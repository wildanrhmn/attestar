/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "snarkjs",
    "circomlibjs",
    "@attestar/sdk",
    "attestar-client",
    "mock-token-client",
    "@stellar/stellar-sdk",
  ],
};

export default nextConfig;
