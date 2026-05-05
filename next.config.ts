import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling Prisma's runtime and native pg client.
  // These rely on Node.js internals (import.meta.url, native bindings) that
  // break when inlined by the bundler.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
