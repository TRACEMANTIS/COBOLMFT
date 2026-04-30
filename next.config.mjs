/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@cobol-mf/lesson-schema",
    "@cobol-mf/sandbox-client",
    "@cobol-mf/sandbox-wasm",
    "@cobol-mf/ui",
  ],
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },
};

export default nextConfig;
