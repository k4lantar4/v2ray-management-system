/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  webpack: (config) => {
    // Simplify the alias configuration
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, './src'),
    };
    return config;
  },
};

module.exports = nextConfig; 