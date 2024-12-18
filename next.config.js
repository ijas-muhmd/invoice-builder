/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    missingSuspenseWithCSRError: false,
    missingSuspenseWithCSRBailout: false
  },
}

module.exports = nextConfig
