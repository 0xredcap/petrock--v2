# @petrock/hedera-agent-kit-plugin

A Hedera Agent Kit plugin that exposes pet-care primitives for on-chain Tamagotchi-style applications. Each pet is an HTS NFT with an HCS topic as its state ledger — actions like feeding, playing, and grooming write signed messages that are replayed to compute current stats. The plugin also maintains a global registry topic listing all adoptions.

Built for use with [Pet Rock](../../README.md) but reusable in any Hedera agent that needs pet-care primitives.

---

## Installation

This package is not published to npm. Install it via npm workspaces (recommended) or copy the `src/` directory into your project.

**Via workspace:**
```bash
# In your root package.json:
{ "workspaces": ["packages/*"] }

# In your app package.json:
{ "dependencies": { "@petrock/hedera-agent-kit-plugin": "*" } }
```

Then run `npm install` from the workspace root.

---

## Usage with Hedera Agent Kit

```ts
import { petRockPlugin } from "@petrock/hedera-agent-kit-plugin";
import { HederaAgentKit, ServerSigner } from "hedera-agent-kit";

const signer = new ServerSigner(
  process.env.HEDERA_OPERATOR_ID!,
  process.env.HEDERA_OPERATOR_KEY!,
  "testnet"
);

const kit = new HederaAgentKit(signer, { plugins: [petRockPlugin] });

// The agent now has access to all pet-care tools
```

**Using tools directly** (without the full kit):
```ts
import { adoptPet, getPetState, feedPet } from "@petrock/hedera-agent-kit-plugin";

const result = await adoptPet({ name: "Pebbles" });
const state  = await getPetState({ serial: 42, topicId: "0.0.12345" });
await feedPet({ serial: 42, topicId: "0.0.12345" });
```

---

## Tools

| Tool | Cost | Effect |
|------|------|--------|
| `adopt_pet(name)` | 1 HBAR (user) | Creates HCS topic, mints NFT, writes `born` message, registers in global registry |
| `feed_pet(serial, topicId)` | 0.5 HBAR (user) | Hunger +30, mood +5 |
| `play_with_pet(serial, topicId)` | 0.5 HBAR (user) | Mood +30, energy -10 |
| `groom_pet(serial, topicId)` | 0.5 HBAR (user) | Mood +20, energy +10 |
| `let_pet_sleep(serial, topicId)` | Free | Energy +40, mood -5, hunger -10 |
| `get_pet_state(serial, topicId)` | Free | Replays HCS, returns stats + distress state |
| `list_recent_pets(limit?)` | Free | Reads global registry, returns recent adoptions |

---

## Distress and Death

A pet enters **DISTRESS** when any stat drops to ≤ 15. `get_pet_state` records a `distressed` HCS message with a 24-hour grace window. If the pet recovers (any stat above 30 after an action), a `recovered` message is written. If the grace window expires without recovery, the pet dies: a `died` HCS message is written and the NFT is burned.

All state transitions are deterministic from the HCS message log — anyone replaying the topic arrives at the same result.

---

## Lib exports

The underlying functions are exported for direct use:

```ts
import {
  // HCS
  createPetTopic, submitPetMessage, readPetMessages,
  submitRegistryMessage, readRegistryMessages,
  // NFT
  mintRockNft, burnRockNft, createNftCollection,
  // Stats
  computeCurrentStats, isDead, isGraceWindowExpired,
} from "@petrock/hedera-agent-kit-plugin";
```

---

## Required environment variables

```
HEDERA_OPERATOR_ID=0.0.XXXXXXX
HEDERA_OPERATOR_KEY=302e...
HEDERA_NETWORK=testnet
PET_ROCK_NFT_COLLECTION_ID=0.0.XXXXXXX
PET_ROCK_REGISTRY_TOPIC_ID=0.0.XXXXXXX   # optional; list_recent_pets requires it
NEXT_PUBLIC_APP_URL=https://your-app.netlify.app
```

---

## Stats decay

Stats decay continuously from the timestamp of the last recorded HCS action:

- Hunger: −2/hour
- Mood: −1/hour
- Energy: −1.5/hour

Decay is applied in `computeCurrentStats` when replaying messages. No cron jobs required — the state is always computed from on-chain data.
