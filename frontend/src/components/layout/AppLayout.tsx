import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import type { SignalRStatus } from '../../hooks/useSignalR'

const pageTitles: Record<string, string> = {
  '/':           'Dashboard',
  '/live':       'Live Data',
  '/oee':        'OEE Analýza',
  '/roi':        'ROI & Investice',
  '/history':    'Historie',
  '/tags':       'Správa tagů',
  '/discovery':  'Discovery — Import OPC uzlů',
}

interface Props {
  signalRStatus: SignalRStatus
}

export function AppLayout({ signalRStatus }: Props) {
  const location = useLocation()
  const title = pageTitles[location.pathname] ?? 'OPC-Backend'

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div className="d-flex flex-column flex-grow-1 bg-light overflow-auto">
        <TopBar title={title} signalRStatus={signalRStatus} />
        <main className="flex-grow-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
