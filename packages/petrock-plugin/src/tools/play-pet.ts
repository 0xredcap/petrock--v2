import { z } from "zod";
import { submitPetMessage } from "../lib/hcs";

export const playPetSchema = z.object({
  serial: z.number().describe("NFT serial number of the pet"),
  topicId: z.string().describe("HCS topic ID for this pet"),
});

export type PlayPetInput = z.infer<typeof playPetSchema>;

export async function playWithPet({ serial, topicId }: PlayPetInput): Promise<string> {
  const txId = await submitPetMessage(topicId, {
    action: "play",
    mood: 30,
    energy: -10,
  });

  return JSON.stringify({
    success: true,
    txId,
    message: `Played with Pet Rock #${serial}! Mood +30, energy -10. Transaction: ${txId}`,
  });
}
