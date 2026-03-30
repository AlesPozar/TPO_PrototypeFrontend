'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

type PricePoint = { timestamp: number; price: number }

type Props = {
  symbol: string
  balance: number
  color: string
  height?: number
}

function formatMoney(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}

export function PriceHistoryChart({ symbol, balance, color, height = 200 }: Props) {
  const [data, setData] = useState<PricePoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    setError('')

    fetch(`/api/price-history?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error && !json.prices?.length) {
          setError(json.error)
          return
        }
        const pts: PricePoint[] = (json.prices ?? []).map(([ts, price]: [number, number]) => ({
          timestamp: ts,
          price,
        }))
        setData(pts)
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [symbol])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-muted-foreground" style={{ height }}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Loading 1Y price history…</span>
      </div>
    )
  }

  if (error || !data.length) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ height }}>
        {error || `No historical price data available for ${symbol}`}
      </div>
    )
  }

  // Calculate holding value at each point: price * balance
  const chartData = data.map((pt) => ({
    timestamp: pt.timestamp,
    value: pt.price * balance,
    price: pt.price,
    label: formatDate(pt.timestamp),
  }))

  const min = Math.min(...chartData.map((d) => d.value))
  const max = Math.max(...chartData.map((d) => d.value))
  const domain = [min * 0.97, max * 1.03]

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`ph-grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: 'oklch(0.55 0 0)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={domain}
          tickFormatter={(v) => formatMoney(v)}
          tick={{ fill: 'oklch(0.55 0 0)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip
          contentStyle={{
            background: 'oklch(0.18 0 0)',
            border: '1px solid oklch(0.28 0 0)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'oklch(0.92 0 0)',
          }}
          formatter={(value: number, name: string) => [
            formatMoney(value),
            name === 'value' ? `${symbol} holding value` : name,
          ]}
          labelStyle={{ color: 'oklch(0.65 0 0)', marginBottom: 4 }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#ph-grad-${symbol})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
