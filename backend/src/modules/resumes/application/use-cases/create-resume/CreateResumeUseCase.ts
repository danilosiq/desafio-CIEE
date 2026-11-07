import { ResumeRepository, ResumeData } from "../../repositories/ResumeRepository";
import { validateResumeInput } from "../../ResumeValidation";

export class CreateResumeUseCase {
  constructor(private readonly repository: Pick<ResumeRepository, "create">) {}
  async execute(input: unknown): Promise<ResumeData> {
    return this.repository.create(validateResumeInput((input ?? {}) as Record<string, unknown>));
  }
}
