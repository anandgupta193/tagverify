import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

const nextConfig: NextConfig = {
  // Static site for Firebase Hosting (no server needed).
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // Public QR links look like /c/TV-000201. In production Firebase Hosting
  // rewrites /c/** to /c/index.html (see firebase.json); this does the same in dev.
  ...(isDev && {
    async rewrites() {
      return [{ source: '/c/:qrId', destination: '/c/' }]
    },
  }),
}

export default nextConfig
