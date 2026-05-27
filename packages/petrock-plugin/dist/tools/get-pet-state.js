"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPetStateSchema = void 0;
exports.getPetState = getPetState;
const zod_1 = require("zod");
const hcs_1 = require("../lib/hcs");
const stats_1 = require("../lib/stats");
const nft_1 = require("../lib/nft");
exports.getPetStateSchema = zod_1.z.object({
    serial: zod_1.z.number().describe("NFT serial number of the pet"),
    topicId: zod_1.z.string().describe("HCS topic ID for this pet"),
});
async function getPetState({ serial, topicId }) {
    const messages = await (0, hcs_1.readPetMessages)(topicId);
    const state = (0, stats_1.computeCurrentStats)(messages);
    if (!state.alive) {
        return JSON.stringify({
            success: true,
            serial,
            state,
            message: `Pet Rock #${serial} has already passed away.`,
        });
    }
    // Record distress on-chain if newly detected and not yet recorded
    const lastMsg = messages[messages.length - 1];
    const lastRecordedDistress = lastMsg?.action === "distressed" ? lastMsg : null;
    if (state.distressed &&
        (!lastRecordedDistress || lastRecordedDistress.reason !== state.distressed.reason)) {
        await (0, hcs_1.submitPetMessage)(topicId, {
            action: "distressed",
            serial,
            reason: state.distressed.reason,
            grace_until: state.distressed.grace_until,
        }).catch(() => {
            // Non-fatal — state is still returned to caller
        });
    }
    // Record recovery on-chain if stat has recovered above 30
    const lastRecordedRecovery = messages.find((m) => m.action === "recovered");
    if (!state.distressed &&
        lastRecordedDistress &&
        !lastRecordedRecovery) {
        await (0, hcs_1.submitPetMessage)(topicId, {
            action: "recovered",
            serial,
            recovered_at: new Date().toISOString(),
        }).catch(() => { });
    }
    // Death after grace window expires
    if ((0, stats_1.isGraceWindowExpired)(state) || (0, stats_1.isDead)(state)) {
        await (0, hcs_1.submitPetMessage)(topicId, {
            action: "died",
            alive: false,
            died_at: new Date().toISOString(),
        });
        if (process.env.PET_ROCK_NFT_COLLECTION_ID) {
            await (0, nft_1.burnRockNft)(serial).catch(() => { });
        }
        return JSON.stringify({
            success: true,
            serial,
            state: { ...state, alive: false },
            died: true,
            message: `Pet Rock #${serial} has passed away. The NFT has been burned.`,
        });
    }
    const labels = {
        mood: state.mood > 70 ? "happy" : state.mood > 30 ? "neutral" : "sad",
        hunger: state.hunger > 70 ? "full" : state.hunger > 30 ? "peckish" : "starving",
        energy: state.energy > 70 ? "energetic" : state.energy > 30 ? "tired" : "exhausted",
    };
    const distressNote = state.distressed
        ? ` ⚠️ DISTRESSED (${state.distressed.reason}): grace window until ${new Date(state.distressed.grace_until).toLocaleString()}.`
        : "";
    return JSON.stringify({
        success: true,
        serial,
        topicId,
        state,
        message: `Pet Rock #${serial} — Hunger: ${Math.round(state.hunger)}/100 (${labels.hunger}), ` +
            `Mood: ${Math.round(state.mood)}/100 (${labels.mood}), ` +
            `Energy: ${Math.round(state.energy)}/100 (${labels.energy}).` +
            distressNote,
    });
}
//# sourceMappingURL=get-pet-state.js.map