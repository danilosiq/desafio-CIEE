import express, { ErrorRequestHandler } from 'express';
import swaggerUi from 'swagger-ui-express';
import { ResumeRepository } from '../modules/resumes/application/repositories/ResumeRepository';
import { PrismaResumeRepository } from '../modules/resumes/infra/repositories/PrismaResumeRepository';
import { getPrismaClient } from '../infra/database/PrismaClient';
import { ListResumesUseCase } from '../modules/resumes/application/use-cases/list-resumes/ListResumesUseCase';
import { InvalidPaginationError } from '../modules/resumes/application/use-cases/list-resumes/Pagination';
import { ListResumesController } from '../modules/resumes/interfaces/http/controllers/ListResumesController';
import { createResumeRoutes } from '../modules/resumes/interfaces/http/routes/ResumeRoutes';
import { openApi } from '../infra/http/documentation/OpenApi';
export function createApp(repository: Pick<ResumeRepository, 'list'> = new PrismaResumeRepository(getPrismaClient())): express.Express {
    const app = express();
    app.disable('x-powered-by');
    app.enable('strict routing');
    app.get('/openapi.json', (_request, response) => { response.json(openApi); });
    app.get('/docs', (_request, response) => { response.redirect('/docs/'); });
    app.get('/docs/', swaggerUi.setup(openApi));
    app.use('/docs', swaggerUi.serve);
    app.use('/resumes', createResumeRoutes(new ListResumesController(new ListResumesUseCase(repository))));
    const handleError: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
        if (error instanceof InvalidPaginationError) {
            response.status(400).json({ message: error.message });
            return;
        }
        console.error('Failed to list resumes.');
        response.status(500).json({ message: 'Não foi possível consultar os currículos.' });
    };
    app.use(handleError);
    return app;
}
