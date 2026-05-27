import { z } from "zod";
import { readRegistryMessages } from "../lib/hcs";

export const listPetsSchema = z.object({
  limit: z
    .number()
    .optional()
    .default(10)
    .describe("Maximum number of recent pets to return"),
});

export type ListPetsInput = z.infer<typeof listPetsSchema>;

export async function listRecentPets({ limit = 10 }: ListPetsInput): Promise<string> {
  const pets = await readRegistryMessages(limit);

  if (pets.length === 0) {
    return JSON.stringify({
      success: true,
      pets: [],
      message: "No pets have been adopted yet — be the first!",
    });
  }

  const summary = pets
    .map((p) => `#${p.serial} "${p.name}" (adopted ${new Date(p.born_at).toLocaleDateString()})`)
    .join(", ");

  return JSON.stringify({
    success: true,
    pets,
    message: `Recent adoptions: ${summary}.`,
  });
}
