import { useState } from 'react'
import {
  Card, Table, Badge, Button, Modal, Form,
  Row, Col, Alert, InputGroup,
} from 'react-bootstrap'
import { useTags } from '../hooks/useTags'
import { tagsApi } from '../api/tagsApi'
import { OpcDataType } from '../types'
import type { Tag } from '../types'

const DATA_TYPE_LABELS: Record<OpcDataType, string> = {
  [OpcDataType.Boolean]:  'Boolean',
  [OpcDataType.SByte]:    'SByte',
  [OpcDataType.Byte]:     'Byte',
  [OpcDataType.Int16]:    'Int16',
  [OpcDataType.UInt16]:   'UInt16',
  [OpcDataType.Int32]:    'Int32',
  [OpcDataType.UInt32]:   'UInt32',
  [OpcDataType.Int64]:    'Int64',
  [OpcDataType.UInt64]:   'UInt64',
  [OpcDataType.Float]:    'Float',
  [OpcDataType.Double]:   'Double',
  [OpcDataType.String]:   'String',
  [OpcDataType.DateTime]: 'DateTime',
}

const EMPTY_TAG: Omit<Tag, 'id' | 'createdAt'> = {
  nodeId: '', displayName: '', dataType: OpcDataType.Double,
  unit: '', minValue: undefined, maxValue: undefined, isActive: true,
}

export function TagsPage() {
  const { tags, loading, error, reload } = useTags()
  const [search, setSearch]   = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTag, setEditTag] = useState<Partial<Tag>>(EMPTY_TAG)
  const [saving, setSaving]   = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const filtered = tags.filter(t =>
    t.displayName.toLowerCase().includes(search.toLowerCase()) ||
    t.nodeId.toLowerCase().includes(search.toLowerCase())
  )

  function openNew() {
    setEditTag(EMPTY_TAG)
    setSaveError(null)
    setShowModal(true)
  }

  function openEdit(tag: Tag) {
    setEditTag({ ...tag })
    setSaveError(null)
    setShowModal(true)
  }

  async function handleSave() {
    if (!editTag.nodeId || !editTag.displayName) {
      setSaveError('NodeId a Název jsou povinné.')
      return
    }
    try {
      setSaving(true)
      if (editTag.id) {
        await tagsApi.update(editTag.id, editTag)
      } else {
        await tagsApi.create(editTag as Omit<Tag, 'id' | 'createdAt'>)
      }
      setShowModal(false)
      reload()
    } catch {
      setSaveError('Uložení selhalo.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(tag: Tag) {
    await tagsApi.setActive(tag.id, !tag.isActive)
    reload()
  }

  const set = (key: keyof Tag) => (e: React.ChangeEvent<HTMLElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement
    setEditTag(prev => ({ ...prev, [key]: target.type === 'number' ? parseFloat(target.value) : target.value }))
  }

  return (
    <div>
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <Row className="g-2 align-items-center">
            <Col md={6}>
              <InputGroup size="sm">
                <InputGroup.Text><i className="bi bi-search" /></InputGroup.Text>
                <Form.Control
                  placeholder="Hledat tag…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col className="text-end">
              <Button size="sm" variant="primary" onClick={openNew}>
                <i className="bi bi-plus-lg me-1" />Nový tag
              </Button>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-0">
          {error && <Alert variant="danger" className="m-3">{error}</Alert>}
          {loading ? (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border spinner-border-sm me-2" />Načítání…
            </div>
          ) : (
            <Table hover responsive className="mb-0" style={{ fontSize: 13 }}>
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Název</th>
                  <th>Node ID</th>
                  <th>Typ</th>
                  <th>Jednotka</th>
                  <th>Rozsah</th>
                  <th className="text-center">Stav</th>
                  <th className="text-center">Akce</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tag => (
                  <tr key={tag.id}>
                    <td className="text-muted">{tag.id}</td>
                    <td className="fw-medium">{tag.displayName}</td>
                    <td><code style={{ fontSize: 11 }}>{tag.nodeId}</code></td>
                    <td><Badge bg="light" text="dark" className="border">{DATA_TYPE_LABELS[tag.dataType]}</Badge></td>
                    <td>{tag.unit || <span className="text-muted">—</span>}</td>
                    <td className="text-muted" style={{ fontSize: 11 }}>
                      {tag.minValue !== undefined && tag.minValue !== null
                        ? `${tag.minValue} – ${tag.maxValue}`
                        : '—'}
                    </td>
                    <td className="text-center">
                      <Form.Check
                        type="switch"
                        checked={tag.isActive}
                        onChange={() => toggleActive(tag)}
                        label=""
                      />
                    </td>
                    <td className="text-center">
                      <Button variant="outline-secondary" size="sm" onClick={() => openEdit(tag)}>
                        <i className="bi bi-pencil" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-5">
                      <i className="bi bi-tags d-block fs-3 mb-2" />
                      Žádné tagy. Přidejte první tag tlačítkem "Nový tag".
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modální okno */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 16 }}>
            {editTag.id ? `Upravit tag #${editTag.id}` : 'Nový tag'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {saveError && <Alert variant="danger" className="mb-3">{saveError}</Alert>}
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ fontSize: 13 }}>Node ID *</Form.Label>
                <Form.Control
                  size="sm"
                  placeholder="ns=2;s=Tank1.Level"
                  value={editTag.nodeId ?? ''}
                  onChange={set('nodeId')}
                  disabled={!!editTag.id}
                />
                <Form.Text className="text-muted">Formát: ns=2;s=Oblast.Proměnná</Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ fontSize: 13 }}>Název *</Form.Label>
                <Form.Control size="sm" placeholder="Tank 1 – Hladina" value={editTag.displayName ?? ''} onChange={set('displayName')} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label style={{ fontSize: 13 }}>Datový typ</Form.Label>
                <Form.Select size="sm" value={editTag.dataType ?? OpcDataType.Double} onChange={set('dataType')}>
                  {Object.entries(DATA_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label style={{ fontSize: 13 }}>Jednotka</Form.Label>
                <Form.Control size="sm" placeholder="°C" value={editTag.unit ?? ''} onChange={set('unit')} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label style={{ fontSize: 13 }}>Min hodnota</Form.Label>
                <Form.Control size="sm" type="number" value={editTag.minValue ?? ''} onChange={set('minValue')} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label style={{ fontSize: 13 }}>Max hodnota</Form.Label>
                <Form.Control size="sm" type="number" value={editTag.maxValue ?? ''} onChange={set('maxValue')} />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={() => setShowModal(false)}>Zrušit</Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-1" />Ukládám…</> : 'Uložit'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
