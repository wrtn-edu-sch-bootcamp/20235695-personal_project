import withPWA from "next-pwa";

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      // Windows 환경에서 간헐적으로 webpack pack cache 손상(청크/CSS 404) 방지
      config.cache = false;
    }
    return config;
  },
};

export default pwaConfig(nextConfig);
