import type { NextConfig } from "next";

// Load .env.local with override so system env vars don't shadow app values
import { config } from "dotenv";
config({ path: ".env.local", override: true });

const nextConfig: NextConfig = {};

export default nextConfig;
