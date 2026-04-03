import { Badge } from 'react-bootstrap'
import type { SignalRStatus } from '../../hooks/useSignalR'

interface Props {
  title: string
  signalRStatus: SignalRStatus
}

const statusConfig: Record<SignalRStatus, { variant: string; label: string }> = {
  connected:    { variant: 'success', label: 'Live'           },
  connecting:   { variant: 'warning', label: 'Připojování…'  },
  disconnected: { variant: 'secondary', label: 'Odpojeno'    },
  error:        { variant: 'danger',  label: 'Chyba spojení' },
}

export function TopBar({ title, signalRStatus }: Props) {
  const { variant, label } = statusConfig[signalRStatus]

  return (
    <div
      className="d-flex align-items-center justify-content-between px-4 py-3 bg-white border-bottom"
      style={{ height: 60 }}
    >
      <h5 className="mb-0 fw-semibold">{title}</h5>

      <div className="d-flex align-items-center gap-3">
        <div className="d-flex align-items-center gap-2">
          <span
            className="rounded-circle"
            style={{
              width: 8, height: 8, display: 'inline-block',
              backgroundColor: variant === 'success' ? '#198754'
                : variant === 'warning' ? '#ffc107'
                : variant === 'danger'  ? '#dc3545' : '#6c757d',
              animation: signalRStatus === 'connected' ? 'pulse 2s infinite' : 'none',
            }}
          />
          <small className="text-muted">{label}</small>
        </div>
        <Badge bg="light" text="dark" className="border">
          <i className="bi bi-clock me-1" />
          {new Date().toLocaleTimeString('cs-CZ')}
        </Badge>
      </div>
    </div>
  )
}
