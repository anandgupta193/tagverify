'use client'

// Shared building blocks so every page follows the same design language.
import type { ReactNode } from 'react'
import { Drawer, Empty, Grid, Modal, Table, theme, type TableColumnsType } from 'antd'
import { CARD_SHADOW } from '@/constants/theme'

export const useIsDesktop = () => Grid.useBreakpoint().md ?? false

export function PageHeader({ overline, title, subtitle, actions }: { overline?: string; title: string; subtitle?: string; actions?: ReactNode }) {
  const { token } = theme.useToken()
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6 fade-up">
      <div>
        {overline && <p className="overline" style={{ color: token.colorPrimary, margin: 0 }}>{overline}</p>}
        <h1 className="display hidden md:block" style={{ fontSize: 30, margin: '4px 0 0', color: token.colorText }}>{title}</h1>
        {subtitle && <p style={{ color: token.colorTextSecondary, margin: '6px 0 0', fontSize: 14 }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

/** White rounded surface with the design-system shadow. */
export function Surface({ children, className = '', padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  const { token } = theme.useToken()
  return (
    <section
      className={`fade-up ${padded ? 'p-5' : ''} ${className}`}
      style={{ background: token.colorBgContainer, borderRadius: 16, border: `1px solid ${token.colorBorderSecondary}`, boxShadow: CARD_SHADOW }}
    >
      {children}
    </section>
  )
}

export function SectionTitle({ children, extra }: { children: ReactNode; extra?: ReactNode }) {
  const { token } = theme.useToken()
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', color: token.colorText }}>{children}</h2>
      {extra}
    </div>
  )
}

export function StatCard({ label, value, icon, tint }: { label: string; value: ReactNode; icon: ReactNode; tint: string }) {
  const { token } = theme.useToken()
  return (
    <div
      className="card-lift fade-up p-5 flex items-start justify-between"
      style={{ background: token.colorBgContainer, borderRadius: 16, border: `1px solid ${token.colorBorderSecondary}`, boxShadow: CARD_SHADOW }}
    >
      <div>
        <p style={{ margin: 0, color: token.colorTextSecondary, fontSize: 13, fontWeight: 500 }}>{label}</p>
        <p className="display" style={{ margin: '6px 0 0', fontSize: 30, color: token.colorText }}>{value}</p>
      </div>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg" style={{ background: `${tint}18`, color: tint }}>
        {icon}
      </div>
    </div>
  )
}

/**
 * Table on desktop, stacked cards on mobile (mobile-first). `renderCard`
 * decides how one row looks as a card.
 */
export function ResponsiveList<T extends object>({
  rows, columns, rowKey, renderCard, loading, emptyText,
}: {
  rows: T[]
  columns: TableColumnsType<T>
  rowKey: (r: T) => string
  renderCard: (r: T) => ReactNode
  loading?: boolean
  emptyText: string
}) {
  const desktop = useIsDesktop()
  const { token } = theme.useToken()
  if (desktop) {
    return (
      <Table<T>
        rowKey={rowKey}
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={rows.length > 20 ? { pageSize: 20, showSizeChanger: false } : false}
        locale={{ emptyText: <Empty description={emptyText} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        scroll={{ x: 'max-content' }}
      />
    )
  }
  if (!loading && rows.length === 0) return <Empty description={emptyText} image={Empty.PRESENTED_IMAGE_SIMPLE} />
  return (
    <div className="flex flex-col gap-3 stagger">
      {rows.map((r) => (
        <div
          key={rowKey(r)}
          className="fade-up p-4"
          style={{ borderRadius: 14, border: `1px solid ${token.colorBorderSecondary}`, background: token.colorBgContainer }}
        >
          {renderCard(r)}
        </div>
      ))}
    </div>
  )
}

/** Form container: bottom sheet on phones, centred dialog on desktop. */
export function FormSheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const desktop = useIsDesktop()
  if (desktop) {
    return (
      <Modal open={open} title={title} onCancel={onClose} footer={null} destroyOnHidden width={560} centered>
        <div className="pt-2">{children}</div>
      </Modal>
    )
  }
  return (
    <Drawer
      open={open}
      title={title}
      onClose={onClose}
      placement="bottom"
      size="auto"
      destroyOnHidden
      // Cap the panel itself (not just the wrapper) so a long form scrolls inside
      // the sheet and its submit button stays reachable on phones.
      styles={{
        wrapper: { height: 'auto', maxHeight: '92dvh' },
        section: { maxHeight: '92dvh' },
        body: { overflowY: 'auto', minHeight: 0, overscrollBehavior: 'contain', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' },
      }}
      rootClassName="tv-sheet"
    >
      {children}
    </Drawer>
  )
}

export const fmtDate = (t?: { toDate: () => Date } | null) =>
  t ? t.toDate().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

export const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e))
