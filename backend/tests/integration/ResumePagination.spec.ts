import { randomUUID } from 'node:crypto';
import { requireTestDatabase } from '../DatabaseTestGuard';
import { getPrismaClient, disconnectDatabase } from '../../src/infra/database/PrismaClient';
import { PrismaResumeRepository } from '../../src/modules/resumes/infra/repositories/PrismaResumeRepository';
requireTestDatabase();
const client = getPrismaClient();
const repository = new PrismaResumeRepository(client);
const ids: string[] = [];
afterAll(async () => {
    try {
        await client.resume.deleteMany({ where: { id: { in: ids } } });
    }
    finally {
        await disconnectDatabase();
    }
});
it('returns at most 30 records, consecutive pages without overlap and an empty later page', async () => {
    const data = Array.from({ length: 35 }, (_, index) => {
        const id = randomUUID();
        ids.push(id);
        return { id, fullName: `Pessoa Fictícia ${index}`, email: `${id}@example.com`, createdAt: new Date(Date.UTC(2020, 0, 1, 0, 0, index)) };
    });
    await client.resume.createMany({ data });
    const first = await repository.list({ page: 1, limit: 30 });
    const second = await repository.list({ page: 2, limit: 30 });
    expect(first.total).toBe(35);
    expect(first.items).toHaveLength(30);
    expect(first.items[0].fullName).toBe('Pessoa Fictícia 34');
    expect(second.items).toHaveLength(5);
    expect(new Set([...first.items, ...second.items].map(item => item.id)).size).toBe(35);
    expect((await repository.list({ page: 3, limit: 30 })).items).toEqual([]);
    expect((await repository.list({ page: 1, limit: 5 })).items).toHaveLength(5);
    await expect(repository.list({ page: 1, limit: 31 })).rejects.toThrow('Invalid pagination');
    const tiedTime = new Date('2020-01-01T00:00:00Z');
    await client.resume.updateMany({ where: { id: { in: ids } }, data: { createdAt: tiedTime } });
    expect((await repository.list({ page: 1, limit: 30 })).items.map(item => item.id)).toEqual((await repository.list({ page: 1, limit: 30 })).items.map(item => item.id));
});
