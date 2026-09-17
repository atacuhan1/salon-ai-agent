import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs"],
  async redirects() {
    return [
      { source: "/kayıt", destination: "/kayit", permanent: false },
      { source: "/giriş", destination: "/giris", permanent: false },
    ];
  },
};

export default nextConfig;
