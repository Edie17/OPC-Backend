CREATE OR ALTER PROCEDURE dbo.sp_GetTags
    @ActiveOnly BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        Id, NodeId, DisplayName, DataType,
        Unit, MinValue, MaxValue, IsActive, CreatedAt
    FROM Tags
    WHERE @ActiveOnly = 0 OR IsActive = 1
    ORDER BY DisplayName;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetTagByNodeId
    @NodeId NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        Id, NodeId, DisplayName, DataType,
        Unit, MinValue, MaxValue, IsActive, CreatedAt
    FROM Tags
    WHERE NodeId = @NodeId;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetTagById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        Id, NodeId, DisplayName, DataType,
        Unit, MinValue, MaxValue, IsActive, CreatedAt
    FROM Tags
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_InsertTag
    @NodeId      NVARCHAR(200),
    @DisplayName NVARCHAR(200),
    @DataType    TINYINT,
    @Unit        NVARCHAR(50)  = NULL,
    @MinValue    FLOAT         = NULL,
    @MaxValue    FLOAT         = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Tags (NodeId, DisplayName, DataType, Unit, MinValue, MaxValue)
    VALUES (@NodeId, @DisplayName, @DataType, @Unit, @MinValue, @MaxValue);

    SELECT SCOPE_IDENTITY();
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_UpdateTag
    @Id          INT,
    @DisplayName NVARCHAR(200),
    @DataType    TINYINT,
    @Unit        NVARCHAR(50)  = NULL,
    @MinValue    FLOAT         = NULL,
    @MaxValue    FLOAT         = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Tags
    SET DisplayName = @DisplayName,
        DataType    = @DataType,
        Unit        = @Unit,
        MinValue    = @MinValue,
        MaxValue    = @MaxValue
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_SetTagActive
    @Id       INT,
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Tags SET IsActive = @IsActive WHERE Id = @Id;
END
GO
