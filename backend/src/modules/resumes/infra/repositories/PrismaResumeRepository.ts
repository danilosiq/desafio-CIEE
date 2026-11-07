import { PrismaClient } from "../../../../generated/prisma/client";
import { ResumeRepository, ResumeInput, ResumeData, ResumeListInput, ResumeListData, } from "../../application/repositories/ResumeRepository";
import { normalizeEmail } from "../../domain/NormalizeEmail";
import { DuplicateEmailError } from "../../domain/DuplicateEmailError";
import { ResumeNotFoundError } from "../../domain/ResumeNotFoundError";
import { getPagination } from "../../application/use-cases/list-resumes/Pagination";

function prismaCode(error: unknown): string | undefined {
    if (error instanceof Error && "code" in error && typeof (error as { code?: unknown }).code === "string")
        return (error as { code: string }).code;
    return undefined;
}

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
        const email = normalizeEmail(input.email);
        try {
            return await this.client.resume.create({
                data: { ...input, email },
            });
        }
        catch (error) {
            if (prismaCode(error) === "P2002") {
                const existing = await this.client.resume.findUnique({ where: { email } });
                if (existing) throw new DuplicateEmailError(existing.id);
            }
            throw error;
        }
    }
    async findById(id: string): Promise<ResumeData | null> {
        return this.client.resume.findUnique({ where: { id } });
    }
    async findByEmail(email: string): Promise<ResumeData | null> {
        return this.client.resume.findUnique({ where: { email: normalizeEmail(email) } });
    }
    async update(id: string, input: ResumeInput): Promise<ResumeData> {
        const email = normalizeEmail(input.email);
        try {
            return await this.client.resume.update({
                where: { id },
                data: { ...input, email },
            });
        }
        catch (error) {
            if (prismaCode(error) === "P2025") throw new ResumeNotFoundError();
            if (prismaCode(error) === "P2002") {
                const existing = await this.client.resume.findUnique({ where: { email } });
                if (existing) throw new DuplicateEmailError(existing.id);
            }
            throw error;
        }
    }
    async delete(id: string): Promise<void> {
        try {
            await this.client.resume.delete({ where: { id } });
        }
        catch (error) {
            if (prismaCode(error) === "P2025") throw new ResumeNotFoundError();
            throw error;
        }
    }
}
