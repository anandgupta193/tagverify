'use client'

import { useEffect, useMemo, useState } from 'react'
import { App, Avatar, Button, Form, Input, Segmented, Select, Switch, Tag, theme } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { FormSheet, PageHeader, ResponsiveList, Surface, errorText } from '@/components/ui'
import { useActionParam } from '@/hooks/useActionParam'
import { useAdminEmail } from '@/hooks/useAdminEmail'
import type { AppUser, Company } from '@/lib/schema'
import { listCompanies } from '@/services/companies'
import { addDealer, listDealers, setUserActive, type NewDealer } from '@/services/users'

const initials = (name: string) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

export default function DealersPage() {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const admin = useAdminEmail()
  const [dealers, setDealers] = useState<AppUser[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [form] = Form.useForm<NewDealer>()

  const companyName = useMemo(() => Object.fromEntries(companies.map((c) => [c.id, c.name])), [companies])
  const load = () =>
    listDealers()
      .then(setDealers)
      .catch((e) => message.error(errorText(e)))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
    listCompanies().then(setCompanies).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useActionParam('add', () => setOpen(true))

  const visible = dealers.filter((d) => {
    if (filter === 'active' && !d.active) return false
    if (filter === 'inactive' && d.active) return false
    const q = search.trim().toLowerCase()
    return !q || d.name.toLowerCase().includes(q) || d.email.includes(q) || (companyName[d.companyId ?? ''] ?? '').toLowerCase().includes(q)
  })

  const onFinish = async (v: NewDealer) => {
    setSaving(true)
    try {
      await addDealer(
        {
          name: v.name, email: v.email, companyId: v.companyId, mobile: v.mobile ?? '', address: v.address ?? '',
          passingLocation: v.passingLocation ?? '', registrationLocation: v.registrationLocation ?? '', password: v.password ?? '',
        },
        admin,
      )
      message.success(`${v.email} can now sign in to the dealer app`)
      form.resetFields()
      setOpen(false)
      load()
    } catch (e) {
      message.error(errorText(e))
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (d: AppUser, active: boolean) => {
    setDealers((list) => list.map((x) => (x.email === d.email ? { ...x, active } : x)))
    try {
      await setUserActive(d.email, active)
    } catch (e) {
      message.error(errorText(e))
      load()
    }
  }

  const status = (d: AppUser) => (d.active ? <Tag color="success" bordered={false}>Active</Tag> : <Tag bordered={false}>Inactive</Tag>)

  return (
    <>
      <PageHeader
        overline="Dealers"
        title="Dealers"
        subtitle="Only these emails can sign in to the TagVerify dealer app."
        actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)} disabled={!companies.length}>Add dealer</Button>}
      />

      <Surface>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Input allowClear prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />} placeholder="Search name, email or company" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Segmented<'all' | 'active' | 'inactive'>
            value={filter}
            onChange={setFilter}
            options={[{ label: 'All', value: 'all' }, { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]}
          />
        </div>

        <ResponsiveList<AppUser>
          rows={visible}
          loading={loading}
          rowKey={(d) => d.email}
          emptyText={companies.length ? 'No dealers yet.' : 'Add a company first, then its dealers.'}
          columns={[
            {
              title: 'Dealer',
              render: (_, d) => (
                <div className="flex items-center gap-3">
                  <Avatar style={{ background: `${token.colorPrimary}18`, color: token.colorPrimary, fontWeight: 600 }}>{initials(d.name)}</Avatar>
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: token.colorTextSecondary }}>{d.email}</div>
                  </div>
                </div>
              ),
            },
            { title: 'Company', render: (_, d) => companyName[d.companyId ?? ''] ?? d.companyId },
            { title: 'Mobile', dataIndex: 'mobile', render: (v?: string) => v || '—' },
            { title: 'Status', render: (_, d) => status(d) },
            { title: 'Access', align: 'right', render: (_, d) => <Switch checked={d.active} onChange={(on) => toggle(d, on)} aria-label={`Allow ${d.name}`} /> },
          ]}
          renderCard={(d) => (
            <div className="flex items-center gap-3">
              <Avatar size={42} style={{ background: `${token.colorPrimary}18`, color: token.colorPrimary, fontWeight: 600 }}>{initials(d.name)}</Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span style={{ fontWeight: 600, color: token.colorText }} className="truncate">{d.name}</span>
                  {status(d)}
                </div>
                <div style={{ fontSize: 12, color: token.colorTextSecondary }} className="truncate">{d.email}</div>
                <div style={{ fontSize: 12, color: token.colorTextSecondary }}>{companyName[d.companyId ?? ''] ?? d.companyId}</div>
              </div>
              <Switch checked={d.active} onChange={(on) => toggle(d, on)} aria-label={`Allow ${d.name}`} />
            </div>
          )}
        />
      </Surface>

      <FormSheet open={open} title="Add dealer" onClose={() => setOpen(false)}>
        <Form form={form} layout="vertical" requiredMark={false} onFinish={onFinish}>
          <Form.Item name="name" label="Dealer name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]} extra="They'll sign in to the app with this email (Google or password).">
            <Input inputMode="email" autoCapitalize="none" />
          </Form.Item>
          <Form.Item name="companyId" label="Company" rules={[{ required: true, message: 'Choose a company' }]}>
            <Select placeholder="Select a company" options={companies.map((c) => ({ value: c.id, label: c.name }))} showSearch={{ optionFilterProp: 'label' }} />
          </Form.Item>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item name="mobile" label="Mobile number">
              <Input inputMode="tel" />
            </Form.Item>
            <Form.Item name="address" label="Address">
              <Input />
            </Form.Item>
            <Form.Item name="passingLocation" label="Passing location">
              <Input />
            </Form.Item>
            <Form.Item name="registrationLocation" label="Registration location">
              <Input />
            </Form.Item>
          </div>
          <Form.Item name="password" label="Password (optional)" rules={[{ min: 6, message: 'At least 6 characters' }]} extra="Set one to allow email login. Leave empty for Google-only.">
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={saving}>Add dealer</Button>
        </Form>
      </FormSheet>
    </>
  )
}
