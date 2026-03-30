'use client'

import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { Trash2, Copy, Check, RefreshCw, Loader2 } from 'lucide-react'
import { useStore, getCoinColor, type CryptoWallet } from '@/lib/store'
import { StatCard } from './stat-card'
import { PortfolioPie } from './portfolio-pie'
import { ValueChart } from './value-chart'
import { AddEntryDialog } from './add-entry-dialog'
import { InlineRename } from './inline-rename'
import { WalletIcon, WALLET_OPTIONS } from './wallet-icons'
import { PriceHistoryChart } from './price-history-chart'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const COOLDOWN_MS = 10_000      // 10 seconds
const AUTO_REFRESH_MS = 120_000 // 2 minutes

type WalletDashboardProps = {
  walletId: string
  onDeleted: () => void
}

export function WalletDashboard({ walletId, onDeleted }: WalletDashboardProps) {
  const wallet = useStore((s) => s.cryptoWallets.find((w) => w.id === walletId))
  const renameWallet = useStore((s) => s.renameWallet)
  const removeWallet = useStore((s) => s.removeWallet)
  const removeWalletHolding = useStore((s) => s.removeWalletHolding)
  const setWalletHoldingsFromFetch = useStore((s) => s.setWalletHoldingsFromFetch)

  const [selected, setSelected] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [cooldown, setCooldown] = useState(0)          // seconds remaining
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [refreshError, setRefreshError] = useState('')
  const [moralisKeyMissing, setMoralisKeyMissing] = useState(false)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const walletOption = WALLET_OPTIONS.find((o) => o.type === wallet?.type)

  const fetchBalances = useCallback(async () => {
    if (!wallet?.address) return
    setRefreshing(true)
    setRefreshError('')
    try {
      const res = await fetch(`/api/wallet-balances?address=${encodeURIComponent(wallet.address)}`)
      const json = await res.json()
      if (!res.ok || json.error) {
        setRefreshError(json.error ?? 'Failed to refresh.')
      } else {
        if (json.moralisKeyMissing) setMoralisKeyMissing(true)
        if (Array.isArray(json.holdings) && json.holdings.length > 0) {
          setWalletHoldingsFromFetch(walletId, json.holdings)
          setLastRefreshed(new Date())
        }
      }
    } catch {
      setRefreshError('Network error — could not refresh balances.')
    } finally {
      setRefreshing(false)
    }
  }, [wallet?.address, walletId, setWalletHoldingsFromFetch])

  function startCooldown() {
    setCooldown(COOLDOWN_MS / 1000)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownRef.current!)
          cooldownRef.current = null
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  async function handleRefresh() {
    if (cooldown > 0 || refreshing) return
    startCooldown()
    await fetchBalances()
  }

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBalances()
    }, AUTO_REFRESH_MS)
    return () => clearInterval(interval)
  }, [fetchBalances])

  // Cleanup cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [])

  function copyAddress() {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleDelete() {
    removeWallet(walletId)
    onDeleted()
  }

  const holdings = wallet?.holdings ?? []

  const portfolioTotal = useMemo(
    () =>
      holdings.reduce((sum, h) => {
        const snaps = h.snapshots
        return sum + (snaps.length > 0 ? snaps[snaps.length - 1].value : 0)
      }, 0),
    [holdings]
  )

  const portfolioPrev = useMemo(
    () =>
      holdings.reduce((sum, h) => {
        const snaps = h.snapshots
        return sum + (snaps.length > 1 ? snaps[snaps.length - 2].value : snaps.length === 1 ? snaps[0].value : 0)
      }, 0),
    [holdings]
  )

  const pieData = useMemo(
    () =>
      holdings
        .map((h, i) => ({
          name: `${h.coin} (${h.symbol})`,
          value: h.snapshots.length > 0 ? h.snapshots[h.snapshots.length - 1].value : 0,
          color: getCoinColor(h.symbol, i),
        }))
        .filter((d) => d.value > 0),
    [holdings]
  )

  const portfolioSeries = useMemo(() => {
    const allTs = Array.from(
      new Set(holdings.flatMap((h) => h.snapshots.map((s) => s.timestamp)))
    ).sort((a, b) => a - b)

    if (!allTs.length) return []

    const data = allTs.map((ts) => {
      let total = 0
      holdings.forEach((h) => {
        const snaps = h.snapshots.filter((s) => s.timestamp <= ts)
        if (snaps.length) total += snaps[snaps.length - 1].value
      })
      return { timestamp: ts, value: total }
    })

    return [{ id: 'portfolio', name: 'Total', color: walletOption?.color ?? 'oklch(0.72 0.19 45)', data }]
  }, [holdings, walletOption])

  const holdingSeries = useMemo(
    () =>
      holdings.map((h, i) => ({
        id: h.id,
        name: h.symbol,
        color: getCoinColor(h.symbol, i),
        data: h.snapshots.map((s) => ({ timestamp: s.timestamp, value: s.value })),
      })),
    [holdings]
  )

  if (!wallet) return null

  const accentColor = walletOption?.color ?? 'oklch(0.72 0.19 45)'
  const shortAddress = wallet.address.length > 12
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : wallet.address

  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: `${accentColor}22` }}
          >
            <WalletIcon type={wallet.type} className="w-5 h-5" />
          </div>
          <div>
            <InlineRename
              value={wallet.name}
              onSave={(name) => renameWallet(walletId, name)}
              className="text-xl font-semibold text-foreground leading-none"
            />
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-muted-foreground font-mono">{shortAddress}</span>
              <button
                onClick={copyAddress}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Copy address"
              >
                {copied ? <Check className="w-3 h-3 text-[oklch(0.70_0.16_155)]" /> : <Copy className="w-3 h-3" />}
              </button>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{walletOption?.label}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <div className="flex flex-col items-end gap-0.5">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-8 px-3 border-border text-muted-foreground bg-transparent gap-1.5 text-xs transition-all',
                cooldown === 0 && !refreshing && 'hover:text-foreground hover:border-[oklch(0.72_0.19_45_/_0.6)]',
                (cooldown > 0 || refreshing) && 'opacity-50 cursor-not-allowed'
              )}
              onClick={handleRefresh}
              disabled={cooldown > 0 || refreshing}
              aria-label="Refresh wallet balances"
            >
              {refreshing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {cooldown > 0 ? `${cooldown}s` : 'Refresh'}
            </Button>
            {lastRefreshed && (
              <span className="text-[10px] text-muted-foreground pr-0.5">
                Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <AddEntryDialog mode="new-wallet-holding" walletId={walletId} triggerLabel="Add Holding" />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-[oklch(0.60_0.20_25)] h-8 px-2"
            onClick={handleDelete}
            aria-label="Remove wallet"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Wallet Value"
          value={portfolioTotal}
          previousValue={portfolioPrev}
          accentColor={accentColor}
          className="sm:col-span-2 lg:col-span-2"
        />
        {holdings.slice(0, 2).map((h, i) => {
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

      {/* Refresh error */}
      {refreshError && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[oklch(0.60_0.20_25_/_0.10)] border border-[oklch(0.60_0.20_25_/_0.3)]">
          <span className="text-xs text-[oklch(0.60_0.20_25)]">{refreshError}</span>
          <button
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setRefreshError('')}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Moralis key missing notice — only show when no holdings were found at all */}
      {moralisKeyMissing && holdings.length === 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[oklch(0.72_0.19_45_/_0.08)] border border-[oklch(0.72_0.19_45_/_0.25)]">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[oklch(0.80_0.15_45)]">ERC-20 token data requires a Moralis API key</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Only native balances (ETH, BNB, etc.) are shown. Add a free{' '}
              <a
                href="https://moralis.io"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[oklch(0.72_0.19_45)]"
              >
                Moralis API key
              </a>{' '}
              as <code className="bg-[oklch(0.22_0_0)] px-1 rounded text-[10px]">MORALIS_API_KEY</code> in your environment variables to see all tokens.
            </p>
          </div>
          <button className="text-muted-foreground hover:text-foreground text-xs mt-0.5 shrink-0" onClick={() => setMoralisKeyMissing(false)}>
            ✕
          </button>
        </div>
      )}

      {/* Pie + chart in same row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-foreground">Holdings Distribution</h2>
          <p className="text-xs text-muted-foreground">By current value</p>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              No holdings yet
            </div>
          ) : (
            <PortfolioPie data={pieData} height={240} />
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-foreground">Portfolio Value Over Time</h2>
          <p className="text-xs text-muted-foreground">
            Time-proportional x-axis — gaps reflect actual time between entries
          </p>
          {portfolioSeries.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              No data yet
            </div>
          ) : (
            <ValueChart series={portfolioSeries} height={240} />
          )}
        </div>
      </div>

      {/* Individual holdings list */}
      <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Individual Holdings</h2>
          <span className="text-xs text-muted-foreground">Click to view history</span>
        </div>

        {holdings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No holdings yet. Add your first holding to this wallet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {holdings.map((h, i) => {
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
                      isSelected ? 'bg-[oklch(0.22_0_0)]' : 'hover:bg-[oklch(0.20_0_0)]'
                    )}
                    onClick={() => setSelected(isSelected ? null : h.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelected(isSelected ? null : h.id)}
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground">{h.symbol}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">{h.coin}</span>
                    </div>
                    {h.rawBalance != null && (
                      <span className="text-xs text-muted-foreground font-mono hidden sm:block">
                        {h.rawBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {h.symbol}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-foreground">
                      ${cur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        {changePct >= 0 ? '+' : ''}
                        {changePct.toFixed(2)}%
                      </span>
                    )}
                    <div
                      className="flex items-center gap-1 ml-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <AddEntryDialog
                        mode="update-wallet-holding"
                        walletId={walletId}
                        holdingId={h.id}
                        triggerVariant="ghost"
                        triggerSize="icon"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-[oklch(0.60_0.20_25)]"
                        onClick={() => removeWalletHolding(walletId, h.id)}
                        aria-label="Remove holding"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="bg-[oklch(0.18_0_0)] rounded-lg mx-2 mb-1 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-muted-foreground">
                          {h.symbol} — 1 year price history (monthly)
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {snaps.length} live snapshot{snaps.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <PriceHistoryChart
                        symbol={h.symbol}
                        balance={h.rawBalance ?? 1}
                        color={color}
                        height={200}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {holdings.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-foreground">All Holdings Comparison</h2>
          <p className="text-xs text-muted-foreground">Individual holding values over time</p>
          <ValueChart series={holdingSeries} height={240} />
        </div>
      )}
    </div>
  )
}
