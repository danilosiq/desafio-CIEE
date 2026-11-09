-- Preserve existing records: remove the unused table only when it is empty.
IF EXISTS (SELECT 1 FROM [dbo].[ResumeProcessingJob])
    THROW 50001, 'ResumeProcessingJob contains data; back it up and remove it explicitly before applying this migration.', 1;

DROP TABLE [dbo].[ResumeProcessingJob];
