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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
      };
    }
    return config;
  },
  experimental: {
    // @ts-ignore
    turbo: {
      resolveAlias: {
        fs: false,
        path: false,
        os: false,
        crypto: false,
      },
    },
  },
};

export default nextConfig;
