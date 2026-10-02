import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // allow image uploads up to ~20 MB in server actions (default is 1 MB)
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
