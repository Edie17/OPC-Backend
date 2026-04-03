using Microsoft.AspNetCore.Mvc;
using OPC_Backend.Application.Services;
using OPC_Backend.Domain.Entities;

namespace OPC_Backend.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TagsController : ControllerBase
{
    private readonly TagService _tagService;

    public TagsController(TagService tagService)
    {
        _tagService = tagService;
    }

    /// <summary>Vrátí seznam všech aktivních tagů.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var tags = await _tagService.GetAllActiveAsync(ct);
        return Ok(tags);
    }

    /// <summary>Vrátí jeden tag podle ID.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var tag = await _tagService.GetByIdAsync(id, ct);
        return tag is null ? NotFound() : Ok(tag);
    }

    /// <summary>Vytvoří nový tag a přidá ho do OPC adresního prostoru.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Tag tag, CancellationToken ct)
    {
        var newId = await _tagService.CreateAsync(tag, ct);
        return CreatedAtAction(nameof(GetById), new { id = newId }, new { id = newId });
    }

    /// <summary>Aktualizuje metadata tagu (DisplayName, DataType, Unit, ...).</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Tag tag, CancellationToken ct)
    {
        tag.Id = id;
        await _tagService.UpdateAsync(tag, ct);
        return NoContent();
    }

    /// <summary>Aktivuje nebo deaktivuje tag (soft delete).</summary>
    [HttpPatch("{id:int}/active")]
    public async Task<IActionResult> SetActive(int id, [FromQuery] bool value, CancellationToken ct)
    {
        await _tagService.SetActiveAsync(id, value, ct);
        return NoContent();
    }

    /// <summary>Vrátí aktuální hodnotu tagu.</summary>
    [HttpGet("{id:int}/value")]
    public async Task<IActionResult> GetCurrentValue(int id, CancellationToken ct)
    {
        var value = await _tagService.GetCurrentValueAsync(id, ct);
        return value is null ? NotFound() : Ok(value);
    }

    /// <summary>Vrátí aktuální hodnoty všech tagů (live snapshot).</summary>
    [HttpGet("values")]
    public async Task<IActionResult> GetAllCurrentValues(CancellationToken ct)
    {
        var values = await _tagService.GetAllCurrentValuesAsync(ct);
        return Ok(values);
    }
}
