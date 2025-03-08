/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  distDir: '.next',
  experimental: {
    serverActions: {
      enabled: true
    }
  },
  webpack: (config) => {
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        '@': path.join(__dirname, 'src')
      },
      modules: [path.resolve(__dirname, 'src'), 'node_modules']
    };
    return config;
  }
};

module.exports = nextConfig; 