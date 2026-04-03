using OPC_Backend.Domain.Entities;

namespace OPC_Backend.Application.Interfaces;

/// <summary>
/// Abstrakce nad OPC-UA adresním prostorem.
/// Umožňuje Application vrstvě aktualizovat hodnoty uzlů bez přímé závislosti na OPC SDK.
/// </summary>
public interface IOpcAddressSpace
{
    /// <summary>Aktualizuje hodnotu OPC uzlu a vyvolá notifikace odběratelům (subscriptions).</summary>
    void UpdateNodeValue(TagValue value);

    /// <summary>Přidá nový uzel do adresního prostoru za běhu.</summary>
    void AddNode(Tag tag);

    /// <summary>Odebere uzel z adresního prostoru za běhu.</summary>
    void RemoveNode(string nodeId);
}
