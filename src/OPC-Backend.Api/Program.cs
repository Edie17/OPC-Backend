using OPC_Backend.Api.Hubs;
using OPC_Backend.Api.Services;
using OPC_Backend.Application.Interfaces;
using OPC_Backend.Application.Services;
using OPC_Backend.Infrastructure.Repositories;
using OPC_Backend.OpcServer;
using OPC_Backend.OpcServer.Client;

var builder = WebApplication.CreateBuilder(args);

// ── Konfigurace ─────────────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("OpcBackend")
    ?? throw new InvalidOperationException("ConnectionString 'OpcBackend' není nakonfigurován.");

var opcServerUrl = builder.Configuration["OpcUa:ServerUrl"] ?? "opc.tcp://localhost:4840/opcbackend";

// ── CORS – povolení React dev serveru ───────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());   // nutné pro SignalR WebSocket
});

// ── Infrastruktura (Dapper) ──────────────────────────────────────────────────
builder.Services.AddSingleton<ITagRepository>(_ => new TagRepository(connectionString));
builder.Services.AddSingleton<IHistoryRepository>(_ => new HistoryRepository(connectionString));

// ── OPC-UA registry ──────────────────────────────────────────────────────────
builder.Services.AddSingleton<OpcNodeManagerRegistry>();
builder.Services.AddSingleton<IOpcAddressSpace>(sp => sp.GetRequiredService<OpcNodeManagerRegistry>());

// ── SignalR notifikace ────────────────────────────────────────────────────────
builder.Services.AddSignalR();
builder.Services.AddSingleton<ITagNotificationService, SignalRTagNotificationService>();

// ── Application services ─────────────────────────────────────────────────────
builder.Services.AddSingleton<TagService>();
builder.Services.AddSingleton<HistoryService>();

// ── OPC-UA server ─────────────────────────────────────────────────────────────
builder.Services.AddSingleton(opcServerUrl);
builder.Services.AddHostedService<OpcUaHostedService>();

// ── OPC-UA Client (připojení na vzdálený server) ───────────────────────────
var clientEnabled    = builder.Configuration.GetValue<bool>("OpcUaClient:Enabled");
var remoteServerUrl  = builder.Configuration["OpcUaClient:RemoteServerUrl"] ?? "opc.tcp://opcuaserver.com:48010";

if (clientEnabled)
{
    builder.Services.AddSingleton(sp => new OpcUaClientService(
        remoteServerUrl,
        sp.GetRequiredService<TagService>(),
        sp.GetRequiredService<ITagRepository>(),
        sp.GetRequiredService<ILogger<OpcUaClientService>>()));
    builder.Services.AddHostedService(sp => sp.GetRequiredService<OpcUaClientService>());
}

// ── ASP.NET Core ─────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseCors("Frontend");
if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.MapHub<OpcDataHub>("/hubs/opc-data");

app.Run();
