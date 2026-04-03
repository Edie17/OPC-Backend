using Opc.Ua;
using Opc.Ua.Server;
using OPC_Backend.Application.Interfaces;
using OPC_Backend.Application.Services;
using OPC_Backend.Domain.Entities;
using OPC_Backend.Domain.Enums;

namespace OPC_Backend.OpcServer.NodeManagers;

/// <summary>
/// Spravuje OPC-UA adresní prostor pro tagy načtené z databáze.
/// Namespace: http://opcbackend.com/tags/
///
/// Každý Tag z DB = jedna BaseDataVariableState v adresním prostoru.
/// NodeId formát: ns=2;s={Tag.NodeId}
///
/// Po inicializaci se zaregistruje do OpcNodeManagerRegistry jako IOpcAddressSpace.
/// </summary>
public class TagNodeManager : CustomNodeManager2, IOpcAddressSpace
{
    private const string Namespace = "http://opcbackend.com/tags/";

    private readonly TagService _tagService;
    private readonly OpcNodeManagerRegistry _registry;

    // Interní cache uzlů pro rychlý přístup při Write / Update
    private readonly Dictionary<string, BaseDataVariableState> _nodeMap = new();

    public TagNodeManager(
        IServerInternal server,
        ApplicationConfiguration config,
        TagService tagService,
        OpcNodeManagerRegistry registry)
        : base(server, config, Namespace)
    {
        _tagService = tagService;
        _registry   = registry;
    }

    // ─── Inicializace adresního prostoru ──────────────────────────────────────

    public override void CreateAddressSpace(IDictionary<NodeId, IList<IReference>> externalReferences)
    {
        lock (Lock)
        {
            base.CreateAddressSpace(externalReferences);

            // Kořenová složka "Tags" pod Objects
            var tagsFolder = CreateFolder(null, "Tags", "Tags");

            if (!externalReferences.TryGetValue(ObjectIds.ObjectsFolder, out var refs))
            {
                refs = new List<IReference>();
                externalReferences[ObjectIds.ObjectsFolder] = refs;
            }
            refs.Add(new NodeStateReference(ReferenceTypeIds.Organizes, false, tagsFolder.NodeId));
            tagsFolder.AddReference(ReferenceTypeIds.Organizes, true, ObjectIds.ObjectsFolder);

            // Načti aktivní tagy z DB a vytvoř uzly
            var tags = _tagService.GetAllActiveAsync().GetAwaiter().GetResult();
            foreach (var tag in tags)
                CreateTagVariable(tagsFolder, tag);

            // Zaregistruj sebe jako IOpcAddressSpace
            _registry.Register(this);
        }
    }

    // ─── IOpcAddressSpace implementace ───────────────────────────────────────

    public void UpdateNodeValue(TagValue value)
    {
        lock (Lock)
        {
            var key = value.TagId.ToString();
            if (!_nodeMap.TryGetValue(key, out var node)) return;

            node.Value               = value.Value;
            node.StatusCode          = MapQuality(value.Quality);
            node.Timestamp           = value.Timestamp;
            node.ClearChangeMasks(SystemContext, false);
        }
    }

    public void AddNode(Tag tag)
    {
        lock (Lock)
        {
            if (_nodeMap.ContainsKey(tag.Id.ToString())) return;

            var tagsFolder = Find(new NodeId("Tags", NamespaceIndex)) as FolderState;
            if (tagsFolder is null) return;

            CreateTagVariable(tagsFolder, tag);
        }
    }

    public void RemoveNode(string nodeId)
    {
        lock (Lock)
        {
            // Najdi uzel podle OPC NodeId stringu
            var entry = _nodeMap.FirstOrDefault(kv => kv.Value.NodeId.Identifier?.ToString() == nodeId);
            if (entry.Value is null) return;

            DeleteNode(SystemContext, entry.Value.NodeId);
            _nodeMap.Remove(entry.Key);
        }
    }

    // ─── Pomocné metody ───────────────────────────────────────────────────────

    private FolderState CreateFolder(NodeState? parent, string name, string displayName)
    {
        var folder = new FolderState(parent)
        {
            NodeId      = new NodeId(name, NamespaceIndex),
            BrowseName  = new QualifiedName(name, NamespaceIndex),
            DisplayName = new LocalizedText(displayName),
            TypeDefinitionId = ObjectTypeIds.FolderType,
            WriteMask   = AttributeWriteMask.None,
            UserWriteMask = AttributeWriteMask.None
        };
        folder.Create(SystemContext, folder.NodeId, folder.BrowseName, null, true);

        if (parent is not null)
        {
            parent.AddChild(folder);
        }

        AddPredefinedNode(SystemContext, folder);
        return folder;
    }

    private BaseDataVariableState CreateTagVariable(NodeState parent, Tag tag)
    {
        var variable = new BaseDataVariableState(parent)
        {
            NodeId       = new NodeId(tag.NodeId, NamespaceIndex),
            BrowseName   = new QualifiedName(tag.DisplayName, NamespaceIndex),
            DisplayName  = new LocalizedText(tag.DisplayName),
            DataType     = MapDataType(tag.DataType),
            ValueRank    = ValueRanks.Scalar,
            AccessLevel  = AccessLevels.CurrentReadOrWrite,
            UserAccessLevel = AccessLevels.CurrentReadOrWrite,
            Historizing  = false,
            StatusCode   = StatusCodes.BadWaitingForInitialData,
            Timestamp    = DateTime.UtcNow,
            Value        = null
        };

        // Callback volaný OPC SDK při Write operaci od klienta
        var tagIdCaptured = tag.Id;
        variable.OnSimpleWriteValue = OnWriteTagValue;

        ServiceResult OnWriteTagValue(ISystemContext ctx, NodeState nd, ref object value)
        {
            var tagValue = new TagValue
            {
                TagId     = tagIdCaptured,
                Value     = value?.ToString(),
                Quality   = QualityCode.Good,
                Timestamp = DateTime.UtcNow
            };
            // Fire-and-forget – nezablokuje OPC thread
            _ = _tagService.WriteValueAsync(tagValue);
            return ServiceResult.Good;
        }

        variable.Create(SystemContext, variable.NodeId, variable.BrowseName, null, true);
        parent.AddChild(variable);
        AddPredefinedNode(SystemContext, variable);

        _nodeMap[tag.Id.ToString()] = variable;
        return variable;
    }

    private static NodeId MapDataType(OpcDataType dt) => dt switch
    {
        OpcDataType.Boolean  => DataTypeIds.Boolean,
        OpcDataType.SByte    => DataTypeIds.SByte,
        OpcDataType.Byte     => DataTypeIds.Byte,
        OpcDataType.Int16    => DataTypeIds.Int16,
        OpcDataType.UInt16   => DataTypeIds.UInt16,
        OpcDataType.Int32    => DataTypeIds.Int32,
        OpcDataType.UInt32   => DataTypeIds.UInt32,
        OpcDataType.Int64    => DataTypeIds.Int64,
        OpcDataType.UInt64   => DataTypeIds.UInt64,
        OpcDataType.Float    => DataTypeIds.Float,
        OpcDataType.Double   => DataTypeIds.Double,
        OpcDataType.String   => DataTypeIds.String,
        OpcDataType.DateTime => DataTypeIds.DateTime,
        _                    => DataTypeIds.BaseDataType
    };

    private static StatusCode MapQuality(QualityCode q) => q switch
    {
        QualityCode.Good      => StatusCodes.Good,
        QualityCode.Bad       => StatusCodes.Bad,
        QualityCode.Uncertain => StatusCodes.Uncertain,
        _                     => StatusCodes.Bad
    };
}
