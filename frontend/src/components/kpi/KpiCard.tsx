import { Card } from 'react-bootstrap'

interface Props {
  title: string
  value: string
  subtitle?: string
  icon: string
  color: string
  trend?: number   // kladné = růst, záporné = pokles
}

export function KpiCard({ title, value, subtitle, icon, color, trend }: Props) {
  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body className="d-flex flex-column justify-content-between p-4">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <p className="text-muted mb-1" style={{ fontSize: 13 }}>{title}</p>
            <h3 className="fw-bold mb-0" style={{ color }}>{value}</h3>
            {subtitle && <small className="text-muted">{subtitle}</small>}
          </div>
          <div
            className="rounded-3 d-flex align-items-center justify-content-center"
            style={{ width: 48, height: 48, backgroundColor: `${color}20` }}
          >
            <i className={`bi ${icon} fs-4`} style={{ color }} />
          </div>
        </div>

        {trend !== undefined && (
          <div className="mt-3 d-flex align-items-center gap-1">
            <i
              className={`bi ${trend >= 0 ? 'bi-arrow-up-right' : 'bi-arrow-down-right'} small`}
              style={{ color: trend >= 0 ? '#198754' : '#dc3545' }}
            />
            <small style={{ color: trend >= 0 ? '#198754' : '#dc3545' }}>
              {Math.abs(trend).toFixed(1)} % vs. předchozí směna
            </small>
          </div>
        )}
      </Card.Body>
    </Card>
  )
}
