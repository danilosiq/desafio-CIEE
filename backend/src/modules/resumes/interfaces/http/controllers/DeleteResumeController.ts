import { Request, Response } from "express";
import { DeleteResumeUseCase } from "../../../application/use-cases/delete-resume/DeleteResumeUseCase";

export class DeleteResumeController {
  constructor(private readonly useCase: DeleteResumeUseCase) {}
  async handle(request: Request, response: Response): Promise<void> {
    await this.useCase.execute({ id: String(request.params.id ?? "") });
    response.status(204).send();
  }
}
