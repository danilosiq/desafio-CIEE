import { Router } from "express";
import { ListResumesController } from "../controllers/ListResumesController";
import { CreateResumeController } from "../controllers/CreateResumeController";
import { GetResumeController } from "../controllers/GetResumeController";
import { UpdateResumeController } from "../controllers/UpdateResumeController";
import { DeleteResumeController } from "../controllers/DeleteResumeController";

export type ResumeControllers = {
  list: ListResumesController;
  create: CreateResumeController;
  get: GetResumeController;
  update: UpdateResumeController;
  remove: DeleteResumeController;
};

export function createResumeRoutes(controllers: ResumeControllers): Router {
  const router = Router();
  router.get("/", (request, response, next) => controllers.list.handle(request, response).catch(next));
  router.post("/", (request, response, next) => controllers.create.handle(request, response).catch(next));
  router.get("/:id", (request, response, next) => controllers.get.handle(request, response).catch(next));
  router.put("/:id", (request, response, next) => controllers.update.handle(request, response).catch(next));
  router.delete("/:id", (request, response, next) => controllers.remove.handle(request, response).catch(next));
  return router;
}
