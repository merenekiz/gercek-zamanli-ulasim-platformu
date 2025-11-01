/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',

  // Görüntü optimizasyonu
  images: {
    domains: [
      'maps.googleapis.com',
      'lh3.googleusercontent.com', // Google Places fotoğrafları
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Çevre değişkenleri
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },

  // Webpack konfigürasyonu
  webpack: (config, { isServer }) => {
    // Leaflet için gerekli ayarlar
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Performans optimizasyonları
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // PWA desteği için gelecek konfigürasyon
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;
