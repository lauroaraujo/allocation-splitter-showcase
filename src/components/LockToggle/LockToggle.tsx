import type { SyntheticEvent } from 'react';
import '../../common/tokens.css';
import styles from './LockToggle.module.css';

const LockClosedIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const LockOpenIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 7.75-1.5" />
  </svg>
);

export interface LockToggleProps {
  isLocked: boolean;
  lockActionLabel?: string;
  unlockActionLabel?: string;
  onClick?: (evt: SyntheticEvent<HTMLButtonElement>) => void
}

/** Small circular button that displays and toggles a locked/unlocked state */
export const LockToggle = ({
  isLocked,
  lockActionLabel = 'Lock',
  unlockActionLabel = 'Unlock',
  onClick = () => undefined,
}: LockToggleProps) => {
  const actionLabel = isLocked ? unlockActionLabel : lockActionLabel;

  return (
    <button
      type="button"
      className={styles.lockToggle}
      data-locked={isLocked || undefined}
      aria-pressed={isLocked}
      aria-label={actionLabel}
      title={actionLabel}
      onClick={onClick}
    >
      {isLocked ? <LockClosedIcon /> : <LockOpenIcon />}
    </button>
  )
};
