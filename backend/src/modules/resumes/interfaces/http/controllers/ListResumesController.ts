import { Request, Response } from 'express';
import { ListResumesUseCase } from '../../../application/use-cases/list-resumes/ListResumesUseCase';
import { InvalidPaginationError } from '../../../application/use-cases/list-resumes/Pagination';
function readInteger(value: unknown): number | undefined {
    if (value === undefined)
        return undefined;
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value))
        throw new InvalidPaginationError();
    return Number(value);
}
export class ListResumesController {
    constructor(private readonly useCase: ListResumesUseCase) { }
    async handle(request: Request, response: Response): Promise<void> {
        const q = typeof request.query.q === 'string' ? request.query.q.trim() : (typeof request.query.search === 'string' ? request.query.search.trim() : '');
        const areaOfExpertiseId = typeof request.query.areaOfExpertiseId === 'string' ? request.query.areaOfExpertiseId.trim() : '';
        const output = await this.useCase.execute({
            page: readInteger(request.query.page),
            limit: readInteger(request.query.limit),
            ...(q ? { search: q } : {}),
            ...(areaOfExpertiseId ? { areaOfExpertiseId } : {}),
        });
        response.status(200).json(output);
    }
}
