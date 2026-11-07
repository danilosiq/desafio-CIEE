import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaAreaOfExpertiseRepository } from '../../src/modules/areas-of-expertise/infra/repositories/PrismaAreaOfExpertiseRepository';
import { DuplicateAreaNameError } from '../../src/modules/areas-of-expertise/domain/DuplicateAreaNameError';
const create = jest.fn();
const repository = new PrismaAreaOfExpertiseRepository({ areaOfExpertise: { create } } as unknown as PrismaClient);
beforeEach(() => create.mockReset());
it('registers a name without surrounding whitespace while preserving its display case', async () => {
    create.mockResolvedValue({ id: 'fixture' });
    await repository.create({ name: ' Tecnologia ', description: 'Descrição fictícia' });
    expect(create).toHaveBeenCalledWith({ data: { name: 'Tecnologia', description: 'Descrição fictícia' } });
});
it('converts a database uniqueness violation to a clear domain error', async () => {
    create.mockRejectedValue(Object.assign(new Error('Database constraint'), { code: 'P2002' }));
    await expect(repository.create({ name: 'Tecnologia', description: 'Descrição fictícia' })).rejects.toBeInstanceOf(DuplicateAreaNameError);
});
it('preserves unrelated database errors', async () => {
    const failure = new Error('Connection unavailable');
    create.mockRejectedValue(failure);
    await expect(repository.create({ name: 'Tecnologia', description: 'Descrição fictícia' })).rejects.toBe(failure);
});
