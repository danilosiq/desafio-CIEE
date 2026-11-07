BEGIN TRY
BEGIN TRAN;

-- Do not delete or merge existing areas. Report incompatible data before changing the schema.
IF EXISTS (
    SELECT LTRIM(RTRIM([name])) COLLATE Latin1_General_100_CI_AS
    FROM [dbo].[AreaOfExpertise]
    GROUP BY LTRIM(RTRIM([name])) COLLATE Latin1_General_100_CI_AS
    HAVING COUNT(*) > 1
)
    THROW 50001, N'Existem áreas com nomes duplicados. Resolva os conflitos antes de aplicar esta migration.', 1;

IF EXISTS (
    SELECT 1 FROM [dbo].[AreaOfExpertise]
    WHERE DATALENGTH([name]) <> DATALENGTH(LTRIM(RTRIM([name])))
)
    THROW 50002, N'Existem nomes de áreas com espaços externos. Corrija-os antes de aplicar esta migration.', 1;

ALTER TABLE [dbo].[AreaOfExpertise]
ALTER COLUMN [name] NVARCHAR(200) COLLATE Latin1_General_100_CI_AS NOT NULL;

ALTER TABLE [dbo].[AreaOfExpertise]
ADD CONSTRAINT [AreaOfExpertise_name_key] UNIQUE NONCLUSTERED ([name]);

ALTER TABLE [dbo].[AreaOfExpertise]
ADD CONSTRAINT [AreaOfExpertise_name_trimmed_check]
CHECK (DATALENGTH([name]) = DATALENGTH(LTRIM(RTRIM([name]))));

COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    THROW;
END CATCH
