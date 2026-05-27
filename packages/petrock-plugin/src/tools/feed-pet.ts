import { z } from "zod";
import { submitPetMessage } from "../lib/hcs";

export const feedPetSchema = z.object({
  serial: z.number().describe("NFT serial number of the pet"),
  topicId: z.string().describe("HCS topic ID for this pet"),
});

export type FeedPetInput = z.infer<typeof feedPetSchema>;

export async function feedPet({ serial, topicId }: FeedPetInput): Promise<string> {
  const txId = await submitPetMessage(topicId, {
    action: "feed",
    hunger: 30,
    mood: 5,
  });

  return JSON.stringify({
    success: true,
    txId,
    message: `Fed Pet Rock #${serial}! Hunger +30, mood +5. Transaction: ${txId}`,
  });
}
