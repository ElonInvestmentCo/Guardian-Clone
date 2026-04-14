import { useRef, useCallback } from "react";

export function formatDateInput(raw: string, prevValue: string): { value: string; cursorPos: number } {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const prevDigits = prevValue.replace(/\D/g, "");

  const isDeleting = digits.length < prevDigits.length;

  let effectiveDigits = digits;
  if (isDeleting && prevDigits.length > 0 && digits.length === prevDigits.length) {
    effectiveDigits = digits.slice(0, -1);
  }

  let formatted = "";
  for (let i = 0; i < effectiveDigits.length; i++) {
    if (i === 2 || i === 4) formatted += "/";
    formatted += effectiveDigits[i];
  }

  return { value: formatted, cursorPos: formatted.length };
}

export function useDateMask(
  value: string,
  onChange: (v: string) => void
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const prevValueRef = useRef(value);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const { value: formatted, cursorPos } = formatDateInput(raw, prevValueRef.current);
      prevValueRef.current = formatted;
      onChange(formatted);

      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(cursorPos, cursorPos);
        }
      });
    },
    [onChange]
  );

  return { inputRef, handleChange, value };
}
