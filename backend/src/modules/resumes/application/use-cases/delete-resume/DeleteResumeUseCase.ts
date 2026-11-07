import { ResumeRepository } from "../../repositories/ResumeRepository";
import { ResumeNotFoundError } from "../../../domain/ResumeNotFoundError";

export type DeleteResumeInput = { id: string };

export class DeleteResumeUseCase {
  constructor(private readonly repository: Pick<ResumeRepository, "delete">) {}
  async execute(input: DeleteResumeInput): Promise<void> {
    if (typeof input.id !== "string" || !input.id.trim()) throw new ResumeNotFoundError();
    await this.repository.delete(input.id);
  }
}
