using Microsoft.AspNetCore.SignalR;
using OPC_Backend.Application.Interfaces;
using OPC_Backend.Api.Hubs;
using OPC_Backend.Domain.Entities;

namespace OPC_Backend.Api.Services;

public class SignalRTagNotificationService : ITagNotificationService
{
    private readonly IHubContext<OpcDataHub> _hub;

    public SignalRTagNotificationService(IHubContext<OpcDataHub> hub)
    {
        _hub = hub;
    }

    public Task NotifyTagValueUpdatedAsync(TagValue value, CancellationToken ct = default)
        => _hub.Clients.All.SendAsync("tagValueUpdated", new
        {
            tagId     = value.TagId,
            value     = value.Value,
            quality   = (byte)value.Quality,
            timestamp = value.Timestamp
        }, ct);
}
