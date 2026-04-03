using Opc.Ua;
using Opc.Ua.Server;
using OPC_Backend.Application.Services;
using OPC_Backend.OpcServer.NodeManagers;

namespace OPC_Backend.OpcServer.Server;

/// <summary>
/// Hlavní OPC-UA server. Dědí StandardServer z OPC Foundation SDK.
/// Registruje vlastní TagNodeManager pro správu adresního prostoru.
/// </summary>
public class OpcUaServer : StandardServer
{
    private readonly TagService _tagService;
    private readonly OpcNodeManagerRegistry _registry;

    public OpcUaServer(TagService tagService, OpcNodeManagerRegistry registry)
    {
        _tagService = tagService;
        _registry   = registry;
    }

    protected override MasterNodeManager CreateMasterNodeManager(
        IServerInternal server,
        ApplicationConfiguration configuration)
    {
        var nodeManagers = new INodeManager[]
        {
            new TagNodeManager(server, configuration, _tagService, _registry)
        };

        return new MasterNodeManager(server, configuration, null, nodeManagers);
    }

    protected override ServerProperties LoadServerProperties()
    {
        return new ServerProperties
        {
            ManufacturerName = "OPC-Backend",
            ProductName      = "OPC-Backend UA Server",
            ProductUri       = "https://github.com/opcbackend",
            SoftwareVersion  = Utils.GetAssemblySoftwareVersion(),
            BuildNumber      = Utils.GetAssemblyBuildNumber(),
            BuildDate        = Utils.GetAssemblyTimestamp()
        };
    }

    protected override void OnServerStarted(IServerInternal server)
    {
        base.OnServerStarted(server);
        // Server spuštěn – zde lze přidat event/log
    }

    protected override void OnServerStopping()
    {
        base.OnServerStopping();
    }
}
