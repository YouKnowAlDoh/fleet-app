/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // keep default app router behavior
  },
  typescript: {
    // fail build on TS errors in CI? you can enable later
    // ignoreBuildErrors: false,
  },
  eslint: {
    // you can flip this to true later; for now keep build unblocked
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
