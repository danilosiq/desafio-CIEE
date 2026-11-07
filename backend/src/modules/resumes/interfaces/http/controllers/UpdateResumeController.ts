import { Request, Response } from "express";
import { UpdateResumeUseCase } from "../../../application/use-cases/update-resume/UpdateResumeUseCase";

export class UpdateResumeController {
  constructor(private readonly useCase: UpdateResumeUseCase) {}
  async handle(request: Request, response: Response): Promise<void> {
    const output = await this.useCase.execute({ id: String(request.params.id ?? ""), data: request.body });
    response.status(200).json(output);
  }
}
