"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPetsSchema = void 0;
exports.listRecentPets = listRecentPets;
const zod_1 = require("zod");
const hcs_1 = require("../lib/hcs");
exports.listPetsSchema = zod_1.z.object({
    limit: zod_1.z
        .number()
        .optional()
        .default(10)
        .describe("Maximum number of recent pets to return"),
});
async function listRecentPets({ limit = 10 }) {
    const pets = await (0, hcs_1.readRegistryMessages)(limit);
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
//# sourceMappingURL=list-pets.js.map