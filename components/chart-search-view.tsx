'use client'

import { useState } from 'react'
import { ArrowLeft, ExternalLink, Search } from 'lucide-react'

type ChartSearchViewProps = {
  pair: string
  onClose: () => void
}

// Normalize the pair to a TradingView-compatible symbol.
// If the user typed e.g. "BTC/USDT" or "btcusdt" → "BINANCE:BTCUSDT"
function toTVSymbol(raw: string): string {
  const clean = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  // If it already contains an exchange prefix like "BINANCE:" keep as-is
  if (raw.includes(':')) return raw.toUpperCase()
  return `BINANCE:${clean}`
}

export function ChartSearchView({ pair, onClose }: ChartSearchViewProps) {
  const [inputValue, setInputValue] = useState(pair)
  const [activePair, setActivePair] = useState(pair)

  const tvSymbol = toTVSymbol(activePair)

  // TradingView advanced chart widget URL
  const iframeSrc =
    `https://www.tradingview.com/widgetbar-chart/?symbol=${encodeURIComponent(tvSymbol)}` +
    `&interval=D&theme=dark&style=1&locale=en&toolbar_bg=%23oklch(0.14 0 0)` +
    `&hide_side_toolbar=0&allow_symbol_change=1&save_image=0&studies=[]&show_popup_button=1`

  // Use the embed widget instead – more compatible
  const embedSrc =
    `https://s.tradingview.com/embed-widget/advanced-chart/?locale=en` +
    `#${encodeURIComponent(JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    }))}`

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (trimmed) setActivePair(trimmed.toUpperCase())
  }

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      {/* Header row */}
      <div className="flex items-center gap-4">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex-1 flex items-center gap-2">
          <h1 className="text-lg font-semibold text-foreground">{tvSymbol}</h1>
          <a
            href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-[oklch(0.72_0.19_45)] transition-colors"
            aria-label="Open on TradingView"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Inline search for switching pairs */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. ETHUSDT"
              className="h-8 pl-8 pr-3 w-44 rounded-lg bg-[oklch(0.20_0_0)] border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[oklch(0.72_0.19_45_/_0.5)] transition-all"
              aria-label="Switch pair"
            />
          </div>
          <button
            type="submit"
            className="h-8 px-3 rounded-lg bg-[oklch(0.72_0.19_45)] hover:bg-[oklch(0.78_0.19_45)] text-[oklch(0.12_0_0)] text-xs font-semibold transition-colors"
          >
            Go
          </button>
        </form>
      </div>

      {/* TradingView iframe */}
      <div className="flex-1 rounded-xl overflow-hidden border border-border bg-card min-h-0">
        <iframe
          key={tvSymbol}
          src={embedSrc}
          title={`${tvSymbol} chart`}
          className="w-full h-full"
          style={{ minHeight: '500px' }}
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Chart data provided by{' '}
        <a
          href="https://www.tradingview.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[oklch(0.72_0.19_45)] hover:underline"
        >
          TradingView
        </a>
        . You can also change the symbol directly inside the chart widget.
      </p>
    </div>
  )
}
