namespace OPC_Backend.Domain.Enums;

/// <summary>
/// OPC-UA StatusCode zjednodušený na 3 stavy pro DB uložení.
/// </summary>
public enum QualityCode : byte
{
    Good      = 0,
    Bad       = 1,
    Uncertain = 2
}
