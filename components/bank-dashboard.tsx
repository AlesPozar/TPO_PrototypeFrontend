'use client'

import { useMemo, useState } from 'react'
import { Wallet, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { StatCard } from './stat-card'
import { ValueChart } from './value-chart'
import { AddEntryDialog } from './add-entry-dialog'
import { InlineRename } from './inline-rename'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AIStatementUpload } from './ai-statement-upload'
import { DeleteDashboardDialog } from './delete-dashboard-dialog'

export function BankDashboard() {
  const bankAccounts = useStore((s) => s.bankAccounts)
  const removeBankAccount = useStore((s) => s.removeBankAccount)
  const dashboardTitles = useStore((s) => s.dashboardTitles)
  const renameDashboard = useStore((s) => s.renameDashboard)
  const clearAllBankData = useStore((s) => s.clearAllBankData)
  const currency = useStore((s) => s.userProfile.displayedCurrency ?? '$')

  const [selected, setSelected] = useState<string | null>(null)

  const bankTotal = useMemo(
    () =>
      bankAccounts.reduce((sum, a) => {
        const snaps = a.snapshots
        return sum + (snaps.length > 0 ? snaps[snaps.length - 1].value : 0)
      }, 0),
    [bankAccounts]
  )

  const bankPrev = useMemo(
    () =>
      bankAccounts.reduce((sum, a) => {
        const snaps = a.snapshots
        return sum + (snaps.length > 1 ? snaps[snaps.length - 2].value : snaps.length === 1 ? snaps[0].value : 0)
      }, 0),
    [bankAccounts]
  )

  const totalSeries = useMemo(() => {
    const allTs = Array.from(
      new Set(bankAccounts.flatMap((a) => a.snapshots.map((s) => s.timestamp)))
    ).sort((a, b) => a - b)
    if (!allTs.length) return []
    const data = allTs.map((ts) => {
      let total = 0
      bankAccounts.forEach((a) => {
        const snaps = a.snapshots.filter((s) => s.timestamp <= ts)
        if (snaps.length) total += snaps[snaps.length - 1].value
      })
      return { timestamp: ts, value: total }
    })
    return [{ id: 'total', name: 'Total Bank', color: 'oklch(0.65 0.15 200)', data }]
  }, [bankAccounts])

  const allAccountSeries = useMemo(
    () =>
      bankAccounts.map((a) => ({
        id: a.id,
        name: a.name,
        color: a.color,
        data: a.snapshots.map((s) => ({ timestamp: s.timestamp, value: s.value })),
      })),
    [bankAccounts]
  )

  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[oklch(0.65_0.15_200_/_0.15)]">
            <Wallet className="w-4 h-4 text-[oklch(0.65_0.15_200)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <InlineRename
                value={dashboardTitles.bank}
                onSave={(t) => renameDashboard('bank', t)}
                className="text-xl font-semibold text-foreground leading-none"
              />
              <DeleteDashboardDialog
                dashboardName={dashboardTitles.bank}
                onConfirm={clearAllBankData}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{bankAccounts.length} accounts</p>
          </div>
        </div>
        <AddEntryDialog mode="new-bank" triggerLabel="Add Account" />
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Bank Balance"
          value={bankTotal}
          previousValue={bankPrev}
          accentColor="oklch(0.65 0.15 200)"
          className="sm:col-span-2 lg:col-span-2"
        />
        {bankAccounts.slice(0, 2).map((a) => {
          const snaps = a.snapshots
          const cur = snaps.length > 0 ? snaps[snaps.length - 1].value : 0
          const prev = snaps.length > 1 ? snaps[snaps.length - 2].value : cur
          return (
            <StatCard key={a.id} label={a.name} value={cur} previousValue={prev} accentColor={a.color} />
          )
        })}
      </div>

      {/* Total balance chart */}
      <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-foreground">Total Balance History</h2>
        <p className="text-xs text-muted-foreground">Time-proportional x-axis — gaps reflect actual time between entries</p>
        <ValueChart series={totalSeries} height={240} />
      </div>

      {/* Individual accounts list */}
      <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Accounts</h2>
          <span className="text-xs text-muted-foreground">Click to view history</span>
        </div>

        {bankAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No accounts yet. Add your first bank account.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {bankAccounts.map((a) => {
              const snaps = a.snapshots
              const cur = snaps.length > 0 ? snaps[snaps.length - 1].value : 0
              const prev = snaps.length > 1 ? snaps[snaps.length - 2].value : 0
              const change = prev > 0 ? cur - prev : null
              const changePct = change !== null && prev > 0 ? (change / prev) * 100 : null
              const isSelected = selected === a.id

              return (
                <div key={a.id} className="flex flex-col">
                  {/* Row — using div not button to avoid nesting buttons inside */}
                  <div
                    role="button"
                    tabIndex={0}
                    className={cn(
                      'flex items-center gap-4 w-full rounded-lg px-4 py-3 transition-colors cursor-pointer select-none',
                      isSelected ? 'bg-[oklch(0.22_0_0)]' : 'hover:bg-[oklch(0.20_0_0)]'
                    )}
                    onClick={() => setSelected(isSelected ? null : a.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelected(isSelected ? null : a.id)
                      }
                    }}
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: a.color }} />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm text-foreground">{a.name}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">
                        {snaps.length} {snaps.length === 1 ? 'entry' : 'entries'}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {currency}{cur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {changePct !== null && (
                      <span
                        className={cn(
                          'text-xs font-medium px-1.5 py-0.5 rounded',
                          changePct >= 0
                            ? 'text-[oklch(0.70_0.16_155)] bg-[oklch(0.70_0.16_155_/_0.12)]'
                            : 'text-[oklch(0.60_0.20_25)] bg-[oklch(0.60_0.20_25_/_0.12)]'
                        )}
                      >
                        {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                      </span>
                    )}
                    {/* Stop propagation so clicking buttons doesn't toggle the row */}
                    <div
                      className="flex items-center gap-1 ml-1"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <AddEntryDialog mode="update-bank" accountId={a.id} triggerVariant="ghost" triggerSize="icon" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-[oklch(0.60_0.20_25)]"
                        onClick={() => removeBankAccount(a.id)}
                        aria-label="Remove account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="bg-[oklch(0.18_0_0)] rounded-lg mx-2 mb-1 p-4">
                      <p className="text-xs text-muted-foreground mb-3">
                        {a.name} balance history · {snaps.length} data points
                      </p>
                      <ValueChart
                        series={[{
                          id: a.id,
                          name: a.name,
                          color: a.color,
                          data: snaps.map((s) => ({ timestamp: s.timestamp, value: s.value })),
                        }]}
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

      {bankAccounts.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-foreground">Account Comparison</h2>
          <p className="text-xs text-muted-foreground">Balance history per account</p>
          <ValueChart series={allAccountSeries} height={220} />
        </div>
      )}

      {/* AI Statement Upload Floating Button */}
      <AIStatementUpload />
    </div>
  )
}
