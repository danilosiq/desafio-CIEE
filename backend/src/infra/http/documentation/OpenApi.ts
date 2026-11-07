export const openApi = {
    "openapi": "3.0.3",
    "info": {
        "title": "Desafio CIEE API",
        "version": "0.1.0"
    },
    "paths": {
        "/resumes": {
            "get": {
                "summary": "Lista currículos com paginação de até 30 registros.",
                "description": "Ordenação por createdAt decrescente e id crescente como desempate. Página sem registros retorna items vazio; sem registros, totalPages é 0. O deslocamento não pode ultrapassar 2147483647.",
                "parameters": [
                    {
                        "name": "page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "minimum": 1,
                            "maximum": 2147483648,
                            "default": 1
                        },
                        "example": 1
                    },
                    {
                        "name": "limit",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "minimum": 1,
                            "maximum": 30,
                            "default": 30
                        },
                        "example": 30
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Página de currículos.",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "required": [
                                        "items",
                                        "page",
                                        "limit",
                                        "total",
                                        "totalPages"
                                    ],
                                    "properties": {
                                        "items": {
                                            "type": "array",
                                            "maxItems": 30,
                                            "items": {
                                                "$ref": "#/components/schemas/Resume"
                                            }
                                        },
                                        "page": {
                                            "type": "integer",
                                            "minimum": 1
                                        },
                                        "limit": {
                                            "type": "integer",
                                            "minimum": 1,
                                            "maximum": 30
                                        },
                                        "total": {
                                            "type": "integer",
                                            "minimum": 0
                                        },
                                        "totalPages": {
                                            "type": "integer",
                                            "minimum": 0
                                        }
                                    }
                                },
                                "example": {
                                    "items": [],
                                    "page": 1,
                                    "limit": 30,
                                    "total": 0,
                                    "totalPages": 0
                                }
                            }
                        }
                    },
                    "400": {
                        "description": "page ou limit inválido, limit maior que 30 ou deslocamento fora do intervalo suportado.",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "required": [
                                        "message"
                                    ],
                                    "properties": {
                                        "message": {
                                            "type": "string"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "500": {
                        "description": "Falha interna ao consultar currículos.",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "required": [
                                        "message"
                                    ],
                                    "properties": {
                                        "message": {
                                            "type": "string"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/openapi.json": {
            "get": {
                "summary": "Especificação OpenAPI.",
                "responses": {
                    "200": {
                        "description": "Documento OpenAPI JSON.",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/docs": {
            "get": {
                "summary": "Redireciona para Swagger UI.",
                "responses": {
                    "302": {
                        "description": "Redirecionamento para /docs/."
                    }
                }
            }
        },
        "/docs/": {
            "get": {
                "summary": "Swagger UI.",
                "responses": {
                    "200": {
                        "description": "Documentação interativa.",
                        "content": {
                            "text/html": {
                                "schema": {
                                    "type": "string"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/docs/{asset}": {
            "get": {
                "summary": "Arquivos estáticos do Swagger UI.",
                "parameters": [
                    {
                        "name": "asset",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string"
                        },
                        "example": "swagger-ui.css"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "CSS, JavaScript ou imagem da documentação."
                    },
                    "404": {
                        "description": "Arquivo não encontrado."
                    }
                }
            }
        }
    },
    "components": {
        "schemas": {
            "Resume": {
                "type": "object",
                "required": [
                    "id",
                    "fullName",
                    "email",
                    "phone",
                    "interestArea",
                    "professionalSummary",
                    "createdAt",
                    "updatedAt"
                ],
                "properties": {
                    "id": {
                        "type": "string",
                        "format": "uuid"
                    },
                    "fullName": {
                        "type": "string",
                        "example": "Pessoa Fictícia"
                    },
                    "email": {
                        "type": "string",
                        "format": "email",
                        "example": "pessoa@example.com"
                    },
                    "phone": {
                        "type": "string",
                        "nullable": true
                    },
                    "interestArea": {
                        "type": "string",
                        "nullable": true
                    },
                    "professionalSummary": {
                        "type": "string",
                        "nullable": true
                    },
                    "createdAt": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "updatedAt": {
                        "type": "string",
                        "format": "date-time"
                    }
                }
            }
        }
    }
};
