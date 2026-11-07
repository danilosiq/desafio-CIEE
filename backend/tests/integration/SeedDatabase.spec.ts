import { requireTestDatabase } from '../DatabaseTestGuard';
import { getPrismaClient, disconnectDatabase } from '../../src/infra/database/PrismaClient';
import { seedDatabase } from '../../src/infra/database/SeedDatabase';
import { seedAreas, seedCandidates } from '../../src/infra/database/SeedData';
requireTestDatabase();
const client = getPrismaClient();
const emails = seedCandidates.map(candidate => candidate.email);
const names = seedAreas.map(area => area.name);
afterAll(async () => {
    try {
        await client.resume.deleteMany({ where: { email: { in: emails } } });
        await client.areaOfExpertise.deleteMany({ where: { name: { in: names } } });
    }
    finally {
        await disconnectDatabase();
    }
});
it('seeds 60 candidates and 30 areas, remains repeatable and preserves existing changes', async () => {
    expect(await seedDatabase(client)).toEqual({ areas: 30, candidates: 60 });
    expect(await client.resume.count({ where: { email: { in: emails } } })).toBe(60);
    expect(await client.areaOfExpertise.count({ where: { name: { in: names } } })).toBe(30);
    const candidate = await client.resume.findUniqueOrThrow({ where: { email: emails[0] } });
    const area = await client.areaOfExpertise.findUniqueOrThrow({ where: { name: names[0] } });
    await client.resume.update({ where: { id: candidate.id }, data: { fullName: 'Alteração que deve ser preservada' } });
    await client.areaOfExpertise.update({ where: { id: area.id }, data: { description: 'Descrição que deve ser preservada' } });
    await seedDatabase(client);
    expect(await client.resume.count({ where: { email: { in: emails } } })).toBe(60);
    expect(await client.areaOfExpertise.count({ where: { name: { in: names } } })).toBe(30);
    expect(await client.resume.findUnique({ where: { id: candidate.id } })).toMatchObject({ fullName: 'Alteração que deve ser preservada' });
    expect(await client.areaOfExpertise.findUnique({ where: { id: area.id } })).toMatchObject({ description: 'Descrição que deve ser preservada' });
});
