/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: false, // THIS IS THE FLAG THAT MATTERS
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    return config
  },
}

module.exports = nextConfig 