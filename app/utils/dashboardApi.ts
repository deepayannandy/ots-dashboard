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
  /** Total time for the workorder between start and end timestamps */
  totalTime: string | null;
  /** Total accumulated idle time between phase end and next phase start */
  totalIdleTime: string | null;
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

/**
 * Calculate timeline progress as the position of the last active (Completed/OnGoing) phase.
 * Returns percentage of completion based on phase sequence, not average progress.
 */
export function getTimelineProgressPercentage(
  phases: DashboardPhaseView[],
): number {
  if (!phases.length) return 0;

  // Find the last phase that is Completed or OnGoing
  let lastActiveIndex = -1;
  for (let i = phases.length - 1; i >= 0; i--) {
    const phase = phases[i]!;
    if (phase.phaseStatus === "Completed" || phase.phaseStatus === "OnGoing") {
      lastActiveIndex = i;
      break;
    }
  }

  // If no active phase, return 0
  if (lastActiveIndex === -1) return 0;

  // Progress extends to the last active phase (as a full segment)
  // If on last phase, could show partial progress; for now show full segment
  return ((lastActiveIndex + 1) / phases.length) * 100;
}

/**
 * Generate timeline items including idle phases between active phases
 */
export function generateTimelineItems(phases: DashboardPhaseView[]): Array<{
  type: "phase" | "idle";
  phase?: DashboardPhaseView;
  idleTime?: number; // in milliseconds
  idleDuration?: string; // formatted duration
}> {
  const items: Array<{
    type: "phase" | "idle";
    phase?: DashboardPhaseView;
    idleTime?: number;
    idleDuration?: string;
  }> = [];

  for (let i = 0; i < phases.length; i++) {
    const currentPhase = phases[i];
    const nextPhase = phases[i + 1];

    // Add the current phase
    items.push({
      type: "phase",
      phase: currentPhase,
    });

    // Check if there's a gap between this phase and the next
    if (nextPhase && currentPhase.endTime && nextPhase.phaseStartTime) {
      const currentEnd = new Date(currentPhase.endTime).getTime();
      const nextStart = new Date(nextPhase.phaseStartTime).getTime();
      const gap = nextStart - currentEnd;

      // Only show idle if gap is more than 1 minute
      if (gap > 60000) {
        items.push({
          type: "idle",
          idleTime: gap,
          idleDuration: formatIdleDuration(gap),
        });
      }
    }
  }

  return items;
}

/**
 * Format idle duration in a human-readable way
 */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

function calculateTotalIdleTime(phases: DashboardApiPhaseRow[]): number {
  let totalIdle = 0;

  for (let i = 0; i < phases.length - 1; i++) {
    const current = phases[i]!;
    const next = phases[i + 1]!;
    if (current.phaseEndTimeStamp && next.phaseStartTimeStamp) {
      const currentEnd = new Date(current.phaseEndTimeStamp).getTime();
      const nextStart = new Date(next.phaseStartTimeStamp).getTime();
      const gap = nextStart - currentEnd;
      if (gap > 0) totalIdle += gap;
    }
  }

  return totalIdle;
}

function formatIdleDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
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
      const totalIdleMs = calculateTotalIdleTime(row.phaseData ?? []);
      const totalTime =
        row.startTimeStamp && row.endTimeStamp
          ? formatDuration(
              new Date(row.endTimeStamp).getTime() -
                new Date(row.startTimeStamp).getTime(),
            )
          : null;

      return {
        id: row._id,
        equipmentId: row.equipmentId,
        type: ts?.type ?? "UNKNOWN",
        clientName: ts?.clientName?.trim() ? ts.clientName : "—",
        clientAddress: ts?.clientAddress?.trim() ? ts.clientAddress : "—",
        startTime,
        lastUpdatedTime: row.updatedAt,
        endTime: row.endTimeStamp ?? null,
        totalTime,
        totalIdleTime: formatDuration(totalIdleMs),
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
