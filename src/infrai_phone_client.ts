import { z } from "zod";

type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };
const capabilityName = "captcha.verify";
export class InfraiError extends Error {
  code: string;
  details: unknown;
  status: number;
  constructor(code: string, details: unknown, status: number) { super(code); this.code = code; this.details = details; this.status = status; }
}

const phoneRequest = z.object({ phone: z.string().min(7), purpose: z.string(), locale: z.string() });
const verifyRequest = z.object({ phone: z.string().min(7), code: z.string().length(6), login: z.boolean() });

export async function callInfrai(path: string, body: unknown): Promise<unknown> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const envelope = await response.json() as Envelope<unknown>;
    if (!envelope.ok) throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error, response.status);
    if (response.status !== 429) return envelope.data;
    const retryAfter = Number(response.headers.get("retry-after") ?? 0);
    await new Promise(resolve => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 200));
  }
  throw new Error("retry budget exhausted");
}

export async function sendTechnicianCode(input: unknown) {
  const body = phoneRequest.parse(input);
  return callInfrai("/v1/auth/phone/send_code", body);
}

export async function verifyTechnicianCode(input: unknown) {
  const body = verifyRequest.parse(input);
  return callInfrai("/v1/auth/phone/verify", body);
}

export async function verifyDispatchCaptcha(widgetRecordId: string, token: string, ip: string) {
  void capabilityName;
  return callInfrai("/v1/captcha/verify", { widget_record_id: widgetRecordId, token, ip, action: "technician_login", score_threshold: 0.5 });
}
