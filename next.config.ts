import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://dev.azure.com https://*.visualstudio.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;