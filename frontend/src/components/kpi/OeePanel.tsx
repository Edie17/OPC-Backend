import { Card, ProgressBar, Row, Col } from 'react-bootstrap'
import {
  RadialBarChart, RadialBar, PolarAngleAxis,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { oeeColor, toPercent } from '../../utils/kpi'
import type { OeeMetrics } from '../../types'

interface Props {
  metrics: OeeMetrics
  trend?: Array<{ time: string; oee: number; availability: number; performance: number; quality: number }>
}

export function OeePanel({ metrics, trend = [] }: Props) {
  const oeeValue   = Math.round(metrics.oee * 100)
  const color      = oeeColor(metrics.oee)
  const radialData = [{ name: 'OEE', value: oeeValue, fill: color }]

  const components = [
    { label: 'Dostupnost',   value: metrics.availability, color: '#0d6efd', icon: 'bi-clock'        },
    { label: 'Výkonnost',    value: metrics.performance,  color: '#6610f2', icon: 'bi-lightning'     },
    { label: 'Kvalita',      value: metrics.quality,      color: '#198754', icon: 'bi-check-circle'  },
  ]

  return (
    <Row className="g-3">
      {/* OEE Gauge */}
      <Col md={4}>
        <Card className="h-100 border-0 shadow-sm text-center p-3">
          <Card.Body>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>Celkové OEE</p>
            <RadialBarChart
              width={200} height={200}
              innerRadius="70%" outerRadius="90%"
              data={radialData}
              startAngle={180} endAngle={-180}
              style={{ margin: '0 auto' }}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#e9ecef' }} />
            </RadialBarChart>
            <div style={{ marginTop: -90, marginBottom: 70 }}>
              <span style={{ fontSize: 36, fontWeight: 700, color }}>{oeeValue} %</span>
              <br />
              <small className="text-muted">
                {oeeValue >= 85 ? '🏆 World Class' : oeeValue >= 65 ? '📊 Průměrné' : '⚠️ Pod průměrem'}
              </small>
            </div>
          </Card.Body>
        </Card>
      </Col>

      {/* Komponenty */}
      <Col md={4}>
        <Card className="h-100 border-0 shadow-sm p-3">
          <Card.Body>
            <h6 className="fw-semibold mb-3">Komponenty OEE</h6>
            {components.map(c => (
              <div key={c.label} className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="d-flex align-items-center gap-2" style={{ fontSize: 13 }}>
                    <i className={`bi ${c.icon}`} style={{ color: c.color }} />
                    {c.label}
                  </span>
                  <strong style={{ color: c.color }}>{toPercent(c.value)}</strong>
                </div>
                <ProgressBar
                  now={c.value * 100}
                  style={{ height: 8, backgroundColor: `${c.color}20` }}
                >
                  <div
                    style={{
                      width: `${c.value * 100}%`,
                      backgroundColor: c.color,
                      height: '100%',
                      borderRadius: 4,
                      transition: 'width 0.6s ease',
                    }}
                  />
                </ProgressBar>
              </div>
            ))}

            <div className="mt-4 pt-3 border-top">
              <small className="text-muted d-block mb-1">Vzorec OEE</small>
              <code style={{ fontSize: 11 }}>
                {toPercent(metrics.availability, 0)} × {toPercent(metrics.performance, 0)} × {toPercent(metrics.quality, 0)} = <strong>{toPercent(metrics.oee)}</strong>
              </code>
            </div>
          </Card.Body>
        </Card>
      </Col>

      {/* Trend */}
      <Col md={4}>
        <Card className="h-100 border-0 shadow-sm p-3">
          <Card.Body>
            <h6 className="fw-semibold mb-3">Trend OEE</h6>
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="oeeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v) => [`${v} %`, 'OEE']} />
                  <Area type="monotone" dataKey="oee" stroke={color} fill="url(#oeeGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted py-5" style={{ fontSize: 13 }}>
                <i className="bi bi-bar-chart-line d-block fs-3 mb-2" />
                Žádná historická data
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}
