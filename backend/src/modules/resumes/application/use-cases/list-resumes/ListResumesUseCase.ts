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
    async execute(input: PaginationInput & { search?: string; areaOfExpertiseId?: string }): Promise<ListResumesOutput> {
        const pagination = getPagination(input);
        const search = typeof input.search === 'string' && input.search.trim() ? input.search.trim() : undefined;
        const areaOfExpertiseId = typeof input.areaOfExpertiseId === 'string' && input.areaOfExpertiseId.trim() ? input.areaOfExpertiseId.trim() : undefined;
        const result = await this.repository.list({ ...pagination, ...(search ? { search } : {}), ...(areaOfExpertiseId ? { areaOfExpertiseId } : {}) });
        return { ...result, ...pagination, totalPages: Math.ceil(result.total / pagination.limit) };
    }
}
