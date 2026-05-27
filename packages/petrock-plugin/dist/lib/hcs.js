"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPetTopic = createPetTopic;
exports.submitPetMessage = submitPetMessage;
exports.submitRegistryMessage = submitRegistryMessage;
exports.readPetMessages = readPetMessages;
exports.readRegistryMessages = readRegistryMessages;
const sdk_1 = require("@hashgraph/sdk");
const client_1 = require("./client");
async function createPetTopic() {
    const client = (0, client_1.getHederaClient)();
    const operatorKey = (0, client_1.parsePrivateKey)(process.env.HEDERA_OPERATOR_KEY);
    const tx = await new sdk_1.TopicCreateTransaction()
        .setAdminKey(operatorKey.publicKey)
        .setSubmitKey(operatorKey.publicKey)
        .setTopicMemo("Pet Rock topic")
        .freezeWith(client)
        .sign(operatorKey);
    const response = await tx.execute(client);
    const receipt = await response.getReceipt(client);
    if (!receipt.topicId)
        throw new Error("Failed to create HCS topic");
    return receipt.topicId.toString();
}
async function submitPetMessage(topicId, message) {
    const client = (0, client_1.getHederaClient)();
    const operatorKey = (0, client_1.parsePrivateKey)(process.env.HEDERA_OPERATOR_KEY);
    const payload = JSON.stringify({ ...message, timestamp: Date.now() });
    const tx = await new sdk_1.TopicMessageSubmitTransaction()
        .setTopicId(sdk_1.TopicId.fromString(topicId))
        .setMessage(payload)
        .freezeWith(client)
        .sign(operatorKey);
    const response = await tx.execute(client);
    await response.getReceipt(client);
    return response.transactionId.toString();
}
async function submitRegistryMessage(serial, name, topicId) {
    const registryTopicId = process.env.PET_ROCK_REGISTRY_TOPIC_ID;
    if (!registryTopicId)
        throw new Error("PET_ROCK_REGISTRY_TOPIC_ID not set");
    return submitPetMessage(registryTopicId, {
        action: "adopted",
        serial,
        name,
        petTopicId: topicId,
        born_at: new Date().toISOString(),
    });
}
async function readPetMessages(topicId) {
    const network = process.env.HEDERA_NETWORK === "mainnet" ? "mainnet" : "testnet";
    const url = `https://${network}.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?limit=100&order=asc`;
    const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...(typeof globalThis.Request !== "undefined"
            ? { cache: "no-store" }
            : { next: { revalidate: 0 } }),
    });
    if (!res.ok) {
        if (res.status === 404)
            return [];
        throw new Error(`Mirror node error: ${res.status}`);
    }
    const data = (await res.json());
    return data.messages.map((m) => {
        try {
            const decoded = Buffer.from(m.message, "base64").toString("utf-8");
            const parsed = JSON.parse(decoded);
            return { ...parsed, sequence: m.sequence_number };
        }
        catch {
            return { action: "unknown", sequence: m.sequence_number };
        }
    });
}
async function readRegistryMessages(limit = 20) {
    const registryTopicId = process.env.PET_ROCK_REGISTRY_TOPIC_ID;
    if (!registryTopicId)
        throw new Error("PET_ROCK_REGISTRY_TOPIC_ID not set");
    const network = process.env.HEDERA_NETWORK === "mainnet" ? "mainnet" : "testnet";
    const url = `https://${network}.mirrornode.hedera.com/api/v1/topics/${registryTopicId}/messages?limit=${limit}&order=desc`;
    const res = await fetch(url);
    if (!res.ok)
        return [];
    const data = (await res.json());
    return data.messages.flatMap((m) => {
        try {
            const decoded = Buffer.from(m.message, "base64").toString("utf-8");
            const parsed = JSON.parse(decoded);
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
        }
        catch {
            return [];
        }
    });
}
//# sourceMappingURL=hcs.js.map