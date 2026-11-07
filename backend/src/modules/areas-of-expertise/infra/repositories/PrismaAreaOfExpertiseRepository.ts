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
}
