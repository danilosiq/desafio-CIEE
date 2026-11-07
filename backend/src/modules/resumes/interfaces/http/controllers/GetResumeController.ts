import { Request, Response } from "express";
import { GetResumeUseCase } from "../../../application/use-cases/get-resume/GetResumeUseCase";

export class GetResumeController {
  constructor(private readonly useCase: GetResumeUseCase) {}
  async handle(request: Request, response: Response): Promise<void> {
    const output = await this.useCase.execute({ id: String(request.params.id ?? "") });
    response.status(200).json(output);
  }
}
