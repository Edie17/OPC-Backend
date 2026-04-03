using OPC_Backend.Application.Interfaces;
using OPC_Backend.Domain.Entities;

namespace OPC_Backend.Application.Services;

public class TagService
{
    private readonly ITagRepository _tagRepo;
    private readonly IHistoryRepository _historyRepo;
    private readonly IOpcAddressSpace _addressSpace;
    private readonly ITagNotificationService _notifications;

    public TagService(
        ITagRepository tagRepo,
        IHistoryRepository historyRepo,
        IOpcAddressSpace addressSpace,
        ITagNotificationService notifications)
    {
        _tagRepo       = tagRepo;
        _historyRepo   = historyRepo;
        _addressSpace  = addressSpace;
        _notifications = notifications;
    }

    public Task<IEnumerable<Tag>> GetAllActiveAsync(CancellationToken ct = default)
        => _tagRepo.GetAllActiveAsync(ct);

    public Task<IEnumerable<Tag>> GetAllAsync(CancellationToken ct = default)
        => _tagRepo.GetAllAsync(ct);

    public Task<Tag?> GetByIdAsync(int id, CancellationToken ct = default)
        => _tagRepo.GetByIdAsync(id, ct);

    public async Task<int> CreateAsync(Tag tag, CancellationToken ct = default)
    {
        int newId = await _tagRepo.InsertAsync(tag, ct);
        tag.Id = newId;
        _addressSpace.AddNode(tag);
        return newId;
    }

    public async Task UpdateAsync(Tag tag, CancellationToken ct = default)
    {
        await _tagRepo.UpdateAsync(tag, ct);
    }

    public async Task SetActiveAsync(int id, bool isActive, CancellationToken ct = default)
    {
        await _tagRepo.SetActiveAsync(id, isActive, ct);
        var tag = await _tagRepo.GetByIdAsync(id, ct);
        if (tag is null) return;

        if (isActive)
            _addressSpace.AddNode(tag);
        else
            _addressSpace.RemoveNode(tag.NodeId);
    }

    /// <summary>
    /// Voláno z OPC-UA NodeManageru při Write operaci od klienta,
    /// nebo z externího datového zdroje (polling, MQTT, ...).
    /// Uloží aktuální hodnotu i historii.
    /// </summary>
    public async Task WriteValueAsync(TagValue value, CancellationToken ct = default)
    {
        await _tagRepo.UpsertCurrentValueAsync(value, ct);
        await _historyRepo.InsertAsync(new HistoricalValue
        {
            TagId     = value.TagId,
            Value     = value.Value,
            Quality   = value.Quality,
            Timestamp = value.Timestamp
        }, ct);

        _addressSpace.UpdateNodeValue(value);
        await _notifications.NotifyTagValueUpdatedAsync(value, ct);
    }

    public Task<TagValue?> GetCurrentValueAsync(int tagId, CancellationToken ct = default)
        => _tagRepo.GetCurrentValueAsync(tagId, ct);

    public Task<IEnumerable<TagValue>> GetAllCurrentValuesAsync(CancellationToken ct = default)
        => _tagRepo.GetAllCurrentValuesAsync(ct);
}
