import { z } from "zod";
export declare const feedPetSchema: z.ZodObject<{
    serial: z.ZodNumber;
    topicId: z.ZodString;
}, z.core.$strip>;
export type FeedPetInput = z.infer<typeof feedPetSchema>;
export declare function feedPet({ serial, topicId }: FeedPetInput): Promise<string>;
//# sourceMappingURL=feed-pet.d.ts.map