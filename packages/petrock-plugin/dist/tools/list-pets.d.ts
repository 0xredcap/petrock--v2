import { z } from "zod";
export declare const listPetsSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export type ListPetsInput = z.infer<typeof listPetsSchema>;
export declare function listRecentPets({ limit }: ListPetsInput): Promise<string>;
//# sourceMappingURL=list-pets.d.ts.map