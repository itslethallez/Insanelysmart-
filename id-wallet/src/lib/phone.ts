/** Australian mobile numbers: 04xx xxx xxx or +61 4xx xxx xxx. */
export function normaliseAuMobile(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  let national = digits;

  if (national.startsWith("+61")) national = `0${national.slice(3)}`;
  else if (national.startsWith("61") && national.length >= 11) national = `0${national.slice(2)}`;

  const compact = national.replace(/\D/g, "");
  if (/^04\d{8}$/.test(compact)) return `+61${compact.slice(1)}`;
  return null;
}

export function isIndustry(value: string): value is
  | "trades"
  | "clinic"
  | "beauty"
  | "professional"
  | "hospitality"
  | "retail"
  | "other" {
  return ["trades", "clinic", "beauty", "professional", "hospitality", "retail", "other"].includes(value);
}

export function isTeamBand(value: string): value is "1-5" | "6-10" | "11+" {
  return value === "1-5" || value === "6-10" || value === "11+";
}

export function isPhoneHandler(value: string): value is "owner" | "receptionist" | "whoever" | "rings-out" {
  return value === "owner" || value === "receptionist" || value === "whoever" || value === "rings-out";
}
