/** @type {import('next').NextConfig} */

// =========================
// POSTER IMAGE CONFIG
// =========================
const posterUrl = (() => {
  const base = process.env.POSTER_BASE_URL;
  if (!base) return null;

  try {
    return new URL(base);
  } catch {
    return null;
  }
})();

const posterPattern = posterUrl
  ? {
      protocol: posterUrl.protocol.replace(":", ""), // http | https
      hostname: posterUrl.hostname,
      port: posterUrl.port || undefined,
      pathname: "/upload/**",
    }
  : null;

// =========================
// NEXT CONFIG
// =========================
const nextConfig = {
  reactStrictMode: true,

  /**
   * MUHIM:
   * Nginx proxy ortida ishlaganda
   * localhost:3000 ga redirect bo‘lishini OLDINI OLADI
   */
  
  images: {
    formats: ["image/avif", "image/webp"],

    remotePatterns: [
      // Local backend (faqat dev uchun)
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/upload/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "3000",
        pathname: "/upload/**",
      },

      // External Poster image server
      ...(posterPattern ? [posterPattern] : []),
    ],
  },

  // Production build uchun
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
