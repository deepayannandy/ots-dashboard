import { ref } from "vue";
import { generateTubes } from "@/utils/geometry";
import type { ReactorConfig, Tube } from "@/types";

export function useReactorGenerator() {
  const config = ref<ReactorConfig>({
    shape: "circle",
    outerDimension: 100,
    width: 160,
    height: 100,
    innerRadius: 50,
    tubeRadius: 5,
    padding: 5,
    shapeColor: "#d3d3d3",
    paddingColor: "#a9a9a9",
    pitch: 15,
    lattice: "triangular",
    angle: 60,
  });

  const tubes = ref<Tube[]>([]);
  const error = ref<string | null>(null);
  const rowCount = ref<number[]>([]);

  function validateAndGenerate() {
    try {
      const { tubes: generated, rowCounts } = generateTubes(config.value);
      tubes.value = generated.filter((t: Tube) => !t.deleted);
      rowCount.value = rowCounts;
      error.value = null;
    } catch (e: any) {
      tubes.value = [];
      useToast().add({
        title: e.message ?? "Error generating tubes",
        color: "error",
      });
    }
  }

  function setConfig(partial: Partial<ReactorConfig>) {
    config.value = { ...config.value, ...partial };
  }

  return { config, tubes, error, validateAndGenerate, setConfig, rowCount };
}
