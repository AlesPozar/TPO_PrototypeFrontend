import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  value: number
  previousValue?: number
  icon?: React.ReactNode
  accentColor?: string
  className?: string
}

function formatCurrency(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(2)}K`
  return `$${v.toFixed(2)}`
}

export function StatCard({ label, value, previousValue, icon, accentColor, className }: StatCardProps) {
  const hasPrev = previousValue !== undefined && previousValue !== null
  const change = hasPrev ? value - previousValue! : null
  const changePct = hasPrev && previousValue! !== 0 ? ((value - previousValue!) / previousValue!) * 100 : null

  const isPositive = change !== null && change > 0
  const isNegative = change !== null && change < 0

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-4 flex flex-col gap-3',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          {label}
        </span>
        {icon && (
          <span
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ background: accentColor ? `${accentColor}22` : 'oklch(0.72 0.19 45 / 0.15)' }}
          >
            {icon}
          </span>
        )}
      </div>

      <div className="flex items-end gap-3">
        <span className="text-2xl font-semibold tracking-tight text-foreground">
          {formatCurrency(value)}
        </span>

        {change !== null && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium mb-0.5 px-1.5 py-0.5 rounded',
              isPositive && 'text-[oklch(0.70_0.16_155)] bg-[oklch(0.70_0.16_155_/_0.12)]',
              isNegative && 'text-[oklch(0.60_0.20_25)] bg-[oklch(0.60_0.20_25_/_0.12)]',
              !isPositive && !isNegative && 'text-muted-foreground bg-muted'
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : isNegative ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {changePct !== null ? `${Math.abs(changePct).toFixed(2)}%` : formatCurrency(Math.abs(change))}
          </div>
        )}
      </div>

      {hasPrev && change !== null && (
        <p className="text-xs text-muted-foreground">
          {isPositive ? '+' : ''}
          {formatCurrency(change)} from last entry
        </p>
      )}
    </div>
  )
}
