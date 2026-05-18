/** @type {import('next').NextConfig} */
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co").host;
  } catch {
    return "placeholder.supabase.co";
  }
})();

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-src 'self' https://www.autoscout24.fr https://www.autoscout24.com;",
          },
        ],
      },
    ];
  },
  images: {
    domains: [
      supabaseHost,
      "vxkzrktpqvuctvnggxdp.supabase.co",
      "vxkzrktpqvuctvnggdp.supabase.co",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
      // Allow any Supabase project host to avoid preview breakage
      // when env changes and dev server cache gets stale.
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Signed URLs can also be used in some views.
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
};

module.exports = nextConfig;
