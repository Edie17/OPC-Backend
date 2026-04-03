import { QualityCode } from '../types'

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('cs-CZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export function formatValue(value?: string, unit?: string): string {
  if (value === undefined || value === null) return '—'
  return unit ? `${value} ${unit}` : value
}

export function qualityLabel(quality: QualityCode | number): string {
  switch (quality) {
    case QualityCode.Good:      return 'Good'
    case QualityCode.Bad:       return 'Bad'
    case QualityCode.Uncertain: return 'Uncertain'
    default:                    return 'Unknown'
  }
}

export function qualityVariant(quality: QualityCode | number): string {
  switch (quality) {
    case QualityCode.Good:      return 'success'
    case QualityCode.Bad:       return 'danger'
    case QualityCode.Uncertain: return 'warning'
    default:                    return 'secondary'
  }
}

export function formatCzk(value: number): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(value)
}
