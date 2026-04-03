// ── Enums jako const objekty (kompatibilní s erasableSyntaxOnly) ───────────

export const OpcDataType = {
  Boolean:  0,
  SByte:    1,
  Byte:     2,
  Int16:    3,
  UInt16:   4,
  Int32:    5,
  UInt32:   6,
  Int64:    7,
  UInt64:   8,
  Float:    9,
  Double:   10,
  String:   11,
  DateTime: 12,
} as const
export type OpcDataType = typeof OpcDataType[keyof typeof OpcDataType]

export const QualityCode = {
  Good:      0,
  Bad:       1,
  Uncertain: 2,
} as const
export type QualityCode = typeof QualityCode[keyof typeof QualityCode]

// ── API modely ─────────────────────────────────────────────────────────────

export interface Tag {
  id: number
  nodeId: string
  displayName: string
  dataType: OpcDataType
  unit?: string
  minValue?: number
  maxValue?: number
  isActive: boolean
  createdAt: string
}

export interface TagValue {
  tagId: number
  value?: string
  quality: QualityCode
  timestamp: string
}

export interface HistoricalValue {
  id: number
  tagId: number
  value?: string
  quality: QualityCode
  timestamp: string
}

// ── SignalR payload ────────────────────────────────────────────────────────

export interface TagValueUpdate {
  tagId: number
  value?: string
  quality: number
  timestamp: string
}

// ── KPI modely ─────────────────────────────────────────────────────────────

export interface OeeMetrics {
  availability: number
  performance: number
  quality: number
  oee: number
}

export interface RoiInputs {
  investmentCzk: number
  annualSavingsCzk: number
  discountRate: number
  years: number
}

export interface RoiResult {
  paybackYears: number
  npv: number
  roi: number
  irr: number
}

export interface ShiftSummary {
  shift: string
  plannedMinutes: number
  downtimeMinutes: number
  totalParts: number
  goodParts: number
  theoreticalCycleMin: number
}
