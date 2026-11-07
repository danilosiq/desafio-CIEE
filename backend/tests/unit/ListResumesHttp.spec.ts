import request from 'supertest';
import { createApp } from '../../src/main/App';
const list = jest.fn().mockResolvedValue({ items: [], total: 0 });
const app = createApp({ list });
beforeEach(() => list.mockClear());
it('returns default pagination from GET /resumes', async () => {
    const response = await request(app).get('/resumes').expect(200);
    expect(response.body).toEqual({ items: [], total: 0, page: 1, limit: 30, totalPages: 0 });
});
it.each(['limit=31', 'limit=0', 'limit=-1', 'limit=1.5', 'page=0', 'page=abc', 'page=', 'page=1&page=2', 'limit=1e1'])('rejects malformed or out of range query %s', async (query) => {
    await request(app).get(`/resumes?${query}`).expect(400);
    expect(list).not.toHaveBeenCalled();
});
it('accepts a smaller limit and a subsequent page', async () => {
    await request(app).get('/resumes?page=2&limit=10').expect(200);
    expect(list).toHaveBeenCalledWith({ page: 2, limit: 10 });
});
it('exposes the actual pagination contract as OpenAPI', async () => {
    const response = await request(app).get('/openapi.json').expect(200);
    const parameters = response.body.paths['/resumes'].get.parameters;
    expect(parameters.find((p: {
        name: string;
    }) => p.name === 'limit').schema).toMatchObject({ maximum: 30, default: 30 });
    await request(app).get('/docs/').expect(200).expect('Content-Type', /html/);
    await request(app).get('/docs/swagger-ui.css').expect(200);
});
it('returns a safe error when persistence fails', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
        list.mockRejectedValueOnce(new Error('sensitive database details'));
        const response = await request(app).get('/resumes').expect(500);
        expect(response.body).toEqual({ message: 'Não foi possível consultar os currículos.' });
    }
    finally {
        log.mockRestore();
    }
});
