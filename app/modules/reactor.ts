import type { Tube, LatticeType } from "@/types";

let tempIdCounter = 0;
function genTempId(): string {
  tempIdCounter++;
  return `T${Date.now().toString(36)}_${tempIdCounter.toString(36)}`;
}

export function groupRowsFrom(tubesArr: Tube[], pitch: number): Tube[][] {
  const active = tubesArr.filter((t) => !t.deleted);
  if (active.length === 0) return [];
  const sorted = [...active].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: Tube[][] = [];
  let current: Tube[] = [];
  const first = sorted[0];
  if (!first) return [];
  let lastY = first.y;
  const rowThreshold = (pitch ?? 1) * 0.3;
  for (const t of sorted) {
    if (Math.abs(t.y - lastY) > rowThreshold) {
      rows.push(current);
      current = [];
    }
    current.push(t);
    lastY = t.y;
  }
  if (current.length) rows.push(current);
  return rows;
}

export function estimateRowOffset(row: Tube[], pitch: number): number {
  if (!pitch || row.length === 0) return 0;
  const mods = row.map((t) => ((t.x % pitch) + pitch) % pitch);
  const avg = mods.reduce((s, v) => s + v, 0) / mods.length;
  if (Math.abs(avg - pitch / 2) < pitch * 0.25) return pitch / 2;
  return 0;
}

export function computeSetRowCountUpdate(
  tubesArr: Tube[],
  rowIdx: number,
  targetCount: number,
  pitch: number,
  tubeRadius: number
): Tube[] {
  const rows = groupRowsFrom(tubesArr, pitch);
  const row = rows[rowIdx];
  if (!row) return tubesArr;
  const current = row.length;
  const r = tubeRadius;
  if (!(pitch > 0)) return tubesArr;
  if (targetCount < 0) targetCount = 0;

  const xs = row.map((t) => t.x).sort((a, b) => a - b);
  const y = row[0]?.y ?? 0;
  const minX = xs[0] ?? 0;
  const maxX = xs[xs.length - 1] ?? 0;

  if (targetCount === current) return tubesArr;

  if (targetCount > current) {
    const delta = targetCount - current;
    const addRight = Math.ceil(delta / 2);
    const addLeft = Math.floor(delta / 2);
    const newTubes: Tube[] = [];
    for (let i = 1; i <= addRight; i++) {
      newTubes.push({ id: genTempId(), x: maxX + i * pitch, y, r, capped: false, capColor: null, blocked: false, deleted: false, comment: null });
    }
    for (let i = 1; i <= addLeft; i++) {
      newTubes.push({ id: genTempId(), x: minX - i * pitch, y, r, capped: false, capColor: null, blocked: false, deleted: false, comment: null });
    }
    return [...tubesArr, ...newTubes];
  }

  const removeDelta = current - targetCount;
  const sortedRow = [...row].sort((a, b) => a.x - b.x);
  const leftToDelete = Math.floor(removeDelta / 2);
  const rightToDelete = Math.ceil(removeDelta / 2);
  const leftIds = sortedRow.slice(0, Math.max(0, leftToDelete)).map((t) => t.id);
  const rightIds = sortedRow.slice(Math.max(sortedRow.length - rightToDelete, 0)).map((t) => t.id);
  const idsToDelete = new Set<string>([...leftIds, ...rightIds]);
  return tubesArr.map((t) => (idsToDelete.has(t.id) ? { ...t, deleted: true } : t));
}

export function computeAddRowForIndex(
  rows: Tube[][],
  rowIdx: number,
  offsetSign: 1 | -1,
  vspace: number,
  lattice: LatticeType,
  pitch: number,
  tubeRadius: number
): Tube[] {
  const row = rows[rowIdx];
  if (!row || row.length === 0) return [];
  const currentOffset = estimateRowOffset(row, pitch);
  const targetOffset = lattice === "triangular" ? (currentOffset === 0 ? pitch / 2 : 0) : 0;
  const dy = offsetSign * vspace;
  const dx = targetOffset - currentOffset;
  return row.map((t) => ({
    id: genTempId(),
    x: t.x + dx,
    y: t.y + dy,
    r: tubeRadius,
    capped: false,
    capColor: null,
    blocked: false,
    deleted: false,
    comment: null,
  }));
}