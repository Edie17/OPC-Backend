import { useState, useMemo } from 'react'
import { Card, Table, Form, InputGroup, Badge, Row, Col } from 'react-bootstrap'
import { StatusBadge } from '../components/shared/StatusBadge'
import { useTags } from '../hooks/useTags'
import { formatValue, formatTimestamp } from '../utils/formatters'
import { QualityCode } from '../types'
import type { TagValueUpdate } from '../types'

interface Props {
  updates: Map<number, TagValueUpdate>
}

export function LiveDataPage({ updates }: Props) {
  const { tags, loading } = useTags()
  const [search, setSearch] = useState('')
  const [qualityFilter, setQualityFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    return tags.filter(tag => {
      const update = updates.get(tag.id)
      const matchSearch = tag.displayName.toLowerCase().includes(search.toLowerCase())
        || tag.nodeId.toLowerCase().includes(search.toLowerCase())
      const matchQuality = qualityFilter === 'all'
        || (update && update.quality === parseInt(qualityFilter))
      return matchSearch && matchQuality
    })
  }, [tags, updates, search, qualityFilter])

  const counts = useMemo(() => ({
    good:      [...updates.values()].filter(u => u.quality === QualityCode.Good).length,
    bad:       [...updates.values()].filter(u => u.quality === QualityCode.Bad).length,
    uncertain: [...updates.values()].filter(u => u.quality === QualityCode.Uncertain).length,
  }), [updates])

  return (
    <div>
      {/* Souhrn */}
      <Row className="g-3 mb-4">
        {[
          { label: 'Good',      count: counts.good,      bg: 'success', icon: 'bi-check-circle' },
          { label: 'Bad',       count: counts.bad,       bg: 'danger',  icon: 'bi-x-circle'     },
          { label: 'Uncertain', count: counts.uncertain, bg: 'warning', icon: 'bi-question-circle' },
          { label: 'No data',   count: tags.length - updates.size, bg: 'secondary', icon: 'bi-dash-circle' },
        ].map(({ label, count, bg, icon }) => (
          <Col key={label} xs={6} md={3}>
            <Card className="border-0 shadow-sm text-center py-3">
              <i className={`bi ${icon} fs-3 text-${bg}`} />
              <h4 className="fw-bold mb-0 mt-1">{count}</h4>
              <small className="text-muted">{label}</small>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Tabulka */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <Row className="g-2 align-items-center">
            <Col md={6}>
              <InputGroup size="sm">
                <InputGroup.Text><i className="bi bi-search" /></InputGroup.Text>
                <Form.Control
                  placeholder="Hledat tag nebo Node ID…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select size="sm" value={qualityFilter} onChange={e => setQualityFilter(e.target.value)}>
                <option value="all">Všechny quality</option>
                <option value="0">Good</option>
                <option value="1">Bad</option>
                <option value="2">Uncertain</option>
              </Form.Select>
            </Col>
            <Col md={3} className="text-end">
              <Badge bg="primary" pill>
                <i className="bi bi-broadcast me-1" />
                {filtered.length} tagů
              </Badge>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border spinner-border-sm me-2" />
              Načítání…
            </div>
          ) : (
            <div style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
              <Table hover className="mb-0" style={{ fontSize: 13 }}>
                <thead className="table-light sticky-top">
                  <tr>
                    <th>#</th>
                    <th>Název</th>
                    <th>Node ID</th>
                    <th>Typ</th>
                    <th className="text-end">Hodnota</th>
                    <th className="text-end">Min / Max</th>
                    <th className="text-center">Kvalita</th>
                    <th>Poslední aktualizace</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(tag => {
                    const update = updates.get(tag.id)
                    const isLive = !!update
                    return (
                      <tr key={tag.id} className={isLive ? '' : 'text-muted'}>
                        <td>{tag.id}</td>
                        <td>
                          <span className="fw-medium">{tag.displayName}</span>
                          {isLive && (
                            <span
                              className="ms-2 rounded-circle bg-success d-inline-block"
                              style={{ width: 6, height: 6, animation: 'pulse 1.5s infinite' }}
                            />
                          )}
                        </td>
                        <td><code style={{ fontSize: 11 }}>{tag.nodeId}</code></td>
                        <td><Badge bg="light" text="dark" className="border">{tag.dataType}</Badge></td>
                        <td className="text-end fw-bold">
                          {isLive
                            ? <span style={{ color: '#0d6efd' }}>{formatValue(update!.value, tag.unit)}</span>
                            : '—'}
                        </td>
                        <td className="text-end text-muted" style={{ fontSize: 11 }}>
                          {tag.minValue !== undefined && tag.minValue !== null
                            ? `${tag.minValue} – ${tag.maxValue} ${tag.unit ?? ''}`
                            : '—'}
                        </td>
                        <td className="text-center">
                          {isLive
                            ? <StatusBadge quality={update!.quality} />
                            : <Badge bg="secondary" pill>No data</Badge>}
                        </td>
                        <td className="text-muted" style={{ fontSize: 11 }}>
                          {isLive ? formatTimestamp(update!.timestamp) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-5">
                        Žádné tagy odpovídají filtru
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
