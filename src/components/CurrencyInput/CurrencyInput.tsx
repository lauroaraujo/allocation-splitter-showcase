import { useLayoutEffect, useRef, useState, type ChangeEvent } from 'react';
import { formatCurrency } from '../../common/currency';
import {
  countDigits,
  cursorOffsetForDigitCount,
  isPastDecimalPoint,
  sanitizeDecimalInput,
} from '../../common/numberInput';
import '../../common/tokens.css';
import styles from './CurrencyInput.module.css';

export interface CurrencyInputProps {
  id: string;
  amount: number;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  onCommit: (nextValue: number) => void;
}

/** A "$"-prefixed numeric input that formats with thousands separators */
export const CurrencyInput = ({ id, amount, disabled, onCommit, ...rest }: CurrencyInputProps) => {
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCursorRef = useRef<number | null>(null);

  // Restores the caret position after a keystroke reformats the draft with
  // thousands separators (e.g. typing the 4th digit turns "123" into "1,234"),
  // since otherwise the browser would just push the caret to the end.
  useLayoutEffect(() => {
    if (pendingCursorRef.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(pendingCursorRef.current, pendingCursorRef.current);
      pendingCursorRef.current = null;
    }
  }, [draft]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const cursorPos = event.target.selectionStart ?? rawValue.length;
    const digitsBeforeCursor = countDigits(rawValue, cursorPos);
    const pastDecimalPoint = isPastDecimalPoint(rawValue, cursorPos);
    const cleaned = sanitizeDecimalInput(rawValue);
    const formatted = formatCurrencyDraft(cleaned);

    pendingCursorRef.current = cursorOffsetForDigitCount(formatted, digitsBeforeCursor, pastDecimalPoint);
    setDraft(formatted);

    if (cleaned === '' || cleaned === '.') {
      return;
    }

    const parsed = Number.parseFloat(cleaned);

    if (Number.isNaN(parsed)) {
      return;
    }

    onCommit(Math.max(0, parsed));
  };

  const handleBlur = () => {
    setDraft(null);
  };

  return (
    <span className={styles.currencyInput}>
      <span className={styles.currencyInputSign}>$</span>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={styles.currencyInputField}
        value={draft ?? formatCurrency(amount)}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        {...rest}
      />
    </span>
  );
};

function formatCurrencyDraft(cleaned: string): string {
  const dotIndex = cleaned.indexOf('.');
  const intPart = dotIndex === -1 ? cleaned : cleaned.slice(0, dotIndex);
  const rest = dotIndex === -1 ? '' : cleaned.slice(dotIndex);

  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + rest;
}
