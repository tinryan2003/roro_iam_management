import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // trailingSlash: true, // Temporarily disabled to fix redirect issues
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
