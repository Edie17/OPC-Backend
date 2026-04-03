import { useState } from 'react'
import { Card, Row, Col, Form, InputGroup, Table } from 'react-bootstrap'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts'
import { calculateRoi } from '../../utils/kpi'
import { formatCzk } from '../../utils/formatters'
import type { RoiInputs } from '../../types'

interface Props {
  defaults: RoiInputs
}

export function RoiPanel({ defaults }: Props) {
  const [inputs, setInputs] = useState<RoiInputs>(defaults)
  const result = calculateRoi(inputs)

  const set = (key: keyof RoiInputs) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setInputs(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))

  // Kumulativní CF po letech
  const cashFlowData = Array.from({ length: inputs.years }, (_, i) => {
    const year = i + 1
    const cumulative = inputs.annualSavingsCzk * year - inputs.investmentCzk
    return { year: `Rok ${year}`, cumulative }
  })

  return (
    <Row className="g-3">
      {/* Vstupy */}
      <Col md={4}>
        <Card className="border-0 shadow-sm h-100">
          <Card.Body className="p-4">
            <h6 className="fw-semibold mb-3">
              <i className="bi bi-sliders me-2 text-primary" />Parametry investice
            </h6>
            {[
              { label: 'Investice',          key: 'investmentCzk',    unit: 'CZK', step: 50000  },
              { label: 'Roční úspora',       key: 'annualSavingsCzk', unit: 'CZK', step: 10000  },
              { label: 'Diskontní sazba',    key: 'discountRate',     unit: '%',   step: 0.5    },
              { label: 'Počet let',          key: 'years',            unit: 'let', step: 1      },
            ].map(({ label, key, unit, step }) => (
              <Form.Group key={key} className="mb-3">
                <Form.Label style={{ fontSize: 13 }}>{label}</Form.Label>
                <InputGroup size="sm">
                  <Form.Control
                    type="number"
                    value={inputs[key as keyof RoiInputs]}
                    onChange={set(key as keyof RoiInputs)}
                    step={step}
                  />
                  <InputGroup.Text>{unit}</InputGroup.Text>
                </InputGroup>
              </Form.Group>
            ))}
          </Card.Body>
        </Card>
      </Col>

      {/* Výsledky */}
      <Col md={4}>
        <Card className="border-0 shadow-sm h-100">
          <Card.Body className="p-4">
            <h6 className="fw-semibold mb-3">
              <i className="bi bi-graph-up-arrow me-2 text-success" />Výsledky
            </h6>
            <Table borderless size="sm">
              <tbody>
                {[
                  { label: 'Doba návratnosti',  value: `${result.paybackYears.toFixed(1)} let`, color: result.paybackYears < 5 ? '#198754' : '#ffc107' },
                  { label: 'NPV',               value: formatCzk(result.npv),                  color: result.npv > 0 ? '#198754' : '#dc3545' },
                  { label: 'ROI',               value: `${result.roi.toFixed(1)} %`,           color: result.roi > 0 ? '#198754' : '#dc3545' },
                  { label: 'IRR',               value: `${result.irr.toFixed(1)} %`,           color: result.irr > inputs.discountRate ? '#198754' : '#dc3545' },
                  { label: 'Celková úspora',    value: formatCzk(inputs.annualSavingsCzk * inputs.years), color: '#0d6efd' },
                ].map(({ label, value, color }) => (
                  <tr key={label}>
                    <td className="text-muted ps-0" style={{ fontSize: 13 }}>{label}</td>
                    <td className="text-end fw-semibold" style={{ color, fontSize: 15 }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div
              className="rounded-3 p-3 mt-2 text-center"
              style={{ backgroundColor: result.npv > 0 ? '#d1e7dd' : '#f8d7da' }}
            >
              <i className={`bi ${result.npv > 0 ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} me-2`} />
              <strong style={{ fontSize: 14 }}>
                {result.npv > 0 ? 'Investice je výnosná' : 'Investice není výnosná'}
              </strong>
            </div>
          </Card.Body>
        </Card>
      </Col>

      {/* Graf kumulativních CF */}
      <Col md={4}>
        <Card className="border-0 shadow-sm h-100">
          <Card.Body className="p-4">
            <h6 className="fw-semibold mb-3">
              <i className="bi bi-bar-chart me-2 text-primary" />Kumulativní cash flow
            </h6>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cashFlowData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatCzk(Number(v)), 'Kumulativní CF']} />
                <ReferenceLine y={0} stroke="#dc3545" strokeDasharray="4 4" />
                <Bar dataKey="cumulative" radius={[4, 4, 0, 0]}>
                  {cashFlowData.map((entry, i) => (
                    <Cell key={i} fill={entry.cumulative >= 0 ? '#198754' : '#dc3545'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}
