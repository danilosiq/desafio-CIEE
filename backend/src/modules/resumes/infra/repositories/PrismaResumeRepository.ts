import { PrismaClient } from "../../../../generated/prisma/client";
import { ResumeRepository, ResumeInput, ResumeData, ResumeListInput, ResumeListData, } from "../../application/repositories/ResumeRepository";
import { normalizeEmail } from "../../domain/NormalizeEmail";
import { DuplicateEmailError } from "../../domain/DuplicateEmailError";
import { ResumeNotFoundError } from "../../domain/ResumeNotFoundError";
import { InvalidResumeDataError } from "../../application/ResumeValidation";
import { getPagination } from "../../application/use-cases/list-resumes/Pagination";

function prismaCode(error: unknown): string | undefined {
    if (error instanceof Error && "code" in error && typeof (error as { code?: unknown }).code === "string")
        return (error as { code: string }).code;
    return undefined;
}

function project<T extends { area: { name: string } | null; areaOfExpertise: string | null }>(row: T) {
    const { area, ...rest } = row;
    return { ...rest, areaOfExpertise: area?.name ?? row.areaOfExpertise };
}

export class PrismaResumeRepository implements ResumeRepository {
    constructor(private readonly client: PrismaClient) { }
    async list(input: ResumeListInput): Promise<ResumeListData> {
        const { page, limit } = getPagination(input);
        const search = typeof input.search === 'string' && input.search.trim() ? input.search.trim() : undefined;
        const where = search
            ? {
                OR: [
                    { fullName: { contains: search } },
                    { email: { contains: search } },
                    { phone: { contains: search } },
                    { areaOfExpertise: { contains: search } },
                ],
            }
            : undefined;
        const [items, total] = await this.client.$transaction([
            this.client.resume.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: [{ createdAt: "desc" }, { id: "asc" }],
                include: { area: { select: { name: true } } },
            }),
            this.client.resume.count({ where }),
        ]);
        return { items: items.map(project), total };
    }
    async create(input: ResumeInput): Promise<ResumeData> {
        const email = normalizeEmail(input.email);
        try {
            return project(await this.client.resume.create({
                data: { ...input, email },
                include: { area: { select: { name: true } } },
            }));
        }
        catch (error) {
            if (prismaCode(error) === "P2003") throw new InvalidResumeDataError({ areaOfExpertiseId: "Área de atuação não encontrada." });
            if (prismaCode(error) === "P2002") {
                const existing = await this.client.resume.findUnique({ where: { email } });
                if (existing) throw new DuplicateEmailError(existing.id);
            }
            throw error;
        }
    }
    async findById(id: string): Promise<ResumeData | null> {
        const row = await this.client.resume.findUnique({ where: { id }, include: { area: { select: { name: true } } } });
        return row ? project(row) : null;
    }
    async findByEmail(email: string): Promise<ResumeData | null> {
        const row = await this.client.resume.findUnique({ where: { email: normalizeEmail(email) }, include: { area: { select: { name: true } } } });
        return row ? project(row) : null;
    }
    async update(id: string, input: ResumeInput): Promise<ResumeData> {
        const email = normalizeEmail(input.email);
        try {
            return project(await this.client.resume.update({
                where: { id },
                data: { ...input, email },
                include: { area: { select: { name: true } } },
            }));
        }
        catch (error) {
            if (prismaCode(error) === "P2003") throw new InvalidResumeDataError({ areaOfExpertiseId: "Área de atuação não encontrada." });
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
            if (prismaCode(error) === "P2003") throw new InvalidResumeDataError({ areaOfExpertiseId: "Área de atuação não encontrada." });
            if (prismaCode(error) === "P2025") throw new ResumeNotFoundError();
            throw error;
        }
    }
}
