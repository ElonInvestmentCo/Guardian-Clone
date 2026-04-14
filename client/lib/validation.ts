export function required(value: unknown, label: string): string | null {
  if (value === undefined || value === null) return `${label} is required`;
  if (typeof value === "string" && value.trim() === "") return `${label} is required`;
  return null;
}

export function minLength(value: string, min: number, label: string): string | null {
  if (value.trim().length < min) return `${label} must be at least ${min} characters`;
  return null;
}

export function maxLength(value: string, max: number, label: string): string | null {
  if (value.trim().length > max) return `${label} must be at most ${max} characters`;
  return null;
}

export function nameField(value: string, label: string): string | null {
  const r = required(value, label);
  if (r) return r;
  if (value.trim().length < 2) return `${label} must be at least 2 characters`;
  if (!/^[a-zA-ZÀ-ÿ\s'\-\.]+$/.test(value.trim())) return `${label} contains invalid characters`;
  return null;
}

export function emailFormat(value: string): string | null {
  const r = required(value, "Email");
  if (r) return r;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) return "Enter a valid email address";
  return null;
}

export function phoneFormat(value: string): string | null {
  const r = required(value, "Phone number");
  if (r) return r;
  const cleaned = value.replace(/[\s\-().+]/g, "");
  if (!/^\d{7,15}$/.test(cleaned)) return "Enter a valid phone number (7–15 digits)";
  return null;
}

export function zipCode(value: string, countryCode: string): string | null {
  const r = required(value, "ZIP / Postal code");
  if (r) return r;
  const v = value.trim();
  switch (countryCode) {
    case "US":
      if (!/^\d{5}(-\d{4})?$/.test(v)) return "Enter a valid US ZIP code (e.g., 12345 or 12345-6789)";
      break;
    case "CA":
      if (!/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/.test(v)) return "Enter a valid Canadian postal code (e.g., K1A 0B1)";
      break;
    case "GB":
      if (!/^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/.test(v)) return "Enter a valid UK postcode (e.g., SW1A 1AA)";
      break;
    case "AU":
      if (!/^\d{4}$/.test(v)) return "Enter a valid Australian postcode (4 digits)";
      break;
    case "DE":
    case "FR":
    case "IT":
    case "ES":
      if (!/^\d{5}$/.test(v)) return "Enter a valid 5-digit postal code";
      break;
    case "IN":
      if (!/^\d{6}$/.test(v)) return "Enter a valid Indian PIN code (6 digits)";
      break;
    case "JP":
      if (!/^\d{3}-?\d{4}$/.test(v)) return "Enter a valid Japanese postal code (e.g., 100-0001)";
      break;
    case "BR":
      if (!/^\d{5}-?\d{3}$/.test(v)) return "Enter a valid Brazilian CEP (e.g., 01310-100)";
      break;
    case "SG":
      if (!/^\d{6}$/.test(v)) return "Enter a valid Singapore postal code (6 digits)";
      break;
    default:
      if (v.length < 3 || v.length > 10) return "Enter a valid postal code";
      break;
  }
  return null;
}

export function dateFormat(value: string, label: string): string | null {
  const r = required(value, label);
  if (r) return r;
  const v = value.trim();
  const dateRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
  const isoRegex = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;
  if (!dateRegex.test(v) && !isoRegex.test(v)) {
    return `${label} must be a valid date (MM/DD/YYYY)`;
  }
  const parsed = new Date(v);
  if (isNaN(parsed.getTime())) return `${label} is not a valid date`;
  return null;
}

export function dateOfBirth(value: string): string | null {
  const fmt = dateFormat(value, "Date of birth");
  if (fmt) return fmt;
  const parsed = new Date(value.trim());
  const now = new Date();
  let age = now.getFullYear() - parsed.getFullYear();
  const monthDiff = now.getMonth() - parsed.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < parsed.getDate())) {
    age--;
  }
  if (age < 18) return "You must be at least 18 years old";
  if (age > 120) return "Please enter a valid date of birth";
  return null;
}

export function idExpirationDate(value: string): string | null {
  const fmt = dateFormat(value, "Expiration date");
  if (fmt) return fmt;
  const parsed = new Date(value.trim());
  if (parsed <= new Date()) return "ID has expired. Please use a valid, unexpired ID";
  return null;
}

export function ssnFormat(value: string, taxIdType: string): string | null {
  const r = required(value, "Tax ID");
  if (r) return r;
  const cleaned = value.replace(/[\s\-]/g, "");
  if (taxIdType === "SSN") {
    if (!/^\d{9}$/.test(cleaned)) return "SSN must be exactly 9 digits (e.g., 123-45-6789)";
    if (cleaned.startsWith("000") || cleaned.startsWith("666") || cleaned.startsWith("9"))
      return "Enter a valid SSN";
  } else if (taxIdType === "EIN") {
    if (!/^\d{9}$/.test(cleaned)) return "EIN must be exactly 9 digits (e.g., 12-3456789)";
  } else {
    if (cleaned.length < 4) return "Foreign ID must be at least 4 characters";
  }
  return null;
}

export function idNumber(value: string): string | null {
  const r = required(value, "ID number");
  if (r) return r;
  if (value.trim().length < 4) return "ID number must be at least 4 characters";
  return null;
}

export function addressField(value: string, label: string): string | null {
  const r = required(value, label);
  if (r) return r;
  if (value.trim().length < 5) return `${label} must be at least 5 characters`;
  return null;
}

export function depositAmount(value: string): string | null {
  const r = required(value, "Initial deposit amount");
  if (r) return r;
  const cleaned = value.replace(/[$,\s]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num) || num <= 0) return "Enter a valid deposit amount";
  return null;
}

export function abaSwiftCode(value: string): string | null {
  const r = required(value, "ABA / SWIFT code");
  if (r) return r;
  const v = value.trim();
  const isABA = /^\d{9}$/.test(v);
  const isSWIFT = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i.test(v);
  if (!isABA && !isSWIFT) return "Enter a valid ABA (9 digits) or SWIFT code (8-11 characters)";
  return null;
}

export function accountNumber(value: string): string | null {
  if (!value.trim()) return null;
  const cleaned = value.replace(/[\s\-]/g, "");
  if (!/^\d{4,17}$/.test(cleaned)) return "Account number should be 4-17 digits";
  return null;
}

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

export function runValidation<T extends string>(
  rules: Array<[T, string | null]>
): FieldErrors<T> {
  const errors: FieldErrors<T> = {};
  for (const [field, error] of rules) {
    if (error) errors[field] = error;
  }
  return errors;
}

export function hasErrors<T extends string>(errors: FieldErrors<T>): boolean {
  return Object.values(errors).some((v) => v !== undefined && v !== null && v !== "");
}
