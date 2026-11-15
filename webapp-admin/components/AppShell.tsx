'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar, Button, Dropdown, Spin, theme } from 'antd'
import { LogoutOutlined, MoonOutlined, SunOutlined, UserOutlined } from '@ant-design/icons'
import { useAuthContext, useTheme } from '@/app/providers'
import { NAV_ITEMS, PUBLIC_PREFIXES } from '@/constants/navigation'
import { useAppShell } from '@/hooks/useAppShell'
import BrandMark from '@/components/BrandMark'
import SignInPage from '@/components/SignInPage'

const norm = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p)
const isActive = (pathname: string, href: string) => norm(pathname) === norm(href)

// ── Authenticated shell ───────────────────────────────────────────────────────

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const { token } = theme.useToken()
  const { theme: appTheme, toggleTheme } = useTheme()
  const { user, profile, signOut } = useAuthContext()
  const pathname = usePathname()

  const pageLabel = NAV_ITEMS.find((i) => isActive(pathname, i.href))?.label ?? 'Overview'

  const userMenu = {
    items: [
      {
        key: 'who',
        disabled: true,
        label: (
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ color: token.colorText, fontWeight: 600 }}>{profile?.name || 'Admin'}</div>
            <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>{user?.email}</div>
          </div>
        ),
      },
      { type: 'divider' as const },
      { key: 'signout', icon: <LogoutOutlined />, label: 'Sign out', onClick: () => signOut() },
    ],
  }

  return (
    <div style={{ minHeight: '100vh', background: token.colorBgLayout }} className="flex flex-col">
      {/* Top bar */}
      <header
        style={{
          background: `${token.colorBgContainer}e6`,
          backdropFilter: 'saturate(180%) blur(12px)',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
        className="sticky top-0 z-50"
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between relative">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <BrandMark size={34} />
            <span className="hidden sm:block" style={{ color: token.colorText, fontWeight: 700, letterSpacing: '-0.01em', fontSize: 17 }}>
              TagVerify <span style={{ color: token.colorTextSecondary, fontWeight: 500 }}>Admin</span>
            </span>
          </Link>

          {/* Mobile: page title centred */}
          <div className="md:hidden absolute left-0 right-0 flex justify-center pointer-events-none">
            <span style={{ color: token.colorText, fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>{pageLabel}</span>
          </div>

          {/* Desktop nav: pill links */}
          <nav className="hidden md:flex items-center gap-1 rounded-full p-1" style={{ background: token.colorFillAlter }}>
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className="flex items-center gap-2 px-4 h-9 rounded-full text-sm transition-all"
                    style={{
                      color: active ? token.colorPrimary : token.colorTextSecondary,
                      background: active ? token.colorBgContainer : 'transparent',
                      boxShadow: active ? '0 1px 3px rgba(20,22,42,.08)' : 'none',
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-1 relative z-10">
            <Button
              type="text"
              shape="circle"
              icon={appTheme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              aria-label={appTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ color: token.colorTextSecondary }}
            />
            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
              <Avatar
                src={user?.photoURL || undefined}
                icon={!user?.photoURL ? <UserOutlined /> : undefined}
                style={{ cursor: 'pointer', border: `2px solid ${token.colorPrimary}`, boxShadow: `0 0 0 2px ${token.colorPrimary}20` }}
                size={34}
              />
            </Dropdown>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 pt-6 pb-28 md:py-8">{children}</main>

      {/* Mobile bottom navigation */}
      <nav
        style={{
          background: `${token.colorBgContainer}f2`,
          backdropFilter: 'saturate(180%) blur(12px)',
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: '0 -2px 16px rgba(20,22,42,0.06)',
        }}
        className="md:hidden fixed bottom-0 left-0 right-0 flex z-50 safe-bottom"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div className="flex flex-col items-center py-2.5 gap-1 relative" style={{ color: active ? token.colorPrimary : token.colorTextSecondary }}>
                {active && (
                  <span
                    className="absolute top-0 rounded-b-full"
                    style={{ background: token.colorPrimary, width: 24, height: 2.5, left: '50%', transform: 'translateX(-50%)', boxShadow: `0 2px 8px ${token.colorPrimary}60` }}
                  />
                )}
                <span className="text-xl" style={{ transform: active ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.15s ease', display: 'block' }}>
                  {item.icon}
                </span>
                <span className="text-xs" style={{ fontWeight: active ? 600 : 500 }}>{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

// ── AppShell — auth guard ─────────────────────────────────────────────────────

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { token } = theme.useToken()
  const { user, loading } = useAuthContext()
  const pathname = usePathname()
  useAppShell()

  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return <>{children}</>

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: token.colorBgLayout }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!user) return <SignInPage />

  return <AuthenticatedShell>{children}</AuthenticatedShell>
}
