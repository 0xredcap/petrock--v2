"use strict";
// Public API: plugin entry point + standalone lib exports
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.petRockPlugin = exports.petRockTools = void 0;
__exportStar(require("./lib/client"), exports);
__exportStar(require("./lib/hcs"), exports);
__exportStar(require("./lib/nft"), exports);
__exportStar(require("./lib/stats"), exports);
__exportStar(require("./tools/adopt-pet"), exports);
__exportStar(require("./tools/feed-pet"), exports);
__exportStar(require("./tools/play-pet"), exports);
__exportStar(require("./tools/groom-pet"), exports);
__exportStar(require("./tools/sleep-pet"), exports);
__exportStar(require("./tools/get-pet-state"), exports);
__exportStar(require("./tools/list-pets"), exports);
const adopt_pet_1 = require("./tools/adopt-pet");
const feed_pet_1 = require("./tools/feed-pet");
const play_pet_1 = require("./tools/play-pet");
const groom_pet_1 = require("./tools/groom-pet");
const sleep_pet_1 = require("./tools/sleep-pet");
const get_pet_state_1 = require("./tools/get-pet-state");
const list_pets_1 = require("./tools/list-pets");
exports.petRockTools = [
    {
        name: "adopt_pet",
        description: "Adopt (mint) a new Pet Rock NFT. Creates an HCS topic for the pet's state, mints an NFT to the treasury, and writes the initial born message. The caller pays 1 HBAR to the treasury (user-signed).",
        schema: adopt_pet_1.adoptPetSchema,
        func: adopt_pet_1.adoptPet,
    },
    {
        name: "feed_pet",
        description: "Feed the pet rock. Restores hunger (+30) and mood (+5). The caller pays 0.5 HBAR (user-signed); treasury writes the HCS message.",
        schema: feed_pet_1.feedPetSchema,
        func: feed_pet_1.feedPet,
    },
    {
        name: "play_with_pet",
        description: "Play with the pet rock. Boosts mood (+30) but costs energy (-10). The caller pays 0.5 HBAR (user-signed).",
        schema: play_pet_1.playPetSchema,
        func: play_pet_1.playWithPet,
    },
    {
        name: "groom_pet",
        description: "Groom the pet rock. Boosts mood (+20) and energy (+10). The caller pays 0.5 HBAR (user-signed).",
        schema: groom_pet_1.groomPetSchema,
        func: groom_pet_1.groomPet,
    },
    {
        name: "let_pet_sleep",
        description: "Let the pet rock sleep. Restores energy (+40), costs mood (-5) and hunger (-10). Free — treasury writes the HCS message.",
        schema: sleep_pet_1.sleepPetSchema,
        func: sleep_pet_1.letPetSleep,
    },
    {
        name: "get_pet_state",
        description: "Read the current state of a pet rock by replaying its HCS topic messages with time-based decay. Returns stats and distress status. Free.",
        schema: get_pet_state_1.getPetStateSchema,
        func: get_pet_state_1.getPetState,
    },
    {
        name: "list_recent_pets",
        description: "List recently adopted Pet Rocks from the global registry HCS topic. Free.",
        schema: list_pets_1.listPetsSchema,
        func: list_pets_1.listRecentPets,
    },
];
exports.petRockPlugin = {
    name: "petrock",
    version: "0.1.0",
    tools: exports.petRockTools,
};
//# sourceMappingURL=index.js.map