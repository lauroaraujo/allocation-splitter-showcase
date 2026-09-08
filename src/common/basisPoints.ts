// Use integer basis points rather than raw floats so that e.g. 5.01 +
// 50 + 15 + 30 comes out to exactly 100.01 instead of 100.00999999999999

export const PERCENT_SCALE = 100;

export function toBasisPoints(percentage: number): number {
  return Math.round(percentage * PERCENT_SCALE);
}

export function fromBasisPoints(basisPoints: number): number {
  return basisPoints / PERCENT_SCALE;
}
