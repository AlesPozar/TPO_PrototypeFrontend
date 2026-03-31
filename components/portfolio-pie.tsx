'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { TooltipProps } from 'recharts'

import { useStore } from '@/lib/store'


type PieItem = {
  name: string
  value: number
  color: string
}

type PortfolioPieProps = {
  data: PieItem[]
  height?: number
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  const currency = useStore((s) => s.userProfile.displayedCurrency ?? '$')

  if (!active || !payload?.length) return null
  const item = payload[0]
  const total = payload[0]?.payload?.total ?? 0
  const pct = total > 0 ? ((Number(item.value) / total) * 100).toFixed(1) : '0.0'
  return (
    <div className="bg-[oklch(0.20_0_0)] border border-border rounded-lg px-3 py-2 text-sm shadow-xl">
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ background: item.payload.fill }}
        />
        <span className="font-semibold text-foreground">{item.name}</span>
      </div>
      <div className="mt-1 text-muted-foreground text-xs">
        {currency}{Number(item.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        {' '}· {pct}%
      </div>
    </div>
  )
}

function CustomLegend({ payload }: { payload?: Array<{ color: string; value: string; payload: { value: number } }> }) {
  const currency = useStore((s) => s.userProfile.displayedCurrency ?? '$')

  if (!payload) return null
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
      {payload.map((entry) => (
        <li key={entry.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="inline-block w-2 h-2 rounded-full shrink-0"
            style={{ background: entry.color }}
          />
          <span>{entry.value}</span>
          <span className="text-foreground font-medium">
            {currency}{entry.payload.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function PortfolioPie({ data, height = 260 }: PortfolioPieProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        No assets to display.
      </div>
    )
  }

  const total = data.reduce((s, d) => s + d.value, 0)
  const enriched = data.map((d) => ({ ...d, total }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={enriched}
          cx="50%"
          cy="45%"
          innerRadius="48%"
          outerRadius="72%"
          paddingAngle={2}
          dataKey="value"
          strokeWidth={0}
        >
          {enriched.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  )
}
