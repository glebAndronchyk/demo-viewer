export type HitGroup =
  | "Generic"
  | "Head"
  | "Chest"
  | "Stomach"
  | "LeftArm"
  | "RightArm"
  | "LeftLeg"
  | "RightLeg"
  | "Neck"
  | "Gear"
  | "Unknown";

const hitGroupMap: Record<number, HitGroup> = {
  0: "Generic",
  1: "Head",
  2: "Chest",
  3: "Stomach",
  4: "LeftArm",
  5: "RightArm",
  6: "LeftLeg",
  7: "RightLeg",
  8: "Neck",
  10: "Gear",
};

export function parseHitGroup(raw: string): HitGroup {
  return hitGroupMap[Number(raw)] ?? "Unknown";
}