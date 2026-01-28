import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.multiversx.com',
      },
      {
        protocol: 'https',
        hostname: 'api.multiversx.com',
      },
    ],
  },
};

export default nextConfig;
