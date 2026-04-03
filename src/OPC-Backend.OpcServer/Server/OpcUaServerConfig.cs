using Opc.Ua;
using Opc.Ua.Configuration;

namespace OPC_Backend.OpcServer.Server;

/// <summary>
/// Sestaví ApplicationConfiguration pro OPC-UA server.
/// PKI certifikáty se ukládají do CertificateStore (podadresář pki/).
/// Self-signed certifikát se vytvoří automaticky pokud neexistuje.
/// </summary>
public static class OpcUaServerConfig
{
    public static async Task<ApplicationConfiguration> BuildAsync(
        string serverUrl = "opc.tcp://localhost:4840/opcbackend",
        string pkiRoot   = "pki")
    {
        var config = new ApplicationConfiguration
        {
            ApplicationName = "OPC-Backend Server",
            ApplicationUri  = Utils.Format("urn:{0}:OpcBackend", System.Net.Dns.GetHostName()),
            ProductUri      = "https://github.com/opcbackend",
            ApplicationType = ApplicationType.Server,

            ServerConfiguration = new ServerConfiguration
            {
                BaseAddresses = { serverUrl },
                MinRequestThreadCount = 5,
                MaxRequestThreadCount = 100,
                MaxQueuedRequestCount = 200,
                SecurityPolicies =
                {
                    new ServerSecurityPolicy
                    {
                        SecurityMode      = MessageSecurityMode.None,
                        SecurityPolicyUri = SecurityPolicies.None
                    },
                    new ServerSecurityPolicy
                    {
                        SecurityMode      = MessageSecurityMode.SignAndEncrypt,
                        SecurityPolicyUri = SecurityPolicies.Basic256Sha256
                    }
                },
                UserTokenPolicies =
                {
                    new UserTokenPolicy(UserTokenType.Anonymous)
                }
            },

            SecurityConfiguration = new SecurityConfiguration
            {
                ApplicationCertificate = new CertificateIdentifier
                {
                    StoreType   = CertificateStoreType.Directory,
                    StorePath   = $"{pkiRoot}/own",
                    SubjectName = "CN=OPC-Backend, O=OpcBackend, DC=localhost"
                },
                TrustedIssuerCertificates = new CertificateTrustList
                {
                    StoreType = CertificateStoreType.Directory,
                    StorePath = $"{pkiRoot}/issuers"
                },
                TrustedPeerCertificates = new CertificateTrustList
                {
                    StoreType = CertificateStoreType.Directory,
                    StorePath = $"{pkiRoot}/trusted"
                },
                RejectedCertificateStore = new CertificateTrustList
                {
                    StoreType = CertificateStoreType.Directory,
                    StorePath = $"{pkiRoot}/rejected"
                },
                AutoAcceptUntrustedCertificates = true,  // DEV only
                AddAppCertToTrustedStore        = true
            },

            TransportConfigurations = new TransportConfigurationCollection(),
            TransportQuotas = new TransportQuotas
            {
                OperationTimeout      = 120_000,
                MaxStringLength       = 1_048_576,
                MaxByteStringLength   = 1_048_576,
                MaxArrayLength        = 65_535,
                MaxMessageSize        = 4_194_304,
                MaxBufferSize         = 65_535,
                ChannelLifetime       = 300_000,
                SecurityTokenLifetime = 3_600_000
            },

            DisableHiResClock = true
        };

        await config.Validate(ApplicationType.Server);

        // ApplicationInstance zajistí vytvoření self-signed certifikátu pokud neexistuje
        var application = new ApplicationInstance
        {
            ApplicationName          = config.ApplicationName,
            ApplicationType          = config.ApplicationType,
            ApplicationConfiguration = config
        };

        await application.CheckApplicationInstanceCertificate(silent: false, minimumKeySize: 2048);

        return config;
    }
}
