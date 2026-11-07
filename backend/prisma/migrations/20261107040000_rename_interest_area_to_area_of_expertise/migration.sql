BEGIN TRY

BEGIN TRAN;

-- Rename preserves existing data and column type/nullability.
EXEC sp_rename N'[dbo].[Resume].[interestArea]', N'areaOfExpertise', 'COLUMN';

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
