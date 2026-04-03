using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Opc.Ua;
using Opc.Ua.Client;
using OPC_Backend.Application.Interfaces;
using OPC_Backend.Application.Services;
using OPC_Backend.Domain.Entities;
using OPC_Backend.Domain.Enums;

namespace OPC_Backend.OpcServer.Client;

/// <summary>
/// BackgroundService který se připojuje na vzdálený OPC-UA server jako klient.
/// Automaticky prochází adresní prostor, vytváří tagy v DB a subscribuje na změny hodnot.
/// Data změny → TagService.WriteValueAsync → DB + SignalR → Frontend.
/// </summary>
public class OpcUaClientService : BackgroundService
{
    private readonly string _remoteServerUrl;
    private readonly TagService _tagService;
    private readonly ITagRepository _tagRepo;
    private readonly ILogger<OpcUaClientService> _logger;

    private Session? _session;
    private Subscription? _subscription;
    private SessionReconnectHandler? _reconnectHandler;

    public OpcUaClientService(
        string remoteServerUrl,
        TagService tagService,
        ITagRepository tagRepo,
        ILogger<OpcUaClientService> logger)
    {
        _remoteServerUrl = remoteServerUrl;
        _tagService      = tagService;
        _tagRepo         = tagRepo;
        _logger          = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await Task.Delay(3_000, ct);   // počkej než nastartuje OPC UA Server

        while (!ct.IsCancellationRequested)
        {
            try
            {
                await ConnectAndRunAsync(ct);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "OPC Client: chyba, znovu za 15 s");
                await Task.Delay(15_000, ct);
            }
        }
    }

    private async Task ConnectAndRunAsync(CancellationToken ct)
    {
        _logger.LogInformation("OPC Client: připojuji se na {Url}", _remoteServerUrl);

        var config   = await OpcUaClientConfig.BuildAsync();
        var endpoint = CoreClientUtils.SelectEndpoint(config, _remoteServerUrl, useSecurity: false);

        _session = await Session.Create(
            config,
            new ConfiguredEndpoint(null, endpoint, EndpointConfiguration.Create(config)),
            updateBeforeConnect: false,
            checkDomain:         false,
            sessionName:         "OPC-Backend Client",
            sessionTimeout:      60_000,
            identity:            new UserIdentity(),
            preferredLocales:    null,
            ct:                  ct);

        _session.KeepAlive += OnKeepAlive;
        _logger.LogInformation("OPC Client: připojen ✓");

        await DiscoverAndSyncTagsAsync(ct);
        await SubscribeAsync(ct);

        await Task.Delay(Timeout.Infinite, ct);
    }

    // ── Discovery ────────────────────────────────────────────────────────────

    public async Task DiscoverAndSyncTagsAsync(CancellationToken ct = default)
    {
        if (_session is null) return;

        _logger.LogInformation("OPC Client: prochází adresní prostor…");
        var nodes = new List<DiscoveredNode>();
        BrowseFolder(_session, ObjectIds.ObjectsFolder, "", nodes, depth: 0, maxDepth: 4);
        _logger.LogInformation("OPC Client: nalezeno {Count} proměnných", nodes.Count);

        foreach (var node in nodes)
        {
            var existing = await _tagRepo.GetByNodeIdAsync(node.NodeId, ct);
            if (existing is not null) continue;

            var tag = new Tag
            {
                NodeId      = node.NodeId,
                DisplayName = node.DisplayName,
                DataType    = MapBuiltinType(node.BuiltInType),
                IsActive    = true,
            };
            await _tagRepo.InsertAsync(tag, ct);
            _logger.LogDebug("OPC Client: tag vytvořen {Name}", tag.DisplayName);
        }
    }

    private void BrowseFolder(
        Session session,
        NodeId folderId,
        string path,
        List<DiscoveredNode> result,
        int depth,
        int maxDepth)
    {
        if (depth > maxDepth) return;

        var browseDesc = new BrowseDescriptionCollection
        {
            new BrowseDescription
            {
                NodeId          = folderId,
                BrowseDirection = BrowseDirection.Forward,
                ReferenceTypeId = ReferenceTypeIds.HierarchicalReferences,
                IncludeSubtypes = true,
                NodeClassMask   = (uint)(NodeClass.Object | NodeClass.Variable),
                ResultMask      = (uint)BrowseResultMask.All,
            }
        };

        session.Browse(null, null, 0, browseDesc, out var browseResults, out _);

        if (browseResults is null || browseResults.Count == 0) return;
        var refs = browseResults[0].References;
        if (refs is null) return;

        foreach (var r in refs)
        {
            var displayName = r.DisplayName.Text ?? r.BrowseName.Name ?? "Unknown";
            var nodeId      = (NodeId)r.NodeId;
            var nodeIdStr   = nodeId.ToString();

            if (r.NodeClass == NodeClass.Variable)
            {
                try
                {
                    var dv = session.ReadValue(nodeId);
                    if (dv?.Value is null) continue;

                    var builtIn = dv.WrappedValue.TypeInfo?.BuiltInType ?? BuiltInType.Variant;

                    // Přeskoč non-skalární a serverové interní typy
                    if (builtIn is BuiltInType.Null or BuiltInType.NodeId
                        or BuiltInType.ExpandedNodeId or BuiltInType.StatusCode
                        or BuiltInType.DiagnosticInfo or BuiltInType.DataValue
                        or BuiltInType.Variant or BuiltInType.ExtensionObject)
                        continue;

                    var fullName = string.IsNullOrEmpty(path) ? displayName : $"{path} / {displayName}";
                    result.Add(new DiscoveredNode(nodeIdStr, fullName, builtIn));
                }
                catch { /* přeskoč nečitelné uzly */ }
            }
            else if (r.NodeClass == NodeClass.Object)
            {
                var childPath = string.IsNullOrEmpty(path) ? displayName : $"{path} / {displayName}";
                BrowseFolder(session, nodeId, childPath, result, depth + 1, maxDepth);
            }
        }
    }

    // ── Subscription ─────────────────────────────────────────────────────────

    private async Task SubscribeAsync(CancellationToken ct)
    {
        if (_session is null) return;

        var tags = (await _tagRepo.GetAllActiveAsync(ct)).ToList();
        if (tags.Count == 0)
        {
            _logger.LogWarning("OPC Client: žádné aktivní tagy");
            return;
        }

        _subscription = new Subscription(_session.DefaultSubscription)
        {
            DisplayName      = "OPC-Backend",
            PublishingInterval = 1_000,
            KeepAliveCount   = 10,
            LifetimeCount    = 100,
        };

        foreach (var tag in tags)
        {
            NodeId nodeId;
            try { nodeId = NodeId.Parse(tag.NodeId); }
            catch { continue; }

            var item = new MonitoredItem(_subscription.DefaultItem)
            {
                DisplayName      = tag.DisplayName,
                StartNodeId      = nodeId,
                SamplingInterval = 500,
            };

            var tagIdCaptured = tag.Id;
            item.Notification += (mi, _) => OnDataChange(mi, tagIdCaptured);
            _subscription.AddItem(item);
        }

        _session.AddSubscription(_subscription);
        _subscription.Create();

        _logger.LogInformation("OPC Client: subscribováno {Count} tagů", _subscription.MonitoredItemCount);
    }

    private void OnDataChange(MonitoredItem item, int tagId)
    {
        foreach (var value in item.DequeueValues())
        {
            var quality = StatusCode.IsGood(value.StatusCode)      ? QualityCode.Good
                        : StatusCode.IsUncertain(value.StatusCode) ? QualityCode.Uncertain
                        : QualityCode.Bad;

            var tagValue = new TagValue
            {
                TagId     = tagId,
                Value     = value.Value?.ToString(),
                Quality   = quality,
                Timestamp = value.SourceTimestamp == DateTime.MinValue
                            ? DateTime.UtcNow : value.SourceTimestamp,
            };

            _ = _tagService.WriteValueAsync(tagValue);
        }
    }

    // ── Keep-Alive / Reconnect ────────────────────────────────────────────────

    private void OnKeepAlive(ISession session, KeepAliveEventArgs e)
    {
        if (!ServiceResult.IsGood(e.Status))
        {
            _logger.LogWarning("OPC Client: keep-alive chyba, reconnect…");
            _reconnectHandler ??= new SessionReconnectHandler(true);
            _reconnectHandler.BeginReconnect(session, 5_000, OnReconnected);
        }
    }

    private void OnReconnected(object? sender, EventArgs e)
    {
        if (sender is SessionReconnectHandler h)
        {
            _session = h.Session as Session;
            h.Dispose();
            _reconnectHandler = null;
            _logger.LogInformation("OPC Client: reconnect úspěšný");
        }
    }

    public override async Task StopAsync(CancellationToken ct)
    {
        _subscription?.Delete(true);
        _session?.Close();
        _session?.Dispose();
        _reconnectHandler?.Dispose();
        await base.StopAsync(ct);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static OpcDataType MapBuiltinType(BuiltInType t) => t switch
    {
        BuiltInType.Boolean  => OpcDataType.Boolean,
        BuiltInType.SByte    => OpcDataType.SByte,
        BuiltInType.Byte     => OpcDataType.Byte,
        BuiltInType.Int16    => OpcDataType.Int16,
        BuiltInType.UInt16   => OpcDataType.UInt16,
        BuiltInType.Int32    => OpcDataType.Int32,
        BuiltInType.UInt32   => OpcDataType.UInt32,
        BuiltInType.Int64    => OpcDataType.Int64,
        BuiltInType.UInt64   => OpcDataType.UInt64,
        BuiltInType.Float    => OpcDataType.Float,
        BuiltInType.Double   => OpcDataType.Double,
        BuiltInType.String   => OpcDataType.String,
        BuiltInType.DateTime => OpcDataType.DateTime,
        _                    => OpcDataType.String,
    };

    public record DiscoveredNode(string NodeId, string DisplayName, BuiltInType BuiltInType);
}
