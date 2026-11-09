import { PrismaClient } from "../../generated/prisma/client";
import { seedAreas, seedCandidates } from "./SeedData";
export async function seedDatabase(client: PrismaClient): Promise<{
  areas: number;
  candidates: number;
}> {
  await client.$transaction(
    async (transaction) => {
      for (const area of seedAreas) {
        await transaction.areaOfExpertise.upsert({
          where: { name: area.name },
          create: area,
          update: {},
        });
      }
      const areas = await transaction.areaOfExpertise.findMany({
        where: { name: { in: seedAreas.map((area) => area.name) } },
        select: { id: true, name: true },
      });
      const areaIds = new Map(areas.map((area) => [area.name, area.id]));
      for (const candidate of seedCandidates) {
        const areaOfExpertiseId = candidate.areaOfExpertise
          ? (areaIds.get(candidate.areaOfExpertise) ?? null)
          : null;
        const data = { ...candidate, areaOfExpertiseId };
        await transaction.resume.upsert({
          where: { email: candidate.email },
          create: data,
          update: {},
        });
      }
    },
    { timeout: 60000 },
  );
  return { areas: seedAreas.length, candidates: seedCandidates.length };
}
