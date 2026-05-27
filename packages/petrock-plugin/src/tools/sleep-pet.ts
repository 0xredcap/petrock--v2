import { z } from "zod";
import { submitPetMessage } from "../lib/hcs";

export const sleepPetSchema = z.object({
  serial: z.number().describe("NFT serial number of the pet"),
  topicId: z.string().describe("HCS topic ID for this pet"),
});

export type SleepPetInput = z.infer<typeof sleepPetSchema>;

export async function letPetSleep({ serial, topicId }: SleepPetInput): Promise<string> {
  const txId = await submitPetMessage(topicId, {
    action: "sleep",
    energy: 40,
    mood: -5,
    hunger: -10,
  });

  return JSON.stringify({
    success: true,
    txId,
    message: `Pet Rock #${serial} is sleeping. Energy +40, mood -5, hunger -10. Transaction: ${txId}`,
  });
}
