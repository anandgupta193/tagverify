'use client'

import { Button, theme } from 'antd'
import { WifiOutlined } from '@ant-design/icons'

export default function OfflinePage() {
  const { token } = theme.useToken()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8" style={{ background: token.colorBgLayout }}>
      <WifiOutlined style={{ fontSize: 48, color: token.colorTextTertiary }} />
      <h1 className="display" style={{ color: token.colorText, fontSize: 24, margin: 0 }}>You&apos;re offline</h1>
      <p style={{ color: token.colorTextSecondary, margin: 0, textAlign: 'center' }}>Check your connection and try again.</p>
      <Button type="primary" size="large" onClick={() => window.location.reload()}>Try again</Button>
    </div>
  )
}
