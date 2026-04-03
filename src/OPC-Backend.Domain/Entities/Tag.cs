using OPC_Backend.Domain.Enums;

namespace OPC_Backend.Domain.Entities;

/// <summary>
/// Konfigurace jednoho OPC-UA uzlu (proměnné).
/// NodeId odpovídá OPC-UA adresnímu prostoru: "ns=2;s=Tank1.Level"
/// </summary>
public class Tag
{
    public int Id { get; set; }

    /// <summary>OPC-UA NodeId ve string formátu, např. "ns=2;s=Tank1.Level"</summary>
    public string NodeId { get; set; } = default!;

    public string DisplayName { get; set; } = default!;

    public OpcDataType DataType { get; set; }

    public string? Unit { get; set; }

    public double? MinValue { get; set; }

    public double? MaxValue { get; set; }

    /// <summary>Neaktivní tagy jsou stále v DB, ale nevystavují se v OPC adresním prostoru.</summary>
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }
}
