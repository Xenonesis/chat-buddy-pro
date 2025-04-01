const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  // Make sure there aren't any raw strings that should be JSON
  // For example, environment variables that should be parsed
};

module.exports = nextConfig;
