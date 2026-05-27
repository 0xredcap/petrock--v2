import { z } from "zod";
export declare const playPetSchema: z.ZodObject<{
    serial: z.ZodNumber;
    topicId: z.ZodString;
}, z.core.$strip>;
export type PlayPetInput = z.infer<typeof playPetSchema>;
export declare function playWithPet({ serial, topicId }: PlayPetInput): Promise<string>;
//# sourceMappingURL=play-pet.d.ts.map