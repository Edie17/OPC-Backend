using OPC_Backend.Application.Interfaces;
using OPC_Backend.Domain.Entities;

namespace OPC_Backend.OpcServer;

/// <summary>
/// Singleton proxy implementující IOpcAddressSpace.
/// TagNodeManager se sem zaregistruje po svém vytvoření OPC SDK frameworkem.
/// Tím se obejde skutečnost, že NodeManager vytváří framework, ne DI kontejner.
/// </summary>
public class OpcNodeManagerRegistry : IOpcAddressSpace
{
    private volatile IOpcAddressSpace? _inner;

    /// <summary>Voláno z TagNodeManager.CreateAddressSpace() po inicializaci.</summary>
    public void Register(IOpcAddressSpace addressSpace)
    {
        _inner = addressSpace;
    }

    public void UpdateNodeValue(TagValue value)
        => _inner?.UpdateNodeValue(value);

    public void AddNode(Tag tag)
        => _inner?.AddNode(tag);

    public void RemoveNode(string nodeId)
        => _inner?.RemoveNode(nodeId);
}
