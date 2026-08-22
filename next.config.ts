import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Wapsi is a mock-data prototype: no images are fetched from anywhere.
  images: { unoptimized: true },
};

export default nextConfig;
