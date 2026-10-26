import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const noStore = [
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
    ];
    return [
      { source: "/invoices/:path*", headers: noStore },
      { source: "/settings", headers: noStore },
    ];
  },
};

export default nextConfig;
