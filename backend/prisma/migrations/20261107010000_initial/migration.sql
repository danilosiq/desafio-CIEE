BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[Resume] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [fullName] NVARCHAR(200) NOT NULL,
    [email] NVARCHAR(320) COLLATE Latin1_General_100_BIN2 NOT NULL,
    [phone] NVARCHAR(50),
    [interestArea] NVARCHAR(200),
    [professionalSummary] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Resume_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Resume_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Resume_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[ResumeProcessingJob] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [status] NVARCHAR(10) NOT NULL CONSTRAINT [ResumeProcessingJob_status_df] DEFAULT 'Processing',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ResumeProcessingJob_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ResumeProcessingJob_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- SQL Server enforces the application status union and canonical email spelling.
ALTER TABLE [dbo].[ResumeProcessingJob] ADD CONSTRAINT [ResumeProcessingJob_status_check]
CHECK (([status] COLLATE Latin1_General_100_BIN2 = N'Processing' AND DATALENGTH([status]) = 20)
    OR ([status] COLLATE Latin1_General_100_BIN2 = N'Finished' AND DATALENGTH([status]) = 16));
ALTER TABLE [dbo].[Resume] ADD CONSTRAINT [Resume_email_normalized_check]
CHECK ([email] COLLATE Latin1_General_100_BIN2 = LOWER(LTRIM(RTRIM([email]))) COLLATE Latin1_General_100_BIN2
       AND DATALENGTH([email]) = DATALENGTH(LTRIM(RTRIM([email]))));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

