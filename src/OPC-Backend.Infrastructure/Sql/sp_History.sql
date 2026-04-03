CREATE OR ALTER PROCEDURE dbo.sp_InsertHistory
    @TagId     INT,
    @Value     NVARCHAR(500) = NULL,
    @Quality   TINYINT,
    @Timestamp DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO History (TagId, Value, Quality, Timestamp)
    VALUES (@TagId, @Value, @Quality, @Timestamp);
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetHistory
    @TagId    INT,
    @From     DATETIME2,
    @To       DATETIME2,
    @MaxCount INT = 1000
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@MaxCount) Id, TagId, Value, Quality, Timestamp
    FROM History
    WHERE TagId   = @TagId
      AND Timestamp >= @From
      AND Timestamp <= @To
    ORDER BY Timestamp ASC;
END
GO
