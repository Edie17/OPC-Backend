-- ============================================================
-- OPC-Backend: kompletní setup skript
-- Spusť jednou proti svému SQL Server instanci.
-- ============================================================

USE master;
GO

-- Vytvoř databázi pokud neexistuje
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'OpcBackend')
BEGIN
    CREATE DATABASE OpcBackend;
    PRINT 'Databáze OpcBackend vytvořena.';
END
ELSE
BEGIN
    PRINT 'Databáze OpcBackend již existuje, přeskakuji.';
END
GO

USE OpcBackend;
GO

-- ============================================================
-- Tabulky
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Tags')
BEGIN
    CREATE TABLE Tags (
        Id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tags PRIMARY KEY,
        NodeId      NVARCHAR(200)     NOT NULL CONSTRAINT UQ_Tags_NodeId UNIQUE,
        DisplayName NVARCHAR(200)     NOT NULL,
        DataType    TINYINT           NOT NULL,
        Unit        NVARCHAR(50)      NULL,
        MinValue    FLOAT             NULL,
        MaxValue    FLOAT             NULL,
        IsActive    BIT               NOT NULL CONSTRAINT DF_Tags_IsActive DEFAULT (1),
        CreatedAt   DATETIME2         NOT NULL CONSTRAINT DF_Tags_CreatedAt DEFAULT (SYSUTCDATETIME())
    );
    PRINT 'Tabulka Tags vytvořena.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CurrentValues')
BEGIN
    CREATE TABLE CurrentValues (
        TagId       INT           NOT NULL CONSTRAINT PK_CurrentValues PRIMARY KEY,
        Value       NVARCHAR(500) NULL,
        Quality     TINYINT       NOT NULL,
        Timestamp   DATETIME2     NOT NULL,
        CONSTRAINT FK_CurrentValues_Tags FOREIGN KEY (TagId) REFERENCES Tags(Id)
    );
    PRINT 'Tabulka CurrentValues vytvořena.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'History')
BEGIN
    CREATE TABLE History (
        Id          BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_History PRIMARY KEY,
        TagId       INT           NOT NULL,
        Value       NVARCHAR(500) NULL,
        Quality     TINYINT       NOT NULL,
        Timestamp   DATETIME2     NOT NULL,
        CONSTRAINT FK_History_Tags FOREIGN KEY (TagId) REFERENCES Tags(Id)
    );

    CREATE NONCLUSTERED INDEX IX_History_TagId_Timestamp
        ON History (TagId ASC, Timestamp DESC)
        INCLUDE (Value, Quality);

    PRINT 'Tabulka History vytvořena.';
END
GO

-- ============================================================
-- Stored Procedures – Tags
-- ============================================================

CREATE OR ALTER PROCEDURE dbo.sp_GetTags
    @ActiveOnly BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, NodeId, DisplayName, DataType, Unit, MinValue, MaxValue, IsActive, CreatedAt
    FROM Tags
    WHERE @ActiveOnly = 0 OR IsActive = 1
    ORDER BY DisplayName;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetTagById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 Id, NodeId, DisplayName, DataType, Unit, MinValue, MaxValue, IsActive, CreatedAt
    FROM Tags
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetTagByNodeId
    @NodeId NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 Id, NodeId, DisplayName, DataType, Unit, MinValue, MaxValue, IsActive, CreatedAt
    FROM Tags
    WHERE NodeId = @NodeId;
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
    SELECT CAST(SCOPE_IDENTITY() AS INT);
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

-- ============================================================
-- Stored Procedures – CurrentValues
-- ============================================================

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

-- ============================================================
-- Stored Procedures – History
-- ============================================================

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
    WHERE TagId     = @TagId
      AND Timestamp >= @From
      AND Timestamp <= @To
    ORDER BY Timestamp ASC;
END
GO

-- ============================================================
-- Testovací data (volitelné – odkomentuj pokud chceš)
-- ============================================================

/*
INSERT INTO Tags (NodeId, DisplayName, DataType, Unit, MinValue, MaxValue) VALUES
    ('ns=2;s=Tank1.Level',       'Tank 1 – Hladina',    10, '%',  0.0, 100.0),  -- Double
    ('ns=2;s=Tank1.Temperature', 'Tank 1 – Teplota',    10, '°C', 0.0, 150.0),  -- Double
    ('ns=2;s=Pump1.Running',     'Čerpadlo 1 – Běží',    0, NULL, NULL, NULL),  -- Boolean
    ('ns=2;s=Pump1.Speed',       'Čerpadlo 1 – Otáčky',  5, 'rpm',0.0, 3000.0); -- Int32
*/

PRINT 'Setup dokončen.';
GO
