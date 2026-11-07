# Desafio CIEE

Cadastro de currículos. Requisitos em [DESAFIO CIEE.md](DESAFIO%20CIEE.md) e registro de desenvolvimento em [DESENVOLVIMENTO.md](DESENVOLVIMENTO.md).

## Backend — persistência

| Tecnologia | Versão utilizada |
| --- | --- |
| Node.js | [24.22.2 LTS](https://nodejs.org/en/blog/release/v24.22.2) (mínimo 24.22.2, inferior a 25) |
| npm | 11.6.2 |
| TypeScript | 5.9.3 |
| Prisma CLI, Client e adaptador MSSQL | 7.10.1 |
| SQL Server de teste | 2022 Developer, 16.0.4305.5 |
| Jest | 30.5.2 |
| Express | 5.3.0 |
| date-fns | 4.4.0 |
| Swagger UI Express | 5.0.1 |
| PDF.js / @napi-rs/canvas | 5.4.624 / 0.1.100 |

O schema fica em `backend/prisma/schema/`, com os modelos de persistência. `Resume` guarda os dados revisados; `ResumeProcessingJob` existe sem vínculo obrigatório com um cadastro e admite somente `Processing` e `Finished`. `AreaOfExpertise` mantém um catálogo independente, com nome e descrição obrigatórios, sem substituir o campo livre `interestArea`. Esta entrega prepara a persistência e a listagem HTTP de currículos; processamento de PDFs, fila de execução e demais endpoints do CRUD permanecem fora desta etapa.

### Configuração e migrations

Selecionar Node 24.22.2 com `nvm install` e `nvm use` na raiz ou na pasta do projeto. O npm recusa versões anteriores por engine-strict. Na pasta `backend`, instalar as dependências com `npm ci`. Copiar `.env.example` para `backend/.env` e preencher a conexão local. Prisma e servidor carregam esse arquivo automaticamente, sem substituir variáveis já exportadas no ambiente. Também é possível configurar a conexão pelo terminal:

```sh
export DATABASE_URL='sqlserver://localhost:1433;database=ciee;user=USUARIO;password=SENHA_LOCAL;encrypt=true;trustServerCertificate=true'
npm exec -- prisma:validate
npm exec -- prisma:generate
npm run migrate:deploy
```

Criar previamente o banco vazio e usar um usuário com permissão para criar a estrutura. `trustServerCertificate=true` serve para certificados locais de teste; em outros ambientes, configurar a validação do certificado. Não versionar credenciais. `migrate:deploy` aplica as migrations pendentes, sem reset; revisar qualquer migration futura antes de aplicá-la.

Para evolução local do schema, `npm run migrate:dev -- --name NOME` usa o fluxo de desenvolvimento do Prisma e pode precisar de um banco shadow. Não autorizar resets nem usar dados reais nesse fluxo.

`getPrismaClient()` centraliza a instância e o pool, com o adaptador SQL Server. A composição futura da API deve injetá-la nos repositories e chamar `disconnectDatabase()` no encerramento. Domínio e contratos de aplicação não dependem do Prisma.

Os e-mails são normalizados com `trim().toLowerCase()` antes da persistência, mantendo pontos e tags `+`. A migration aplica índice único e exige e-mail canônico em minúsculas, sem espaços externos, com collation binária. Escritas diretas também devem respeitar esse formato. Duplicidades são convertidas em `DuplicateEmailError`, inclusive em inserções concorrentes; outras falhas são propagadas para tratamento pela aplicação.

SQL Server não oferece enums no schema Prisma: os estados dos jobs são tipados na aplicação e protegidos por `CHECK` na migration, incluindo caixa e espaços finais. Preservar esses constraints manuais em migrations futuras. No ambiente validado com Prisma 7.10.1, o migration engine exige `provider = "mssql"` em `migration_lock.toml`; o datasource do schema continua `sqlserver`.

### Verificações

```sh
npm run check
```

Esse comando valida o schema, gera o client, verifica tipos, executa unitários e compila o backend em `dist/`. O client gerado não é versionado.

Integração e E2E exigem SQL Server real em `localhost` ou `127.0.0.1`, com um banco separado chamado exatamente `ciee_test`. O guard dos testes recusa conexão ausente, host remoto ou outro nome de banco. Criar esse banco vazio, configurar `DATABASE_URL` para ele e executar:

```sh
npm run migrate:deploy
npm run test:integration
npm run build
npm run test:e2e
```

Os testes usam dados fictícios e removem seus próprios registros. O E2E de persistência executa os repositories compilados em processos Node distintos, verificando dados após encerrar e reabrir a conexão, duplicidade e conclusão de job. Esse cenário de persistência não valida a interface web. A listagem também possui E2E HTTP contra o código compilado e SQL Server real.

### Contribuição

Informar o nome da branch de trabalho e criá-la a partir de `dev`, preservando alterações locais. Não desenvolver diretamente em `dev` ou `main`; exceções para `main` exigem autorização explícita. A origem disponível neste momento só contém `main`; a base `dev` utilizada existe localmente.


## Listagem de currículos

Com `DATABASE_URL` configurada e migrations aplicadas, executar `npm run dev` em `backend` para desenvolvimento, ou `npm run build` seguido de `npm start` para o código compilado. A API usa a porta 3333 por padrão (`PORT` configura outra porta).

`GET /resumes?page=1&limit=30` retorna `items`, `page`, `limit`, `total` e `totalPages`. A primeira página e o limite 30 são os padrões. O limite aceito é de 1 a 30; valores maiores retornam HTTP 400. Página deve ser um inteiro positivo, e o deslocamento deve caber no intervalo suportado pelo SQL Server. Parâmetros vazios, repetidos ou fora do formato inteiro também retornam 400.

A consulta usa paginação no banco, ordenada por `createdAt` decrescente e `id` crescente como desempate. Uma página além do último resultado retorna `items: []`, preservando o total. Sem registros, `totalPages` é 0.

Swagger UI em `/docs/` e especificação OpenAPI publicada em `/openapi.json`, incluindo os parâmetros e respostas 200, 400 e 500. Esta listagem não altera a consulta de um currículo por ID no repository.


## Docker do backend e SQL Server local

O `compose.yaml` contém SQL Server 2025, backend e a configuração de imagem do frontend. Os comandos abaixo iniciam somente SQL Server e backend. Ollama não faz parte dessa composição.

A configuração local fica em `backend/.env.docker`, ignorada pelo Git. Para outro checkout, copiar `backend/.env.docker.example` e definir uma senha forte. Não usar `;` ou `$` nessa senha, pois são delimitadores da conexão/interpolação. As variáveis são `MSSQL_SA_PASSWORD`, `MSSQL_DATABASE` (ciee), `SQLSERVER_PORT` (1433) e `BACKEND_PORT` (3333).

Na raiz, validar e iniciar o banco:

```sh
docker compose --env-file backend/.env.docker config --quiet
docker compose --env-file backend/.env.docker up -d sqlserver
```

No primeiro uso, criar o banco (exemplo para o nome padrão ciee):

```sh
docker compose --env-file backend/.env.docker exec -T sqlserver bash <<'SH'
export SQLCMDPASSWORD="$MSSQL_SA_PASSWORD"
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C -b -Q "IF DB_ID(N'ciee') IS NULL CREATE DATABASE [ciee];"
SH
```

Configurar `backend/.env` com DATABASE_URL usando localhost, a porta publicada, o nome do banco e a mesma senha de `.env.docker`. Aplicar as migrations pelo host antes de consultar a API:

```sh
cd backend
npm run migrate:deploy
cd ..
docker compose --env-file backend/.env.docker up -d --build backend
docker compose --env-file backend/.env.docker ps -a
docker compose --env-file backend/.env.docker logs -f backend
```

O Compose aguarda o SQL Server saudável. As migrations são explícitas e não executam reset. Swagger em [localhost:3333/docs/](http://localhost:3333/docs/) e listagem em [localhost:3333/resumes](http://localhost:3333/resumes). Dentro dos containers, a conexão usa sqlserver:1433; no host, usa localhost e a porta publicada.

O volume nomeado sqlserver-data preserva o banco ao parar ou recriar containers. Para encerrar sem apagar dados:

```sh
docker compose --env-file backend/.env.docker down
```

Não usar down -v para o ambiente de desenvolvimento. Alterar a senha no arquivo não modifica a senha de um banco já persistido.

O Dockerfile usa Node 24.22.2 e npm 11.6.2, instalação reproduzível com npm ci, geração Prisma e compilação em etapas. A imagem runtime usa usuário node e contém dependências de produção e dist. As etapas development e migrations mantêm as ferramentas de cada finalidade. A imagem também inclui bibliotecas e fontes para PDF.js e @napi-rs/canvas.

O SQL Server usa linux/amd64. Neste Mac ARM64 depende da emulação do Docker Desktop, fora do suporte oficial para hosts Linux x86-64: [documentação do SQL Server](https://learn.microsoft.com/en-us/sql/linux/quickstart-install-connect-docker?view=sql-server-linux-ver16).

### Validação isolada de Docker

Os testes usam o projeto ciee-docker-test, o override compose.test.yaml e o arquivo local backend/.env.docker.test: banco ciee_test, API em 13333 e SQL Server em 14339. O override mantém nomes de containers distintos do ambiente de desenvolvimento.

```sh
docker compose -f compose.yaml -f compose.test.yaml --env-file backend/.env.docker.test -p ciee-docker-test up -d sqlserver
```

Criar o banco ciee_test e aplicar as migrations com DATABASE_URL apontando para localhost:14339, usando as credenciais do arquivo de teste. Depois:

```sh
docker compose -f compose.yaml -f compose.test.yaml --env-file backend/.env.docker.test -p ciee-docker-test up -d backend
cd backend
npm exec -- jest --config jest.docker.config.cjs --runInBand
```

Os cenários verificam HTTP, paginação, isolamento da imagem runtime, renderização de PDF fictício e persistência após recriar somente os containers do projeto isolado.

## Seed de desenvolvimento

Após configurar o banco e aplicar as migrations, executar na pasta `backend`:

```sh
npm run seed
```

O comando usa a configuração de seed do Prisma 7 (`npm exec -- prisma db seed` também funciona). A seed garante 30 áreas de atuação com nome e descrição e 60 candidatos fictícios em um banco vazio. Cada candidato tem e-mail estável no domínio example.com e uma área de interesse entre as 30 cadastradas. O modelo de persistência dos candidatos continua sendo Resume.

É possível executar novamente: as áreas são localizadas pelo nome único e os candidatos pelo e-mail. Os registros existentes não são sobrescritos e os demais dados do banco não são removidos. Todas as inserções ficam em uma transação. A seed é executada explicitamente e não faz parte da inicialização da API ou do Compose.

Com o SQL Server em Docker, o mesmo `npm run seed` é executado no host; `backend/.env` deve apontar para o banco e a porta publicados. A seed não depende de um serviço migrate no Compose.

Nomes de área são únicos sem diferenciar maiúsculas e minúsculas; acentos permanecem significativos. O repository remove espaços externos ao cadastrar e converte conflitos em DuplicateAreaNameError. A migration adiciona collation CI_AS, constraint única e proteção contra espaços externos. Se existirem nomes repetidos ou nomes com espaços externos, ela interrompe com uma mensagem clara, sem excluir, mesclar ou corrigir dados silenciosamente. Corrigir os conflitos antes de reaplicar a migration.
