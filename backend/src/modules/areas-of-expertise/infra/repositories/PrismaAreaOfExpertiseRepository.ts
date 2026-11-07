import { PrismaClient } from "../../../../generated/prisma/client";
import { AreaOfExpertiseData, AreaOfExpertiseInput, AreaOfExpertiseRepository, } from "../../application/repositories/AreaOfExpertiseRepository";
import { DuplicateAreaNameError } from "../../domain/DuplicateAreaNameError";
export class PrismaAreaOfExpertiseRepository implements AreaOfExpertiseRepository {
    constructor(private readonly client: PrismaClient) { }
    async create(input: AreaOfExpertiseInput): Promise<AreaOfExpertiseData> {
        try {
            return await this.client.areaOfExpertise.create({
                data: { ...input, name: input.name.trim() },
            });
        }
        catch (error) {
            if (error instanceof Error && "code" in error && error.code === "P2002") {
                throw new DuplicateAreaNameError();
            }
            throw error;
        }
    }
    async findById(id: string): Promise<AreaOfExpertiseData | null> {
        return this.client.areaOfExpertise.findUnique({ where: { id } });
    }
    async list(): Promise<AreaOfExpertiseData[]> {
        return this.client.areaOfExpertise.findMany({ orderBy: { name: "asc" } });
    }
    async update(id: string, input: AreaOfExpertiseInput): Promise<AreaOfExpertiseData | null> {
        try {
            return await this.client.areaOfExpertise.update({ where: { id }, data: input });
        } catch (error) {
            if (error instanceof Error && "code" in error && error.code === "P2002") throw new DuplicateAreaNameError();
            if (error instanceof Error && "code" in error && error.code === "P2025") return null;
            throw error;
        }
    }
    async delete(id: string): Promise<boolean> {
        const result = await this.client.areaOfExpertise.deleteMany({ where: { id } });
        return result.count > 0;
    }
}
