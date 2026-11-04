import type { PaletteColor } from '../../common/colorPalette';
import { PERCENT_SCALE, toBasisPoints, fromBasisPoints } from '../../common/basisPoints';

export type AllocationCategory = {
  name: string;
  description?: string;
  percentage: number;
  color: PaletteColor;
  isLocked?: boolean;
};

export type AllocationRow = Required<Pick<AllocationCategory, 'name' | 'percentage' | 'isLocked'>>;

export function sumRowPercentages(rows: AllocationRow[]) {
  return rows.map(r => r.percentage).reduce((sum, p) => sum + toBasisPoints(p), 0);
}

/**
 * Distributes `total` as integers across `weights` so they sum exactly to `total`.
 * Floors every share, then hands the leftover units to the largest fractional
 * parts, so e.g. three equal weights splitting 100 don't come out to 99.
 * A non-positive `total` yields all zeros rather than negative shares.
 */
export function largestRemainder(weights: number[], total: number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0 || total <= 0) {
    return weights.map(() => 0);
  }

  const exact = weights.map((weight) => (weight / sum) * total);
  const floored = exact.map(Math.floor);
  const used = floored.reduce((a, b) => a + b, 0);
  const leftover = total - used;

  const order = exact
    .map((amount, index) => ({ index, fraction: amount - Math.floor(amount) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let k = 0; k < leftover; k++) {
    floored[order[k % order.length].index] += 1;
  }

  return floored;
}

export function getMaxAvailable(rows: AllocationRow[], name: string): number {
  const lockedBasisPoints = sumRowPercentages(rows.filter(row => row.name !== name && row.isLocked));
  return fromBasisPoints(Math.max(0, 100 * PERCENT_SCALE - lockedBasisPoints));
}

/**
 * Clamps a requested percentage to what `name`'s locked siblings leave
 * available, rounded to basis points. Every allocation strategy (built-in
 * or a caller-supplied `allocationStrategy`) receives its `nextValue`
 * already run through this, so none of them have to re-derive
 * `getMaxAvailable` themselves just to stay within that bound.
 */
export function clampPercentage(rows: AllocationRow[], name: string, nextValue: number): number {
  const max = getMaxAvailable(rows, name);
  return Math.max(0, Math.min(max, fromBasisPoints(toBasisPoints(nextValue))));
}

/**
 *
 * Proportional model: set `name` to `nextValue`, then rebalance the unlocked
 * rows around it so the total stays at 100, preserving their relative shares.
 * `nextValue` is assumed already clamped via `clampPercentage`.
 */
export function proportionalAllocation(
  rows: AllocationRow[],
  name: string,
  nextValue: number
): AllocationRow[] {
  const max = getMaxAvailable(rows, name);
  const pool = rows.filter((row) => row.name !== name && !row.isLocked);
  const remainingBasisPoints = Math.max(0, toBasisPoints(max) - toBasisPoints(nextValue));

  if (pool.length === 0) {
    return rows.map((row) => (row.name === name ? { ...row, percentage: nextValue } : row));
  }

  const poolSum = sumRowPercentages(pool);
  const weights = poolSum > 0 ? pool.map((row) => row.percentage) : pool.map(() => 1);
  const shares = largestRemainder(weights, remainingBasisPoints).map(fromBasisPoints);
  const shareByName = new Map(pool.map((row, index) => [row.name, shares[index]]));

  return rows.map((row) => {
    if (row.name === name) {
      return { ...row, percentage: nextValue };
    }

    const share = shareByName.get(row.name);
    return share === undefined ? row : { ...row, percentage: share };
  });
}

/**
 * Free-form model: only the edited row changes, clamped to what locked rows
 * leave available. The total is allowed to drift away from 100. `nextValue`
 * is assumed already clamped via `clampPercentage`.
 */
export function freeformAllocation(rows: AllocationRow[], name: string, nextValue: number): AllocationRow[] {
  return rows.map((row) => (row.name === name ? { ...row, percentage: nextValue } : row));
}

/**
 * Receives `nextValue` already clamped to what `name`'s locked siblings
 * leave available (see `clampPercentage`), so it doesn't need to re-derive
 * that bound itself — only decide how the rest of `rows` reacts.
 */
export type AllocationStrategy = (
  rows: AllocationRow[],
  name: string,
  nextValue: number
) => AllocationRow[];

// Keyed by an arbitrary string id (not a fixed enum), so a consumer can mix
// the built-ins with their own named strategies. Each entry carries its own
// display label since the key itself (e.g. a consumer's own
// "weightedSplit") isn't necessarily fit to show in the built-in selector.
export type AllocationStrategyMap<K extends string = 'proportional' | 'freeform'> = Record<
  K,
  { label: string; strategy: AllocationStrategy }
>;

export const defaultAllocationStrategies: AllocationStrategyMap<'proportional' | 'freeform'> = {
  proportional: { label: 'Proportional', strategy: proportionalAllocation },
  freeform: { label: 'Freeform', strategy: freeformAllocation },
};

/**
 * Dollar amounts are also split with the largest-remainder method, in cents,
 * so they sum exactly to `value` instead of drifting from independent rounding.
 */
export function getAmounts(rows: AllocationRow[], value: number): number[] {
  const cents = Math.round(value * 100);
  const totalBasisPoints = sumRowPercentages(rows);
  if (totalBasisPoints !== 100 * PERCENT_SCALE || cents <= 0) {
    return rows.map((row) => (row.percentage / 100) * value);
  }

  const shares = largestRemainder(
    rows.map((row) => row.percentage),
    cents
  );
  return shares.map((share) => share / 100);
}
