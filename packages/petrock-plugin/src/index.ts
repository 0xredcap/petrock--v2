// Public API: plugin entry point + standalone lib exports

export * from "./lib/client";
export * from "./lib/hcs";
export * from "./lib/nft";
export * from "./lib/stats";

export * from "./tools/adopt-pet";
export * from "./tools/feed-pet";
export * from "./tools/play-pet";
export * from "./tools/groom-pet";
export * from "./tools/sleep-pet";
export * from "./tools/get-pet-state";
export * from "./tools/list-pets";

import { adoptPet, adoptPetSchema } from "./tools/adopt-pet";
import { feedPet, feedPetSchema } from "./tools/feed-pet";
import { playWithPet, playPetSchema } from "./tools/play-pet";
import { groomPet, groomPetSchema } from "./tools/groom-pet";
import { letPetSleep, sleepPetSchema } from "./tools/sleep-pet";
import { getPetState, getPetStateSchema } from "./tools/get-pet-state";
import { listRecentPets, listPetsSchema } from "./tools/list-pets";

export interface PluginTool {
  name: string;
  description: string;
  schema: unknown;
  func: (...args: unknown[]) => Promise<string>;
}

export const petRockTools: PluginTool[] = [
  {
    name: "adopt_pet",
    description:
      "Adopt (mint) a new Pet Rock NFT. Creates an HCS topic for the pet's state, mints an NFT to the treasury, and writes the initial born message. The caller pays 1 HBAR to the treasury (user-signed).",
    schema: adoptPetSchema,
    func: adoptPet as unknown as PluginTool["func"],
  },
  {
    name: "feed_pet",
    description:
      "Feed the pet rock. Restores hunger (+30) and mood (+5). The caller pays 0.5 HBAR (user-signed); treasury writes the HCS message.",
    schema: feedPetSchema,
    func: feedPet as unknown as PluginTool["func"],
  },
  {
    name: "play_with_pet",
    description:
      "Play with the pet rock. Boosts mood (+30) but costs energy (-10). The caller pays 0.5 HBAR (user-signed).",
    schema: playPetSchema,
    func: playWithPet as unknown as PluginTool["func"],
  },
  {
    name: "groom_pet",
    description:
      "Groom the pet rock. Boosts mood (+20) and energy (+10). The caller pays 0.5 HBAR (user-signed).",
    schema: groomPetSchema,
    func: groomPet as unknown as PluginTool["func"],
  },
  {
    name: "let_pet_sleep",
    description:
      "Let the pet rock sleep. Restores energy (+40), costs mood (-5) and hunger (-10). Free — treasury writes the HCS message.",
    schema: sleepPetSchema,
    func: letPetSleep as unknown as PluginTool["func"],
  },
  {
    name: "get_pet_state",
    description:
      "Read the current state of a pet rock by replaying its HCS topic messages with time-based decay. Returns stats and distress status. Free.",
    schema: getPetStateSchema,
    func: getPetState as unknown as PluginTool["func"],
  },
  {
    name: "list_recent_pets",
    description:
      "List recently adopted Pet Rocks from the global registry HCS topic. Free.",
    schema: listPetsSchema,
    func: listRecentPets as unknown as PluginTool["func"],
  },
];

export const petRockPlugin = {
  name: "petrock",
  version: "0.1.0",
  tools: petRockTools,
};
