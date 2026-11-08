# Desafio CIEE — Cadastro de currículos

Aplicação para cadastrar e consultar candidatos, manualmente ou com auxílio de um currículo em PDF.

## Estado atual

O frontend com mocks está implementado. É uma demonstração navegável com dados fictícios: cadastro manual, listagem com busca e ordenação, alternância entre lista e cards, detalhes, edição inline, exclusão, catálogo de áreas de atuação e preenchimento assistido por PDF simulado. A interface usa azul-marinho como cor primária e tema claro.

As operações passam por services Axios e hooks TanStack Query, mas o adapter em `frontend/src/mocks` responde localmente. Dados da demonstração ficam no armazenamento local do navegador; não são persistidos no SQL Server. Nenhum PDF é enviado a um servidor nem interpretado por IA nesta etapa. A integração real com o backend permanece nos cards de integração.

## Tecnologias e versões

| Tecnologia | Versão |
| --- | --- |
| Node.js | 22.12.0 |
| npm | 11.6.2 |
| Next.js | 16.4.5 |
| React / React DOM | 19.3.1 |
| TypeScript | 5.9.3 |
| Tailwind CSS | 4.3.4 |
| Axios | 1.21.0 |
| TanStack Query | 5.106.1 |
| date-fns | 4.4.0 |
| React Hook Form | 7.91.0 |
| Zod / @hookform/resolvers | 4.6.7 / 7.0.3 |
| Radix Dialog / Popover | 1.3.1 |
| Motion | 14.9.1 |
| Jest / jsdom | 30.5.2 |
| Playwright, somente automação do navegador | 1.65.0 |

Componentes base seguem shadcn/ui; o CLI não é uma dependência local do projeto. O backend foi preparado com Express 5.3.0, Prisma 7.10.1, adaptador SQL Server 7.10.1, PDF.js 5.4.624 e `@napi-rs/canvas` 0.1.100. A solução de inferência escolhida é Ollama local com `qwen2.5vl:7b`, ainda não integrada ao frontend.

## Executar o frontend

Com a versão de Node indicada em `frontend/.nvmrc` e Corepack disponível:

```sh
cd frontend
npm ci
npm run dev
```

A aplicação fica em http://localhost:3000. O frontend com mocks funciona sem SQL Server, backend ou Ollama.

## Experimentar a demonstração

- Acesse **Áreas de atuação** pelo header ou pelo footer para cadastrar, consultar, editar e excluir categorias com nome e descrição. A exclusão é bloqueada enquanto houver candidatos vinculados.
- No candidato, selecione uma categoria, deixe a área vazia ou escolha **Outros** e informe um texto. Outros não cria uma categoria no catálogo.
- Abra um dos cinco cadastros fictícios para consultar detalhes e editar.
- Em **Adicionar**, preencha o formulário sem arquivo para testar o fluxo manual e use **Confirmar dados** para salvar.
- Selecione um PDF de até 5 MB e clique em **Processar dados**. A leitura ainda usa uma resposta local simulada, sem parser ou IA real.
- No desktop, arquivo e formulário aparecem lado a lado. No celular, o PDF segue seleção, processamento e revisão; o cadastro manual abre diretamente pelo botão **Adicionar**.
- Experimente `ana.pereira@example.com` para demonstrar duplicidade e abertura da edição do cadastro existente. O conflito é tratado na criação e na edição, preserva os campos e não sobrescreve outro registro.
- Use o ícone ao lado de Candidatos para organizar por ordem alfabética ou pela última alteração (mais antiga/mais nova). O filtro de áreas foi removido.
- Clique em qualquer ponto da linha/card para abrir o perfil. Botões usam cursor de ação; menus, dialogs e trocas de visualização têm fade e slide, respeitando movimento reduzido.
- Alterne entre lista e cards; na edição, use **Desfazer** para restaurar os dados ou **Concluir** para salvar. A exclusão exige confirmação.
- No celular, a listagem usa somente cards e o seletor lista/cards fica oculto. No desktop, a preferência de visualização é preservada ao redimensionar a janela.
- No celular, os dialogs de cadastro, PDF e confirmação viram bottom sheets com conteúdo rolável.
- Busque um nome inexistente para conferir o estado vazio e a recuperação dos filtros.
- Recarregar preserva os dados fictícios salvos neste navegador. Para reiniciar a demonstração, abra uma janela privada ou limpe o armazenamento local desta origem.

## Verificações

Todos os testes são executados pelo Jest e usam `.spec.ts`. React Hook Form e Zod são obrigatórios nos formulários. Regressão com Playwright em desktop e celular é obrigatória para alterações de interface, conforme `frontend/AGENTS.md`. React Testing Library verifica componentes; Playwright é usado apenas como biblioteca de automação dentro dos testes E2E do Jest.

```sh
cd frontend
npm test
npm run test:coverage
npm run fullcheck
```

`fullcheck` executa formatação, arquitetura/política de npm, TypeScript, testes com cobertura e build. Para os E2E:

```sh
corepack yarn exec playwright install chromium
corepack yarn build
npm run test:e2e
```

