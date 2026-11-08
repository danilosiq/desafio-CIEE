const resumeSchema = {
  type: "object",
  required: ["id", "fullName", "email", "phone", "areaOfExpertise", "professionalSummary", "createdAt", "updatedAt"],
  properties: {
    id: { type: "string", format: "uuid" },
    fullName: { type: "string", example: "Pessoa Fictícia" },
    email: { type: "string", format: "email", example: "pessoa@example.com" },
    phone: { type: "string", nullable: true },
    areaOfExpertise: { type: "string", nullable: true },
    professionalSummary: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const resumeInputSchema = {
  type: "object",
  required: ["fullName", "email"],
  properties: {
    fullName: { type: "string", example: "Pessoa Fictícia" },
    email: { type: "string", format: "email", example: "pessoa@example.com" },
    phone: { type: "string", nullable: true },
    areaOfExpertise: { type: "string", nullable: true },
    professionalSummary: { type: "string", nullable: true },
  },
  additionalProperties: true,
};

const messageSchema = {
  type: "object",
  required: ["message"],
  properties: {
    code: { type: "string" },
    message: { type: "string" },
  },
};

const validationErrorSchema = {
  type: "object",
  required: ["message"],
  properties: {
    code: { type: "string", example: "VALIDATION_ERROR" },
    message: { type: "string" },
    details: { type: "object", additionalProperties: { type: "string" } },
    errors: { type: "object", additionalProperties: { type: "string" } },
  },
};

const conflictErrorSchema = {
  type: "object",
  required: ["message", "existingId"],
  properties: {
    code: { type: "string", example: "DUPLICATE_EMAIL" },
    message: { type: "string", example: "Este e-mail já possui um cadastro." },
    existingId: { type: "string", format: "uuid" },
  },
};

export const openApi = {
  openapi: "3.0.3",
  info: { title: "Desafio CIEE API", version: "0.1.0" },
  paths: {
    "/areas-of-expertise": {
      get: { summary: "Lista áreas de atuação.", responses: { "200": { description: "Áreas cadastradas." } } },
      post: { summary: "Cadastra uma área de atuação.", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/AreaInput" } } } }, responses: { "201": { description: "Área criada." }, "400": { description: "Dados inválidos." }, "409": { description: "Nome já cadastrado." } } },
    },
    "/areas-of-expertise/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      get: { summary: "Consulta uma área.", responses: { "200": { description: "Área encontrada." }, "404": { description: "Área não encontrada." } } },
      put: { summary: "Atualiza uma área.", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/AreaInput" } } } }, responses: { "200": { description: "Área atualizada." }, "400": { description: "Dados inválidos." }, "404": { description: "Área não encontrada." }, "409": { description: "Nome já cadastrado." } } },
      delete: { summary: "Exclui uma área.", responses: { "204": { description: "Área excluída." }, "404": { description: "Área não encontrada." } } },
    },
    "/resumes": {
      get: {
        summary: "Lista currículos com paginação de até 30 registros.",
        description:
          "Ordenação por createdAt decrescente e id crescente como desempate. Página sem registros retorna items vazio; sem registros, totalPages é 0. O deslocamento não pode ultrapassar 2147483647.",
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 2147483648, default: 1 }, example: 1 },
          { name: "limit", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 30, default: 30 }, example: 30 },
        ],
        responses: {
          "200": {
            description: "Página de currículos.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["items", "page", "limit", "total", "totalPages"],
                  properties: {
                    items: { type: "array", maxItems: 30, items: { $ref: "#/components/schemas/Resume" } },
                    page: { type: "integer", minimum: 1 },
                    limit: { type: "integer", minimum: 1, maximum: 30 },
                    total: { type: "integer", minimum: 0 },
                    totalPages: { type: "integer", minimum: 0 },
                  },
                },
                example: { items: [], page: 1, limit: 30, total: 0, totalPages: 0 },
              },
            },
          },
          "400": { description: "page ou limit inválido, limit maior que 30 ou deslocamento fora do intervalo suportado.", content: { "application/json": { schema: messageSchema } } },
          "500": { description: "Falha interna ao consultar currículos.", content: { "application/json": { schema: messageSchema } } },
        },
      },
      post: {
        summary: "Cadastra um candidato manualmente.",
        description: "Não exige arquivo/PDF. O e-mail é normalizado (trim/lowercase) e deve ser único entre candidatos.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ResumeInput" } } },
        },
        responses: {
          "201": { description: "Candidato cadastrado.", content: { "application/json": { schema: { $ref: "#/components/schemas/Resume" } } } },
          "400": { description: "Dados inválidos (nome vazio, e-mail ausente/inválido ou formato incorreto).", content: { "application/json": { schema: validationErrorSchema } } },
          "409": { description: "E-mail já cadastrado. A resposta inclui existingId para o frontend localizar o cadastro existente.", content: { "application/json": { schema: conflictErrorSchema } } },
          "500": { description: "Falha interna ao processar a solicitação.", content: { "application/json": { schema: messageSchema } } },
        },
      },
    },
    "/resumes/{id}": {
      get: {
        summary: "Consulta detalhes de um candidato.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Dados do candidato.", content: { "application/json": { schema: { $ref: "#/components/schemas/Resume" } } } },
          "404": { description: "Cadastro não encontrado.", content: { "application/json": { schema: messageSchema } } },
          "500": { description: "Falha interna ao processar a solicitação.", content: { "application/json": { schema: messageSchema } } },
        },
      },
      put: {
        summary: "Atualiza explicitamente os dados de um candidato.",
        description: "Conflito de e-mail com outro candidato retorna 409 com existingId e não sobrescreve o outro cadastro.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ResumeInput" } } },
        },
        responses: {
          "200": { description: "Candidato atualizado.", content: { "application/json": { schema: { $ref: "#/components/schemas/Resume" } } } },
          "400": { description: "Dados inválidos.", content: { "application/json": { schema: validationErrorSchema } } },
          "404": { description: "Cadastro não encontrado.", content: { "application/json": { schema: messageSchema } } },
          "409": { description: "E-mail já cadastrado por outro candidato. Inclui existingId.", content: { "application/json": { schema: conflictErrorSchema } } },
          "500": { description: "Falha interna ao processar a solicitação.", content: { "application/json": { schema: messageSchema } } },
        },
      },
      delete: {
        summary: "Exclui um candidato.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "204": { description: "Candidato excluído." },
          "404": { description: "Cadastro não encontrado.", content: { "application/json": { schema: messageSchema } } },
          "500": { description: "Falha interna ao processar a solicitação.", content: { "application/json": { schema: messageSchema } } },
        },
      },
    },
    "/scan": { post: {
      summary: "Extrai sugestões de nome, e-mail e telefone de um PDF sem persistir candidatos.",
      description: "Processa todas as páginas em ordem. Campos conflitantes entre páginas retornam null e são listados em conflicts; sugestões exigem revisão. A leitura não cria nem atualiza registros.",
      requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", required: ["file"], properties: { file: { type: "string", format: "binary", description: "PDF até 5 MiB." } } } } } },
      responses: {
        "200": { description: "Sugestões para revisão e campos conflitantes.", content: { "application/json": { schema: { type: "object", required: ["fullName", "email", "phone", "conflicts", "requiresReview", "model", "promptVersion"], properties: { fullName: { type: "string", nullable: true }, email: { type: "string", nullable: true }, phone: { type: "string", nullable: true }, conflicts: { type: "array", items: { type: "string", enum: ["fullName", "email", "phone"] } }, requiresReview: { type: "boolean", enum: [true] }, model: { type: "string" }, promptVersion: { type: "string" } } } } } },
        "400": { description: "Arquivo ausente, inválido, corrompido ou protegido por senha." }, "413": { description: "PDF acima de 5 MiB." }, "415": { description: "A requisição deve ser multipart/form-data." }, "422": { description: "Falha de renderização." }, "502": { description: "Resposta inválida do modelo." }, "503": { description: "Inferência indisponível ou ocupada." }, "504": { description: "Tempo limite de inferência excedido." }
      }
    } },
    "/pdf/render": { post: {
      summary: "Renderiza todas as páginas de um PDF em imagens PNG, sem persistência.",
      requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", required: ["file"], properties: { file: { type: "string", format: "binary", description: "PDF de até 5 MiB (5.242.880 bytes)." } } } } } },
      responses: { "200": { description: "Páginas em ordem, codificadas em base64.", content: { "application/json": { schema: { type: "object", required: ["pages"], properties: { pages: { type: "array", items: { type: "object", required: ["page", "width", "height", "mimeType", "imageBase64"], properties: { page: { type: "integer" }, width: { type: "integer" }, height: { type: "integer" }, mimeType: { type: "string", example: "image/png" }, imageBase64: { type: "string", format: "byte" } } } } } } } } }, "400": { description: "Arquivo inválido, ausente, corrompido ou protegido por senha." }, "413": { description: "Arquivo excede 5 MiB." }, "415": { description: "Tipo de requisição inválido." }, "422": { description: "Não foi possível renderizar todas as páginas." } }
    } },
    "/ollama/status": { get: { summary: "Verifica o runtime Ollama e o modelo local configurado.", responses: { "200": { description: "Modelo disponível; inclui versão, digest e tamanho." }, "503": { description: "Runtime indisponível, modelo ausente ou configuração inválida." } } } },
    "/openapi.json": {
      get: {
        summary: "Especificação OpenAPI.",
        responses: { "200": { description: "Documento OpenAPI JSON.", content: { "application/json": { schema: { type: "object" } } } } },
      },
    },
    "/docs": { get: { summary: "Redireciona para Swagger UI.", responses: { "302": { description: "Redirecionamento para /docs/." } } } },
    "/docs/": { get: { summary: "Swagger UI.", responses: { "200": { description: "Documentação interativa.", content: { "text/html": { schema: { type: "string" } } } } } } },
    "/docs/{asset}": {
      get: {
        summary: "Arquivos estáticos do Swagger UI.",
        parameters: [{ name: "asset", in: "path", required: true, schema: { type: "string" }, example: "swagger-ui.css" }],
        responses: { "200": { description: "CSS, JavaScript ou imagem da documentação." }, "404": { description: "Arquivo não encontrado." } },
      },
    },
  },
  components: {
    schemas: {
      AreaInput: { type: "object", required: ["name", "description"], properties: { name: { type: "string", maxLength: 200 }, description: { type: "string" } } },
      Resume: resumeSchema,
      ResumeInput: resumeInputSchema,
      Message: messageSchema,
      ValidationError: validationErrorSchema,
      ConflictError: conflictErrorSchema,
    },
  },
} as const;
