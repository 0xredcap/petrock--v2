"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playPetSchema = void 0;
exports.playWithPet = playWithPet;
const zod_1 = require("zod");
const hcs_1 = require("../lib/hcs");
exports.playPetSchema = zod_1.z.object({
    serial: zod_1.z.number().describe("NFT serial number of the pet"),
    topicId: zod_1.z.string().describe("HCS topic ID for this pet"),
});
async function playWithPet({ serial, topicId }) {
    const txId = await (0, hcs_1.submitPetMessage)(topicId, {
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
//# sourceMappingURL=play-pet.js.map