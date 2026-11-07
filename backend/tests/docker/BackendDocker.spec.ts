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
it('renders a fictitious PDF using PDF.js and native canvas inside the runtime image', () => {
  expect(inBackend(`
(async()=>{
const {createCanvas}=require('@napi-rs/canvas');
const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
const content='BT /F1 16 Tf 20 40 Td (CIEE TEST) Tj ET';
const objects=[
'<< /Type /Catalog /Pages 2 0 R >>',
'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
'<< /Length '+Buffer.byteLength(content)+' >>\\nstream\\n'+content+'\\nendstream',
'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
let pdf='%PDF-1.4\\n';const offsets=[0];
objects.forEach((object,index)=>{offsets.push(Buffer.byteLength(pdf));pdf+=(index+1)+' 0 obj\\n'+object+'\\nendobj\\n';});
const xref=Buffer.byteLength(pdf);pdf+='xref\\n0 6\\n0000000000 65535 f \\n';
offsets.slice(1).forEach(offset=>pdf+=String(offset).padStart(10,'0')+' 00000 n \\n');
pdf+='trailer\\n<< /Size 6 /Root 1 0 R >>\\nstartxref\\n'+xref+'\\n%%EOF';
const document=await getDocument({data:new Uint8Array(Buffer.from(pdf)),useSystemFonts:true}).promise;
const page=await document.getPage(1);const viewport=page.getViewport({scale:1});
const canvas=createCanvas(viewport.width,viewport.height);
await page.render({canvas,canvasContext:canvas.getContext('2d'),viewport}).promise;
const png=canvas.toBuffer('image/png');await document.destroy();
console.log(JSON.stringify({width:canvas.width,height:canvas.height,png:png.subarray(1,4).toString()==='PNG'}));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
`)).toEqual({ width: 200, height: 100, png: true });
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
