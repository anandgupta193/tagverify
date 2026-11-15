import { BRAND_GRADIENT, PALETTE } from '@/constants/theme'

/** Logo tile: QR corner marks with a check, on the brand gradient. */
export default function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: BRAND_GRADIENT,
        boxShadow: `0 ${size / 8}px ${size / 3}px ${PALETTE.primary[500]}45`,
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <path d="m8.5 12.2 2.4 2.4 4.8-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
