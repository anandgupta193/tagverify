'use client'

import { useState } from 'react'
import { Alert, Button, Form, Input, Typography, theme } from 'antd'
import { QrcodeOutlined, SafetyCertificateOutlined, TeamOutlined } from '@ant-design/icons'
import { useAuthContext } from '@/app/providers'
import BrandMark from '@/components/BrandMark'
import { BRAND_GRADIENT, CTA_SHADOW } from '@/constants/theme'

const FEATURES = [
  { icon: <QrcodeOutlined />, text: 'Generate QR codes in bulk for every company' },
  { icon: <TeamOutlined />, text: 'Control which dealers can certify' },
  { icon: <SafetyCertificateOutlined />, text: 'Every genuine radium gets a public certificate' },
]

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.195 17.64 11.87 17.64 9.2z" fill="#fff" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#fff" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#fff" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#fff" />
    </svg>
  )
}

export default function SignInPage() {
  const { signingIn, error, signInWithGoogle, signInWithEmail } = useAuthContext()
  const { token } = theme.useToken()
  const [showEmail, setShowEmail] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: token.colorBgLayout }}>
      {/* Gradient mesh background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 45%, ${token.colorPrimary}1f 0%, transparent 55%),
            radial-gradient(ellipse at 80% 15%, #818cf81a 0%, transparent 50%),
            radial-gradient(ellipse at 55% 90%, ${token.colorSuccess}10 0%, transparent 50%)
          `,
        }}
      />
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: `radial-gradient(circle, ${token.colorBorder} 1px, transparent 1px)`, backgroundSize: '28px 28px', opacity: 0.5 }}
      />

      <div
        className="w-full max-w-sm relative z-10 scale-in"
        style={{
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: 24,
          boxShadow: `0 32px 80px rgba(20,22,42,0.12), 0 0 0 1px ${token.colorBorderSecondary}`,
          overflow: 'hidden',
        }}
      >
        <div style={{ height: 4, background: BRAND_GRADIENT }} />

        <div className="p-8">
          <div className="flex justify-center mb-6">
            <BrandMark size={56} />
          </div>

          <div className="text-center mb-7">
            <p className="overline" style={{ color: token.colorPrimary, marginBottom: 6 }}>Admin panel</p>
            <Typography.Title level={3} className="display" style={{ marginBottom: 6, fontSize: 26 }}>
              TagVerify
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 14, lineHeight: 1.5 }}>
              Proof of genuine radium, one QR at a time
            </Typography.Text>
          </div>

          <div className="rounded-2xl p-4 mb-7 space-y-3" style={{ background: token.colorFillAlter, border: `1px solid ${token.colorBorderSecondary}` }}>
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${token.colorPrimary}18`, color: token.colorPrimary, fontSize: 14 }}
                >
                  {f.icon}
                </div>
                <Typography.Text style={{ fontSize: 13 }}>{f.text}</Typography.Text>
              </div>
            ))}
          </div>

          {/* Inline spacing: antd's reset beats Tailwind margin utilities on its components */}
          {error && <Alert type="error" showIcon title={error} style={{ borderRadius: 12, marginBottom: 16 }} />}

          <Button
            type="primary"
            size="large"
            loading={signingIn}
            onClick={signInWithGoogle}
            className="w-full"
            icon={<GoogleIcon />}
            style={{ height: 48, borderRadius: 12, fontWeight: 600, fontSize: 15, boxShadow: CTA_SHADOW }}
          >
            Continue with Google
          </Button>

          {showEmail ? (
            <Form layout="vertical" className="fade-up" style={{ marginTop: 24 }} requiredMark={false} onFinish={(v) => signInWithEmail(v.email, v.password)}>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input autoComplete="username" />
              </Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                <Input.Password autoComplete="current-password" />
              </Form.Item>
              <Button htmlType="submit" block size="large" loading={signingIn} style={{ height: 44, borderRadius: 12, fontWeight: 600, marginTop: 4 }}>
                Sign in with email
              </Button>
            </Form>
          ) : (
            <Button type="link" block style={{ marginTop: 12 }} onClick={() => setShowEmail(true)}>
              Use email and password instead
            </Button>
          )}

          <Typography.Text type="secondary" className="block text-center" style={{ fontSize: 11, marginTop: 16 }}>
            Only accounts with the admin role can sign in
          </Typography.Text>
        </div>
      </div>
    </div>
  )
}
