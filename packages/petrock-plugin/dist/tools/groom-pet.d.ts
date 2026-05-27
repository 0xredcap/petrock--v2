import { z } from "zod";
export declare const groomPetSchema: z.ZodObject<{
    serial: z.ZodNumber;
    topicId: z.ZodString;
}, z.core.$strip>;
export type GroomPetInput = z.infer<typeof groomPetSchema>;
export declare function groomPet({ serial, topicId }: GroomPetInput): Promise<string>;
//# sourceMappingURL=groom-pet.d.ts.map