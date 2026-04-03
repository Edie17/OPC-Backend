using Microsoft.AspNetCore.SignalR;

namespace OPC_Backend.Api.Hubs;

/// <summary>
/// SignalR hub pro real-time push OPC dat do React frontendu.
/// Endpoint: /hubs/opc-data
///
/// Klientské metody (volané ze serveru):
///   tagValueUpdated({ tagId, value, quality, timestamp })
/// </summary>
public class OpcDataHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
