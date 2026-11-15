'use client'

import { useEffect, useState } from 'react'
import { App, Button, DatePicker, Form, Input, theme } from 'antd'
import { BankOutlined, PlusOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import { FormSheet, PageHeader, ResponsiveList, Surface, errorText, fmtDate } from '@/components/ui'
import { useAdminEmail } from '@/hooks/useAdminEmail'
import { useActionParam } from '@/hooks/useActionParam'
import type { Company } from '@/lib/schema'
import { addCompany, listCompanies } from '@/services/companies'

export default function CompaniesPage() {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const admin = useAdminEmail()
  const [rows, setRows] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const load = () =>
    listCompanies()
      .then(setRows)
      .catch((e) => message.error(errorText(e)))
      .finally(() => setLoading(false))
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useActionParam('add', () => setOpen(true))

  const onFinish = async (v: { name: string; copNumber?: string; copValidity?: Dayjs; logoUrl?: string }) => {
    setSaving(true)
    try {
      await addCompany(
        { name: v.name, copNumber: v.copNumber ?? '', copValidity: v.copValidity ? v.copValidity.format('YYYY-MM-DD') : '', logoUrl: v.logoUrl ?? '' },
        admin,
      )
      message.success(`Added ${v.name}`)
      form.resetFields()
      setOpen(false)
      load()
    } catch (e) {
      message.error(errorText(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        overline="Companies"
        title="Companies"
        subtitle="Brands whose radium carries a TagVerify QR."
        actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Add company</Button>}
      />

      <Surface>
        <ResponsiveList<Company>
          rows={rows}
          loading={loading}
          rowKey={(r) => r.id}
          emptyText="No companies yet — add your first one."
          columns={[
            { title: 'Company', dataIndex: 'name', render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span> },
            { title: 'COP number', dataIndex: 'copNumber', render: (v?: string) => v || '—' },
            { title: 'COP valid till', dataIndex: 'copValidity', render: (v: Company['copValidity']) => (v ? v.toDate().toLocaleDateString('en-IN') : '—') },
            { title: 'Added', dataIndex: 'createdAt', render: (v: Company['createdAt']) => <span style={{ color: token.colorTextSecondary }}>{fmtDate(v)}</span> },
          ]}
          renderCard={(c) => (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${token.colorPrimary}18`, color: token.colorPrimary }}>
                <BankOutlined />
              </div>
              <div className="min-w-0">
                <div style={{ fontWeight: 600, color: token.colorText }}>{c.name}</div>
                <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
                  COP {c.copNumber || '—'}
                  {c.copValidity ? ` · valid till ${c.copValidity.toDate().toLocaleDateString('en-IN')}` : ''}
                </div>
              </div>
            </div>
          )}
        />
      </Surface>

      <FormSheet open={open} title="Add company" onClose={() => setOpen(false)}>
        <Form form={form} layout="vertical" requiredMark={false} onFinish={onFinish}>
          <Form.Item name="name" label="Company name" rules={[{ required: true, message: 'Enter the company name' }]}>
            <Input placeholder="e.g. Shree Radium Works" />
          </Form.Item>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item name="copNumber" label="COP number">
              <Input />
            </Form.Item>
            <Form.Item name="copValidity" label="COP validity">
              <DatePicker className="w-full" format="DD MMM YYYY" />
            </Form.Item>
          </div>
          <Form.Item name="logoUrl" label="Logo URL" extra="Optional for now">
            <Input placeholder="https://…" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={saving}>Add company</Button>
        </Form>
      </FormSheet>
    </>
  )
}
