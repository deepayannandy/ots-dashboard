import type { ReactorConfig } from "@/types";

function darkenHex(color: string, amount = 0.12) {
  const hex = color.replace("#", "");
  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return color;

  const intVal = parseInt(normalized, 16);
  const r = Math.max(
    0,
    Math.min(255, Math.floor(((intVal >> 16) & 255) * (1 - amount))),
  );
  const g = Math.max(
    0,
    Math.min(255, Math.floor(((intVal >> 8) & 255) * (1 - amount))),
  );
  const b = Math.max(
    0,
    Math.min(255, Math.floor((intVal & 255) * (1 - amount))),
  );
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function drawBoundary(
  viewport: SVGGElement,
  cfg: ReactorConfig,
  centerX = 460,
  centerY = 380,
  scale = 3,
  darken = false,
) {
  const create = (n: string) =>
    document.createElementNS("http://www.w3.org/2000/svg", n);
  const boundaryColor = darken ? darkenHex(cfg.shapeColor) : cfg.shapeColor;
  const paddingColor = darken ? darkenHex(cfg.paddingColor) : cfg.paddingColor;

  if (cfg.shape === "CIRCLE" || cfg.shape === "DONUT") {
    const outer = create("circle");
    outer.setAttribute("cx", String(centerX));
    outer.setAttribute("cy", String(centerY));
    outer.setAttribute("r", String(cfg.outerDimension * scale));
    outer.setAttribute("fill", boundaryColor);
    outer.setAttribute("stroke", "#0f172a");
    outer.setAttribute("stroke-width", "1");
    viewport.appendChild(outer);

    const padLayer = create("circle");
    padLayer.setAttribute("cx", String(centerX));
    padLayer.setAttribute("cy", String(centerY));
    padLayer.setAttribute(
      "r",
      String(Math.max(0, cfg.outerDimension - cfg.padding) * scale),
    );
    padLayer.setAttribute("fill", paddingColor);
    viewport.appendChild(padLayer);

    if (cfg.shape === "DONUT") {
      const inner = create("circle");
      inner.setAttribute("cx", String(centerX));
      inner.setAttribute("cy", String(centerY));
      inner.setAttribute(
        "r",
        String(Math.max(0, (cfg.innerRadius ?? 0) + cfg.padding) * scale),
      );
      inner.setAttribute("fill", "white");
      viewport.appendChild(inner);
    }
  } else if (cfg.shape === "RECTANGLE") {
    const outer = create("rect");
    outer.setAttribute("x", String(centerX - (cfg.width! * scale) / 2));
    outer.setAttribute("y", String(centerY - (cfg.height! * scale) / 2));
    outer.setAttribute("width", String(cfg.width! * scale));
    outer.setAttribute("height", String(cfg.height! * scale));
    outer.setAttribute("fill", boundaryColor);
    outer.setAttribute("stroke", "#0f172a");
    viewport.appendChild(outer);

    const innerW = Math.max(0, cfg.width! - 2 * cfg.padding);
    const innerH = Math.max(0, cfg.height! - 2 * cfg.padding);
    const padRect = create("rect");
    padRect.setAttribute("x", String(centerX - (innerW * scale) / 2));
    padRect.setAttribute("y", String(centerY - (innerH * scale) / 2));
    padRect.setAttribute("width", String(innerW * scale));
    padRect.setAttribute("height", String(innerH * scale));
    padRect.setAttribute("fill", paddingColor);
    viewport.appendChild(padRect);
  } else if (cfg.shape === "HEXAGONE") {
    const ptsOuter: string[] = [];
    const ptsInner: string[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      ptsOuter.push(
        `${centerX + Math.cos(a) * cfg.outerDimension * scale},${centerY + Math.sin(a) * cfg.outerDimension * scale}`,
      );
      ptsInner.push(
        `${centerX + Math.cos(a) * Math.max(0, cfg.outerDimension - cfg.padding) * scale},${centerY + Math.sin(a) * Math.max(0, cfg.outerDimension - cfg.padding) * scale}`,
      );
    }
    const polyOuter = create("polygon");
    polyOuter.setAttribute("points", ptsOuter.join(" "));
    polyOuter.setAttribute("fill", boundaryColor);
    polyOuter.setAttribute("stroke", "#0f172a");
    viewport.appendChild(polyOuter);
    const polyPad = create("polygon");
    polyPad.setAttribute("points", ptsInner.join(" "));
    polyPad.setAttribute("fill", paddingColor);
    viewport.appendChild(polyPad);
  }
}
