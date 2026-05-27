import { z } from "zod";
export declare const sleepPetSchema: z.ZodObject<{
    serial: z.ZodNumber;
    topicId: z.ZodString;
}, z.core.$strip>;
export type SleepPetInput = z.infer<typeof sleepPetSchema>;
export declare function letPetSleep({ serial, topicId }: SleepPetInput): Promise<string>;
//# sourceMappingURL=sleep-pet.d.ts.map