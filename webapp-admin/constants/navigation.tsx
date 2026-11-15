import { AppstoreOutlined, BankOutlined, QrcodeOutlined, TeamOutlined } from '@ant-design/icons'

export const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: <AppstoreOutlined /> },
  { href: '/qr/', label: 'QR codes', icon: <QrcodeOutlined /> },
  { href: '/dealers/', label: 'Dealers', icon: <TeamOutlined /> },
  { href: '/companies/', label: 'Companies', icon: <BankOutlined /> },
]

/** Routes that don't need an admin login. */
export const PUBLIC_PREFIXES = ['/c', '/offline']
