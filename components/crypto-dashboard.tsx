'use client'

import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useStore, getCoinColor } from '@/lib/store'
import { StatCard } from './stat-card'
import { PortfolioPie } from './portfolio-pie'
import { ValueChart } from './value-chart'
import { AddEntryDialog } from './add-entry-dialog'
import { InlineRename } from './inline-rename'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DeleteDashboardDialog } from './delete-dashboard-dialog'

// Binance logo icon inline
function BinanceLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Binance">
      <path d="M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.352 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595zm4.6366-4.6366L24 12l-2.7175 2.7164L18.568 12l2.693-2.7164zm-9.272 0l2.7175 2.7164-2.7175 2.7164-2.7164-2.7164 2.7164-2.7164zM12 0l7.353 7.353-2.7175 2.7164L12 5.4l-4.6366 4.6695L4.647 7.353 12 0z" />
    </svg>
  )
}

export function CryptoDashboard() {
  const cryptoHoldings = useStore((s) => s.cryptoHoldings)
  const removeCryptoHolding = useStore((s) => s.removeCryptoHolding)
  const dashboardTitles = useStore((s) => s.dashboardTitles)
  const renameDashboard = useStore((s) => s.renameDashboard)
  const clearAllCryptoData = useStore((s) => s.clearAllCryptoData)
  const currency = useStore((s) => s.userProfile.displayedCurrency ?? '$')

  const [selected, setSelected] = useState<string | null>(null)

  // Total crypto portfolio value
  const portfolioTotal = useMemo(
    () =>
      cryptoHoldings.reduce((sum, h) => {
        const snaps = h.snapshots
        return sum + (snaps.length > 0 ? snaps[snaps.length - 1].value : 0)
      }, 0),
    [cryptoHoldings]
  )

  const portfolioPrev = useMemo(
    () =>
      cryptoHoldings.reduce((sum, h) => {
        const snaps = h.snapshots
        return sum + (snaps.length > 1 ? snaps[snaps.length - 2].value : snaps.length === 1 ? snaps[0].value : 0)
      }, 0),
    [cryptoHoldings]
  )

  // Pie chart data
  const pieData = useMemo(
    () =>
      cryptoHoldings
        .map((h, i) => ({
          name: `${h.coin} (${h.symbol})`,
          value: h.snapshots.length > 0 ? h.snapshots[h.snapshots.length - 1].value : 0,
          color: getCoinColor(h.symbol, i),
        }))
        .filter((d) => d.value > 0),
    [cryptoHoldings]
  )

  // Portfolio total over time
  const portfolioSeries = useMemo(() => {
    const allTs = Array.from(
      new Set(cryptoHoldings.flatMap((h) => h.snapshots.map((s) => s.timestamp)))
    ).sort((a, b) => a - b)

    if (!allTs.length) return []

    const data = allTs.map((ts) => {
      let total = 0
      cryptoHoldings.forEach((h) => {
        const snaps = h.snapshots.filter((s) => s.timestamp <= ts)
        if (snaps.length) total += snaps[snaps.length - 1].value
      })
      return { timestamp: ts, value: total }
    })

    return [{ id: 'portfolio', name: 'Total Crypto', color: 'oklch(0.72 0.19 45)', data }]
  }, [cryptoHoldings])

  // Individual holding series (for selected view)
  const holdingSeries = useMemo(() => {
    return cryptoHoldings.map((h, i) => ({
      id: h.id,
      name: h.symbol,
      color: getCoinColor(h.symbol, i),
      data: h.snapshots.map((s) => ({ timestamp: s.timestamp, value: s.value })),
    }))
  }, [cryptoHoldings])

  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[oklch(0.72_0.19_45_/_0.15)]">
            <BinanceLogo className="w-4 h-4 text-[oklch(0.72_0.19_45)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <InlineRename
                value={dashboardTitles.crypto}
                onSave={(t) => renameDashboard('crypto', t)}
                className="text-xl font-semibold text-foreground leading-none"
              />
              <DeleteDashboardDialog
                dashboardName={dashboardTitles.crypto}
                onConfirm={clearAllCryptoData}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{cryptoHoldings.length} holdings</p>
          </div>
        </div>
        <AddEntryDialog mode="new-crypto" triggerLabel="Add Holding" />
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Crypto Value"
          value={portfolioTotal}
          previousValue={portfolioPrev}
          accentColor="oklch(0.72 0.19 45)"
          className="sm:col-span-2 lg:col-span-2"
        />
        {cryptoHoldings.slice(0, 2).map((h, i) => {
          const snaps = h.snapshots
          const cur = snaps.length > 0 ? snaps[snaps.length - 1].value : 0
          const prev = snaps.length > 1 ? snaps[snaps.length - 2].value : cur
          return (
            <StatCard
              key={h.id}
              label={`${h.coin} (${h.symbol})`}
              value={cur}
              previousValue={prev}
              accentColor={getCoinColor(h.symbol, i)}
            />
          )
        })}
      </div>

      {/* Pie + total chart */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-foreground">Holdings Distribution</h2>
          <p className="text-xs text-muted-foreground">By current value</p>
          <PortfolioPie data={pieData} height={240} />
        </div>

        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-foreground">Portfolio Value History</h2>
          <p className="text-xs text-muted-foreground">
            Time-proportional x-axis — gaps reflect actual time between entries
          </p>
          <ValueChart series={portfolioSeries} height={240} />
        </div>
      </div>

      {/* Individual holdings list */}
      <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Individual Holdings</h2>
          <span className="text-xs text-muted-foreground">Click to view history</span>
        </div>

        {cryptoHoldings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No holdings yet. Add your first crypto holding.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {cryptoHoldings.map((h, i) => {
              const snaps = h.snapshots
              const cur = snaps.length > 0 ? snaps[snaps.length - 1].value : 0
              const prev = snaps.length > 1 ? snaps[snaps.length - 2].value : 0
              const change = prev > 0 ? cur - prev : null
              const changePct = change !== null && prev > 0 ? (change / prev) * 100 : null
              const color = getCoinColor(h.symbol, i)
              const isSelected = selected === h.id

              return (
                <div key={h.id} className="flex flex-col gap-0">
                  <div
                    role="button"
                    tabIndex={0}
                    className={cn(
                      'flex items-center gap-4 w-full rounded-lg px-4 py-3 transition-colors text-left cursor-pointer',
                      isSelected
                        ? 'bg-[oklch(0.22_0_0)]'
                        : 'hover:bg-[oklch(0.20_0_0)]'
                    )}
                    onClick={() => setSelected(isSelected ? null : h.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelected(isSelected ? null : h.id)}
                  >
                    {/* Color dot */}
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm text-foreground">{h.coin}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">{h.symbol}</span>
                    </div>
                    {/* Raw balance */}
                    {h.rawBalance != null && (
                      <span className="text-xs text-muted-foreground font-mono hidden sm:block">
                        {h.rawBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {h.symbol}
                      </span>
                    )}
                    {/* Value */}
                    <span className="text-sm font-semibold text-foreground">
                      {currency}{cur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {/* Change */}
                    {changePct !== null && (
                      <span
                        className={cn(
                          'text-xs font-medium px-1.5 py-0.5 rounded',
                          changePct >= 0
                            ? 'text-[oklch(0.70_0.16_155)] bg-[oklch(0.70_0.16_155_/_0.12)]'
                            : 'text-[oklch(0.60_0.20_25)] bg-[oklch(0.60_0.20_25_/_0.12)]'
                        )}
                      >
                        {changePct >= 0 ? '+' : ''}
                        {changePct.toFixed(2)}%
                      </span>
                    )}
                    {/* Actions */}
                    <div
                      className="flex items-center gap-1 ml-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <AddEntryDialog
                        mode="update-crypto"
                        holdingId={h.id}
                        triggerVariant="ghost"
                        triggerSize="icon"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-[oklch(0.60_0.20_25)]"
                        onClick={() => removeCryptoHolding(h.id)}
                        aria-label="Remove holding"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded chart */}
                  {isSelected && (
                    <div className="bg-[oklch(0.18_0_0)] rounded-lg mx-2 mb-1 p-4">
                      <p className="text-xs text-muted-foreground mb-3">
                        {h.coin} value history · {snaps.length} data points
                      </p>
                      <ValueChart
                        series={[
                          {
                            id: h.id,
                            name: h.symbol,
                            color,
                            data: snaps.map((s) => ({ timestamp: s.timestamp, value: s.value })),
                          },
                        ]}
                        height={180}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* All holdings chart */}
      {cryptoHoldings.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-foreground">All Holdings Comparison</h2>
          <p className="text-xs text-muted-foreground">Individual holding values over time</p>
          <ValueChart series={holdingSeries} height={240} />
        </div>
      )}
    </div>
  )
}
