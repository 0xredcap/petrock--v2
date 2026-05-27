"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleepPetSchema = void 0;
exports.letPetSleep = letPetSleep;
const zod_1 = require("zod");
const hcs_1 = require("../lib/hcs");
exports.sleepPetSchema = zod_1.z.object({
    serial: zod_1.z.number().describe("NFT serial number of the pet"),
    topicId: zod_1.z.string().describe("HCS topic ID for this pet"),
});
async function letPetSleep({ serial, topicId }) {
    const txId = await (0, hcs_1.submitPetMessage)(topicId, {
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
//# sourceMappingURL=sleep-pet.js.map