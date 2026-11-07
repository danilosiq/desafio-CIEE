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
      Resume: resumeSchema,
      ResumeInput: resumeInputSchema,
      Message: messageSchema,
      ValidationError: validationErrorSchema,
      ConflictError: conflictErrorSchema,
    },
  },
} as const;
