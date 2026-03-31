'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'
import type { TooltipProps } from 'recharts'
import { useStore } from '@/lib/store'

type DataPoint = {
  timestamp: number
  value: number
  label?: string
}

type Series = {
  id: string
  name: string
  color: string
  data: DataPoint[]
}

type ValueChartProps = {
  series: Series[]
  title?: string
  height?: number
  formatValue?: (v: number) => string
}

type ChartDataPoint = {
  timestamp: number
} & Record<string, number | undefined>

// Custom tooltip
function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  const currency = useStore((s) => s.userProfile.displayedCurrency ?? '$')

  if (!active || !payload?.length) return null
  return (
    <div className="bg-[oklch(0.20_0_0)] border border-border rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-muted-foreground text-xs mb-1">
        {label ? format(new Date(Number(label)), 'MMM d, yyyy') : ''}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-muted-foreground text-xs">{entry.name}:</span>
          <span className="font-semibold text-foreground">
            {currency}{Number(entry.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </div>
  )
}

// Merge and deduplicate timestamps from all series, preserving real time spacing
function buildChartData(series: Series[]) {
  if (series.length === 0) return []

  // Collect all unique timestamps
  const allTimestamps = Array.from(
    new Set(series.flatMap((s) => s.data.map((d) => d.timestamp)))
  ).sort((a, b) => a - b)

  if (allTimestamps.length === 0) return []

  // For each timestamp, compute value for each series (carry forward last known)
  return allTimestamps.map((ts): ChartDataPoint => {
    const point: ChartDataPoint = { timestamp: ts }
    series.forEach((s) => {
      // Find last known value at or before this timestamp
      const matching = s.data.filter((d) => d.timestamp <= ts)
      if (matching.length > 0) {
        point[s.id] = matching[matching.length - 1].value
      }
    })
    return point
  })
}

export function ValueChart({ series, height = 280 }: ValueChartProps) {
  const currency = useStore((s) => s.userProfile.displayedCurrency ?? '$')
  const chartData = buildChartData(series)

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        No data yet. Add your first entry to see the chart.
      </div>
    )
  }

  // Build a scale: map timestamps to proportional x positions
  const minTs = chartData[0].timestamp as number
  const maxTs = chartData[chartData.length - 1].timestamp as number
  const range = maxTs - minTs || 1

  // Convert to scaled x values (0–1000 range) for proportional spacing
  const scaledData: Array<ChartDataPoint & { x: number }> = chartData.map((d) => ({
    ...d,
    x: Math.round(((Number(d.timestamp) - minTs) / range) * 1000),
  }))

  // Determine tick positions: pick up to 6 evenly-spaced ticks from the scaled range
  const tickCount = Math.min(scaledData.length, 6)
  const tickStep = 1000 / (tickCount - 1 || 1)
  const ticks = Array.from({ length: tickCount }, (_, i) => Math.round(i * tickStep))

  // Map scaled x -> original timestamp for tick label lookup
  const xToTs: Record<number, number> = {}
  scaledData.forEach((d) => {
    xToTs[d.x] = Number(d.timestamp)
  })

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={scaledData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="oklch(0.25 0 0)"
          vertical={false}
        />
        <XAxis
          dataKey="x"
          type="number"
          domain={[0, 1000]}
          ticks={ticks}
          tickFormatter={(val) => {
            // Find closest real timestamp
            const closestEntry = scaledData.reduce((prev, curr) =>
              Math.abs(curr.x - val) < Math.abs(prev.x - val) ? curr : prev
            )
            return format(new Date(Number(closestEntry.timestamp)), 'MMM d')
          }}
          tick={{ fill: 'oklch(0.60 0 0)', fontSize: 11 }}
          axisLine={{ stroke: 'oklch(0.25 0 0)' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) =>
            `${currency}${Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(1)}k` : Number(v).toFixed(0)}`
          }
          tick={{ fill: 'oklch(0.60 0 0)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        {series.map((s, seriesIndex) => (
          <Line
            key={s.id}
            type="monotone"
            dataKey={s.id}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, index } = props
              const row = typeof index === 'number' ? scaledData[index] : undefined
              // Only show dot for actual data points (not carried-forward values)
              const hasActual = row
                ? s.data.some((d) => d.timestamp === Number(row.timestamp))
                : false
              // Use series id + index for unique key
              const uniqueKey = `dot-${s.id}-${index}`
              if (!hasActual) return <g key={uniqueKey} />
              return (
                <circle
                  key={uniqueKey}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill={s.color}
                  stroke="oklch(0.16 0 0)"
                  strokeWidth={2}
                />
              )
            }}
            activeDot={{ r: 5, fill: s.color, stroke: 'oklch(0.16 0 0)', strokeWidth: 2 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
