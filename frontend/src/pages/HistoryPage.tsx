import { useState } from 'react'
import { Card, Row, Col, Form, Button, Alert } from 'react-bootstrap'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useTags } from '../hooks/useTags'
import { useHistory } from '../hooks/useHistory'
import { formatTimestamp } from '../utils/formatters'

export function HistoryPage() {
  const { tags }                          = useTags()
  const { data, loading, error, load }    = useHistory()
  const [tagId, setTagId]                 = useState('')
  const [from, setFrom]                   = useState(() => {
    const d = new Date(); d.setHours(d.getHours() - 8); return d.toISOString().slice(0, 16)
  })
  const [to, setTo]                       = useState(() => new Date().toISOString().slice(0, 16))

  const chartData = data.map(h => ({
    time:  formatTimestamp(h.timestamp),
    value: parseFloat(h.value ?? 'NaN'),
  })).filter(d => !isNaN(d.value))

  const selectedTag = tags.find(t => t.id === parseInt(tagId))

  function handleLoad() {
    if (!tagId) return
    load(parseInt(tagId), new Date(from).toISOString(), new Date(to).toISOString())
  }

  return (
    <div>
      {/* Filtr */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Label style={{ fontSize: 13 }}>Tag</Form.Label>
              <Form.Select size="sm" value={tagId} onChange={e => setTagId(e.target.value)}>
                <option value="">— vyberte tag —</option>
                {tags.map(t => (
                  <option key={t.id} value={t.id}>{t.displayName}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label style={{ fontSize: 13 }}>Od</Form.Label>
              <Form.Control type="datetime-local" size="sm" value={from} onChange={e => setFrom(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label style={{ fontSize: 13 }}>Do</Form.Label>
              <Form.Control type="datetime-local" size="sm" value={to} onChange={e => setTo(e.target.value)} />
            </Col>
            <Col md={2}>
              <Button
                variant="primary" size="sm" className="w-100"
                onClick={handleLoad}
                disabled={!tagId || loading}
              >
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-1" />Načítám…</>
                  : <><i className="bi bi-search me-1" />Načíst</>}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Graf */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
          <span className="fw-semibold">
            {selectedTag ? selectedTag.displayName : 'Vyberte tag'}
            {selectedTag?.unit && <span className="text-muted ms-1">[{selectedTag.unit}]</span>}
          </span>
          <span className="text-muted" style={{ fontSize: 13 }}>{data.length} záznamů</span>
        </Card.Header>
        <Card.Body>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  formatter={(v) => [
                    `${Number(v).toFixed(3)}${selectedTag?.unit ? ` ${selectedTag.unit}` : ''}`,
                    selectedTag?.displayName ?? 'Hodnota'
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={selectedTag?.displayName ?? 'Hodnota'}
                  stroke="#0d6efd"
                  strokeWidth={2}
                  dot={data.length < 100}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted py-5">
              <i className="bi bi-clock-history d-block fs-2 mb-2" />
              {tagId ? 'Žádná data pro vybraný rozsah' : 'Vyberte tag a časový rozsah'}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Datová tabulka */}
      {data.length > 0 && (
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white py-3 fw-semibold">Surová data</Card.Header>
          <Card.Body className="p-0">
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table className="table table-sm table-hover mb-0" style={{ fontSize: 12 }}>
                <thead className="table-light sticky-top">
                  <tr>
                    <th>Čas</th>
                    <th className="text-end">Hodnota</th>
                    <th>Kvalita</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(h => (
                    <tr key={h.id}>
                      <td className="text-muted">{formatTimestamp(h.timestamp)}</td>
                      <td className="text-end fw-medium">{h.value ?? '—'}</td>
                      <td>
                        <span className={`badge rounded-pill bg-${h.quality === 0 ? 'success' : h.quality === 1 ? 'danger' : 'warning'}`}>
                          {h.quality === 0 ? 'Good' : h.quality === 1 ? 'Bad' : 'Uncertain'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}
