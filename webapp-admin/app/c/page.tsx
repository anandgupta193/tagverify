'use client'

import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { Button, Spin, theme } from 'antd'
import { CheckCircleFilled, DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import BrandMark from '@/components/BrandMark'
import CertificateView from '@/components/certificate/CertificateView'
import { CARD_SHADOW } from '@/constants/theme'
import { getFirebaseDb } from '@/lib/firebase'
import { C, type PublicCertificate } from '@/lib/schema'

/** QR id from /c/TV-000201 (production rewrite) or /c/?id=TV-000201. */
function readQrId(): string {
  const fromPath = window.location.pathname.replace(/^\/c\/?/, '').replace(/\/$/, '')
  const fromQuery = new URLSearchParams(window.location.search).get('id') ?? ''
  return decodeURIComponent(fromPath || fromQuery).toUpperCase()
}

/**
 * What anyone sees after scanning a sticker: the installation certificate,
 * or "QR not found" when no certificate exists for this code.
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

  useEffect(() => {
    if (typeof state === 'object') {
      const v = state.vehicle?.vehicleNumber ?? state.qrId
      document.title = `Installation Certificate · ${v}`
    }
  }, [state])

  if (typeof state === 'object') {
    return (
      <div className="min-h-screen pb-10 print:pb-0" style={{ background: token.colorBgLayout }}>
        {/* Toolbar (hidden when printing) */}
        <div className="print:hidden sticky top-0 z-10 border-b" style={{ background: `${token.colorBgContainer}f0`, borderColor: token.colorBorderSecondary, backdropFilter: 'blur(10px)' }}>
          <div className="mx-auto flex max-w-[820px] items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircleFilled style={{ color: token.colorSuccess, fontSize: 20 }} />
              <div className="min-w-0">
                <div style={{ fontWeight: 700, color: token.colorText, lineHeight: 1.2 }}>Verified genuine</div>
                <div className="truncate" style={{ fontSize: 12, color: token.colorTextSecondary }}>{state.companyName} · {state.qrId}</div>
              </div>
            </div>
            <Button type="primary" icon={<DownloadOutlined />} onClick={() => window.print()}>Download PDF</Button>
          </div>
        </div>
        <div className="px-3 pt-4 sm:pt-8 print:p-0">
          <CertificateView c={state} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: token.colorBgLayout }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `radial-gradient(ellipse at 50% 0%, ${token.colorPrimary}22 0%, transparent 60%)` }} />
      <div className="w-full max-w-sm relative z-10 scale-in text-center p-8" style={{ background: token.colorBgContainer, borderRadius: 24, boxShadow: CARD_SHADOW, border: `1px solid ${token.colorBorderSecondary}` }}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <BrandMark size={28} />
          <span style={{ fontWeight: 700, color: token.colorText, letterSpacing: '-0.01em' }}>TagVerify</span>
        </div>
        <p className="font-mono" style={{ fontSize: 12, color: token.colorTextSecondary, margin: 0 }}>{qrId}</p>

        {state === 'loading' ? (
          <div className="py-10"><Spin /></div>
        ) : (
          <div className="fade-up">
            <div className="mx-auto mt-7 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: `${token.colorWarning}1f` }}>
              <SearchOutlined style={{ fontSize: 28, color: token.colorWarning }} />
            </div>
            <h1 className="display" style={{ fontSize: 24, margin: '16px 0 8px', color: token.colorText }}>
              {state === 'error' ? "Couldn't check this QR" : 'QR not found'}
            </h1>
            <p style={{ color: token.colorTextSecondary, fontSize: 14, margin: 0 }}>
              {state === 'error'
                ? 'Please check your internet connection and scan again.'
                : 'There is no installation certificate for this QR code. If it is on a fitted radium, the product may not be genuine.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
