import {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
} from "@hashgraph/sdk";
import { getHederaClient, parsePrivateKey } from "./client";

export interface PetMessage {
  action: string;
  serial?: number;
  name?: string;
  hunger?: number;
  mood?: number;
  energy?: number;
  alive?: boolean;
  born_at?: string;
  died_at?: string;
  reason?: string;
  grace_until?: string;
  recovered_at?: string;
  timestamp?: number;
  sequence?: number;
}

export interface HcsMessage {
  sequence_number: number;
  consensus_timestamp: string;
  message: string;
}

export async function createPetTopic(): Promise<string> {
  const client = getHederaClient();
  const operatorKey = parsePrivateKey(process.env.HEDERA_OPERATOR_KEY!);

  const tx = await new TopicCreateTransaction()
    .setAdminKey(operatorKey.publicKey)
    .setSubmitKey(operatorKey.publicKey)
    .setTopicMemo("Pet Rock topic")
    .freezeWith(client)
    .sign(operatorKey);

  const response = await tx.execute(client);
  const receipt = await response.getReceipt(client);

  if (!receipt.topicId) throw new Error("Failed to create HCS topic");
  return receipt.topicId.toString();
}

export async function submitPetMessage(
  topicId: string,
  message: PetMessage
): Promise<string> {
  const client = getHederaClient();
  const operatorKey = parsePrivateKey(process.env.HEDERA_OPERATOR_KEY!);

  const payload = JSON.stringify({ ...message, timestamp: Date.now() });

  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(topicId))
    .setMessage(payload)
    .freezeWith(client)
    .sign(operatorKey);

  const response = await tx.execute(client);
  await response.getReceipt(client);
  return response.transactionId.toString();
}

export async function submitRegistryMessage(
  serial: number,
  name: string,
  topicId: string
): Promise<string> {
  const registryTopicId = process.env.PET_ROCK_REGISTRY_TOPIC_ID;
  if (!registryTopicId) throw new Error("PET_ROCK_REGISTRY_TOPIC_ID not set");

  return submitPetMessage(registryTopicId, {
    action: "adopted",
    serial,
    name,
    born_at: new Date().toISOString(),
    // store the per-pet topicId inside the message for lookup
    ...(({ topicId: _topicId }: { topicId: string }) => ({ petTopicId: _topicId }))(
      { topicId }
    ),
  });
}

export async function readPetMessages(topicId: string): Promise<PetMessage[]> {
  const network = process.env.HEDERA_NETWORK === "mainnet" ? "mainnet" : "testnet";
  const url = `https://${network}.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?limit=100&order=asc`;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...(typeof globalThis.Request !== "undefined"
      ? { cache: "no-store" }
      : { next: { revalidate: 0 } }),
  } as RequestInit);

  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Mirror node error: ${res.status}`);
  }

  const data = (await res.json()) as { messages: HcsMessage[] };

  return data.messages.map((m) => {
    try {
      const decoded = Buffer.from(m.message, "base64").toString("utf-8");
      const parsed = JSON.parse(decoded) as PetMessage;
      return { ...parsed, sequence: m.sequence_number };
    } catch {
      return { action: "unknown", sequence: m.sequence_number };
    }
  });
}

export async function readRegistryMessages(
  limit = 20
): Promise<{ serial: number; name: string; petTopicId: string; born_at: string }[]> {
  const registryTopicId = process.env.PET_ROCK_REGISTRY_TOPIC_ID;
  if (!registryTopicId) throw new Error("PET_ROCK_REGISTRY_TOPIC_ID not set");

  const network = process.env.HEDERA_NETWORK === "mainnet" ? "mainnet" : "testnet";
  const url = `https://${network}.mirrornode.hedera.com/api/v1/topics/${registryTopicId}/messages?limit=${limit}&order=desc`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = (await res.json()) as { messages: HcsMessage[] };

  return data.messages.flatMap((m) => {
    try {
      const decoded = Buffer.from(m.message, "base64").toString("utf-8");
      const parsed = JSON.parse(decoded) as PetMessage & { petTopicId?: string };
      if (parsed.action === "adopted" && parsed.serial && parsed.name && parsed.petTopicId) {
        return [
          {
            serial: parsed.serial,
            name: parsed.name,
            petTopicId: parsed.petTopicId,
            born_at: parsed.born_at ?? new Date().toISOString(),
          },
        ];
      }
      return [];
    } catch {
      return [];
    }
  });
}
