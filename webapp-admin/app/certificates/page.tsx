'use client'

import { useEffect, useMemo, useState } from 'react'
import { App, Button, Form, Input, Select, Tag, theme } from 'antd'
import { EditOutlined, ExportOutlined, SafetyCertificateOutlined, SearchOutlined } from '@ant-design/icons'
import { FormSheet, PageHeader, ResponsiveList, Surface, errorText, fmtDate } from '@/components/ui'
import { useMasters } from '@/constants/masters'
import { useAdminEmail } from '@/hooks/useAdminEmail'
import { listCertificates, updateCertificate, type Certificate, type CertificateEdit } from '@/services/certificates'

// Same checks as the dealer app's fitment form (FitmentModels.kt).
const FIVE_CHARS = { pattern: /^[A-Za-z0-9]{5}$/, message: 'Exactly 5 letters or digits' }
const MOBILE = { pattern: /^[6-9]\d{9}$/, message: '10-digit mobile starting 6–9' }
const SERIES = { pattern: /^[A-Za-z]{0,3}\d{1,4}$/, message: 'e.g. AB1234' }
const required = (what: string) => ({ required: true, message: `Enter ${what}` })

const searchText = (c: Certificate) =>
  [c.qrId, c.certificateNo, c.vehicle?.vehicleNumber, c.owner?.name, c.owner?.mobile, c.dealerName, c.dealerEmail, c.companyName]
    .join(' ')
    .toLowerCase()

