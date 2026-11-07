import { randomUUID } from 'node:crypto';
import { requireTestDatabase } from '../DatabaseTestGuard';
import { getPrismaClient, disconnectDatabase } from '../../src/infra/database/PrismaClient';
import { PrismaAreaOfExpertiseRepository } from '../../src/modules/areas-of-expertise/infra/repositories/PrismaAreaOfExpertiseRepository';
requireTestDatabase();
const client = getPrismaClient();
const areas = new PrismaAreaOfExpertiseRepository(client);
const createdIds: string[] = [];
afterAll(async () => {
    try {
        if (createdIds.length)
            await client.areaOfExpertise.deleteMany({ where: { id: { in: createdIds } } });
    }
    finally {
        await disconnectDatabase();
    }
});
it('creates and reads an area with its name and description', async () => {
    const input = { name: `Tecnologia ${randomUUID()}`, description: 'Desenvolvimento de software e infraestrutura.' };
    const saved = await areas.create(input);
    createdIds.push(saved.id);
    expect(saved).toMatchObject(input);
    expect(saved.createdAt).toBeInstanceOf(Date);
    expect(await areas.findById(saved.id)).toEqual(saved);
});
it('returns null for an unknown area', async () => {
    expect(await areas.findById(randomUUID())).toBeNull();
});
it('rejects the same name regardless of case and external spaces', async () => {
    const name = `Área ${randomUUID()}`;
    const area = await areas.create({ name, description: 'Primeiro cadastro fictício' });
    createdIds.push(area.id);
    await expect(areas.create({ name: ` ${name.toUpperCase()} `, description: 'Duplicado' })).rejects.toMatchObject({ name: 'DuplicateAreaNameError' });
    await expect(client.areaOfExpertise.create({ data: { name: name.toUpperCase(), description: 'Escrita direta duplicada' } })).rejects.toMatchObject({ code: 'P2002' });
});
it('allows only one concurrent insert for the same normalized name', async () => {
    const name = `Área ${randomUUID()}`;
    const results = await Promise.allSettled([name, ` ${name.toUpperCase()} `].map(value => areas.create({ name: value, description: 'Cadastro concorrente fictício' })));
    for (const result of results)
        if (result.status === 'fulfilled')
            createdIds.push(result.value.id);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect((results.find(result => result.status === 'rejected') as PromiseRejectedResult).reason).toMatchObject({ name: 'DuplicateAreaNameError' });
});
