// Keeps digits and a single decimal point, capped at `maxDecimals` fractional
// digits, while letting the user freely type "88." or "88.8" en route to
// "88.88" without the field snapping back mid-entry. Shared by the percentage
// inputs and the currency input.
export function sanitizeDecimalInput(rawValue: string, maxDecimals = 2): string {
  const digitsAndDot = rawValue.replace(/[^0-9.]/g, '');
  const dotIndex = digitsAndDot.indexOf('.');

  if (dotIndex === -1) {
    return digitsAndDot;
  }

  const intPart = digitsAndDot.slice(0, dotIndex);
  const decimalPart = digitsAndDot.slice(dotIndex + 1).replace(/\./g, '').slice(0, maxDecimals);
  return `${intPart}.${decimalPart}`;
}

export function countDigits(value: string, endIndex: number): number {
  return value.slice(0, endIndex).replace(/[^0-9]/g, '').length;
}

// A digit count alone can't tell "right before the decimal point" apart from
// "right after it" (no digits sit between those two positions), so this is
// tracked separately and used to break the tie in cursorOffsetForDigitCount.
export function isPastDecimalPoint(value: string, endIndex: number): boolean {
  return value.slice(0, endIndex).includes('.');
}

// Inverse of countDigits: finds the position in `formatted` right after the
// nth digit, so the caret lands on the same digit post-format instead of
// drifting when a comma is inserted or removed ahead of it. `pastDecimalPoint`
// resolves the tie above by placing the caret after the "." once it's reached,
// rather than stopping just before it.
export function cursorOffsetForDigitCount(
  formatted: string,
  digitCount: number,
  pastDecimalPoint = false
): number {
  if (digitCount <= 0 && !pastDecimalPoint) {
    return 0;
  }

  let seen = 0;
  let passedDot = false;

  for (let i = 0; i < formatted.length; i++) {
    const char = formatted[i];
    if (/[0-9]/.test(char)) {
      seen += 1;
      if (seen === digitCount && (!pastDecimalPoint || passedDot)) {
        return i + 1;
      }
    } else if (char === '.') {
      passedDot = true;
      if (pastDecimalPoint && seen === digitCount) {
        return i + 1;
      }
    }
  }

  return formatted.length;
}

