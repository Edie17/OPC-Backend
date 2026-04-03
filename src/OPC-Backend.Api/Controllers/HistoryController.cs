using Microsoft.AspNetCore.Mvc;
using OPC_Backend.Application.Services;

namespace OPC_Backend.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HistoryController : ControllerBase
{
    private readonly HistoryService _historyService;

    public HistoryController(HistoryService historyService)
    {
        _historyService = historyService;
    }

    /// <summary>
    /// Vrátí historická data tagu v časovém rozsahu.
    /// </summary>
    /// <param name="tagId">ID tagu</param>
    /// <param name="from">Začátek rozsahu (UTC ISO 8601)</param>
    /// <param name="to">Konec rozsahu (UTC ISO 8601)</param>
    /// <param name="maxCount">Max počet záznamů (default 1000)</param>
    [HttpGet("{tagId:int}")]
    public async Task<IActionResult> GetByTagId(
        int tagId,
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        [FromQuery] int maxCount = 1000,
        CancellationToken ct = default)
    {
        if (from >= to)
            return BadRequest("'from' musí být dříve než 'to'.");

        var data = await _historyService.GetByTagIdAsync(tagId, from, to, maxCount, ct);
        return Ok(data);
    }

    /// <summary>
    /// Vrátí historická data podle OPC NodeId.
    /// </summary>
    [HttpGet("by-nodeid")]
    public async Task<IActionResult> GetByNodeId(
        [FromQuery] string nodeId,
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        [FromQuery] int maxCount = 1000,
        CancellationToken ct = default)
    {
        if (from >= to)
            return BadRequest("'from' musí být dříve než 'to'.");

        try
        {
            var data = await _historyService.GetByNodeIdAsync(nodeId, from, to, maxCount, ct);
            return Ok(data);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }
}
