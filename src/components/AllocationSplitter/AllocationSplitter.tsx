import { useEffect, useId, useRef, useState } from 'react';
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
  redistributeProportionally,
  applyFreeform,
  getAmounts,
  type AllocationCategory,
  sumRowPercentages,
} from './allocation';
import { slugify } from '../../common/string';

export type AllocationSplitterMode = 'proportional' | 'freeform';

export type AllocationSplitterValueInputMode = 'readOnly' | 'readWrite' | 'hidden';

export type AllocationSplitterProps = {
  value: number;
  onValueChange: (value: number) => void;
  categories: AllocationCategory[];
  onCategoriesChange: (categories: AllocationCategory[]) => void;
  mode?: AllocationSplitterMode;
  onModeChange: (mode: AllocationSplitterMode) => void;
  showTotal?: boolean;
  valueInputMode?: AllocationSplitterValueInputMode;
  showModeSelector?: boolean;
  showBar?: boolean;
};

export const AllocationSplitter = ({
  value,
  onValueChange,
  categories,
  onCategoriesChange,
  mode = 'proportional',
  onModeChange,
  showTotal = true,
  valueInputMode = 'readWrite',
  showModeSelector = true,
  showBar = true,
}: AllocationSplitterProps) => {
  // Derived fresh from `categories` every render rather than mirrored into
  // state, since `categories` (and `value`/`mode`) are now the live source
  // of truth — the parent owns them and this component only requests
  // changes via the on*Change callbacks.
  const rows: AllocationRow[] = categories.map(({ name, percentage, isLocked }) => ({
    name,
    percentage,
    isLocked: !!isLocked,
  }));
  const [announcement, setAnnouncement] = useState('');

  const isFirstRenderRef = useRef(true);
  const announceTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounced so rapid edits (typing, arrow-key repeats) announce once the
  // user settles rather than firing on every intermediate keystroke. Keyed
  // off the `categories` prop rather than the locally-derived `rows`, since
  // a controlled prop's reference is expected to change only when its
  // contents actually do (unlike `rows`, which is a new array every render).
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const uid = useId();
  const totalValueId = `${uid}-total`;

  const rowByName = new Map(rows.map((row) => [row.name, row]));
  const amounts = getAmounts(rows, value);
  const amountByName = new Map(rows.map((row, index) => [row.name, amounts[index]]));
  const totalBasisPoints = sumRowPercentages(rows);
  const total = fromBasisPoints(totalBasisPoints);
  const isTotalValid = totalBasisPoints === 100 * PERCENT_SCALE;

  // Rows and the public categories prop stay index-aligned (rows are derived
  // directly from categories above), so updated rows can be zipped back onto
  // the original categories by position to restore description/color.
  const toPublicCategories = (nextRows: AllocationRow[]): AllocationCategory[] =>
    categories.map((category, index) => ({
      ...category,
      percentage: nextRows[index].percentage,
      isLocked: nextRows[index].isLocked,
    }));

  const applyPercentage = (name: string, nextValue: number) => {
    const nextRows =
      mode === 'freeform'
        ? applyFreeform(rows, name, nextValue)
        : redistributeProportionally(rows, name, nextValue);
    onCategoriesChange(toPublicCategories(nextRows));
  };

  const toggleLock = (name: string) => {
    const nextRows = rows.map((row) => (row.name === name ? { ...row, isLocked: !row.isLocked } : row));
    onCategoriesChange(toPublicCategories(nextRows));
  };

  const valueInputId = `${uid}-value`;
  const modeSelectId = `${uid}-mode`;
  const barSegments = categories.map(({ name, color }) => ({
    name,
    color,
    percentage: rowByName.get(name)?.percentage ?? 0,
  }));

  return (
    <div className={styles.allocationSplitterRoot}>
      {(valueInputMode !== 'hidden' || showModeSelector) && (
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
          {showModeSelector && (
            <div className={styles.allocationSplitterModeField}>
              <label htmlFor={modeSelectId} className={styles.allocationSplitterModeLabel}>
                Mode
              </label>
              <select
                id={modeSelectId}
                className={styles.allocationSplitterModeSelect}
                value={mode}
                onChange={(event) => onModeChange(event.target.value as AllocationSplitterMode)}
              >
                <option value="proportional">Proportional</option>
                <option value="freeform">Freeform</option>
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
                      aria-describedby={showTotal ? totalValueId : undefined}
                    />
                  </td>
                  <td className={styles.allocationSplitterAmountCell}>
                    ${formatCurrency(amountByName.get(name) ?? 0)}
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
                  <span id={totalValueId}>{total}%</span>
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

// Phrased as the settled result, not the keystroke, so a screen reader user
// hears a coherent summary instead of a stream of in-progress diffs.
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
