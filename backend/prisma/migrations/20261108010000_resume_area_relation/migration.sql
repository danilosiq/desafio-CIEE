ALTER TABLE [dbo].[Resume] ADD [areaOfExpertiseId] UNIQUEIDENTIFIER NULL;

EXEC(N'UPDATE r SET [areaOfExpertiseId] = a.[id]
FROM [dbo].[Resume] r
JOIN [dbo].[AreaOfExpertise] a ON r.[areaOfExpertise] COLLATE Latin1_General_100_CI_AI = a.[name]
WHERE r.[areaOfExpertise] IS NOT NULL');

ALTER TABLE [dbo].[Resume] ADD CONSTRAINT [Resume_areaOfExpertiseId_fkey]
FOREIGN KEY ([areaOfExpertiseId]) REFERENCES [dbo].[AreaOfExpertise]([id])
ON DELETE NO ACTION ON UPDATE NO ACTION;
