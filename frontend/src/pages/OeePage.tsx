import { useState } from 'react'
import { Card, Row, Col, Table, Badge } from 'react-bootstrap'
import { OeePanel } from '../components/kpi/OeePanel'
import { calculateOee, toPercent, oeeColor, DEMO_SHIFT } from '../utils/kpi'
import type { ShiftSummary } from '../types'

const DEMO_TREND = Array.from({ length: 12 }, (_, i) => ({
  time: `${(6 + i * 2).toString().padStart(2, '0')}:00`,
  oee:         Math.round(72 + Math.random() * 18),
  availability:Math.round(85 + Math.random() * 12),
  performance: Math.round(78 + Math.random() * 15),
  quality:     Math.round(92 + Math.random() * 7),
}))

const SHIFTS: ShiftSummary[] = [
  { shift: 'Ranní',   plannedMinutes: 480, downtimeMinutes: 38, totalParts: 1240, goodParts: 1196, theoreticalCycleMin: 0.35 },
  { shift: 'Odpolední', plannedMinutes: 480, downtimeMinutes: 52, totalParts: 1180, goodParts: 1142, theoreticalCycleMin: 0.35 },
  { shift: 'Noční',   plannedMinutes: 480, downtimeMinutes: 71, totalParts: 1050, goodParts: 995,  theoreticalCycleMin: 0.35 },
]

export function OeePage() {
  const [selectedShift, setSelectedShift] = useState(0)
  const shift   = SHIFTS[selectedShift] ?? DEMO_SHIFT
  const metrics = calculateOee(shift)

  return (
    <div>
      {/* Výběr směny */}
      <Row className="g-3 mb-4">
        {SHIFTS.map((s, i) => {
          const m      = calculateOee(s)
          const color  = oeeColor(m.oee)
          const active = selectedShift === i
          return (
            <Col key={s.shift} md={4}>
              <Card
                className={`border-2 shadow-sm h-100 cursor-pointer ${active ? 'border-primary' : ''}`}
                onClick={() => setSelectedShift(i)}
                style={{ cursor: 'pointer', borderColor: active ? '#0d6efd' : undefined }}
              >
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1" style={{ fontSize: 12 }}>{s.shift} směna</p>
                      <h3 className="fw-bold mb-0" style={{ color }}>{toPercent(m.oee)}</h3>
                    </div>
                    <div className="text-end">
                      <Badge bg={active ? 'primary' : 'light'} text={active ? 'white' : 'dark'}>
                        {active ? 'Zobrazeno' : 'Zobrazit'}
                      </Badge>
                    </div>
                  </div>
                  <div className="d-flex gap-3 mt-2">
                    {[
                      { label: 'A', value: toPercent(m.availability, 0) },
                      { label: 'P', value: toPercent(m.performance, 0)  },
                      { label: 'Q', value: toPercent(m.quality, 0)      },
                    ].map(({ label, value }) => (
                      <span key={label} style={{ fontSize: 12 }}>
                        <span className="text-muted">{label}: </span>
                        <strong>{value}</strong>
                      </span>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )
        })}
      </Row>

      {/* OEE detailní panel */}
      <div className="mb-4">
        <h6 className="fw-semibold mb-3 text-muted text-uppercase" style={{ fontSize: 12, letterSpacing: 1 }}>
          OEE Analýza — {shift.shift} směna
        </h6>
        <OeePanel metrics={metrics} trend={DEMO_TREND} />
      </div>

      {/* Srovnávací tabulka */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3 fw-semibold">Srovnání směn</Card.Header>
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0" style={{ fontSize: 13 }}>
            <thead className="table-light">
              <tr>
                <th>Směna</th>
                <th className="text-end">OEE</th>
                <th className="text-end">Dostupnost</th>
                <th className="text-end">Výkonnost</th>
                <th className="text-end">Kvalita</th>
                <th className="text-end">Dobré kusy</th>
                <th className="text-end">Prostoje</th>
              </tr>
            </thead>
            <tbody>
              {SHIFTS.map((s, i) => {
                const m = calculateOee(s)
                const color = oeeColor(m.oee)
                return (
                  <tr key={s.shift} className={selectedShift === i ? 'table-primary' : ''}>
                    <td className="fw-medium">{s.shift}</td>
                    <td className="text-end fw-bold" style={{ color }}>{toPercent(m.oee)}</td>
                    <td className="text-end">{toPercent(m.availability)}</td>
                    <td className="text-end">{toPercent(m.performance)}</td>
                    <td className="text-end">{toPercent(m.quality)}</td>
                    <td className="text-end">{s.goodParts.toLocaleString('cs-CZ')} / {s.totalParts.toLocaleString('cs-CZ')}</td>
                    <td className="text-end">{s.downtimeMinutes} min</td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  )
}
