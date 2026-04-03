using Dapper;
using Microsoft.Data.SqlClient;
using OPC_Backend.Application.Interfaces;
using OPC_Backend.Domain.Entities;
using OPC_Backend.Domain.Enums;

namespace OPC_Backend.Infrastructure.Repositories;

public class HistoryRepository : IHistoryRepository
{
    private readonly string _connectionString;

    public HistoryRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    private SqlConnection CreateConnection() => new(_connectionString);

    public async Task InsertAsync(HistoricalValue value, CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        await conn.ExecuteAsync(
            "dbo.sp_InsertHistory",
            new
            {
                value.TagId,
                value.Value,
                Quality   = (byte)value.Quality,
                value.Timestamp
            },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task InsertBatchAsync(IEnumerable<HistoricalValue> values, CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync(ct);
        await using var tx = await conn.BeginTransactionAsync(ct);
        try
        {
            foreach (var v in values)
            {
                await conn.ExecuteAsync(
                    "dbo.sp_InsertHistory",
                    new
                    {
                        v.TagId,
                        v.Value,
                        Quality   = (byte)v.Quality,
                        v.Timestamp
                    },
                    transaction: (SqlTransaction)tx,
                    commandType: System.Data.CommandType.StoredProcedure);
            }
            await tx.CommitAsync(ct);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<IEnumerable<HistoricalValue>> GetByTagIdAsync(
        int tagId,
        DateTime from,
        DateTime to,
        int maxCount = 1000,
        CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        var rows = await conn.QueryAsync<HistoryRow>(
            "dbo.sp_GetHistory",
            new { TagId = tagId, From = from, To = to, MaxCount = maxCount },
            commandType: System.Data.CommandType.StoredProcedure);

        return rows.Select(r => new HistoricalValue
        {
            Id        = r.Id,
            TagId     = r.TagId,
            Value     = r.Value,
            Quality   = (QualityCode)r.Quality,
            Timestamp = r.Timestamp
        });
    }

    private sealed record HistoryRow(
        long Id, int TagId, string? Value, byte Quality, DateTime Timestamp);
}
