using Microsoft.AspNetCore.Mvc;
using OPC_Backend.OpcServer.Client;

namespace OPC_Backend.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DiscoveryController : ControllerBase
{
    private readonly OpcUaClientService? _clientService;

    public DiscoveryController(OpcUaClientService? clientService = null)
    {
        _clientService = clientService;
    }

    /// <summary>
    /// Spustí znovu discovery + sync tagů z připojeného vzdáleného serveru.
    /// </summary>
    [HttpPost("sync")]
    public async Task<IActionResult> Sync(CancellationToken ct)
    {
        if (_clientService is null)
            return StatusCode(503, "OPC Client není spuštěn.");

        await _clientService.DiscoverAndSyncTagsAsync(ct);
        return Ok(new { message = "Sync dokončen." });
    }

    /// <summary>
    /// Vrátí seznam veřejných testovacích OPC-UA serverů.
    /// </summary>
    [HttpGet("servers")]
    public IActionResult GetPublicServers()
    {
        return Ok(new[]
        {
            new { name = "Prosys OPC UA Simulation",  url = "opc.tcp://opcuaserver.com:48010"            },
            new { name = "Eclipse Milo Demo",          url = "opc.tcp://milo.digitalpetri.com:62541/milo" },
            new { name = "Unified Automation Demo",    url = "opc.tcp://demo.unified-automation.com:4840" },
        });
    }
}
