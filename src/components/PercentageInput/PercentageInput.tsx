import { useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { sanitizeDecimalInput } from '../../common/numberInput';
import '../../common/tokens.css';
import styles from './PercentageInput.module.css';

export interface PercentageInputProps {
  id: string;
  percentage: number;
  'aria-label': string;
  onCommit: (nextValue: number) => void;
  disabled?: boolean;
  maxDecimals?: number;
  'aria-describedby'?: string;
}

const MAX_PERCENTAGE = 100;

/** A numeric input pill suffixed with a "%" sign */
export const PercentageInput = ({
  id,
  percentage,
  disabled,
  onCommit,
  maxDecimals = 2,
  ...rest
}: PercentageInputProps) => {
  const [draft, setDraft] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitizeDecimalInput(event.target.value, maxDecimals);
    setDraft(cleaned);

    if (cleaned === '' || cleaned === '.') {
      return;
    }

    const parsed = Number.parseFloat(cleaned);

    if (Number.isNaN(parsed)) {
      return;
    }

    onCommit(parsed);
  };

  const handleBlur = () => {
    setDraft(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const step = event.shiftKey ? 10 : 1;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setDraft(null);
      onCommit(percentage + step);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setDraft(null);
      onCommit(percentage - step);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setDraft(null);
      onCommit(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setDraft(null);
      onCommit(MAX_PERCENTAGE);
    }
  };

  return (
    <span className={styles.percentageInput}>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={styles.percentageInputField}
        value={draft ?? String(percentage)}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        {...rest}
      />
      <span className={styles.percentageInputSign}>%</span>
    </span>
  );
};
