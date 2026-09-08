import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { PERCENT_SCALE, fromBasisPoints } from '../../common/basisPoints';
import { PALETTE } from '../../common/colorPalette';
import { formatCurrency } from '../../common/currency';
import { AllocationBar } from '../AllocationBar';
import { CurrencyInput } from '../CurrencyInput';
import { LockToggle } from '../LockToggle';
import { PercentageInput } from '../PercentageInput';
import '../../common/tokens.css';
import styles from './AllocationSplitter.module.css';
import {
  type AllocationRow,
  clampPercentage,
  getAmounts,
  type AllocationCategory,
  sumRowPercentages,
  type AllocationStrategyMap,
  defaultAllocationStrategies,
} from './allocation';
import { slugify } from '../../common/string';

export type AllocationSplitterValueInputMode = 'readOnly' | 'readWrite' | 'hidden';

export type AllocationSplitterProps<K extends string = 'proportional' | 'freeform'> = {
  value: number;
  onValueChange: (value: number) => void;
  categories: AllocationCategory[];
  onCategoriesChange: (categories: AllocationCategory[]) => void;
  // Defaults to `defaultAllocationStrategies` (proportional + freeform) when
  // omitted. Passing a custom map fully replaces the built-ins — spread
  // `defaultAllocationStrategies` into your own map to keep them alongside
  // a custom strategy.
  strategies?: AllocationStrategyMap<K>;
  strategy?: K;
  onStrategyChange: (strategy: K) => void;
  showTotal?: boolean;
  valueInputMode?: AllocationSplitterValueInputMode;
  showStrategySelector?: boolean;
  showBar?: boolean;
};

