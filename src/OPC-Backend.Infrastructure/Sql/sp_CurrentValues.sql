CREATE OR ALTER PROCEDURE dbo.sp_UpsertCurrentValue
    @TagId     INT,
    @Value     NVARCHAR(500) = NULL,
    @Quality   TINYINT,
    @Timestamp DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    MERGE CurrentValues AS target
    USING (SELECT @TagId AS TagId) AS source ON target.TagId = source.TagId
    WHEN MATCHED THEN
        UPDATE SET Value = @Value, Quality = @Quality, Timestamp = @Timestamp
    WHEN NOT MATCHED THEN
        INSERT (TagId, Value, Quality, Timestamp)
        VALUES (@TagId, @Value, @Quality, @Timestamp);
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetCurrentValue
    @TagId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TagId, Value, Quality, Timestamp
    FROM CurrentValues
    WHERE TagId = @TagId;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetAllCurrentValues
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TagId, Value, Quality, Timestamp
    FROM CurrentValues;
END
GO
