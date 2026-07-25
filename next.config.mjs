/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Ensure the reviews CSV is bundled into the serverless function on Vercel,
    // since /api/analyze reads it from disk at runtime via process.cwd().
    outputFileTracingIncludes: {
      "/api/analyze": ["./data/**"],
    },
  },
};

export default nextConfig;
