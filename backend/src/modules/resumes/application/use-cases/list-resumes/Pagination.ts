export class InvalidPaginationError extends Error {
  constructor() {
    super("Paginação inválida: informe 'page' como inteiro maior que 0 e 'limit' entre 1 e 30.");
    this.name = "InvalidPaginationError";
  }
}
export type PaginationInput = {
    page?: number;
    limit?: number;
};
export type Pagination = {
    page: number;
    limit: number;
};
export function getPagination(input: PaginationInput): Pagination {
    const page = input.page ?? 1;
    const limit = input.limit ?? 30;
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 30 || (page - 1) * limit > 2147483647) {
        throw new InvalidPaginationError();
    }
    return { page, limit };
}
