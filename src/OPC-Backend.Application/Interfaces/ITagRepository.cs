using OPC_Backend.Domain.Entities;

namespace OPC_Backend.Application.Interfaces;

public interface ITagRepository
{
    Task<IEnumerable<Tag>> GetAllActiveAsync(CancellationToken ct = default);
    Task<IEnumerable<Tag>> GetAllAsync(CancellationToken ct = default);
    Task<Tag?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Tag?> GetByNodeIdAsync(string nodeId, CancellationToken ct = default);
    Task<int> InsertAsync(Tag tag, CancellationToken ct = default);
    Task UpdateAsync(Tag tag, CancellationToken ct = default);
    Task SetActiveAsync(int id, bool isActive, CancellationToken ct = default);

    Task UpsertCurrentValueAsync(TagValue value, CancellationToken ct = default);
    Task<TagValue?> GetCurrentValueAsync(int tagId, CancellationToken ct = default);
    Task<IEnumerable<TagValue>> GetAllCurrentValuesAsync(CancellationToken ct = default);
}
