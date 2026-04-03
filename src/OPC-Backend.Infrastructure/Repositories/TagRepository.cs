using Dapper;
using Microsoft.Data.SqlClient;
using OPC_Backend.Application.Interfaces;
using OPC_Backend.Domain.Entities;
using OPC_Backend.Domain.Enums;

namespace OPC_Backend.Infrastructure.Repositories;

public class TagRepository : ITagRepository
{
    private readonly string _connectionString;

    public TagRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    private SqlConnection CreateConnection() => new(_connectionString);

    public async Task<IEnumerable<Tag>> GetAllActiveAsync(CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        var result = await conn.QueryAsync<TagRow>(
            "dbo.sp_GetTags",
            new { ActiveOnly = true },
            commandType: System.Data.CommandType.StoredProcedure);
        return result.Select(MapTag);
    }

    public async Task<IEnumerable<Tag>> GetAllAsync(CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        var result = await conn.QueryAsync<TagRow>(
            "dbo.sp_GetTags",
            new { ActiveOnly = false },
            commandType: System.Data.CommandType.StoredProcedure);
        return result.Select(MapTag);
    }

    public async Task<Tag?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        var row = await conn.QueryFirstOrDefaultAsync<TagRow>(
            "dbo.sp_GetTagById",
            new { Id = id },
            commandType: System.Data.CommandType.StoredProcedure);
        return row is null ? null : MapTag(row);
    }

    public async Task<Tag?> GetByNodeIdAsync(string nodeId, CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        var row = await conn.QueryFirstOrDefaultAsync<TagRow>(
            "dbo.sp_GetTagByNodeId",
            new { NodeId = nodeId },
            commandType: System.Data.CommandType.StoredProcedure);
        return row is null ? null : MapTag(row);
    }

    public async Task<int> InsertAsync(Tag tag, CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        var newId = await conn.ExecuteScalarAsync<int>(
            "dbo.sp_InsertTag",
            new
            {
                tag.NodeId,
                tag.DisplayName,
                DataType = (byte)tag.DataType,
                tag.Unit,
                tag.MinValue,
                tag.MaxValue
            },
            commandType: System.Data.CommandType.StoredProcedure);
        return newId;
    }

    public async Task UpdateAsync(Tag tag, CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        await conn.ExecuteAsync(
            "dbo.sp_UpdateTag",
            new
            {
                tag.Id,
                tag.DisplayName,
                DataType = (byte)tag.DataType,
                tag.Unit,
                tag.MinValue,
                tag.MaxValue
            },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task SetActiveAsync(int id, bool isActive, CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        await conn.ExecuteAsync(
            "dbo.sp_SetTagActive",
            new { Id = id, IsActive = isActive },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task UpsertCurrentValueAsync(TagValue value, CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        await conn.ExecuteAsync(
            "dbo.sp_UpsertCurrentValue",
            new
            {
                value.TagId,
                value.Value,
                Quality   = (byte)value.Quality,
                value.Timestamp
            },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<TagValue?> GetCurrentValueAsync(int tagId, CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        var row = await conn.QueryFirstOrDefaultAsync<CurrentValueRow>(
            "dbo.sp_GetCurrentValue",
            new { TagId = tagId },
            commandType: System.Data.CommandType.StoredProcedure);
        return row is null ? null : MapTagValue(row);
    }

    public async Task<IEnumerable<TagValue>> GetAllCurrentValuesAsync(CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        var result = await conn.QueryAsync<CurrentValueRow>(
            "dbo.sp_GetAllCurrentValues",
            commandType: System.Data.CommandType.StoredProcedure);
        return result.Select(MapTagValue);
    }

    // --------------- Private mapping ---------------

    private static Tag MapTag(TagRow r) => new()
    {
        Id          = r.Id,
        NodeId      = r.NodeId,
        DisplayName = r.DisplayName,
        DataType    = (OpcDataType)r.DataType,
        Unit        = r.Unit,
        MinValue    = r.MinValue,
        MaxValue    = r.MaxValue,
        IsActive    = r.IsActive,
        CreatedAt   = r.CreatedAt
    };

    private static TagValue MapTagValue(CurrentValueRow r) => new()
    {
        TagId     = r.TagId,
        Value     = r.Value,
        Quality   = (QualityCode)r.Quality,
        Timestamp = r.Timestamp
    };

    // Dapper vyžaduje plain typy bez nullable enums → proto interní row typy
    private sealed record TagRow(
        int Id, string NodeId, string DisplayName,
        byte DataType, string? Unit, double? MinValue, double? MaxValue,
        bool IsActive, DateTime CreatedAt);

    private sealed record CurrentValueRow(
        int TagId, string? Value, byte Quality, DateTime Timestamp);
}
