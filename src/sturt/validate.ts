/** Normalizes an Australian mobile number to +61XXXXXXXXX, or null if it doesn't look like one. */
export function normalizeAuMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");

  let national: string;
  if (digits.startsWith("61") && digits.length === 11) {
    national = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 10) {
    national = digits.slice(1);
  } else if (digits.length === 9) {
    national = digits;
  } else {
    return null;
  }

  if (!/^4\d{8}$/.test(national)) return null;
  return "+61" + national;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}
