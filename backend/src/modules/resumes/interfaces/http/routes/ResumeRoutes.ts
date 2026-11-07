import { Router } from 'express';
import { ListResumesController } from '../controllers/ListResumesController';
export function createResumeRoutes(controller: ListResumesController): Router {
    const router = Router();
    router.get('/', (request, response) => controller.handle(request, response));
    return router;
}
