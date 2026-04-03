using OPC_Backend.Application.Interfaces;
using OPC_Backend.Domain.Entities;

namespace OPC_Backend.Application.Services;

public class HistoryService
{
    private readonly IHistoryRepository _historyRepo;
    private readonly ITagRepository _tagRepo;

    public HistoryService(IHistoryRepository historyRepo, ITagRepository tagRepo)
    {
        _historyRepo = historyRepo;
        _tagRepo = tagRepo;
    }

    public Task<IEnumerable<HistoricalValue>> GetByTagIdAsync(
        int tagId,
        DateTime from,
        DateTime to,
        int maxCount = 1000,
        CancellationToken ct = default)
        => _historyRepo.GetByTagIdAsync(tagId, from, to, maxCount, ct);

    public async Task<IEnumerable<HistoricalValue>> GetByNodeIdAsync(
        string nodeId,
        DateTime from,
        DateTime to,
        int maxCount = 1000,
        CancellationToken ct = default)
    {
        var tag = await _tagRepo.GetByNodeIdAsync(nodeId, ct)
            ?? throw new KeyNotFoundException($"Tag s NodeId '{nodeId}' neexistuje.");

        return await _historyRepo.GetByTagIdAsync(tag.Id, from, to, maxCount, ct);
    }
}
