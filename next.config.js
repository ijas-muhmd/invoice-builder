/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    missingSuspenseWithCSRError: false,
  },
}

module.exports = nextConfig
