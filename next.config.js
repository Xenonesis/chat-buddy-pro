const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  webpack(config) {
    return config;
  },
  // Properly configure transpilation
  transpilePackages: ['react-syntax-highlighter'],
}

module.exports = nextConfig
