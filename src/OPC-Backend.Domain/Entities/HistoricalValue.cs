using OPC_Backend.Domain.Enums;

namespace OPC_Backend.Domain.Entities;

/// <summary>
/// Jeden historický záznam hodnoty tagu (time-series).
/// </summary>
public class HistoricalValue
{
    public long Id { get; set; }

    public int TagId { get; set; }

    public string? Value { get; set; }

    public QualityCode Quality { get; set; }

    public DateTime Timestamp { get; set; }
}
