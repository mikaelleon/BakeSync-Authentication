/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Suppress webpack cache warnings (harmless warnings during cache rebuild)
    config.infrastructureLogging = {
      level: 'error',
    }
    
    // Ignore specific webpack warnings about cache pack files
    config.ignoreWarnings = [
      {
        module: /cache/,
        message: /Caching failed for pack/,
      },
      {
        message: /ENOENT.*pack\.gz/,
      },
    ]
    
    return config
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-dropdown-menu',
    ],
  },
}

export default nextConfig
