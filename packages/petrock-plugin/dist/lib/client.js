"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePrivateKey = parsePrivateKey;
exports.getHederaClient = getHederaClient;
const sdk_1 = require("@hashgraph/sdk");
let _client = null;
function parsePrivateKey(raw) {
    if (raw.startsWith("302e") || raw.startsWith("3026") || raw.startsWith("302")) {
        return sdk_1.PrivateKey.fromStringDer(raw);
    }
    return sdk_1.PrivateKey.fromStringED25519(raw);
}
function getHederaClient() {
    if (_client)
        return _client;
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;
    if (!operatorId || !operatorKey) {
        throw new Error("HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY must be set");
    }
    _client =
        process.env.HEDERA_NETWORK === "mainnet"
            ? sdk_1.Client.forMainnet()
            : sdk_1.Client.forTestnet();
    _client.setOperator(operatorId, parsePrivateKey(operatorKey));
    return _client;
}
//# sourceMappingURL=client.js.map