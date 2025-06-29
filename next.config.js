/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sqlite3'],
  },
  webpack: (config) => {
    config.externals.push({
      'sqlite3': 'commonjs sqlite3',
    });
    return config;
  },
  async headers() {
    return [
      {
        source: '/api/files/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 