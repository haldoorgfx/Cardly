/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/render': ['./public/fonts/**/*'],
    },
  },
};

export default nextConfig;
