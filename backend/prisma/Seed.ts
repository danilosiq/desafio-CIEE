import { loadEnvironment } from '../src/infra/config/LoadEnvironment';
import { getPrismaClient, disconnectDatabase } from '../src/infra/database/PrismaClient';
import { seedDatabase } from '../src/infra/database/SeedDatabase';
async function main(): Promise<void> {
    loadEnvironment();
    try {
        const result = await seedDatabase(getPrismaClient());
        console.log(`Seed concluída: ${result.candidates} candidatos e ${result.areas} áreas garantidos. Registros existentes preservados.`);
    }
    catch {
        console.error('Não foi possível executar a seed. Verifique a conexão e aplique as migrations pendentes.');
        process.exitCode = 1;
    }
    finally {
        await disconnectDatabase();
    }
}
void main();
