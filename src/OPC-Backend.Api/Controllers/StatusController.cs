using Microsoft.AspNetCore.Mvc;
using OPC_Backend.Application.Services;
using OPC_Backend.OpcServer;

namespace OPC_Backend.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatusController : ControllerBase
{
    private readonly TagService _tagService;
    private readonly OpcNodeManagerRegistry _registry;

    public StatusController(TagService tagService, OpcNodeManagerRegistry registry)
    {
        _tagService = tagService;
        _registry   = registry;
    }

    /// <summary>Stav backendu — OPC server, DB, počty tagů.</summary>
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var tags = await _tagService.GetAllActiveAsync(ct);
        var tagList = tags.ToList();

        return Ok(new
        {
            timestamp      = DateTime.UtcNow,
            opcServer      = new
            {
                endpoint   = "opc.tcp://localhost:4840/opcbackend",
                nodeManager= _registry is not null ? "registered" : "not registered",
            },
            database       = new { status = "ok", activeTags = tagList.Count },
            signalR        = new { hub = "/hubs/opc-data", status = "running" },
        });
    }
}
