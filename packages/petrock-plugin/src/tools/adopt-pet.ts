import { z } from "zod";
import { createPetTopic, submitPetMessage, submitRegistryMessage } from "../lib/hcs";
import { mintRockNft } from "../lib/nft";

export const adoptPetSchema = z.object({
  name: z.string().describe("A display name for the pet rock"),
  metadataBaseUrl: z
    .string()
    .optional()
    .describe("Base URL for NFT metadata endpoint (defaults to NEXT_PUBLIC_APP_URL)"),
});

export type AdoptPetInput = z.infer<typeof adoptPetSchema>;

export async function adoptPet({ name, metadataBaseUrl }: AdoptPetInput): Promise<string> {
  const baseUrl =
    metadataBaseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const topicId = await createPetTopic();
  const serial = await mintRockNft(`${baseUrl}/api/metadata/${Date.now()}`);

  await submitPetMessage(topicId, {
    action: "born",
    serial,
    name,
    hunger: 100,
    mood: 100,
    energy: 100,
    alive: true,
    born_at: new Date().toISOString(),
  });

  // Write to the global registry if it is configured
  if (process.env.PET_ROCK_REGISTRY_TOPIC_ID) {
    await submitRegistryMessage(serial, name, topicId).catch(() => {
      // Non-fatal — registry write failure doesn't block adoption
    });
  }

  return JSON.stringify({
    success: true,
    serial,
    topicId,
    message: `${name} (Pet Rock #${serial}) adopted! NFT minted on Hedera. HCS topic: ${topicId}.`,
  });
}
