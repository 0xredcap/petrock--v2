"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNftCollection = createNftCollection;
exports.mintRockNft = mintRockNft;
exports.burnRockNft = burnRockNft;
const sdk_1 = require("@hashgraph/sdk");
const client_1 = require("./client");
async function createNftCollection() {
    const client = (0, client_1.getHederaClient)();
    const operatorKey = (0, client_1.parsePrivateKey)(process.env.HEDERA_OPERATOR_KEY);
    const tx = await new sdk_1.TokenCreateTransaction()
        .setTokenName("Pet Rock")
        .setTokenSymbol("ROCK")
        .setTokenType(sdk_1.TokenType.NonFungibleUnique)
        .setSupplyType(sdk_1.TokenSupplyType.Finite)
        .setMaxSupply(10000)
        .setTreasuryAccountId(sdk_1.AccountId.fromString(process.env.HEDERA_OPERATOR_ID))
        .setAdminKey(operatorKey.publicKey)
        .setSupplyKey(operatorKey.publicKey)
        .setMetadataKey(operatorKey.publicKey)
        .freezeWith(client)
        .sign(operatorKey);
    const receipt = await (await tx.execute(client)).getReceipt(client);
    if (!receipt.tokenId)
        throw new Error("Failed to create NFT collection");
    return receipt.tokenId.toString();
}
async function mintRockNft(metadataUri) {
    const client = (0, client_1.getHederaClient)();
    const operatorKey = (0, client_1.parsePrivateKey)(process.env.HEDERA_OPERATOR_KEY);
    const collectionId = process.env.PET_ROCK_NFT_COLLECTION_ID;
    if (!collectionId)
        throw new Error("PET_ROCK_NFT_COLLECTION_ID not set");
    const metadata = Buffer.from(metadataUri, "utf-8");
    const tx = await new sdk_1.TokenMintTransaction()
        .setTokenId(sdk_1.TokenId.fromString(collectionId))
        .addMetadata(metadata)
        .freezeWith(client)
        .sign(operatorKey);
    const receipt = await (await tx.execute(client)).getReceipt(client);
    const serial = receipt.serials?.[0]?.toNumber();
    if (serial === undefined)
        throw new Error("Mint returned no serial number");
    return serial;
}
async function burnRockNft(serial) {
    const client = (0, client_1.getHederaClient)();
    const operatorKey = (0, client_1.parsePrivateKey)(process.env.HEDERA_OPERATOR_KEY);
    const collectionId = process.env.PET_ROCK_NFT_COLLECTION_ID;
    if (!collectionId)
        throw new Error("PET_ROCK_NFT_COLLECTION_ID not set");
    const tx = await new sdk_1.TokenBurnTransaction()
        .setTokenId(sdk_1.TokenId.fromString(collectionId))
        .setSerials([serial])
        .freezeWith(client)
        .sign(operatorKey);
    const response = await tx.execute(client);
    await response.getReceipt(client);
    return response.transactionId.toString();
}
//# sourceMappingURL=nft.js.map