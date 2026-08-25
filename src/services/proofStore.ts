import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { calculate, type CalculatorAnswers, type CalculatorResult } from "./calculator.js";

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

const store = new Map<string, ProofRecord>();
const dataFile = path.resolve(process.cwd(), "data", "proofs.json");
let loaded = false;

function proofId(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let id = "is-";
  for (const byte of bytes) id += alphabet[byte % alphabet.length];
  return id;
}

async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw) as ProofRecord[];
    for (const record of parsed) store.set(record.id, record);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") console.warn("Could not load proofs file:", err);
  }
}

async function persist(): Promise<void> {
  try {
    await mkdir(path.dirname(dataFile), { recursive: true });
    await writeFile(dataFile, JSON.stringify([...store.values()], null, 2));
  } catch (err) {
    console.warn("Could not persist proofs file:", err);
  }
}

export async function createProof(answers: CalculatorAnswers): Promise<ProofRecord> {
  await ensureLoaded();
  const result = calculate(answers);
  const record: ProofRecord = {
    id: proofId(),
    createdAt: new Date().toISOString(),
    answers,
    result,
  };
  store.set(record.id, record);
  await persist();
  return record;
}

export async function getProof(id: string): Promise<ProofRecord | undefined> {
  await ensureLoaded();
  return store.get(id);
}

export async function saveProof(record: ProofRecord): Promise<ProofRecord> {
  await ensureLoaded();
  store.set(record.id, record);
  await persist();
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
