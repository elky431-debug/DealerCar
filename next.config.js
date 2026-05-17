/** @type {import('next').NextConfig} */
const supabaseHost = (() => {
  const raw = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co").trim().replace(/\/+$/, "");
  try {
    return new URL(raw).hostname;
  } catch {
    return "placeholder.supabase.co";
  }
})();

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
      // Un segment sous-domaine (ex. ref.supabase.co) — `**` n’est pas fiable selon les versions Next.
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
};

module.exports = nextConfig;
