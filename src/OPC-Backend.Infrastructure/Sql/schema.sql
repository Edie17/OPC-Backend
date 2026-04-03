-- ============================================================
-- OPC-Backend databázové schéma
-- ============================================================

-- Tabulka konfigurace OPC-UA uzlů
CREATE TABLE Tags (
    Id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tags PRIMARY KEY,
    NodeId      NVARCHAR(200)     NOT NULL CONSTRAINT UQ_Tags_NodeId UNIQUE,
    DisplayName NVARCHAR(200)     NOT NULL,
    DataType    TINYINT           NOT NULL,   -- enum OpcDataType
    Unit        NVARCHAR(50)      NULL,
    MinValue    FLOAT             NULL,
    MaxValue    FLOAT             NULL,
    IsActive    BIT               NOT NULL CONSTRAINT DF_Tags_IsActive DEFAULT (1),
    CreatedAt   DATETIME2         NOT NULL CONSTRAINT DF_Tags_CreatedAt DEFAULT (SYSUTCDATETIME())
);

-- Aktuální hodnoty tagů (live data, upsert pattern)
CREATE TABLE CurrentValues (
    TagId       INT           NOT NULL CONSTRAINT PK_CurrentValues PRIMARY KEY,
    Value       NVARCHAR(500) NULL,
    Quality     TINYINT       NOT NULL,       -- enum QualityCode: 0=Good,1=Bad,2=Uncertain
    Timestamp   DATETIME2     NOT NULL,
    CONSTRAINT FK_CurrentValues_Tags FOREIGN KEY (TagId) REFERENCES Tags(Id)
);

-- Historická data (time-series)
CREATE TABLE History (
    Id          BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_History PRIMARY KEY,
    TagId       INT           NOT NULL,
    Value       NVARCHAR(500) NULL,
    Quality     TINYINT       NOT NULL,
    Timestamp   DATETIME2     NOT NULL,
    CONSTRAINT FK_History_Tags FOREIGN KEY (TagId) REFERENCES Tags(Id)
);

-- Index pro rychlé dotazy na historii: TagId + čas sestupně
CREATE NONCLUSTERED INDEX IX_History_TagId_Timestamp
    ON History (TagId ASC, Timestamp DESC)
    INCLUDE (Value, Quality);

GO
