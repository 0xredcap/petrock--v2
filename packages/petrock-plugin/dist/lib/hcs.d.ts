export interface PetMessage {
    action: string;
    serial?: number;
    name?: string;
    petTopicId?: string;
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
export declare function createPetTopic(): Promise<string>;
export declare function submitPetMessage(topicId: string, message: PetMessage): Promise<string>;
export declare function submitRegistryMessage(serial: number, name: string, topicId: string): Promise<string>;
export declare function readPetMessages(topicId: string): Promise<PetMessage[]>;
export declare function readRegistryMessages(limit?: number): Promise<{
    serial: number;
    name: string;
    petTopicId: string;
    born_at: string;
}[]>;
//# sourceMappingURL=hcs.d.ts.map