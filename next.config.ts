import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // OpenF1 returns F1 CDN URLs; production can be strict about path matching.
    // If images still break in prod, set unoptimized: true (browser loads URLs directly).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.formula1.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.formula1.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.formula1.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "static.formula1.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "image.formula1.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
