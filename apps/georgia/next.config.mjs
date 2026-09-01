/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@crystal/types', '@crystal/validation', '@crystal/ui'],
};

export default nextConfig;
