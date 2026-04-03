using System.Net;
using Opc.Ua;
using Opc.Ua.Configuration;

namespace OPC_Backend.OpcServer.Client;

public static class OpcUaClientConfig
{
    public static async Task<ApplicationConfiguration> BuildAsync(string pkiRoot = "pki-client")
    {
        var config = new ApplicationConfiguration
        {
            ApplicationName = "OPC-Backend Client",
            ApplicationUri  = Utils.Format("urn:{0}:OpcBackendClient", Dns.GetHostName()),
            ApplicationType = ApplicationType.Client,

            SecurityConfiguration = new SecurityConfiguration
            {
                ApplicationCertificate = new CertificateIdentifier
                {
                    StoreType   = CertificateStoreType.Directory,
                    StorePath   = $"{pkiRoot}/own",
                    SubjectName = "CN=OPC-Backend Client"
                },
                TrustedIssuerCertificates = new CertificateTrustList
                    { StoreType = CertificateStoreType.Directory, StorePath = $"{pkiRoot}/issuers" },
                TrustedPeerCertificates = new CertificateTrustList
                    { StoreType = CertificateStoreType.Directory, StorePath = $"{pkiRoot}/trusted" },
                RejectedCertificateStore = new CertificateTrustList
                    { StoreType = CertificateStoreType.Directory, StorePath = $"{pkiRoot}/rejected" },
                AutoAcceptUntrustedCertificates = true,
                AddAppCertToTrustedStore        = true
            },

            TransportQuotas = new TransportQuotas { OperationTimeout = 30_000 },
            ClientConfiguration = new ClientConfiguration { DefaultSessionTimeout = 60_000 },
            DisableHiResClock = true
        };

        await config.Validate(ApplicationType.Client);

        var app = new ApplicationInstance
        {
            ApplicationName          = config.ApplicationName,
            ApplicationType          = ApplicationType.Client,
            ApplicationConfiguration = config
        };
        await app.CheckApplicationInstanceCertificate(false, 2048);

        return config;
    }
}
