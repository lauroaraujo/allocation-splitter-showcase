import { toBasisPoints, fromBasisPoints, PERCENT_SCALE } from '../../common/basisPoints';
import { PALETTE, type PaletteColor } from '../../common/colorPalette';
import '../../common/tokens.css';
import styles from './AllocationBar.module.css';

export type AllocationBarSegment = {
  name: string;
  percentage: number;
  color: PaletteColor;
};

export interface AllocationBarProps {
  segments: AllocationBarSegment[];
  isValid?: boolean;
}

export const AllocationBar = ({ segments, isValid = true }: AllocationBarProps) => {
  const totalBasisPoints = segments.reduce((sum, segment) => sum + toBasisPoints(segment.percentage), 0);
  const gapBasisPoints = Math.max(0, 100 * PERCENT_SCALE - totalBasisPoints);
  const excessBasisPoints = Math.max(0, totalBasisPoints - 100 * PERCENT_SCALE);
  const total = fromBasisPoints(totalBasisPoints);
  const gap = fromBasisPoints(gapBasisPoints);
  const excess = fromBasisPoints(excessBasisPoints);

  // Over-allocated segments can't just render at their raw percentage widths
  // (they'd overflow the bar), so they're scaled down.
  const scale = excess > 0 ? (100 - excess) / total : 1;

  return (
    <div
      className={`${styles.allocationBar}${isValid ? '' : ` ${styles.isInvalid}`}`}
      // Restates data the rows already carry (name, percentage, color), so it's
      // hidden from assistive tech rather than exposing the same info twice.
      aria-hidden="true"
    >
      {segments.map((segment) => {
        const { background, text } = PALETTE[segment.color];
        const width = segment.percentage * scale;
        return (
          <div
            key={segment.name}
            className={styles.allocationBarSegment}
            style={{ width: `${width}%`, backgroundColor: background, color: text }}
            title={`${segment.name}: ${segment.percentage}%`}
          >
            {width >= 8 ? `${segment.percentage}%` : null}
          </div>
        );
      })}
      {gap > 0 && <div className={styles.allocationBarGap} style={{ width: `${gap}%` }} />}
      {excess > 0 && (
        <div
          className={styles.allocationBarExcess}
          style={{ width: `${excess}%` }}
          title={`${excess}% over-allocated`}
        >
          {excess >= 8 ? `⚠️ +${excess}%` : '⚠️'}
        </div>
      )}
    </div>
  );
};
