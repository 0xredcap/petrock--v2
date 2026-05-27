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
export interface PluginTool {
    name: string;
    description: string;
    schema: unknown;
    func: (...args: unknown[]) => Promise<string>;
}
export declare const petRockTools: PluginTool[];
export declare const petRockPlugin: {
    name: string;
    version: string;
    tools: PluginTool[];
};
//# sourceMappingURL=index.d.ts.map