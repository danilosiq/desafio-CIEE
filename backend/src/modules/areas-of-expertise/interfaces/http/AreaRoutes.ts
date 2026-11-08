import { Router } from "express";
import { PrismaAreaOfExpertiseRepository } from "../../infra/repositories/PrismaAreaOfExpertiseRepository";
import { DuplicateAreaNameError } from "../../domain/DuplicateAreaNameError";

export function createAreaRoutes(repository: () => PrismaAreaOfExpertiseRepository): Router {
  const router = Router();
  const validId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  router.get("/", async (_req, res, next) => {
    try { res.json(await repository().list()); } catch (error) { next(error); }
  });
  router.get("/:id", async (req, res, next) => {
    try {
      const area = validId(req.params.id) ? await repository().findById(req.params.id) : null;
      if (!area) { res.status(404).json({ message: "Área de atuação não encontrada." }); return; }
      res.json(area);
    } catch (error) { next(error); }
  });
  const save = (update: boolean) => async (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
    if (!name || name.length > 200 || !description) { res.status(400).json({ message: "Informe nome (até 200 caracteres) e descrição da área." }); return; }
    try {
      if (update && !validId(id)) { res.status(404).json({ message: "Área de atuação não encontrada." }); return; }
      const area = update ? await repository().update(id, { name, description }) : await repository().create({ name, description });
      if (!area) { res.status(404).json({ message: "Área de atuação não encontrada." }); return; }
      res.status(update ? 200 : 201).json(area);
    } catch (error) {
      if (error instanceof DuplicateAreaNameError) { res.status(409).json({ message: error.message }); return; }
      next(error);
    }
  };
  router.post("/", save(false));
  router.put("/:id", save(true));
  router.delete("/:id", async (req, res, next) => {
    try {
      const deleted = validId(req.params.id) && await repository().delete(req.params.id);
      if (!deleted) { res.status(404).json({ message: "Área de atuação não encontrada." }); return; }
      res.status(204).end();
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "P2003") { res.status(409).json({ message: "Área vinculada a candidatos não pode ser excluída." }); return; }
      next(error);
    }
  });
  return router;
}
