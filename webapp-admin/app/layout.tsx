import type { Metadata, Viewport } from 'next'
import { Outfit } from 'next/font/google'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { Providers } from './providers'
import AppShell from '@/components/AppShell'
import './globals.css'

// Variable name must match PRIMARY_FONT_CSS_VAR in config/fonts.ts
const outfit = Outfit({
  variable: '--font-primary',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'TagVerify Admin',
  description: 'Manage companies, dealers and QR certificates for genuine radium',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TagVerify',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#6366F1',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} antialiased`}>
        <AntdRegistry>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </AntdRegistry>
      </body>
    </html>
  )
}
