# Diagrama de entidades e relacionamentos

O diagrama representa o schema Prisma do backend no SQL Server.

```mermaid
erDiagram
    AreaOfExpertise o|--o{ Resume : "área opcional"

    Resume {
        uuid id PK
        nvarchar fullName "obrigatório, até 200 caracteres"
        nvarchar email UK "obrigatório, até 320 caracteres"
        nvarchar phone "opcional, até 50 caracteres"
        nvarchar areaOfExpertise "texto livre opcional, até 200 caracteres"
        uuid areaOfExpertiseId FK "opcional"
        nvarchar professionalSummary "opcional"
        datetime2 createdAt
        datetime2 updatedAt
    }

    AreaOfExpertise {
        uuid id PK
        nvarchar name UK "obrigatório, até 200 caracteres"
        nvarchar description "obrigatório"
        datetime2 createdAt
        datetime2 updatedAt
    }

```

Uma área pode estar vinculada a nenhum ou vários currículos. Um currículo pode estar vinculado a nenhuma ou uma área; o campo de texto livre também é opcional. A exclusão de uma área referenciada é bloqueada pela chave estrangeira.
