import { PetMessage } from "./hcs";
export interface Distress {
    reason: "low_hunger" | "low_mood" | "low_energy";
    grace_until: string;
}
export interface PetState {
    hunger: number;
    mood: number;
    energy: number;
    alive: boolean;
    born_at?: string;
    died_at?: string;
    lastActionAt: number;
    distressed: Distress | null;
}
export declare function computeCurrentStats(messages: PetMessage[]): PetState;
export declare function isDead(state: PetState): boolean;
export declare function isGraceWindowExpired(state: PetState): boolean;
//# sourceMappingURL=stats.d.ts.map