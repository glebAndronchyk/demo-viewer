import type { RadarConfig } from "@ant-design/plots";

export interface RadarAxisOptions {
  grid?: boolean;
  gridLineWidth?: number;
  gridLineDash?: [number, number];
}

export interface RadarPointOptions {
  shapeField?: string;
  sizeField?: number;
}

export interface RadarLineStyleOptions {
  lineWidth?: number;
}

export interface RadarAreaOptions {
  style?: {
    fillOpacity?: number;
  };
}

export const radarAxis = {
  x: {
    grid: true,
    gridLineWidth: 1,
    gridLineDash: [0, 0],
  },
  y: {
    grid: true,
    gridLineWidth: 1,
    gridLineDash: [1, 0],
  },
} satisfies RadarConfig["axis"];

export const radarPoint = {
  shapeField: "point",
  sizeField: 3,
} satisfies RadarConfig["point"];

export const radarStyle = {
  lineWidth: 2,
} satisfies RadarConfig["style"];

export const radarArea = {
  style: {
    fillOpacity: 0.5,
  },
} satisfies RadarConfig["area"];
