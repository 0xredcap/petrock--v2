import { z } from "zod";
export declare const getPetStateSchema: z.ZodObject<{
    serial: z.ZodNumber;
    topicId: z.ZodString;
}, z.core.$strip>;
export type GetPetStateInput = z.infer<typeof getPetStateSchema>;
export declare function getPetState({ serial, topicId }: GetPetStateInput): Promise<string>;
//# sourceMappingURL=get-pet-state.d.ts.map