BEGIN TRY
BEGIN TRAN;

IF EXISTS (
    SELECT [name] COLLATE Latin1_General_100_CI_AI
    FROM [dbo].[AreaOfExpertise]
    GROUP BY [name] COLLATE Latin1_General_100_CI_AI
    HAVING COUNT(*) > 1
)
    THROW 50003, N'Existem áreas com nomes equivalentes ignorando acentos. Resolva os conflitos antes de aplicar esta migration.', 1;

ALTER TABLE [dbo].[AreaOfExpertise] DROP CONSTRAINT [AreaOfExpertise_name_key];
ALTER TABLE [dbo].[AreaOfExpertise] DROP CONSTRAINT [AreaOfExpertise_name_trimmed_check];
ALTER TABLE [dbo].[AreaOfExpertise] ALTER COLUMN [name] NVARCHAR(200) COLLATE Latin1_General_100_CI_AI NOT NULL;
ALTER TABLE [dbo].[AreaOfExpertise] ADD CONSTRAINT [AreaOfExpertise_name_key] UNIQUE NONCLUSTERED ([name]);
ALTER TABLE [dbo].[AreaOfExpertise] ADD CONSTRAINT [AreaOfExpertise_name_trimmed_check]
CHECK (DATALENGTH([name]) = DATALENGTH(LTRIM(RTRIM([name]))));

COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    THROW;
END CATCH
