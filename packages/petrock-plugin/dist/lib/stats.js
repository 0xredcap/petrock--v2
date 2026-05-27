"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeCurrentStats = computeCurrentStats;
exports.isDead = isDead;
exports.isGraceWindowExpired = isGraceWindowExpired;
const DECAY_HUNGER_PER_MS = 2 / (60 * 60 * 1000);
const DECAY_MOOD_PER_MS = 1 / (60 * 60 * 1000);
const DECAY_ENERGY_PER_MS = 1.5 / (60 * 60 * 1000);
const DISTRESS_THRESHOLD = 15;
const GRACE_WINDOW_MS = 24 * 60 * 60 * 1000;
function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
}
function computeCurrentStats(messages) {
    let hunger = 0;
    let mood = 0;
    let energy = 0;
    let alive = false;
    let born_at;
    let died_at;
    let lastActionAt = Date.now();
    let distressed = null;
    for (const msg of messages) {
        const msgTime = msg.timestamp ?? Date.now();
        switch (msg.action) {
            case "born":
                hunger = 100;
                mood = 100;
                energy = 100;
                alive = true;
                born_at = msg.born_at;
                lastActionAt = msgTime;
                distressed = null;
                break;
            case "feed":
                hunger = clamp(hunger + (msg.hunger ?? 30));
                mood = clamp(mood + (msg.mood ?? 5));
                lastActionAt = msgTime;
                break;
            case "play":
                mood = clamp(mood + (msg.mood ?? 30));
                energy = clamp(energy + (msg.energy ?? -10));
                lastActionAt = msgTime;
                break;
            case "groom":
                mood = clamp(mood + (msg.mood ?? 20));
                energy = clamp(energy + (msg.energy ?? 10));
                lastActionAt = msgTime;
                break;
            case "sleep":
                energy = clamp(energy + (msg.energy ?? 40));
                mood = clamp(mood + (msg.mood ?? -5));
                hunger = clamp(hunger + (msg.hunger ?? -10));
                lastActionAt = msgTime;
                break;
            case "distressed":
                distressed = {
                    reason: msg.reason ?? "low_hunger",
                    grace_until: msg.grace_until ?? new Date(msgTime + GRACE_WINDOW_MS).toISOString(),
                };
                break;
            case "recovered":
                distressed = null;
                break;
            case "died":
                alive = false;
                died_at = msg.died_at;
                lastActionAt = msgTime;
                distressed = null;
                break;
        }
    }
    if (!alive && messages.length === 0) {
        return { hunger: 0, mood: 0, energy: 0, alive: false, lastActionAt, distressed: null };
    }
    if (alive) {
        const elapsedMs = Date.now() - lastActionAt;
        hunger = clamp(hunger - DECAY_HUNGER_PER_MS * elapsedMs);
        mood = clamp(mood - DECAY_MOOD_PER_MS * elapsedMs);
        energy = clamp(energy - DECAY_ENERGY_PER_MS * elapsedMs);
        // Compute distress from current stats if not already in a recorded distress state
        if (distressed === null) {
            if (hunger <= DISTRESS_THRESHOLD) {
                distressed = {
                    reason: "low_hunger",
                    grace_until: new Date(Date.now() + GRACE_WINDOW_MS).toISOString(),
                };
            }
            else if (mood <= DISTRESS_THRESHOLD) {
                distressed = {
                    reason: "low_mood",
                    grace_until: new Date(Date.now() + GRACE_WINDOW_MS).toISOString(),
                };
            }
            else if (energy <= DISTRESS_THRESHOLD) {
                distressed = {
                    reason: "low_energy",
                    grace_until: new Date(Date.now() + GRACE_WINDOW_MS).toISOString(),
                };
            }
        }
    }
    return { hunger, mood, energy, alive, born_at, died_at, lastActionAt, distressed };
}
function isDead(state) {
    return state.hunger <= 0 && state.mood <= 0;
}
function isGraceWindowExpired(state) {
    if (!state.distressed)
        return false;
    return new Date(state.distressed.grace_until) < new Date();
}
//# sourceMappingURL=stats.js.map