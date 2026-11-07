import { ResumeRepository, ResumeData } from "../../repositories/ResumeRepository";
import { validateResumeInput } from "../../ResumeValidation";
import { ResumeNotFoundError } from "../../../domain/ResumeNotFoundError";

export type UpdateResumeInput = { id: string; data: unknown };

export class UpdateResumeUseCase {
  constructor(private readonly repository: Pick<ResumeRepository, "update">) {}
  async execute(input: UpdateResumeInput): Promise<ResumeData> {
    if (typeof input.id !== "string" || !input.id.trim()) throw new ResumeNotFoundError();
    return this.repository.update(input.id, validateResumeInput((input.data ?? {}) as Record<string, unknown>));
  }
}
