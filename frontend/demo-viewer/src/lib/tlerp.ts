/**
 * Interpolate over time
 */
export const tlerp = (a: [number, number], b: [number, number], t: number) => {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
};
