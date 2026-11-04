import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { fromBasisPoints, toBasisPoints } from '../../common/basisPoints';
import {
  type AllocationRow,
  clampPercentage,
  freeformAllocation,
  getAmounts,
  getMaxAvailable,
  largestRemainder,
  proportionalAllocation,
  sumRowPercentages,
} from './allocation';

const FULL = 100 * 100; // 100% in basis points

function row(name: string, percentage: number, isLocked = false): AllocationRow {
  return { name, percentage, isLocked };
}

/** Basis-point values that sum exactly to `total`, built from sorted cut points. */
function basisPointsSummingTo(total: number, length: number) {
  return fc
    .array(fc.integer({ min: 0, max: total }), { minLength: length - 1, maxLength: length - 1 })
    .map((cuts) => {
      const sorted = [0, ...cuts.sort((a, b) => a - b), total];
      return sorted.slice(1).map((cut, i) => cut - sorted[i]);
    });
}

/** Rows whose percentages add up to exactly 100%, with random locks. */
const validRows = fc.integer({ min: 1, max: 8 }).chain((length) =>
  fc
    .tuple(
      basisPointsSummingTo(FULL, length),
      fc.array(fc.boolean(), { minLength: length, maxLength: length })
    )
    .map(([points, locks]) => points.map((p, i) => row(`r${i}`, fromBasisPoints(p), locks[i])))
);

/** Valid rows plus an edit: which row, and a requested value already clamped. */
const edit = validRows.chain((rows) =>
  fc
    .tuple(fc.integer({ min: 0, max: rows.length - 1 }), fc.double({ min: -10, max: 110, noNaN: true }))
    .map(([index, requested]) => {
      const name = rows[index].name;
      return { rows, name, nextValue: clampPercentage(rows, name, requested) };
    })
);

describe('largestRemainder', () => {
  it('splits equal thirds of 100 as 34/33/33', () => {
    expect(largestRemainder([1, 1, 1], 100)).toEqual([34, 33, 33]);
  });

  it('returns all zeros for all-zero weights', () => {
    expect(largestRemainder([0, 0, 0], 100)).toEqual([0, 0, 0]);
  });

  it('returns all zeros for a non-positive total', () => {
    expect(largestRemainder([1, 2, 3], 0)).toEqual([0, 0, 0]);
    expect(largestRemainder([1, 2, 3], -2000)).toEqual([0, 0, 0]);
  });

  it('always sums exactly to total, each share within 1 of its exact value', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 0, max: 1000, noNaN: true }), { minLength: 1, maxLength: 10 }),
        fc.nat({ max: 1_000_000 }),
        (weights, total) => {
          const sum = weights.reduce((a, b) => a + b, 0);
          fc.pre(sum > 0);

          const shares = largestRemainder(weights, total);
          expect(shares.reduce((a, b) => a + b, 0)).toBe(total);
          shares.forEach((share, i) => {
            expect(Number.isInteger(share)).toBe(true);
            expect(Math.abs(share - (weights[i] / sum) * total)).toBeLessThan(1);
          });
        }
      )
    );
  });
});

describe('getMaxAvailable / clampPercentage', () => {
  const rows = [row('a', 30, true), row('b', 20, true), row('c', 50)];

  it('subtracts locked siblings but not the row itself', () => {
    expect(getMaxAvailable(rows, 'c')).toBe(50);
    expect(getMaxAvailable(rows, 'a')).toBe(80);
  });

  it('clamps to [0, max]', () => {
    expect(clampPercentage(rows, 'c', 70)).toBe(50);
    expect(clampPercentage(rows, 'c', -5)).toBe(0);
    expect(clampPercentage(rows, 'c', 12.5)).toBe(12.5);
  });

  it('rounds to basis points', () => {
    expect(clampPercentage(rows, 'c', 12.3456)).toBe(12.35);
    expect(clampPercentage(rows, 'c', 12.344)).toBe(12.34);
  });

  it('never returns a negative max when locked siblings exceed 100', () => {
    expect(getMaxAvailable([row('a', 60, true), row('b', 60, true), row('c', 0)], 'c')).toBe(0);
  });

  it('allows only 0 when locked siblings add up to 100 or more', () => {
    expect(clampPercentage([row('a', 100, true), row('b', 0)], 'b', 10)).toBe(0);
    expect(clampPercentage([row('a', 60, true), row('b', 60, true), row('c', 0)], 'c', 10)).toBe(0);
  });

  it('always returns a basis-point value within [0, max]', () => {
    fc.assert(
      fc.property(edit, ({ rows, name, nextValue }) => {
        expect(nextValue).toBeGreaterThanOrEqual(0);
        expect(nextValue).toBeLessThanOrEqual(getMaxAvailable(rows, name));
        expect(fromBasisPoints(toBasisPoints(nextValue))).toBe(nextValue);
      })
    );
  });
});

