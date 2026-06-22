/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@attestar/sdk",
    "attestar-client",
    "mock-token-client",
    "@stellar/stellar-sdk",
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        readline: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        constants: false,
      };
    }
    return config;
  },
};

export default nextConfig;
