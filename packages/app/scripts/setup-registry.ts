import "dotenv/config";
import { createPetTopic } from "@petrock/hedera-agent-kit-plugin";

async function main() {
  console.log("Creating global pet registry HCS topic...");
  const topicId = await createPetTopic();
  console.log(`\nRegistry topic created: ${topicId}`);
  console.log(`\nAdd this to your .env.local:`);
  console.log(`PET_ROCK_REGISTRY_TOPIC_ID=${topicId}`);
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
