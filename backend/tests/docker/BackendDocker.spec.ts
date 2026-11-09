import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

// Dedicated Compose project and database; never uses the development .env.docker.
const root = resolve(__dirname, '../../..');
const argumentsPrefix = ['compose', '-f', 'compose.yaml', '-f', 'compose.test.yaml', '--env-file', 'backend/.env.docker.test', '-p', 'ciee-docker-test'];
const prefix = `docker-test-${randomUUID()}`;
// Fixture commands block the test process; avoid reusing idle HTTP sockets afterwards.
async function api(path: string): Promise<Response> {
  return fetch(`http://127.0.0.1:13333${path}`, { headers: { Connection: 'close' } });
}

function compose(args: string[], timeout = 30000): string {
  return execFileSync('docker', [...argumentsPrefix, ...args], { cwd: root, encoding: 'utf8', timeout });
}
function inBackend(source: string): unknown {
  const output = compose(['exec', '-T', 'backend', 'node', '-e', source]);
  return JSON.parse(output.trim().split('\n').at(-1)!);
}
const databaseSetup = `
const {getPrismaClient,disconnectDatabase}=require('./dist/infra/database/PrismaClient');
const client=getPrismaClient();
if (!process.env.DATABASE_URL.includes(';database=ciee_test;')) throw new Error('Dedicated test database required.');
`;
afterAll(() => {
  inBackend(databaseSetup + `
(async()=>{try{
await client.resume.deleteMany({where:{email:{startsWith:${JSON.stringify(prefix)}}}});
await client.areaOfExpertise.deleteMany({where:{name:${JSON.stringify(prefix)}}});
console.log(JSON.stringify({cleaned:true}));
}finally{await disconnectDatabase();}})().catch(()=>process.exitCode=1);
`);
});
it('serves Swagger and rejects invalid pagination over HTTP', async () => {
  expect((await api('/docs/')).status).toBe(200);
  expect((await api('/resumes?limit=31')).status).toBe(400);
});
it('runs without root, development dependencies, source code or env files', () => {
  expect(inBackend(`
const fs=require('node:fs');
console.log(JSON.stringify({uid:process.getuid(),env:fs.existsSync('/app/.env'),source:fs.existsSync('/app/src'),tests:fs.existsSync('/app/tests'),typescript:fs.existsSync('/app/node_modules/typescript'),prismaCli:fs.existsSync('/app/node_modules/prisma')}));
`)).toEqual({ uid: 1000, env: false, source: false, tests: false, typescript: false, prismaCli: false });
});
it('lists real persisted resumes in pages of 30 and 1', async () => {
  inBackend(databaseSetup + `
(async()=>{try{
await client.resume.createMany({data:Array.from({length:31},(_,index)=>({fullName:'Pessoa Fictícia',email:${JSON.stringify(prefix)}+'-'+index+'@example.com'}))});
console.log(JSON.stringify({created:31}));
}finally{await disconnectDatabase();}})().catch(()=>process.exitCode=1);
`);
  const first = await (await api('/resumes')).json();
  const second = await (await api('/resumes?page=2')).json();
  expect(first.items).toHaveLength(30);
  expect(second.items).toHaveLength(1);
  expect(first.total).toBe(31);
});
it('extrai texto de um PDF fictício no backend em container', async () => {
  const { makeTextPdf } = await import('../fixtures/MakeTextPdf');
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(makeTextPdf(['Ana Maria Silva', 'ana@example.com', 'Telefone: (11) 99999-0000']))], { type: 'application/pdf' }), 'cv.pdf');
  const response = await fetch('http://127.0.0.1:13333/scan', { method: 'POST', body: form });
  expect(response.status).toBe(200);
  expect((await response.json()).data).toMatchObject({ name: 'Ana Maria Silva', email: 'ana@example.com' });
});
it('preserves database records when backend and SQL Server containers are recreated', () => {
  inBackend(databaseSetup + `
(async()=>{try{await client.areaOfExpertise.create({data:{name:${JSON.stringify(prefix)},description:'Docker persistence fixture'}});console.log(JSON.stringify({created:true}));}finally{await disconnectDatabase();}})().catch(()=>process.exitCode=1);
`);
  compose(['up', '-d', '--force-recreate', '--wait', '--wait-timeout', '180', 'sqlserver', 'backend'], 210000);
  expect(inBackend(databaseSetup + `
(async()=>{try{console.log(JSON.stringify({count:await client.areaOfExpertise.count({where:{name:${JSON.stringify(prefix)}}})}));}finally{await disconnectDatabase();}})().catch(()=>process.exitCode=1);
`)).toEqual({ count: 1 });
});
