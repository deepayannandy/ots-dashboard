import { typeOfPhases } from "@/utils/tubesheetOptions";

/** Raw row from GET /api/v2/dashboard/getDashboardData */
export interface DashboardApiTubeSheet {
  _id: string;
  equipmentId: string;
  type: string;
  workOrder?: string;
  clientName?: string;
  clientAddress?: string;
  status?: string;
  projectStartDate?: string;
  material?: string;
  totalNoOfTubes?: number;
  /** Active survey on the tube sheet when present */
  surveyId?: string | null;
  [key: string]: unknown;
}

export interface DashboardApiPhaseNested {
  _id: string;
  updatedAt?: string;
  endTimeStamp?: string;
  /** 0–100 from API */
  progress?: number | null;
  [key: string]: unknown;
}

export interface DashboardApiPhaseRow {
  phaseName: string;
  phaseStatus: string;
  _id: string;
  phaseData?: DashboardApiPhaseNested | null;
  phaseStartTimeStamp?: string;
  phaseEndTimeStamp?: string;
  /** 0–100 from API at phase row level */
  progress?: number | null;
}

export interface DashboardApiRow {
  _id: string;
  tubeSheet: DashboardApiTubeSheet | null;
  equipmentId: string;
  status: string;
  workOrderId: string;
  isVisible?: boolean;
  phaseData: DashboardApiPhaseRow[];
  createdAt: string;
  updatedAt: string;
  reactorId?: string;
  startTimeStamp?: string;
  endTimeStamp?: string | null;
}

export interface DashboardPhaseView {
  phaseId: string;
  phaseName: string;
  /** Raw API phase status string */
  phaseStatus: string;
  /** 0–100 from API; null if not available */
  progress: number | null;
  /** Effective progress adjusted for phase status (100 if Completed, 50+ if OnGoing) */
  effectiveProgress: number | null;
  phaseStartTime: string | null;
  lastUpdatedTime: string | null;
  endTime: string | null;
  surveyID?: string | null;
}

export interface DashboardEquipmentView {
  id: string;
  equipmentId: string;
  type: string;
  clientName: string;
  clientAddress: string;
  /** Survey run start — from API start time only (not createdAt) */
  startTime: string | null;
  lastUpdatedTime: string;
  endTime: string | null;
  woId: string;
  phases: DashboardPhaseView[];
  /** Raw API status string */
  equipmentStatus: string;
  reactorId?: string;
  tubeSheetId: string | null;
  /** From tube sheet when API provides it */
  tubeSheetSurveyId: string | null;
}

function formatPhaseKeyAsLabel(phaseName: string): string {
  return phaseName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function getPhaseDisplayName(phaseName: string): string {
  const item = typeOfPhases.find((p) => p.value === phaseName);
  if (item) return item.label;
  return formatPhaseKeyAsLabel(phaseName);
}

export function parseProgressValue(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}
/** Calculate effective progress based on phase status and numeric progress */
export function getEffectiveProgress(
  phaseStatus: string,
  numericProgress: number | null,
): number | null {
  if (phaseStatus === "Completed") {
    return 100;
  }
  if (phaseStatus === "OnGoing") {
    return Math.max(numericProgress ?? 0, 50);
  }
  return numericProgress;
}
export function mapDashboardApiToView(
  rows: DashboardApiRow[],
): DashboardEquipmentView[] {
  return rows
    .filter((row) => row.isVisible !== false)
    .map((row) => {
      const ts = row.tubeSheet;
      const phases: DashboardPhaseView[] = (row.phaseData ?? []).map((p) => {
        const nested = p.phaseData;
        // Progress is at top level of phase, not inside nested phaseData
        const progress =
          parseProgressValue(p.progress) ??
          (nested ? parseProgressValue(nested.progress) : null);
        const effectiveProgress = getEffectiveProgress(p.phaseStatus, progress);
        return {
          phaseId: p._id,
          phaseName: getPhaseDisplayName(p.phaseName),
          phaseStatus: p.phaseStatus,
          progress,
          effectiveProgress,
          phaseStartTime: p.phaseStartTimeStamp ?? null,
          lastUpdatedTime: (nested?.updatedAt as string | undefined) ?? null,
          endTime:
            p.phaseEndTimeStamp ??
            (nested?.endTimeStamp as string | undefined) ??
            null,
          surveyID: nested?._id ?? null,
        };
      });

      const startTime = row.startTimeStamp ?? null;

      return {
        id: row._id,
        equipmentId: row.equipmentId,
        type: ts?.type ?? "UNKNOWN",
        clientName: ts?.clientName?.trim() ? ts.clientName : "—",
        clientAddress: ts?.clientAddress?.trim() ? ts.clientAddress : "—",
        startTime,
        lastUpdatedTime: row.updatedAt,
        endTime: row.endTimeStamp ?? null,
        woId: row.workOrderId,
        phases,
        equipmentStatus: row.status,
        reactorId: row.reactorId,
        tubeSheetId: ts?._id ?? null,
        tubeSheetSurveyId:
          ts?.surveyId != null && ts.surveyId !== ""
            ? String(ts.surveyId)
            : null,
      };
    });
}

/** Prefer tube sheet survey id; otherwise latest phase survey by last update time. */
export function resolveReportSurveyId(
  equipment: DashboardEquipmentView,
): string | null {
  if (equipment.tubeSheetSurveyId) return equipment.tubeSheetSurveyId;
  let best: { t: number; id: string } | null = null;
  for (const p of equipment.phases) {
    if (!p.surveyID) continue;
    const t = p.lastUpdatedTime ? new Date(p.lastUpdatedTime).getTime() : 0;
    if (!best || t >= best.t) best = { t, id: p.surveyID };
  }
  return best?.id ?? null;
}
