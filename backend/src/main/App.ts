import express, { ErrorRequestHandler } from "express";
import swaggerUi from "swagger-ui-express";
import { ResumeRepository } from "../modules/resumes/application/repositories/ResumeRepository";
import { ListResumesUseCase } from "../modules/resumes/application/use-cases/list-resumes/ListResumesUseCase";
import { CreateResumeUseCase } from "../modules/resumes/application/use-cases/create-resume/CreateResumeUseCase";
import { GetResumeUseCase } from "../modules/resumes/application/use-cases/get-resume/GetResumeUseCase";
import { UpdateResumeUseCase } from "../modules/resumes/application/use-cases/update-resume/UpdateResumeUseCase";
import { DeleteResumeUseCase } from "../modules/resumes/application/use-cases/delete-resume/DeleteResumeUseCase";
import { InvalidPaginationError } from "../modules/resumes/application/use-cases/list-resumes/Pagination";
import { InvalidResumeDataError } from "../modules/resumes/application/ResumeValidation";
import { DuplicateEmailError } from "../modules/resumes/domain/DuplicateEmailError";
import { ResumeNotFoundError } from "../modules/resumes/domain/ResumeNotFoundError";
import { ListResumesController } from "../modules/resumes/interfaces/http/controllers/ListResumesController";
import { CreateResumeController } from "../modules/resumes/interfaces/http/controllers/CreateResumeController";
import { GetResumeController } from "../modules/resumes/interfaces/http/controllers/GetResumeController";
import { UpdateResumeController } from "../modules/resumes/interfaces/http/controllers/UpdateResumeController";
import { DeleteResumeController } from "../modules/resumes/interfaces/http/controllers/DeleteResumeController";
import { createResumeRoutes } from "../modules/resumes/interfaces/http/routes/ResumeRoutes";
import { openApi } from "../infra/http/documentation/OpenApi";

function defaultRepository(): ResumeRepository {
  const { PrismaResumeRepository } = require("../modules/resumes/infra/repositories/PrismaResumeRepository") as typeof import("../modules/resumes/infra/repositories/PrismaResumeRepository");
  const { getPrismaClient } = require("../infra/database/PrismaClient") as typeof import("../infra/database/PrismaClient");
  return new PrismaResumeRepository(getPrismaClient());
}

export function createApp(repository: ResumeRepository = defaultRepository()): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.enable("strict routing");
  app.use(express.json({ limit: "1mb" }));
  app.get("/openapi.json", (_request, response) => { response.json(openApi); });
  app.get("/docs", (_request, response) => { response.redirect("/docs/"); });
  app.get("/docs/", swaggerUi.setup(openApi));
  app.use("/docs", swaggerUi.serve);
  app.use("/resumes", createResumeRoutes({
    list: new ListResumesController(new ListResumesUseCase(repository)),
    create: new CreateResumeController(new CreateResumeUseCase(repository)),
    get: new GetResumeController(new GetResumeUseCase(repository)),
    update: new UpdateResumeController(new UpdateResumeUseCase(repository)),
    remove: new DeleteResumeController(new DeleteResumeUseCase(repository)),
  }));
  const handleError: ErrorRequestHandler = (error: unknown, request, response, _next) => {
    if (error instanceof InvalidPaginationError || error instanceof InvalidResumeDataError) {
      response.status(400).json(error instanceof InvalidResumeDataError ? { message: error.message, details: error.details } : { message: error.message });
      return;
    }
    if (error instanceof ResumeNotFoundError) {
      response.status(404).json({ message: error.message });
      return;
    }
    if (error instanceof DuplicateEmailError) {
      response.status(409).json({ message: error.message, existingId: error.existingId });
      return;
    }
    console.error(`Failed to handle ${request.method} ${request.path}.`);
    response.status(500).json({ message: "Não foi possível processar a solicitação." });
  };
  app.use(handleError);
  return app;
}
