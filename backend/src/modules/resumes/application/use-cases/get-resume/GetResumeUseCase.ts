import { ResumeRepository, ResumeData } from "../../repositories/ResumeRepository";
import { ResumeNotFoundError } from "../../../domain/ResumeNotFoundError";

export type GetResumeInput = { id: string };

export class GetResumeUseCase {
  constructor(private readonly repository: Pick<ResumeRepository, "findById">) {}
  async execute(input: GetResumeInput): Promise<ResumeData> {
    if (typeof input.id !== "string" || !input.id.trim()) throw new ResumeNotFoundError();
    const resume = await this.repository.findById(input.id);
    if (!resume) throw new ResumeNotFoundError();
    return resume;
  }
}
