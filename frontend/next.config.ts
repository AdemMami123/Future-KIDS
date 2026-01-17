import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false, // Disable for production stability
  // Ensure static CSS is properly handled
  transpilePackages: [],
  productionBrowserSourceMaps: false,
};

export default nextConfig;
