import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { requireTestDatabase } from '../DatabaseTestGuard';
import { getPrismaClient, disconnectDatabase } from '../../src/infra/database/PrismaClient';

requireTestDatabase();
const { createApp } = require('../../dist/main/App') as typeof import('../../src/main/App');
const { disconnectDatabase: disconnectCompiledDatabase } = require('../../dist/infra/database/PrismaClient') as typeof import('../../src/infra/database/PrismaClient');
const client = getPrismaClient();
const app = createApp();
const ids: string[] = [];
beforeAll(async () => {
  const data = Array.from({ length: 31 }, (_, index) => {
    const id = randomUUID(); ids.push(id);
    return { id, fullName: `Pessoa Fictícia ${index}`, email: `${id}@example.com`, createdAt: new Date(Date.UTC(2025, 0, 1, 0, 0, index)) };
  });
  await client.resume.createMany({ data });
});
afterAll(async () => {
  try { await client.resume.deleteMany({ where: { id: { in: ids } } }); }
  finally { await Promise.all([disconnectDatabase(), disconnectCompiledDatabase()]); }
});
it('serves paginated HTTP responses from the compiled API backed by SQL Server', async () => {
  const first = await request(app).get('/resumes').expect(200);
  expect(first.body).toMatchObject({ page: 1, limit: 30, total: 31, totalPages: 2 });
  expect(first.body.items).toHaveLength(30);
  expect(first.body.items[0].fullName).toBe('Pessoa Fictícia 30');
  const second = await request(app).get('/resumes?page=2').expect(200);
  expect(second.body.items).toHaveLength(1);
  expect(new Set([...first.body.items, ...second.body.items].map(item => item.id)).size).toBe(31);
  const beyond = await request(app).get('/resumes?page=3').expect(200);
  expect(beyond.body).toEqual({ items: [], page: 3, limit: 30, total: 31, totalPages: 2 });
  await request(app).get('/resumes?limit=31').expect(400);
  await request(app).get('/resumes?page=0').expect(400);
  const specification = await request(app).get('/openapi.json').expect(200);
  expect(specification.body.paths['/resumes'].get.parameters.find((item: { name: string }) => item.name === 'limit').schema.maximum).toBe(30);
  await request(app).get('/docs/').expect(200);
});
