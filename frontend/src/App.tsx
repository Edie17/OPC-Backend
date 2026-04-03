import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout }      from './components/layout/AppLayout'
import { DashboardPage }  from './pages/DashboardPage'
import { LiveDataPage }   from './pages/LiveDataPage'
import { OeePage }        from './pages/OeePage'
import { RoiPage }        from './pages/RoiPage'
import { HistoryPage }    from './pages/HistoryPage'
import { TagsPage }       from './pages/TagsPage'
import { DiscoveryPage }  from './pages/DiscoveryPage'
import { useSignalR }     from './hooks/useSignalR'

export default function App() {
  const { status, updates } = useSignalR()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout signalRStatus={status} />}>
          <Route index          element={<DashboardPage updates={updates} />} />
          <Route path="live"    element={<LiveDataPage  updates={updates} />} />
          <Route path="oee"     element={<OeePage />} />
          <Route path="roi"     element={<RoiPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="tags"       element={<TagsPage />} />
          <Route path="discovery"  element={<DiscoveryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
