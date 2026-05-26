import { DynamicStructuredTool } from "@langchain/core/tools";
import {
  adoptPet,
  adoptPetSchema,
  feedPet,
  feedPetSchema,
  playWithPet,
  playPetSchema,
  groomPet,
  groomPetSchema,
  letPetSleep,
  sleepPetSchema,
  getPetState,
  getPetStateSchema,
  listRecentPets,
  listPetsSchema,
} from "@petrock/hedera-agent-kit-plugin";

export const adoptPetTool = new DynamicStructuredTool({
  name: "adopt_pet",
  description:
    "Adopt (mint) a new Pet Rock NFT on Hedera. Creates an HCS topic for the pet's state and mints an NFT. Costs 1 HBAR.",
  schema: adoptPetSchema,
  func: adoptPet,
});

export const feedPetTool = new DynamicStructuredTool({
  name: "feed_pet",
  description: "Feed the user's pet rock. Restores hunger (+30) and mood (+5). Costs 0.5 HBAR.",
  schema: feedPetSchema,
  func: feedPet,
});

export const playPetTool = new DynamicStructuredTool({
  name: "play_with_pet",
  description: "Play with the pet rock. Boosts mood (+30) but uses energy (-10). Costs 0.5 HBAR.",
  schema: playPetSchema,
  func: playWithPet,
});

export const groomPetTool = new DynamicStructuredTool({
  name: "groom_pet",
  description: "Groom the pet rock. Boosts mood (+20) and energy (+10). Costs 0.5 HBAR.",
  schema: groomPetSchema,
  func: groomPet,
});

export const sleepPetTool = new DynamicStructuredTool({
  name: "let_pet_sleep",
  description:
    "Let the pet rock sleep. Restores energy (+40), costs mood (-5) and hunger (-10). Free.",
  schema: sleepPetSchema,
  func: letPetSleep,
});

export const checkPetTool = new DynamicStructuredTool({
  name: "get_pet_state",
  description:
    "Check the current stats of the pet rock. Replays HCS messages with time-decay and returns distress status. Free.",
  schema: getPetStateSchema,
  func: getPetState,
});

export const listPetsTool = new DynamicStructuredTool({
  name: "list_recent_pets",
  description: "List recently adopted Pet Rocks from the global registry. Free.",
  schema: listPetsSchema,
  func: listRecentPets,
});

export const petTools = [
  adoptPetTool,
  feedPetTool,
  playPetTool,
  groomPetTool,
  sleepPetTool,
  checkPetTool,
  listPetsTool,
];
