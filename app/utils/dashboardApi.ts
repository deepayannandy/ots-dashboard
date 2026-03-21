import { typeOfPhases } from '@/utils/tubesheetOptions'

/** Raw row from GET /api/v2/dashboard/getDashboardData */
export interface DashboardApiTubeSheet {
  _id: string
  equipmentId: string
  type: string
  workOrder?: string
  clientName?: string
  clientAddress?: string
  status?: string
  projectStartDate?: string
  material?: string
  totalNoOfTubes?: number
  /** Active survey on the tube sheet when present */
  surveyId?: string | null
  [key: string]: unknown
}

export interface DashboardApiPhaseNested {
  _id: string
  updatedAt?: string
  endTimeStamp?: string
  [key: string]: unknown
}

export interface DashboardApiPhaseRow {
  phaseName: string
  phaseStatus: string
  _id: string
  phaseData?: DashboardApiPhaseNested | null
  phaseStartTimeStamp?: string
  phaseEndTimeStamp?: string
}

export interface DashboardApiRow {
  _id: string
  tubeSheet: DashboardApiTubeSheet | null
  equipmentId: string
  status: string
  workOrderId: string
  isVisible?: boolean
  phaseData: DashboardApiPhaseRow[]
  createdAt: string
  updatedAt: string
  reactorId?: string
  startTimeStamp?: string
  endTimeStamp?: string | null
}

export interface DashboardPhaseView {
  phaseId: string
  phaseName: string
  /** API phase status, e.g. Completed, NotStarted, OnGoing */
  phaseStatus: string
  progress: number | null
  phaseStartTime: string | null
  lastUpdatedTime: string | null
  endTime: string | null
  surveyID?: string | null
}

export interface DashboardEquipmentView {
  id: string
  equipmentId: string
  type: string
  clientName: string
  clientAddress: string
  projectStartTime: string
  lastUpdatedTime: string
  endTime: string | null
  woId: string
  phases: DashboardPhaseView[]
  equipmentStatus: string
  reactorId?: string
  tubeSheetId: string | null
  /** From tube sheet when API provides it */
  tubeSheetSurveyId: string | null
}

function formatPhaseKeyAsLabel(phaseName: string): string {
  return phaseName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export function getPhaseDisplayName(phaseName: string): string {
  const item = typeOfPhases.find(p => p.value === phaseName)
  if (item) return item.label
  return formatPhaseKeyAsLabel(phaseName)
}

export function phaseStatusToProgress(phaseStatus: string): number | null {
  const s = phaseStatus.toLowerCase().replace(/\s+/g, '')
  if (s === 'completed') return 100
  if (s === 'notstarted') return null
  if (s === 'ongoing' || s === 'inprogress') return 50
  return null
}

export function mapDashboardApiToView(rows: DashboardApiRow[]): DashboardEquipmentView[] {
  return rows
    .filter(row => row.isVisible !== false)
    .map(row => {
      const ts = row.tubeSheet
      const phases: DashboardPhaseView[] = (row.phaseData ?? []).map(p => {
        const nested = p.phaseData
        const progress = phaseStatusToProgress(p.phaseStatus)
        return {
          phaseId: p._id,
          phaseName: getPhaseDisplayName(p.phaseName),
          phaseStatus: p.phaseStatus,
          progress,
          phaseStartTime: p.phaseStartTimeStamp ?? null,
          lastUpdatedTime: (nested?.updatedAt as string | undefined) ?? p.phaseEndTimeStamp ?? null,
          endTime: p.phaseEndTimeStamp ?? (nested?.endTimeStamp as string | undefined) ?? null,
          surveyID: nested?._id ?? null
        }
      })

      return {
        id: row._id,
        equipmentId: row.equipmentId,
        type: ts?.type ?? 'UNKNOWN',
        clientName: ts?.clientName?.trim() ? ts.clientName : '—',
        clientAddress: ts?.clientAddress?.trim() ? ts.clientAddress : '—',
        projectStartTime: ts?.projectStartDate ?? row.startTimeStamp ?? row.createdAt,
        lastUpdatedTime: row.updatedAt,
        endTime: row.endTimeStamp ?? null,
        woId: row.workOrderId,
        phases,
        equipmentStatus: row.status,
        reactorId: row.reactorId,
        tubeSheetId: ts?._id ?? null,
        tubeSheetSurveyId:
          ts?.surveyId != null && ts.surveyId !== ''
            ? String(ts.surveyId)
            : null
      }
    })
}

/** Prefer tube sheet survey id; otherwise latest phase survey by last update time. */
export function resolveReportSurveyId(equipment: DashboardEquipmentView): string | null {
  if (equipment.tubeSheetSurveyId) return equipment.tubeSheetSurveyId
  let best: { t: number, id: string } | null = null
  for (const p of equipment.phases) {
    if (!p.surveyID) continue
    const t = p.lastUpdatedTime ? new Date(p.lastUpdatedTime).getTime() : 0
    if (!best || t >= best.t) best = { t, id: p.surveyID }
  }
  return best?.id ?? null
}

export function formatEquipmentStatus(status: string): string {
  const map: Record<string, string> = {
    OnGoing: 'Ongoing',
    NotStarted: 'Not started',
    Completed: 'Completed'
  }
  if (map[status]) return map[status]
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}
