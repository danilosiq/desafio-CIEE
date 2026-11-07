import { createApp } from './App';
import { disconnectDatabase } from '../infra/database/PrismaClient';
import { loadEnvironment } from "../infra/config/LoadEnvironment";

loadEnvironment();

const port = Number(process.env.PORT ?? 3333);
if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT must be between 1 and 65535.');
const server = createApp().listen(port, () => console.log(`API listening on port ${port}.`));
function shutdown(): void {
    server.close(() => {
        void disconnectDatabase().catch(() => { process.exitCode = 1; });
    });
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
