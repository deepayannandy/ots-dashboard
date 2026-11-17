<template>
  <!-- Triangle just outside the reactor boundary, centred on row 1 and pointing
       at it, with a "Row 1" heading beside it. Place inside an <svg>. -->
  <g
    v-if="marker"
    class="first-row-marker"
    :transform="transform"
    pointer-events="none"
  >
    <g
      :transform="`translate(${marker.x}, ${marker.y}) rotate(${marker.angle})`"
    >
      <polygon
        points="0,12 -11,-10 11,-10"
        fill="#f59e0b"
        stroke="#0f172a"
        stroke-width="1"
      />
    </g>
    <!-- Counter-rotate / un-mirror so the heading always reads upright -->
    <g
      :transform="`translate(${marker.labelX}, ${marker.labelY}) rotate(${-rotation}) scale(${mirrored ? -1 : 1}, 1)`"
    >
      <text
        text-anchor="middle"
        dominant-baseline="middle"
        fill="#f59e0b"
        stroke="#0f172a"
        stroke-width="3"
        paint-order="stroke"
        font-weight="bold"
        font-size="18"
      >
        Row 1
      </text>
    </g>
  </g>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    tubes: { id: string; x: number; y: number; deleted?: boolean }[];
    /** Distance (svg px) from the centre to the boundary edge. */
    edge: { vertical: number; horizontal: number };
    centerX: number;
    centerY: number;
    /** Same transform as the #viewport group so the marker pans/zooms/rotates with it. */
    transform: string;
    rotation?: number;
    /** True when the whole svg is flipped with scale(-1, 1) (back views). */
    mirrored?: boolean;
  }>(),
  { rotation: 0, mirrored: false },
);

const GAP = 22; // boundary edge -> triangle centre
const LABEL_GAP = 34; // triangle centre -> label centre (sideways)

const marker = computed(() => {
  const row1 = props.tubes.filter(
    (t) => !t.deleted && /^R1C\d+$/.test(t.id),
  );
  if (!row1.length) return null;

  const xs = row1.map((t) => t.x);
  const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const midY = row1.reduce((sum, t) => sum + t.y, 0) / row1.length;

  // Direction from the reactor centre to the middle of row 1 (default: up).
  const len = Math.hypot(midX, midY);
  const ux = len > 1e-6 ? midX / len : 0;
  const uy = len > 1e-6 ? midY / len : -1;

  const edge =
    Math.abs(uy) >= Math.abs(ux) ? props.edge.vertical : props.edge.horizontal;
  const dist = edge + GAP;
  const x = props.centerX + ux * dist;
  const y = props.centerY + uy * dist;

  // Label sits beside the triangle (perpendicular to the pointing direction),
  // so it stays clear of the compass N/S/E/W indicators further out.
  const px = -uy;
  const py = ux;

  return {
    x,
    y,
    // Triangle is drawn pointing down (+y); rotate it to point at the centre.
    angle: (Math.atan2(-uy, -ux) * 180) / Math.PI - 90,
    labelX: x + px * LABEL_GAP * (props.mirrored ? -1 : 1),
    labelY: y + py * LABEL_GAP * (props.mirrored ? -1 : 1),
  };
});
</script>
