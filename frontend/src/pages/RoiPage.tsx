import { RoiPanel } from '../components/kpi/RoiPanel'
import { DEMO_ROI } from '../utils/kpi'

export function RoiPage() {
  return (
    <div>
      <p className="text-muted mb-4" style={{ fontSize: 14 }}>
        Kalkulace návratnosti investice do OPC-UA infrastruktury. Upravte parametry a sledujte výsledky v reálném čase.
      </p>
      <RoiPanel defaults={DEMO_ROI} />
    </div>
  )
}
