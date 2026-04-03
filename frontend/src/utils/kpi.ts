import type { OeeMetrics, RoiInputs, RoiResult, ShiftSummary } from '../types'

// ── OEE výpočty ────────────────────────────────────────────────────────────

export function calculateOee(shift: ShiftSummary): OeeMetrics {
  const operatingTime = shift.plannedMinutes - shift.downtimeMinutes
  const availability  = operatingTime / shift.plannedMinutes

  const actualOutput      = shift.totalParts
  const theoreticalOutput = operatingTime / shift.theoreticalCycleMin
  const performance = theoreticalOutput > 0
    ? Math.min(actualOutput / theoreticalOutput, 1)
    : 0

  const quality = shift.totalParts > 0
    ? shift.goodParts / shift.totalParts
    : 0

  return {
    availability,
    performance,
    quality,
    oee: availability * performance * quality,
  }
}

export function toPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)} %`
}

export function oeeColor(oee: number): string {
  if (oee >= 0.85) return '#198754'   // green – World Class
  if (oee >= 0.65) return '#ffc107'   // yellow – Average
  return '#dc3545'                     // red – Below Average
}

// ── ROI výpočty ────────────────────────────────────────────────────────────

export function calculateRoi(inputs: RoiInputs): RoiResult {
  const { investmentCzk, annualSavingsCzk, discountRate, years } = inputs
  const r = discountRate / 100

  // NPV = Σ (savings / (1+r)^t) - investment
  let npv = -investmentCzk
  for (let t = 1; t <= years; t++) {
    npv += annualSavingsCzk / Math.pow(1 + r, t)
  }

  const paybackYears = investmentCzk / annualSavingsCzk

  const roi = ((annualSavingsCzk * years - investmentCzk) / investmentCzk) * 100

  // IRR – Newton-Raphson aproximace
  const irr = approximateIrr(investmentCzk, annualSavingsCzk, years)

  return { paybackYears, npv, roi, irr }
}

function approximateIrr(investment: number, annualCashFlow: number, years: number): number {
  let rate = 0.1
  for (let i = 0; i < 100; i++) {
    let npv = -investment
    let dnpv = 0
    for (let t = 1; t <= years; t++) {
      const factor = Math.pow(1 + rate, t)
      npv  += annualCashFlow / factor
      dnpv -= (t * annualCashFlow) / (factor * (1 + rate))
    }
    const delta = npv / dnpv
    rate -= delta
    if (Math.abs(delta) < 1e-6) break
  }
  return rate * 100
}

// ── Demo data (použijí se pokud nejsou reálná data) ────────────────────────

export const DEMO_SHIFT: ShiftSummary = {
  shift:               'Ranní',
  plannedMinutes:      480,
  downtimeMinutes:     38,
  totalParts:          1240,
  goodParts:           1196,
  theoreticalCycleMin: 0.35,
}

export const DEMO_ROI: RoiInputs = {
  investmentCzk:    1_500_000,
  annualSavingsCzk:   480_000,
  discountRate:     5,
  years:            10,
}
