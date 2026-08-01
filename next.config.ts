import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@mantine/core",
      "@mantine/hooks",
    ],
  },
};

export default nextConfig;
