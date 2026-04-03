using OPC_Backend.Domain.Entities;

namespace OPC_Backend.Application.Interfaces;

public interface IHistoryRepository
{
    Task InsertAsync(HistoricalValue value, CancellationToken ct = default);
    Task InsertBatchAsync(IEnumerable<HistoricalValue> values, CancellationToken ct = default);

    Task<IEnumerable<HistoricalValue>> GetByTagIdAsync(
        int tagId,
        DateTime from,
        DateTime to,
        int maxCount = 1000,
        CancellationToken ct = default);
}