O Jest inicia e encerra uma instância de produção na porta 3100. Para testar uma instância existente, configure `E2E_BASE_URL`. As capturas ficam em `frontend/test-results/`, e os relatórios de cobertura em `frontend/coverage/`; ambos são ignorados pelo Git. Esses E2E comprovam a interface com mocks, não a integração com SQL Server ou inferência real.

## Estrutura

- `frontend/src/app`: rotas Next.js.
- `frontend/src/core/pages`: páginas e componentes específicos.
- `frontend/src/core/hooks`: queries, mutations e lógica do formulário.
- `frontend/src/core/services`: comunicação com adapter Axios.
- `frontend/src/core/components`: composições e componentes globais.
- `frontend/src/components/ui`: componentes base de UI.
- `frontend/src/mocks`: adapter, armazenamento de demonstração e fixtures de candidatos e categorias.
- `backend`: estrutura inicial; a implementação da API é uma entrega posterior.

O escopo original está em `DESAFIO CIEE.md`, o registro do desenvolvimento em `DESENVOLVIMENTO.md` e o ERD inicial em `ResumeERD.excalidraw` e `ResumeERD.png`.

## Ollama no Docker

O Compose inicia o Ollama como serviço separado e prepara `qwen2.5vl:7b` automaticamente no primeiro uso. Com o Docker instalado e `backend/.env.docker` configurado, execute na raiz do projeto:

```bash
docker compose --env-file backend/.env.docker up -d --build
```

O download inicial ocorre em segundo plano e ocupa cerca de 6 GB no volume `ollama-data`. As próximas inicializações reutilizam o modelo; `docker compose down -v` remove esse volume. O frontend e o backend não aguardam o download: cadastro e consulta manuais continuam disponíveis enquanto a IA é preparada. Para acompanhar, execute `docker compose --env-file backend/.env.docker logs -f ollama-setup` e consulte `GET http://localhost:3333/ollama/status`. `ready` indica que o runtime e o modelo estão presentes; não significa que a leitura de PDF já esteja implementada.

O backend usa `OLLAMA_BASE_URL=http://ollama:11434` e `OLLAMA_MODEL=qwen2.5vl:7b` no Compose. Para executar o backend fora do Docker, use `OLLAMA_BASE_URL=http://127.0.0.1:11434` com um Ollama local separado e `npm run ollama:check` no diretório `backend`. Como alternativa ao serviço do Compose, uma instalação local existente pode ser usada configurando `OLLAMA_BASE_URL=http://host.docker.internal:11434` no `backend/.env.docker`.

O modelo [qwen2.5vl:7b](https://ollama.com/library/qwen2.5vl:7b) ocupa aproximadamente 6 GB no disco; RAM/VRAM durante inferência depende do contexto e do sistema. A execução em containers no macOS não utiliza a GPU Apple como a instalação nativa e pode ser mais lenta. O endpoint de status informa versão do Ollama, digest e tamanho efetivo. O projeto não implementa ainda a leitura de PDF por IA.

O módulo de processamento fornece um contrato interno de extração para imagens, com `OLLAMA_CONTEXT` (padrão 4096), `OLLAMA_CONCURRENCY` (1) e `OLLAMA_TIMEOUT_MS` (120000). O provider usa o prompt versionado `ExtractResumeV1` e retorna nome, e-mail e telefone como sugestão, com identificação do modelo e revisão obrigatória. Não persiste candidatos. A validação verifica estrutura e formatos, mas não consegue comprovar que o texto foi lido corretamente: a pessoa deve conferir a sugestão com o documento. A conversão de PDFs em imagens e a exposição do fluxo de upload são etapas posteriores.

## Renderização de PDF

`POST /pdf/render` recebe um arquivo no campo `file` de `multipart/form-data`, com limite de **5 MiB (5.242.880 bytes)**. A resposta contém `pages` em ordem, com dimensões e cada imagem PNG em `imageBase64`. A operação valida o conteúdo e não salva o arquivo, as imagens ou candidatos. PDFs inválidos, corrompidos ou protegidos por senha retornam erro; arquivos acima do limite retornam 413. O contrato completo está no Swagger em `/docs/`.

As páginas são renderizadas sequencialmente; todas as imagens são reunidas em memória para a resposta, portanto documentos extensos ainda podem exigir bastante memória. `PDF_RENDER_SCALE` controla a resolução (padrão `1.5`, maior que zero e até `4`); `PDF_RENDER_MAX_PIXELS` limita os pixels de cada página (padrão 16 milhões), reduzindo a resolução de páginas maiores sem descartá-las. A conversão não depende do Ollama e não dispara extração ou cadastro.

`POST /scan` recebe o PDF no campo multipart `file` e devolve `fullName`, `email` e `phone` como sugestões, sem criar ou alterar candidatos. As páginas são processadas em ordem. Valores equivalentes após normalizar maiúsculas e espaços, ou formatação do telefone, são consolidados; quando há valores diferentes, o campo retorna `null` e seu nome aparece em `conflicts`. A resposta exige revisão (`requiresReview`); o cadastro ou a atualização devem ser confirmados separadamente pelo CRUD. Os erros HTTP e o formato completo estão no Swagger. A integração desse fluxo ao navegador está prevista em card próprio da Sprint 1.
