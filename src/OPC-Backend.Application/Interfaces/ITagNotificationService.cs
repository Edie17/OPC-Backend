using OPC_Backend.Domain.Entities;

namespace OPC_Backend.Application.Interfaces;

/// <summary>
/// Abstrakce nad real-time notifikacemi (SignalR).
/// Umožňuje Application vrstvě posílat push notifikace bez závislosti na ASP.NET Core.
/// </summary>
public interface ITagNotificationService
{
    Task NotifyTagValueUpdatedAsync(TagValue value, CancellationToken ct = default);
}
