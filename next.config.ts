import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/orm-postgres", "pg", "temporal-polyfill"],
};

export default nextConfig;
