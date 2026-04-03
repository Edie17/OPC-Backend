import { Row, Col, Card, Table, Badge } from 'react-bootstrap'
import { KpiCard } from '../components/kpi/KpiCard'
import { OeePanel } from '../components/kpi/OeePanel'
import { StatusBadge } from '../components/shared/StatusBadge'
import { useTags } from '../hooks/useTags'
import { calculateOee, DEMO_SHIFT, toPercent } from '../utils/kpi'
import { formatValue, formatTimestamp } from '../utils/formatters'
import type { TagValueUpdate } from '../types'

interface Props {
  updates: Map<number, TagValueUpdate>
}

export function DashboardPage({ updates }: Props) {
  const { tags } = useTags()
  const metrics  = calculateOee(DEMO_SHIFT)

  const activeTags  = tags.filter(t => t.isActive).length
  const liveUpdates = updates.size

  const kpiCards = [
    {
      title:    'OEE',
      value:    toPercent(metrics.oee),
      subtitle: 'Overall Equipment Effectiveness',
      icon:     'bi-bar-chart-fill',
      color:    '#0d6efd',
      trend:    2.4,
    },
    {
      title:    'Aktivní tagy',
      value:    activeTags.toString(),
      subtitle: `${liveUpdates} live aktualizací`,
      icon:     'bi-tags-fill',
      color:    '#198754',
    },
    {
      title:    'Dostupnost',
      value:    toPercent(metrics.availability),
      subtitle: `${DEMO_SHIFT.downtimeMinutes} min prostoje`,
      icon:     'bi-clock-fill',
      color:    '#6610f2',
      trend:    -1.1,
    },
    {
      title:    'Dobrých kusů',
      value:    DEMO_SHIFT.goodParts.toLocaleString('cs-CZ'),
      subtitle: `z ${DEMO_SHIFT.totalParts.toLocaleString('cs-CZ')} celkem`,
      icon:     'bi-check-circle-fill',
      color:    '#198754',
      trend:    0.8,
    },
    {
      title:    'Výkonnost',
      value:    toPercent(metrics.performance),
      subtitle: 'vs. teoretické maximum',
      icon:     'bi-lightning-fill',
      color:    '#ffc107',
    },
    {
      title:    'Kvalita',
      value:    toPercent(metrics.quality),
      subtitle: `${DEMO_SHIFT.totalParts - DEMO_SHIFT.goodParts} zmetků`,
      icon:     'bi-shield-fill-check',
      color:    '#20c997',
      trend:    1.2,
    },
  ]

  return (
    <div>
      {/* KPI karty */}
      <Row className="g-3 mb-4">
        {kpiCards.map(card => (
          <Col key={card.title} xs={12} sm={6} xl={4}>
            <KpiCard {...card} />
          </Col>
        ))}
      </Row>

      {/* OEE panel */}
      <div className="mb-4">
        <h6 className="fw-semibold mb-3 text-muted text-uppercase" style={{ fontSize: 12, letterSpacing: 1 }}>
          OEE — Aktuální směna
        </h6>
        <OeePanel metrics={metrics} />
      </div>

      {/* Live tag tabulka */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3">
          <span className="fw-semibold">Live hodnoty tagů</span>
          <Badge bg="success" pill>
            <i className="bi bi-broadcast me-1" />
            {updates.size} aktualizací
          </Badge>
        </Card.Header>
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0" style={{ fontSize: 13 }}>
            <thead className="table-light">
              <tr>
                <th>Název</th>
                <th>Node ID</th>
                <th className="text-end">Hodnota</th>
                <th className="text-center">Kvalita</th>
                <th>Čas</th>
              </tr>
            </thead>
            <tbody>
              {tags.slice(0, 10).map(tag => {
                const update = updates.get(tag.id)
                return (
                  <tr key={tag.id}>
                    <td className="fw-medium">{tag.displayName}</td>
                    <td><code className="text-muted" style={{ fontSize: 11 }}>{tag.nodeId}</code></td>
                    <td className="text-end fw-semibold">
                      {update ? formatValue(update.value, tag.unit) : <span className="text-muted">—</span>}
                    </td>
                    <td className="text-center">
                      {update
                        ? <StatusBadge quality={update.quality} />
                        : <Badge bg="secondary" pill>No data</Badge>}
                    </td>
                    <td className="text-muted">
                      {update ? formatTimestamp(update.timestamp) : '—'}
                    </td>
                  </tr>
                )
              })}
              {tags.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-5">
                    <i className="bi bi-tags d-block fs-3 mb-2" />
                    Žádné tagy. Přidejte tagy v sekci Správa tagů.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  )
}
