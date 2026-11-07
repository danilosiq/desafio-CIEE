import { ListResumesUseCase } from '../../src/modules/resumes/application/use-cases/list-resumes/ListResumesUseCase';
const list = jest.fn().mockResolvedValue({ items: [], total: 61 });
const useCase = new ListResumesUseCase({ list });
beforeEach(() => list.mockClear());
it('defaults to page 1 and 30 records', async () => {
    expect(await useCase.execute({})).toEqual({ items: [], total: 61, page: 1, limit: 30, totalPages: 3 });
    expect(list).toHaveBeenCalledWith({ page: 1, limit: 30 });
});
it('supports smaller page sizes and later pages', async () => {
    expect(await useCase.execute({ page: 3, limit: 10 })).toMatchObject({ page: 3, limit: 10, totalPages: 7 });
    expect(list).toHaveBeenCalledWith({ page: 3, limit: 10 });
});
it.each([{ limit: 31 }, { limit: 0 }, { limit: -1 }, { limit: 1.5 }, { page: 0 }, { page: -1 }, { page: NaN }, { page: Infinity }, { page: 1.5 }, { page: Number.MAX_SAFE_INTEGER }])('rejects invalid pagination %p before querying', async (input) => {
    await expect(useCase.execute(input)).rejects.toThrow('Invalid pagination');
    expect(list).not.toHaveBeenCalled();
});
it('reports zero pages for an empty result', async () => {
    list.mockResolvedValueOnce({ items: [], total: 0 });
    expect(await useCase.execute({})).toMatchObject({ total: 0, totalPages: 0 });
});
