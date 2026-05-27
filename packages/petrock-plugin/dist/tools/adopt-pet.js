"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adoptPetSchema = void 0;
exports.adoptPet = adoptPet;
const zod_1 = require("zod");
const hcs_1 = require("../lib/hcs");
const nft_1 = require("../lib/nft");
exports.adoptPetSchema = zod_1.z.object({
    name: zod_1.z.string().describe("A display name for the pet rock"),
    metadataBaseUrl: zod_1.z
        .string()
        .optional()
        .describe("Base URL for NFT metadata endpoint (defaults to NEXT_PUBLIC_APP_URL)"),
});
async function adoptPet({ name, metadataBaseUrl }) {
    const baseUrl = metadataBaseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const topicId = await (0, hcs_1.createPetTopic)();
    const serial = await (0, nft_1.mintRockNft)(`${baseUrl}/api/metadata/${Date.now()}`);
    await (0, hcs_1.submitPetMessage)(topicId, {
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
        await (0, hcs_1.submitRegistryMessage)(serial, name, topicId).catch(() => {
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
//# sourceMappingURL=adopt-pet.js.map