describe('proportionalAllocation', () => {
  it('rebalances unlocked rows around the edited one, keeping their ratio', () => {
    const rows = [row('a', 50), row('b', 30), row('c', 20)];
    expect(proportionalAllocation(rows, 'a', 0)).toEqual([row('a', 0), row('b', 60), row('c', 40)]);
  });

  it('leaves locked rows untouched', () => {
    const rows = [row('a', 40, true), row('b', 30), row('c', 30)];
    expect(proportionalAllocation(rows, 'b', 50)).toEqual([row('a', 40, true), row('b', 50), row('c', 10)]);
  });

  it('splits evenly when the other unlocked rows are all zero', () => {
    const rows = [row('a', 100), row('b', 0), row('c', 0)];
    expect(proportionalAllocation(rows, 'a', 50)).toEqual([row('a', 50), row('b', 25), row('c', 25)]);
  });

  it('only changes the edited row when every other row is locked', () => {
    const rows = [row('a', 40, true), row('b', 60)];
    expect(proportionalAllocation(rows, 'b', 30)).toEqual([row('a', 40, true), row('b', 30)]);
  });

  it('keeps invariants for any valid starting state', () => {
    fc.assert(
      fc.property(edit, ({ rows, name, nextValue }) => {
        const result = proportionalAllocation(rows, name, nextValue);
        const pool = rows.filter((r) => r.name !== name && !r.isLocked);

        expect(result.map((r) => r.name)).toEqual(rows.map((r) => r.name));
        expect(result.find((r) => r.name === name)?.percentage).toBe(nextValue);
        result.forEach((r, i) => {
          expect(r.percentage).toBeGreaterThanOrEqual(0);
          if (rows[i].isLocked && rows[i].name !== name) {
            expect(r).toEqual(rows[i]);
          }
        });

        if (pool.length > 0) {
          expect(sumRowPercentages(result)).toBe(FULL);

          // Each pool row gets its share of what's left, within one basis point.
          const poolSum = sumRowPercentages(pool);
          const remaining = toBasisPoints(getMaxAvailable(rows, name)) - toBasisPoints(nextValue);
          for (const before of pool) {
            const after = result.find((r) => r.name === before.name)!;
            const weight = poolSum > 0 ? toBasisPoints(before.percentage) / poolSum : 1 / pool.length;
            expect(Math.abs(toBasisPoints(after.percentage) - weight * remaining)).toBeLessThan(1);
          }
        }
      })
    );
  });

  // Locked rows over 100% are reachable via freeform; the pool must not go negative.
  it('never produces negative values when locked rows exceed 100% (#4)', () => {
    const rows = [row('a', 60, true), row('b', 60, true), row('c', 0), row('d', 0)];
    const nextValue = clampPercentage(rows, 'c', 10);
    const result = proportionalAllocation(rows, 'c', nextValue);
    result.forEach((r) => expect(r.percentage).toBeGreaterThanOrEqual(0));
  });
});

describe('freeformAllocation', () => {
  it('only changes the edited row', () => {
    fc.assert(
      fc.property(edit, ({ rows, name, nextValue }) => {
        const result = freeformAllocation(rows, name, nextValue);
        result.forEach((r, i) => {
          expect(r).toEqual(r.name === name ? { ...rows[i], percentage: nextValue } : rows[i]);
        });
      })
    );
  });
});

describe('getAmounts', () => {
  it('splits cents so they add up exactly to value', () => {
    const rows = [row('a', 33.33), row('b', 33.33), row('c', 33.34)];
    const amounts = getAmounts(rows, 100);
    expect(amounts).toEqual([33.33, 33.33, 33.34]);
  });

  it('always sums exactly to value (in cents) when the total is 100%', () => {
    fc.assert(
      fc.property(validRows, fc.integer({ min: 1, max: 1_000_000_000 }), (rows, cents) => {
        const amounts = getAmounts(rows, cents / 100);
        const totalCents = amounts.reduce((sum, a) => sum + Math.round(a * 100), 0);
        expect(totalCents).toBe(cents);
        amounts.forEach((a) => expect(Math.round(a * 100) / 100).toBe(a));
      })
    );
  });

  it('falls back to plain percentages when the total is not 100%', () => {
    const rows = [row('a', 50), row('b', 30)];
    expect(getAmounts(rows, 200)).toEqual([100, 60]);
  });

  it('falls back to plain percentages when value is not positive', () => {
    const rows = [row('a', 50), row('b', 50)];
    expect(getAmounts(rows, 0)).toEqual([0, 0]);
    expect(getAmounts(rows, -10)).toEqual([-5, -5]);
  });
});
