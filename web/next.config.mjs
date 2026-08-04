/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Preserve any inbound links from the old static site that still use
  // /htmls/*.html or extensionless /htmls/* paths.
  async redirects() {
    return [
      { source: "/htmls", destination: "/", permanent: true },
      { source: "/htmls/index", destination: "/", permanent: true },
      { source: "/htmls/index.html", destination: "/", permanent: true },
      { source: "/htmls/:path*.html", destination: "/:path*", permanent: true },
      { source: "/htmls/:path*", destination: "/:path*", permanent: true },
    ];
  },

  async headers() {
    // Default security headers applied to every response.
    // Kept intentionally lean — CSP is stricter than what Next.js
    // inline scripts + Google Sign-In tolerate, so we skip it here
    // and rely on the platform's HTTPS + these hardening headers.
    const base = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ];
    return [
      { source: "/:path*", headers: base },
      // Admin console: also robots-header noindex so caching proxies
      // never accidentally cache the URL under a public identity.
      {
        source: "/nanaforexlogs/:path*",
        headers: [
          ...base,
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store, private" },
        ],
      },
    ];
  },
};

export default nextConfig;
