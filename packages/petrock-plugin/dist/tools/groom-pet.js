"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groomPetSchema = void 0;
exports.groomPet = groomPet;
const zod_1 = require("zod");
const hcs_1 = require("../lib/hcs");
exports.groomPetSchema = zod_1.z.object({
    serial: zod_1.z.number().describe("NFT serial number of the pet"),
    topicId: zod_1.z.string().describe("HCS topic ID for this pet"),
});
async function groomPet({ serial, topicId }) {
    const txId = await (0, hcs_1.submitPetMessage)(topicId, {
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
//# sourceMappingURL=groom-pet.js.map