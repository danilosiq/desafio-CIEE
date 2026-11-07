import { ResumeRepository, ResumeData } from '../../repositories/ResumeRepository';
import { getPagination, PaginationInput } from './Pagination';
export type ListResumesOutput = {
    items: ResumeData[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};
export class ListResumesUseCase {
    constructor(private readonly repository: Pick<ResumeRepository, 'list'>) { }
    async execute(input: PaginationInput): Promise<ListResumesOutput> {
        const pagination = getPagination(input);
        const result = await this.repository.list(pagination);
        return { ...result, ...pagination, totalPages: Math.ceil(result.total / pagination.limit) };
    }
}
