using OPC_Backend.Domain.Enums;

namespace OPC_Backend.Domain.Entities;

/// <summary>
/// Aktuální hodnota tagu – ukládána do tabulky CurrentValues (upsert).
/// Value je string aby pokryl všechny datové typy bez generiky.
/// </summary>
public class TagValue
{
    public int TagId { get; set; }

    public string? Value { get; set; }

    public QualityCode Quality { get; set; }

    public DateTime Timestamp { get; set; }
}
