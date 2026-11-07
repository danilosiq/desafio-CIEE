import { Request, Response } from "express";
import { CreateResumeUseCase } from "../../../application/use-cases/create-resume/CreateResumeUseCase";

export class CreateResumeController {
  constructor(private readonly useCase: CreateResumeUseCase) {}
  async handle(request: Request, response: Response): Promise<void> {
    const output = await this.useCase.execute(request.body);
    response.status(201).json(output);
  }
}
