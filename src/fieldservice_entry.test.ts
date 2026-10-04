import { recordFollowUp } from "./fieldservice_entry.ts";

const before = { id: "WO-1", technicianPhone: "+15550000000", status: "en_route" as const, photos: [] as string[] };
const after = recordFollowUp(before, "meter.jpg", "Check seal in 30 days");
if (after.status !== "complete" || after.photos[0] !== "meter.jpg" || after.followUp !== "Check seal in 30 days") {
  throw new Error("follow-up decision did not complete the work order");
}
console.log("follow-up test passed");
