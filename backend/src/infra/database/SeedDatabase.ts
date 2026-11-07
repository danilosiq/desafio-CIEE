import { PrismaClient } from '../../generated/prisma/client';
import { seedAreas, seedCandidates } from './SeedData';
export async function seedDatabase(client: PrismaClient): Promise<{
    areas: number;
    candidates: number;
}> {
    await client.$transaction(async (transaction) => {
        for (const area of seedAreas) {
            await transaction.areaOfExpertise.upsert({ where: { name: area.name }, create: area, update: {} });
        }
        for (const candidate of seedCandidates) {
            await transaction.resume.upsert({ where: { email: candidate.email }, create: candidate, update: {} });
        }
    }, { timeout: 60000 });
    return { areas: seedAreas.length, candidates: seedCandidates.length };
}
