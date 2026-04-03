import { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Alert, Badge, ListGroup, Form, Spinner } from 'react-bootstrap'
import client from '../api/client'

interface PublicServer { name: string; url: string }

type SyncStatus = 'idle' | 'syncing' | 'done' | 'error'

export function DiscoveryPage() {
  const [servers, setServers]         = useState<PublicServer[]>([])
  const [selectedUrl, setSelectedUrl] = useState('')
  const [syncStatus, setSyncStatus]   = useState<SyncStatus>('idle')
  const [message, setMessage]         = useState('')

  useEffect(() => {
    client.get<PublicServer[]>('/discovery/servers').then(r => {
      setServers(r.data)
      if (r.data[0]) setSelectedUrl(r.data[0].url)
    })
  }, [])

  async function handleSync() {
    setSyncStatus('syncing')
    setMessage('')
    try {
      const r = await client.post<{ message: string }>('/discovery/sync')
      setMessage(r.data.message)
      setSyncStatus('done')
    } catch {
      setMessage('Sync selhal. Zkontroluj konzolu backendu.')
      setSyncStatus('error')
    }
  }

  return (
    <div>
      <p className="text-muted mb-4" style={{ fontSize: 14 }}>
        Připoj se na vzdálený OPC-UA server, automaticky zjisti dostupné uzly a importuj je jako tagy do databáze.
        Po importu začnou proudit živá data do dashboardu.
      </p>

      {/* Tok dat */}
      <Card className="border-0 shadow-sm mb-4 bg-dark text-white">
        <Card.Body className="py-3">
          <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap" style={{ fontSize: 13 }}>
            {[
              { icon: 'bi-server',          label: 'Vzdálený OPC-UA Server', color: '#0dcaf0' },
              { icon: 'bi-arrow-right',     label: '',                        color: '#6c757d' },
              { icon: 'bi-cpu',             label: 'OPC-UA Client',           color: '#0d6efd' },
              { icon: 'bi-arrow-right',     label: '',                        color: '#6c757d' },
              { icon: 'bi-database',        label: 'SQL DB (Tags)',           color: '#20c997' },
              { icon: 'bi-arrow-right',     label: '',                        color: '#6c757d' },
              { icon: 'bi-broadcast',       label: 'SignalR',                 color: '#ffc107' },
              { icon: 'bi-arrow-right',     label: '',                        color: '#6c757d' },
              { icon: 'bi-display',         label: 'Frontend',                color: '#198754' },
            ].map(({ icon, label, color }, i) => (
              label
                ? <span key={i} className="d-flex align-items-center gap-1">
                    <i className={`bi ${icon}`} style={{ color }} />
                    <span style={{ color }}>{label}</span>
                  </span>
                : <i key={i} className={`bi ${icon}`} style={{ color }} />
            ))}
          </div>
        </Card.Body>
      </Card>

      <Row className="g-3">
        {/* Výběr serveru */}
        <Col md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <h6 className="fw-semibold mb-3">
                <i className="bi bi-server me-2 text-primary" />Veřejné testovací servery
              </h6>

              <ListGroup variant="flush" className="mb-3">
                {servers.map(s => (
                  <ListGroup.Item
                    key={s.url}
                    action
                    active={selectedUrl === s.url}
                    onClick={() => setSelectedUrl(s.url)}
                    className="d-flex justify-content-between align-items-start py-2"
                    style={{ fontSize: 13 }}
                  >
                    <div>
                      <div className="fw-medium">{s.name}</div>
                      <code style={{ fontSize: 11 }}>{s.url}</code>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              <Form.Group>
                <Form.Label style={{ fontSize: 13 }}>Nebo vlastní URL</Form.Label>
                <Form.Control
                  size="sm"
                  placeholder="opc.tcp://host:port/path"
                  value={selectedUrl}
                  onChange={e => setSelectedUrl(e.target.value)}
                />
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>

        {/* Akce */}
        <Col md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <h6 className="fw-semibold mb-3">
                <i className="bi bi-lightning me-2 text-warning" />Spustit discovery
              </h6>

              <div className="mb-3 p-3 rounded bg-light" style={{ fontSize: 13 }}>
                <p className="mb-2"><strong>Co se stane:</strong></p>
                <ol className="mb-0 ps-3">
                  <li>Backend se připojí na <code style={{ fontSize: 11 }}>{selectedUrl || '…'}</code></li>
                  <li>Projde adresní prostor (max 4 úrovně)</li>
                  <li>Pro každý nový uzel vytvoří Tag v DB</li>
                  <li>Subscribuje na změny hodnot</li>
                  <li>Data začnou proudit přes SignalR do dashboardu</li>
                </ol>
              </div>

              <Button
                variant="primary"
                className="w-100 mb-3"
                onClick={handleSync}
                disabled={syncStatus === 'syncing' || !selectedUrl}
              >
                {syncStatus === 'syncing'
                  ? <><Spinner animation="border" size="sm" className="me-2" />Probíhá discovery…</>
                  : <><i className="bi bi-search me-2" />Spustit Discovery & Sync</>}
              </Button>

              {syncStatus === 'done' && (
                <Alert variant="success" className="mb-0">
                  <i className="bi bi-check-circle me-2" />{message}
                  <div className="mt-2" style={{ fontSize: 12 }}>
                    Přejdi na <strong>Live Data</strong> nebo <strong>Dashboard</strong> pro zobrazení dat.
                  </div>
                </Alert>
              )}
              {syncStatus === 'error' && (
                <Alert variant="danger" className="mb-0">
                  <i className="bi bi-exclamation-triangle me-2" />{message}
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Poznámky */}
      <Card className="border-0 shadow-sm mt-3">
        <Card.Body className="p-4">
          <h6 className="fw-semibold mb-2">
            <i className="bi bi-info-circle me-2 text-info" />Informace o serverech
          </h6>
          <Row className="g-2" style={{ fontSize: 13 }}>
            {[
              {
                name: 'opcuaserver.com:48010',
                desc: 'Prosys OPC UA Simulation Server — simuluje průmyslové měření (teplota, tlak, čítače)',
                badge: 'Doporučeno',
                color: 'success',
              },
              {
                name: 'milo.digitalpetri.com:62541',
                desc: 'Eclipse Milo Demo Server — open-source Java implementace, dynamické a statické uzly',
                badge: 'Stabilní',
                color: 'primary',
              },
              {
                name: 'demo.unified-automation.com:4840',
                desc: 'Unified Automation Demo — referenční implementace od tvůrců OPC UA specifikace',
                badge: 'Referenční',
                color: 'info',
              },
            ].map(s => (
              <Col key={s.name} md={4}>
                <div className="p-3 rounded bg-light h-100">
                  <div className="d-flex justify-content-between mb-1">
                    <code style={{ fontSize: 11 }}>{s.name}</code>
                    <Badge bg={s.color}>{s.badge}</Badge>
                  </div>
                  <p className="mb-0 text-muted">{s.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
    </div>
  )
}
