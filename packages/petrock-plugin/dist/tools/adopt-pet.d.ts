import { z } from "zod";
export declare const adoptPetSchema: z.ZodObject<{
    name: z.ZodString;
    metadataBaseUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type AdoptPetInput = z.infer<typeof adoptPetSchema>;
export declare function adoptPet({ name, metadataBaseUrl }: AdoptPetInput): Promise<string>;
//# sourceMappingURL=adopt-pet.d.ts.map