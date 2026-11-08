# Desafio CIEE — Cadastro de currículos

Aplicação para cadastrar e consultar candidatos por meio de um formulário manual ou com preenchimento assistido por PDF. A leitura de texto acontece no backend, e as sugestões de nome, e-mail e telefone devem ser revisadas antes do salvamento. O cadastro manual funciona sem arquivo.

## Tecnologias

| Tecnologia | Versão |
| --- | --- |
| Node.js | 24.22.2 |
| npm | 11.6.2 |
| Next.js | 16.4.5 |
| React / React DOM | 19.3.1 |
| TypeScript | 5.9.3 |
| Express | 5.3.0 |
| Prisma / adaptador SQL Server | 7.10.1 |
| SQL Server | 2025 |
| pdf-parse | 2.4.5 |
| Multer | 2.5.0 |
| Jest | 30.5.2 |
| Playwright | 1.65.0 |

## Preparação

São necessários Node.js e npm nas versões indicadas, Docker com Compose e espaço disponível para a imagem e os dados do SQL Server. Os exemplos abaixo usam a porta `1433` e o banco `ciee`.

1. Copie `backend/.env.docker.example` para `backend/.env.docker`, defina uma senha local forte e mantenha esse arquivo fora do controle de versão.
2. Copie `backend/.env.example` para `backend/.env` e configure `DATABASE_URL` com a mesma senha, o banco `ciee` e a porta do SQL Server. A conexão local usa `localhost`; dentro do Compose, o backend acessa `sqlserver`.
3. Na raiz do repositório, inicie o banco:

```sh
docker compose --env-file backend/.env.docker up -d sqlserver
```

4. Crie o banco `ciee` se ele ainda não existir, usando a senha já disponível no container:

```sh
docker compose --env-file backend/.env.docker exec -T sqlserver /bin/bash -c 'SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C -b -Q "IF DB_ID(N'\''ciee'\'') IS NULL CREATE DATABASE [ciee]"'
```

5. Com o banco disponível, instale as dependências e aplique as migrations:

```sh
cd backend
npm ci
npm run migrate:deploy
```

A seed é opcional: `npm run seed` garante as áreas e os candidatos fictícios sem apagar registros existentes. De volta à raiz, construa e inicie a aplicação:

```sh
docker compose --env-file backend/.env.docker up -d --build
```

O frontend fica em [http://localhost:3000](http://localhost:3000), a API em [http://localhost:3333](http://localhost:3333) e o Swagger em [http://localhost:3333/docs/](http://localhost:3333/docs/). O volume `sqlserver-data` guarda os dados do banco. `docker compose down` para os containers; não use `down -v` se quiser preservá-los.

Para desenvolvimento sem o frontend em container, instale suas dependências com `npm ci` no diretório `frontend` e execute `npm run dev`. Configure `NEXT_PUBLIC_API_URL` para a URL acessível pelo navegador ou use o proxy `/api` do Next.js. Cada projeto usa seu próprio `package-lock.json`.

## Leitura de currículos

`POST /scan` recebe um arquivo no campo `file` de `multipart/form-data`, valida o PDF e devolve sugestões de nome, e-mail e telefone sem persistir candidato. Campos não identificados retornam `null`; a pessoa pode revisar e completar todos os campos antes de salvar pelo mesmo CRUD usado no cadastro manual.

A leitura usa `pdf-parse` e regras locais. PDFs sem texto selecionável, inclusive digitalizados somente como imagem, não são reconhecidos; a interface permite continuar manualmente. A identificação de nome é heurística: currículos de duas colunas, nomes de uma palavra ou cabeçalhos pouco convencionais podem produzir sugestões incompletas ou incorretas. Revise os dados antes de confirmar.

O limite do arquivo é **5 MiB (5.242.880 bytes)**. A extração usa `PDF_MAX_PAGES` (padrão `20`), `PDF_PARSE_TIMEOUT_MS` (`15000`) e `PDF_PARSE_CONCURRENCY` (`2`); limites excedidos geram erro explícito. Arquivos e texto não são persistidos como parte do cadastro. A renderização separada `POST /pdf/render` mantém `PDF_RENDER_SCALE` e `PDF_RENDER_MAX_PIXELS` como configurações próprias. Consulte o Swagger para formatos de resposta e erros.

## Testes

Com as dependências instaladas, os scripts disponíveis incluem:

```sh
cd backend
npm test
npm run typecheck
npm run build
```

Os testes de integração exigem um SQL Server local e um banco isolado `ciee_test`; não aponte os testes ao banco de desenvolvimento. Crie o banco de teste, configure `DATABASE_URL` para ele, aplique as migrations e inicie uma instância da API na porta 3335:

```sh
cd backend
export DATABASE_URL='sqlserver://localhost:1433;database=ciee_test;user=sa;password=SUA_SENHA;encrypt=true;trustServerCertificate=true'
npm run migrate:deploy
NODE_ENV=test PORT=3335 npm run dev
```

Em outro terminal, execute as verificações do frontend contra essa instância. As suítes criam dados fictícios e removem os registros que criaram:

```sh
cd frontend
export NEXT_PUBLIC_API_URL=http://127.0.0.1:3335
export FRONTEND_TEST_DATABASE=ciee_test
npm test
npm run fullcheck
```

Para os testes de navegador, instale o Chromium (`npx playwright install chromium`), faça o build do frontend com `NEXT_PUBLIC_API_URL` configurada e inicie-o na porta 3103. Em outro terminal, execute:

```sh
cd frontend
E2E_BASE_URL=http://127.0.0.1:3103 E2E_API_URL=http://127.0.0.1:3335 E2E_TEST_DATABASE=ciee_test npm run test:e2e
```

## Uso de IA no desenvolvimento

O Codex auxiliou na análise, implementação e revisão do projeto. As regras de extração do produto são determinísticas e não enviam documentos a serviços externos. A pessoa responsável deve conferir os resultados e as limitações dos testes antes de apresentar a aplicação.
