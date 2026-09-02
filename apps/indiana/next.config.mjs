/** @type {import('next').NextConfig} */
const apiTarget = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@crystal/types', '@crystal/validation', '@crystal/ui'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

