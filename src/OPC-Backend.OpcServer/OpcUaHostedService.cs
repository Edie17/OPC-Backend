using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OPC_Backend.Application.Services;
using OPC_Backend.OpcServer.Server;

namespace OPC_Backend.OpcServer;

/// <summary>
/// ASP.NET Core hosted service – spouští a zastavuje OPC-UA server
/// souběžně s HTTP pipeline.
/// </summary>
public class OpcUaHostedService : BackgroundService
{
    private readonly TagService _tagService;
    private readonly OpcNodeManagerRegistry _registry;
    private readonly ILogger<OpcUaHostedService> _logger;
    private readonly string _serverUrl;

    private OpcUaServer? _server;

    public OpcUaHostedService(
        TagService tagService,
        OpcNodeManagerRegistry registry,
        ILogger<OpcUaHostedService> logger,
        string serverUrl = "opc.tcp://localhost:4840/opcbackend")
    {
        _tagService = tagService;
        _registry   = registry;
        _logger     = logger;
        _serverUrl  = serverUrl;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            var config = await OpcUaServerConfig.BuildAsync(_serverUrl);

            _server = new OpcUaServer(_tagService, _registry);
            _server.Start(config);

            _logger.LogInformation("OPC-UA server spuštěn na {Url}", _serverUrl);

            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            // Normální zastavení
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OPC-UA server selhal");
            throw;
        }
    }

    public override Task StopAsync(CancellationToken cancellationToken)
    {
        if (_server is not null)
        {
            _server.Stop();
            _logger.LogInformation("OPC-UA server zastaven");
        }
        return base.StopAsync(cancellationToken);
    }
}
