import { PrismaClient } from "../../../../generated/prisma/client";
import { ResumeRepository, ResumeInput, ResumeData, ResumeListInput, ResumeListData, } from "../../application/repositories/ResumeRepository";
import { normalizeEmail } from "../../domain/NormalizeEmail";
import { DuplicateEmailError } from "../../domain/DuplicateEmailError";
import { getPagination } from "../../application/use-cases/list-resumes/Pagination";
export class PrismaResumeRepository implements ResumeRepository {
    constructor(private readonly client: PrismaClient) { }
    async list(input: ResumeListInput): Promise<ResumeListData> {
        const { page, limit } = getPagination(input);
        const [items, total] = await this.client.$transaction([
            this.client.resume.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: [{ createdAt: "desc" }, { id: "asc" }],
            }),
            this.client.resume.count(),
        ]);
        return { items, total };
    }
    async create(input: ResumeInput): Promise<ResumeData> {
        try {
            return await this.client.resume.create({
                data: { ...input, email: normalizeEmail(input.email) },
            });
        }
        catch (error) {
            if (error instanceof Error && "code" in error && error.code === "P2002")
                throw new DuplicateEmailError();
            throw error;
        }
    }
    async findById(id: string): Promise<ResumeData | null> {
        return this.client.resume.findUnique({ where: { id } });
    }
}
