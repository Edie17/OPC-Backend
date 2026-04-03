import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',           icon: 'bi-speedometer2',      label: 'Dashboard'       },
  { to: '/live',       icon: 'bi-activity',           label: 'Live Data'       },
  { to: '/oee',        icon: 'bi-bar-chart-line',     label: 'OEE'             },
  { to: '/roi',        icon: 'bi-cash-coin',          label: 'ROI / Investice' },
  { to: '/history',    icon: 'bi-clock-history',      label: 'Historie'        },
  { to: '/tags',       icon: 'bi-tags',               label: 'Správa tagů'     },
  { to: '/discovery',  icon: 'bi-diagram-3',          label: 'Discovery'       },
]

export function Sidebar() {
  return (
    <nav
      className="d-flex flex-column bg-dark text-white"
      style={{ width: 230, minHeight: '100vh', flexShrink: 0 }}
    >
      {/* Logo */}
      <div className="px-3 py-4 border-bottom border-secondary">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-cpu fs-4 text-primary" />
          <div>
            <div className="fw-bold lh-1">OPC-Backend</div>
            <small className="text-secondary" style={{ fontSize: 11 }}>Industrial IoT</small>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ul className="nav flex-column px-2 pt-3 flex-grow-1">
        {links.map(({ to, icon, label }) => (
          <li key={to} className="nav-item">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `nav-link d-flex align-items-center gap-2 rounded mb-1 px-3 py-2 ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-secondary hover-light'
                }`
              }
            >
              <i className={`bi ${icon}`} style={{ fontSize: 16 }} />
              <span style={{ fontSize: 14 }}>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="px-3 py-3 border-top border-secondary">
        <small className="text-secondary" style={{ fontSize: 11 }}>
          OPC UA Server v1.0
        </small>
      </div>
    </nav>
  )
}
