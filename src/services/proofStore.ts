import { calculate, type CalculatorAnswers, type CalculatorResult } from "./calculator.js";
import { parseAnswers } from "../lib/parseAnswers.js";

export type ProofRecord = {
  id: string;
  createdAt: string;
  answers: CalculatorAnswers;
  result: CalculatorResult;
  sms?: { to: string; body: string; dryRun: boolean; sentAt: string };
  lock?: {
    paymentPath: "invoice" | "split" | "care-first";
    contactName: string;
    mobile: string;
    lockedAt: string;
  };
};

/** Stateless id so /value/:id works on Vercel (no shared disk or in-memory Map). */
export function encodeProofId(answers: CalculatorAnswers): string {
  return Buffer.from(JSON.stringify(answers), "utf8").toString("base64url");
}

export function decodeProofId(id: string): CalculatorAnswers | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(id, "base64url").toString("utf8"));
    return parseAnswers(parsed);
  } catch {
    return null;
  }
}

function recordFromAnswers(answers: CalculatorAnswers, extra: Partial<ProofRecord> = {}): ProofRecord {
  return {
    id: encodeProofId(answers),
    createdAt: extra.createdAt ?? new Date().toISOString(),
    answers,
    result: extra.result ?? calculate(answers),
    sms: extra.sms,
    lock: extra.lock,
  };
}

export async function createProof(answers: CalculatorAnswers): Promise<ProofRecord> {
  return recordFromAnswers(answers);
}

export async function getProof(id: string): Promise<ProofRecord | undefined> {
  const answers = decodeProofId(id);
  if (!answers) return undefined;
  return recordFromAnswers(answers);
}

/** Re-encode after lock/SMS fields change — those live on the person record, not in the URL. */
export async function saveProof(record: ProofRecord): Promise<ProofRecord> {
  return record;
}

export function publicBaseUrl(reqHost?: string, proto?: string): string {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  if (reqHost) return `${proto === "http" ? "http" : "https"}://${reqHost}`;
  return "http://localhost:3000";
}

export function proofUrl(id: string, baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/value/${id}`;
}

export function proofSmsBody(companyName: string, url: string): string {
  return `Charlie from Insanely Smart — here's the proof of value for ${companyName}: ${url}`;
}

export function lockSmsBody(companyName: string, url: string): string {
  return `You're locked in with Insanely Smart for ${companyName}. Mick will be in touch about the first build. Your numbers are still here: ${url}`;
}
