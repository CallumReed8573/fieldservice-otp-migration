import { sendTechnicianCode, verifyTechnicianCode, verifyDispatchCaptcha } from "./infrai_phone_client.ts";

export type WorkOrder = { id: string; technicianPhone: string; status: "dispatched" | "en_route" | "complete"; photos: string[]; followUp?: string };

export async function beginTechnicianLogin(phone: string, widgetRecordId: string, captchaToken: string, ip: string) {
  await verifyDispatchCaptcha(widgetRecordId, captchaToken, ip);
  await sendTechnicianCode({ phone, purpose: "technician_login", locale: "en-US" });
  return { next: "enter_code", phone } as const;
}

export async function completeTechnicianLogin(phone: string, code: string) {
  const session = await verifyTechnicianCode({ phone, code, login: true });
  return { authenticated: true, session };
}

export function recordFollowUp(order: WorkOrder, photo: string, note: string): WorkOrder {
  return { ...order, photos: [...order.photos, photo], followUp: note, status: "complete" };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(recordFollowUp({ id: "WO-104", technicianPhone: "+15551234567", status: "en_route", photos: [] }, "arrival.jpg", "Replace filter next visit"));
}
