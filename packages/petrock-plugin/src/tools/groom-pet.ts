import { z } from "zod";
import { submitPetMessage } from "../lib/hcs";

export const groomPetSchema = z.object({
  serial: z.number().describe("NFT serial number of the pet"),
  topicId: z.string().describe("HCS topic ID for this pet"),
});

export type GroomPetInput = z.infer<typeof groomPetSchema>;

export async function groomPet({ serial, topicId }: GroomPetInput): Promise<string> {
  const txId = await submitPetMessage(topicId, {
    action: "groom",
    mood: 20,
    energy: 10,
  });

  return JSON.stringify({
    success: true,
    txId,
    message: `Groomed Pet Rock #${serial}! Mood +20, energy +10. Transaction: ${txId}`,
  });
}