export default function CertificatesPage() {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const admin = useAdminEmail()
  const masters = useMasters()
  const [rows, setRows] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Certificate | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<CertificateEdit>()
  const regRto = Form.useWatch(['vehicle', 'registrationRto'], form)
  const series = Form.useWatch(['vehicle', 'series'], form)

  const load = () =>
    listCertificates()
      .then(setRows)
      .catch((e) => message.error(errorText(e)))
      .finally(() => setLoading(false))
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    return t ? rows.filter((r) => searchText(r).includes(t)) : rows
  }, [rows, q])

  const openEdit = (c: Certificate) => {
    const v = c.vehicle ?? {}
    form.setFieldsValue({
      vehicle: {
        make: v.make ?? '', category: v.category ?? '', fuelType: v.fuelType ?? '',
        passingRto: v.passingRto ?? '', registrationRto: v.registrationRto ?? '', series: v.series ?? '',
        mfgYear: v.mfgYear ?? '', chassisNo: v.chassisNo ?? '', engineNo: v.engineNo ?? '',
      },
      ownerName: c.owner?.name ?? '',
      ownerMobile: c.owner?.mobile ?? '',
      quantity: c.quantity || 'Set of 2',
    })
    setEditing(c)
  }

  const onFinish = async (v: CertificateEdit) => {
    if (!editing) return
    setSaving(true)
    try {
      await updateCertificate(editing, v, admin)
      message.success(`Updated ${editing.qrId} — the public certificate shows the new details`)
      setEditing(null)
      load()
    } catch (e) {
      message.error(errorText(e))
    } finally {
      setSaving(false)
    }
  }

  const opts = (list: string[]) => list.map((x) => ({ value: x, label: x }))
  const rtoOpts = masters.rtos.map((r) => ({ value: r.code, label: r.label }))
  const pick = { showSearch: { optionFilterProp: 'label' }, placeholder: 'Select' } as const
  const viewUrl = (c: Certificate) => `/c/${c.qrId}`

  const editedTag = (c: Certificate) =>
    c.updatedAt ? <Tag color="purple" variant="filled" style={{ marginInlineEnd: 0 }}>Edited</Tag> : null

  return (
    <>
      <PageHeader
        overline="Certificates"
        title="Certificates"
        subtitle="Every fitted sticker. Correct a dealer's mistake here — the public certificate updates instantly."
      />

      <Surface>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
          placeholder="Search vehicle, QR, owner, mobile or dealer"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <ResponsiveList<Certificate>
          rows={shown}
          loading={loading}
          rowKey={(r) => r.id}
          emptyText={q ? 'No certificate matches that search.' : 'No certificates yet — they appear once a dealer certifies a sticker.'}
          columns={[
            {
              title: 'Vehicle',
              render: (_, c) => (
                <div>
                  <div className="flex items-center gap-2" style={{ fontWeight: 600 }}>{c.vehicle?.vehicleNumber || '—'} {editedTag(c)}</div>
                  <div className="font-mono" style={{ fontSize: 12, color: token.colorTextSecondary }}>{c.qrId}</div>
                </div>
              ),
            },
            {
              title: 'Owner',
              render: (_, c) => (
                <div>
                  <div>{c.owner?.name || '—'}</div>
                  <div style={{ fontSize: 12, color: token.colorTextSecondary }}>{c.owner?.mobile}</div>
                </div>
              ),
            },
            {
              title: 'Dealer',
              render: (_, c) => (
                <div>
                  <div>{c.dealerName || c.dealerEmail || '—'}</div>
                  <div style={{ fontSize: 12, color: token.colorTextSecondary }}>{c.companyName}</div>
                </div>
              ),
            },
            { title: 'Issued', render: (_, c) => <span style={{ color: token.colorTextSecondary }}>{fmtDate(c.createdAt)}</span> },
            {
              title: '',
              align: 'right',
              render: (_, c) => (
                <div className="flex justify-end gap-1">
                  <Button type="text" icon={<ExportOutlined />} href={viewUrl(c)} target="_blank">View</Button>
                  <Button icon={<EditOutlined />} onClick={() => openEdit(c)}>Edit</Button>
                </div>
              ),
            },
          ]}
          renderCard={(c) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${token.colorPrimary}18`, color: token.colorPrimary }}>
                  <SafetyCertificateOutlined />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2" style={{ fontWeight: 600, color: token.colorText }}>
                    {c.vehicle?.vehicleNumber || '—'} {editedTag(c)}
                  </div>
                  <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
                    <span className="font-mono">{c.qrId}</span> · {c.owner?.name || '—'}
                  </div>
                  <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
                    {c.dealerName || c.dealerEmail} · {fmtDate(c.createdAt)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button icon={<ExportOutlined />} href={viewUrl(c)} target="_blank">View</Button>
                <Button type="primary" icon={<EditOutlined />} onClick={() => openEdit(c)}>Edit</Button>
              </div>
            </div>
          )}
        />
      </Surface>

      <FormSheet open={!!editing} title={editing ? `Edit certificate · ${editing.qrId}` : 'Edit certificate'} onClose={() => setEditing(null)}>
        <Form form={form} layout="vertical" requiredMark={false} onFinish={onFinish}>
          <p className="overline" style={{ color: token.colorTextSecondary, margin: '0 0 12px' }}>Vehicle</p>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item name={['vehicle', 'make']} label="Vehicle make" rules={[required('the make')]}>
              <Select {...pick} options={opts(masters.makes)} />
            </Form.Item>
            <Form.Item name={['vehicle', 'category']} label="Vehicle category" rules={[required('the category')]}>
              <Select {...pick} options={opts(masters.categories)} />
            </Form.Item>
            <Form.Item name={['vehicle', 'fuelType']} label="Fuel type" rules={[required('the fuel type')]}>
              <Select {...pick} options={opts(masters.fuelTypes)} />
            </Form.Item>
            <Form.Item name={['vehicle', 'mfgYear']} label="Manufacturing year" rules={[required('the year')]}>
              <Select {...pick} options={opts(masters.mfgYears)} />
            </Form.Item>
            <Form.Item name={['vehicle', 'passingRto']} label="Passing RTO" rules={[required('the passing RTO')]}>
              <Select {...pick} options={rtoOpts} />
            </Form.Item>
            <Form.Item name={['vehicle', 'registrationRto']} label="Registration RTO" rules={[required('the registration RTO')]}>
              <Select {...pick} options={rtoOpts} />
            </Form.Item>
            <Form.Item
              name={['vehicle', 'series']}
              label="Series"
              rules={[required('the series'), SERIES]}
              extra={regRto && series ? <>Vehicle number: <b>{`${regRto}${series}`.toUpperCase()}</b></> : 'The part after the registration RTO'}
            >
              <Input autoCapitalize="characters" maxLength={7} />
            </Form.Item>
            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item name={['vehicle', 'chassisNo']} label="Chassis (last 5)" rules={[required('5 characters'), FIVE_CHARS]}>
                <Input autoCapitalize="characters" maxLength={5} />
              </Form.Item>
              <Form.Item name={['vehicle', 'engineNo']} label="Engine (last 5)" rules={[required('5 characters'), FIVE_CHARS]}>
                <Input autoCapitalize="characters" maxLength={5} />
              </Form.Item>
            </div>
          </div>

          <p className="overline" style={{ color: token.colorTextSecondary, margin: '4px 0 12px' }}>Owner &amp; material</p>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item name="ownerName" label="Owner name" rules={[required('the owner name')]}>
              <Input />
            </Form.Item>
            <Form.Item name="ownerMobile" label="Owner mobile" rules={[required('the mobile number'), MOBILE]}>
              <Input inputMode="tel" maxLength={10} />
            </Form.Item>
            <Form.Item name="quantity" label="Quantity" rules={[required('the quantity')]}>
              <Input placeholder="Set of 2" />
            </Form.Item>
          </div>

          {editing?.updatedAt && (
            <p style={{ fontSize: 12, color: token.colorTextSecondary, margin: '0 0 12px' }}>
              Last edited {fmtDate(editing.updatedAt)} by {editing.updatedBy}
            </p>
          )}
          <Button type="primary" htmlType="submit" block size="large" loading={saving}>Save changes</Button>
        </Form>
      </FormSheet>
    </>
  )
}
