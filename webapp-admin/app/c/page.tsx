'use client'

import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { Button, Spin, theme } from 'antd'
import { CheckCircleFilled, ExclamationCircleFilled, FilePdfOutlined } from '@ant-design/icons'
import BrandMark from '@/components/BrandMark'
import { CARD_SHADOW, CTA_SHADOW } from '@/constants/theme'
import { getFirebaseDb } from '@/lib/firebase'
import { C, type PublicCertificate } from '@/lib/schema'

/** QR id from /c/TV-000201 (production rewrite) or /c/?id=TV-000201. */
function readQrId(): string {
  const fromPath = window.location.pathname.replace(/^\/c\/?/, '').replace(/\/$/, '')
  const fromQuery = new URLSearchParams(window.location.search).get('id') ?? ''
  return decodeURIComponent(fromPath || fromQuery).toUpperCase()
}

/**
 * What anyone sees after scanning a sticker with a normal phone camera.
 * Reads publicCertificates/{qrId}, which holds no personal data.
 */
export default function PublicCertificatePage() {
  const { token } = theme.useToken()
  const [qrId, setQrId] = useState('')
  const [state, setState] = useState<'loading' | 'missing' | 'error' | PublicCertificate>('loading')

  useEffect(() => {
    const id = readQrId()
    setQrId(id)
    if (!id) {
      setState('missing')
      return
    }
    getDoc(doc(getFirebaseDb(), C.publicCertificates, id))
      .then((s) => setState(s.exists() ? (s.data() as PublicCertificate) : 'missing'))
      .catch(() => setState('error'))
  }, [])

  const ok = typeof state === 'object'

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: token.colorBgLayout }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% 0%, ${ok ? token.colorSuccess : token.colorPrimary}22 0%, transparent 60%)`,
        }}
      />
      <div className="w-full max-w-sm relative z-10 scale-in text-center p-8" style={{ background: token.colorBgContainer, borderRadius: 24, boxShadow: CARD_SHADOW, border: `1px solid ${token.colorBorderSecondary}` }}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <BrandMark size={28} />
          <span style={{ fontWeight: 700, color: token.colorText, letterSpacing: '-0.01em' }}>TagVerify</span>
        </div>
        <p className="font-mono" style={{ fontSize: 12, color: token.colorTextSecondary, margin: 0 }}>{qrId}</p>

        {state === 'loading' && (
          <div className="py-10">
            <Spin />
          </div>
        )}

        {(state === 'missing' || state === 'error') && (
          <div className="fade-up">
            <ExclamationCircleFilled style={{ fontSize: 56, color: token.colorWarning, marginTop: 28 }} />
            <h1 className="display" style={{ fontSize: 22, margin: '16px 0 8px', color: token.colorText }}>
              {state === 'error' ? "Couldn't check this code" : 'Certificate not available'}
            </h1>
            <p style={{ color: token.colorTextSecondary, fontSize: 14, margin: 0 }}>
              {state === 'error'
                ? 'Please check your internet connection and scan again.'
                : "This QR hasn't been certified by an authorised dealer yet. If it's on a fitted radium, it may not be genuine."}
            </p>
          </div>
        )}

        {ok && (
          <div className="fade-up">
            <CheckCircleFilled style={{ fontSize: 60, color: token.colorSuccess, marginTop: 28 }} />
            <p className="overline" style={{ color: token.colorSuccess, margin: '14px 0 0' }}>Verified original</p>
            <h1 className="display" style={{ fontSize: 26, margin: '4px 0 8px', color: token.colorText }}>Genuine radium</h1>
            <p style={{ color: token.colorTextSecondary, fontSize: 14, margin: 0 }}>
              Certified product of <strong style={{ color: token.colorText }}>{state.companyName}</strong>
              {state.productType ? ` · ${state.productType}` : ''}
            </p>
            {state.certifiedAt && (
              <p style={{ color: token.colorTextTertiary, fontSize: 12, marginTop: 6 }}>Certified on {state.certifiedAt.toDate().toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
            )}
            {state.pdfUrl && (
              <Button type="primary" size="large" block href={state.pdfUrl} icon={<FilePdfOutlined />} className="mt-6" style={{ height: 48, borderRadius: 12, boxShadow: CTA_SHADOW }}>
                View certificate
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