export const AllocationSplitter = <K extends string = 'proportional' | 'freeform',>({
  value,
  onValueChange,
  categories,
  onCategoriesChange,
  strategies,
  strategy,
  onStrategyChange,
  showTotal = true,
  valueInputMode = 'readWrite',
  showStrategySelector = true,
  showBar = true,
}: AllocationSplitterProps<K>) => {
  // Memoized so its reference only changes when `categories` itself does —
  // otherwise the announcement effect below (which depends on `rows`)
  // would re-run on every render, since `.map()` would hand it a new array
  // each time regardless of whether anything actually changed.
  const rows: AllocationRow[] = useMemo(
    () =>
      categories.map(({ name, percentage, isLocked }) => ({
        name,
        percentage,
        isLocked: !!isLocked,
      })),
    [categories]
  );
  const [announcement, setAnnouncement] = useState('');

  const isFirstRenderRef = useRef(true);
  const announceTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    clearTimeout(announceTimeoutRef.current);
    announceTimeoutRef.current = setTimeout(() => {
      setAnnouncement(buildAnnouncement(rows));
    }, 600);
    return () => clearTimeout(announceTimeoutRef.current);
  }, [rows]);

  const uid = useId();
  const totalValueId = `${uid}-total`;

  const rowByName = new Map(rows.map((row) => [row.name, row]));
  const amounts = getAmounts(rows, value);
  const amountByName = new Map(rows.map((row, index) => [row.name, amounts[index]]));
  const totalBasisPoints = sumRowPercentages(rows);
  const total = fromBasisPoints(totalBasisPoints);
  const isTotalValid = totalBasisPoints === 100 * PERCENT_SCALE;

  const toPublicCategories = (nextRows: AllocationRow[]): AllocationCategory[] =>
    categories.map((category, index) => ({
      ...category,
      percentage: nextRows[index].percentage,
      isLocked: nextRows[index].isLocked,
    }));

  const strategyMap = (strategies ?? defaultAllocationStrategies) as AllocationStrategyMap<K>;
  const strategyKeys = Object.keys(strategyMap) as K[];
  const activeStrategyKey = strategy ?? strategyKeys[0];

  const applyPercentage = (name: string, nextValue: number) => {
    const clamped = clampPercentage(rows, name, nextValue);
    const activeStrategy = strategyMap[activeStrategyKey].strategy;
    onCategoriesChange(toPublicCategories(activeStrategy(rows, name, clamped)));
  };

  const toggleLock = (name: string) => {
    const nextRows = rows.map((row) => (row.name === name ? { ...row, isLocked: !row.isLocked } : row));
    onCategoriesChange(toPublicCategories(nextRows));
  };

  const valueInputId = `${uid}-value`;
  const strategySelectId = `${uid}-strategy`;
  const barSegments = categories.map(({ name, color }) => ({
    name,
    color,
    percentage: rowByName.get(name)?.percentage ?? 0,
  }));

  return (
    <div className={styles.allocationSplitterRoot}>
      {(valueInputMode !== 'hidden' || showStrategySelector) && (
        <div className={styles.allocationSplitterControlsRow}>
          {valueInputMode !== 'hidden' && (
            <div className={styles.allocationSplitterAmountField}>
              <label htmlFor={valueInputId} className={styles.allocationSplitterValueLabel}>
                Amount
              </label>
              <CurrencyInput
                id={valueInputId}
                amount={value}
                onCommit={onValueChange}
                disabled={valueInputMode === 'readOnly'}
              />
            </div>
          )}
          {showStrategySelector && (
            <div className={styles.allocationSplitterModeField}>
              <label htmlFor={strategySelectId} className={styles.allocationSplitterModeLabel}>
                Strategy
              </label>
              <select
                id={strategySelectId}
                className={styles.allocationSplitterModeSelect}
                value={activeStrategyKey}
                onChange={(event) => onStrategyChange(event.target.value as K)}
              >
                {strategyKeys.map((key) => (
                  <option key={key} value={key}>
                    {strategyMap[key].label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
      {showBar && (
        <div className={styles.allocationSplitterBarWrapper}>
          <AllocationBar segments={barSegments} isValid={isTotalValid} />
        </div>
      )}
      <div className={styles.allocationSplitterScroll}>
        <table className={styles.allocationSplitterTable}>
          <tbody>
            {categories.map(({ name, description, color }) => {
              const row = rowByName.get(name);
              if (!row) {
                return null;
              }

              const inputId = `${uid}-${slugify(name)}`;
              // Plain-text table cells (like the dollar amount) aren't
              // focusable, so a screen reader user tabbing between the
              // percentage input and lock button would otherwise never
              // land on it — describedby attaches it to the input's own
              // focus stop instead of requiring a full linear read-through.
              const amountId = `${inputId}-amount`;
              const describedBy = [amountId, showTotal ? totalValueId : null]
                .filter(Boolean)
                .join(' ');

              return (
                <tr className={styles.allocationSplitterRow} key={name}>
                  <td className={styles.allocationSplitterLabelCell}>
                    <label htmlFor={inputId} className={styles.allocationSplitterName}>
                      {showBar && (
                        <span
                          className={styles.allocationSplitterSwatch}
                          style={{ backgroundColor: PALETTE[color].background }}
                          aria-hidden="true"
                        />
                      )}
                      {name}
                    </label>
                    {description && (
                      <div className={styles.allocationSplitterDescription}>{description}</div>
                    )}
                  </td>
                  <td className={styles.allocationSplitterPercentageCell}>
                    <PercentageInput
                      id={inputId}
                      percentage={row.percentage}
                      onCommit={(nextValue) => applyPercentage(name, nextValue)}
                      disabled={row.isLocked}
                      aria-label={`Percentage of ${name}`}
                      aria-describedby={describedBy}
                    />
                  </td>
                  <td className={styles.allocationSplitterAmountCell} id={amountId}>
                    <span className={styles.allocationSplitterSrOnly}>Amount: </span>$
                    {formatCurrency(amountByName.get(name) ?? 0)}
                  </td>
                  <td className={styles.allocationSplitterLockCell}>
                    <LockToggle
                      isLocked={row.isLocked}
                      unlockActionLabel={`Unlock ${name} (currently locked at ${row.percentage} percent)`}
                      lockActionLabel={`Lock ${name} at ${row.percentage} percent`}
                      onClick={() => toggleLock(name)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
          {showTotal && (
            <tfoot>
              <tr
                className={`${styles.allocationSplitterTotalRow}${isTotalValid ? '' : ` ${styles.isInvalid}`}`}
              >
                <td className={styles.allocationSplitterTotalLabel} colSpan={1}>
                  Total allocated
                </td>
                <td className={styles.allocationSplitterTotalValue} colSpan={4}>
                  {!isTotalValid && (
                    <span className={styles.allocationSplitterTotalNote}>
                      {fromBasisPoints(Math.abs(100 * PERCENT_SCALE - totalBasisPoints))}%{' '}
                      {total < 100 ? 'left to allocate' : 'over'}
                    </span>
                  )}
                  {/* TODO: look for a better fix; This was suggested by Claude code; */}
                  <span id={totalValueId}>
                    {/* Percentage inputs point their aria-describedby at this
                        span so screen reader users hear the running total
                        while editing any row. Without this prefix, the
                        description reads as a bare number right after the
                        field's own value (e.g. "5" then "100%"), which is
                        easily misheard as the field's value itself instead
                        of the total. */}
                    <span className={styles.allocationSplitterSrOnly}>Total allocated: </span>
                    {total}%
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <div
        className={styles.allocationSplitterSrOnly}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>
    </div>
  );
};

function buildAnnouncement(rows: AllocationRow[]): string {
  const totalBasisPoints = sumRowPercentages(rows)
  const total = fromBasisPoints(totalBasisPoints);
  const parts = rows.map(
    (row) => `${row.name} ${row.percentage}%${row.isLocked ? ', locked' : ''}`
  );
  const diff = fromBasisPoints(Math.abs(100 * PERCENT_SCALE - totalBasisPoints));
  const totalPart =
    totalBasisPoints === 100 * PERCENT_SCALE
      ? `Total ${total}%.`
      : `Total ${total}%, ${diff}% ${total < 100 ? 'unallocated.' : 'over.'}`;
  return `${parts.join('. ')}. ${totalPart}`;
}
