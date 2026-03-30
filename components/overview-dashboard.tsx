'use client'

import { useMemo } from 'react'
import { LayoutDashboard, TrendingUp } from 'lucide-react'
import { useStore, getCoinColor } from '@/lib/store'
import { StatCard } from './stat-card'
import { PortfolioPie } from './portfolio-pie'
import { ValueChart } from './value-chart'
import { InlineRename } from './inline-rename'

const ORANGE = 'oklch(0.72 0.19 45)'

export function OverviewDashboard() {
  const cryptoHoldings = useStore((s) => s.cryptoHoldings)
  const bankAccounts = useStore((s) => s.bankAccounts)
  const dashboardTitles = useStore((s) => s.dashboardTitles)
  const renameDashboard = useStore((s) => s.renameDashboard)

  // Current and previous values per asset
  const cryptoTotal = useMemo(() => {
    return cryptoHoldings.reduce((sum, h) => {
      const snaps = h.snapshots
      return sum + (snaps.length > 0 ? snaps[snaps.length - 1].value : 0)
    }, 0)
  }, [cryptoHoldings])

  const cryptoPrev = useMemo(() => {
    return cryptoHoldings.reduce((sum, h) => {
      const snaps = h.snapshots
      return sum + (snaps.length > 1 ? snaps[snaps.length - 2].value : snaps.length === 1 ? snaps[0].value : 0)
    }, 0)
  }, [cryptoHoldings])

  const bankTotal = useMemo(() => {
    return bankAccounts.reduce((sum, a) => {
      const snaps = a.snapshots
      return sum + (snaps.length > 0 ? snaps[snaps.length - 1].value : 0)
    }, 0)
  }, [bankAccounts])

  const bankPrev = useMemo(() => {
    return bankAccounts.reduce((sum, a) => {
      const snaps = a.snapshots
      return sum + (snaps.length > 1 ? snaps[snaps.length - 2].value : snaps.length === 1 ? snaps[0].value : 0)
    }, 0)
  }, [bankAccounts])

  const totalNet = cryptoTotal + bankTotal
  const totalPrev = cryptoPrev + bankPrev

  // Pie data: 2 slices — Crypto vs Bank
  const pieData = [
    { name: 'Crypto', value: cryptoTotal, color: 'oklch(0.72 0.19 45)' },
    { name: 'Bank', value: bankTotal, color: 'oklch(0.65 0.15 200)' },
  ].filter((d) => d.value > 0)

  // Combined time-series chart: merge all snapshots into total-portfolio values
  const allSnapshots = useMemo(() => {
    const all: { timestamp: number; type: 'crypto' | 'bank'; id: string; value: number }[] = []
    cryptoHoldings.forEach((h) =>
      h.snapshots.forEach((s) => all.push({ timestamp: s.timestamp, type: 'crypto', id: h.id, value: s.value }))
    )
    bankAccounts.forEach((a) =>
      a.snapshots.forEach((s) => all.push({ timestamp: s.timestamp, type: 'bank', id: a.id, value: s.value }))
    )
    return all
  }, [cryptoHoldings, bankAccounts])

  // Build portfolio-total series for the overview chart
  const overviewSeries = useMemo(() => {
    const allTs = Array.from(new Set(allSnapshots.map((s) => s.timestamp))).sort((a, b) => a - b)
    if (!allTs.length) return []

    const cryptoData = allTs.map((ts) => {
      let total = 0
      cryptoHoldings.forEach((h) => {
        const snaps = h.snapshots.filter((s) => s.timestamp <= ts)
        if (snaps.length) total += snaps[snaps.length - 1].value
      })
      return { timestamp: ts, value: total }
    })

    const bankData = allTs.map((ts) => {
      let total = 0
      bankAccounts.forEach((a) => {
        const snaps = a.snapshots.filter((s) => s.timestamp <= ts)
        if (snaps.length) total += snaps[snaps.length - 1].value
      })
      return { timestamp: ts, value: total }
    })

    const totalData = allTs.map((ts, i) => ({
      timestamp: ts,
      value: cryptoData[i].value + bankData[i].value,
    }))

    return [
      { id: 'crypto', name: 'Crypto', color: 'oklch(0.72 0.19 45)', data: cryptoData },
      { id: 'bank', name: 'Bank', color: 'oklch(0.65 0.15 200)', data: bankData },
      { id: 'total', name: 'Total', color: '#ffffff', data: totalData },
    ]
  }, [allSnapshots, cryptoHoldings, bankAccounts])

  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[oklch(0.72_0.19_45_/_0.15)]">
          <LayoutDashboard className="w-4 h-4 text-[oklch(0.72_0.19_45)]" />
        </div>
          <div>
            <InlineRename
              value={dashboardTitles.overview}
              onSave={(t) => renameDashboard('overview', t)}
              className="text-xl font-semibold text-foreground leading-none"
            />
            <p className="text-xs text-muted-foreground mt-0.5">All investments combined</p>
          </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Net Worth"
          value={totalNet}
          previousValue={totalPrev}
          icon={<TrendingUp className="w-3.5 h-3.5 text-[oklch(0.72_0.19_45)]" />}
          accentColor={ORANGE}
        />
        <StatCard
          label="Crypto Portfolio"
          value={cryptoTotal}
          previousValue={cryptoPrev}
          accentColor="oklch(0.72 0.19 45)"
        />
        <StatCard
          label="Bank Accounts"
          value={bankTotal}
          previousValue={bankPrev}
          accentColor="oklch(0.65 0.15 200)"
        />
      </div>

      {/* Pie + Chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Allocation pie */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-foreground">Asset Allocation</h2>
          <p className="text-xs text-muted-foreground">Crypto vs Bank</p>
          <PortfolioPie data={pieData} height={240} />
        </div>

        {/* Total portfolio chart */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-foreground">Portfolio History</h2>
          <p className="text-xs text-muted-foreground">
            Value over time — x-axis reflects actual time spacing between entries
          </p>
          <ValueChart series={overviewSeries} height={240} />
        </div>
      </div>
    </div>
  )
}
