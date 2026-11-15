import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { useAuth } from './lib/auth'
import Companies from './pages/Companies'
import Dashboard from './pages/Dashboard'
import Dealers from './pages/Dealers'
import Login from './pages/Login'
import PublicCertificate from './pages/PublicCertificate'
import QrCodes from './pages/QrCodes'

export default function App() {
  return (
    <Routes>
      {/* Public: what anyone sees after scanning a sticker. */}
      <Route path="/c/:qrId" element={<PublicCertificate />} />
      <Route path="/*" element={<AdminArea />} />
    </Routes>
  )
}

function AdminArea() {
  const { state } = useAuth()
  if (state.status === 'loading') {
    return <div className="grid min-h-screen place-items-center text-slate-500">Loading…</div>
  }
  if (state.status === 'signedOut') return <Login message={state.message} />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="companies" element={<Companies />} />
        <Route path="dealers" element={<Dealers />} />
        <Route path="qr" element={<QrCodes />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}
