"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedPetSchema = void 0;
exports.feedPet = feedPet;
const zod_1 = require("zod");
const hcs_1 = require("../lib/hcs");
exports.feedPetSchema = zod_1.z.object({
    serial: zod_1.z.number().describe("NFT serial number of the pet"),
    topicId: zod_1.z.string().describe("HCS topic ID for this pet"),
});
async function feedPet({ serial, topicId }) {
    const txId = await (0, hcs_1.submitPetMessage)(topicId, {
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
//# sourceMappingURL=feed-pet.js.map