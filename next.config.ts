import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Browsers only honor this over HTTPS, so it's harmless in local dev.
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;

// Makes Cloudflare bindings available during `next dev`. Local only: Workers
// AI would otherwise need a Cloudflare login just to build (the contact form
// treats a missing AI answer as "unsure").
initOpenNextCloudflareForDev({ remoteBindings: false });
