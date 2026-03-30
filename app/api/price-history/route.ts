import { NextRequest, NextResponse } from 'next/server'

// Returns ~12 monthly price points for the last year.
// Primary: Kraken OHLC (weekly candles, sampled monthly) — free, no key, no geo-block.
// Fallback: CoinGecko with COINGECKO_API_KEY (covers tokens not on Kraken, e.g. POL/MATIC).

const SYMBOL_TO_KRAKEN_PAIR: Record<string, string> = {
  BTC: 'XXBTZUSD', ETH: 'XETHZUSD', WETH: 'XETHZUSD',
  BNB: 'BNBUSD',   SOL: 'SOLUSD',   ADA: 'ADAUSD',
  DOT: 'DOTUSD',   AVAX: 'AVAXUSD', WAVAX: 'AVAXUSD',
  LINK: 'LINKUSD', UNI: 'UNIUSD',   AAVE: 'AAVEUSD',
  CRV: 'CRVUSD',   SNX: 'SNXUSD',   MKR: 'MKRUSD',
  COMP: 'COMPUSD', YFI: 'YFIUSD',   LRC: 'LRCUSD',
  BAT: 'BATUSD',   MANA: 'MANAUSD', SAND: 'SANDUSD',
  AXS: 'AXSUSD',   APE: 'APEUSD',   GRT: 'GRTUSD',
  FTM: 'FTMUSD',   ARB: 'ARBUSD',   OP: 'OPUSD',
  LDO: 'LDOUSD',   IMX: 'IMXUSD',   BLUR: 'BLURUSD',
  BAL: 'BALUSD',   RPL: 'RPLUSD',   SHIB: 'SHIBUSD',
  PEPE: 'PEPEUSD', WBTC: 'WBTCUSD', DYDX: 'DYDXUSD',
  STETH: 'XETHZUSD', WSTETH: 'XETHZUSD', CBETH: 'XETHZUSD', RETH: 'XETHZUSD',
  WBNB: 'BNBUSD',
}

const SYMBOL_TO_CG_ID: Record<string, string> = {
  ETH: 'ethereum', BTC: 'bitcoin', WBTC: 'wrapped-bitcoin',
  BNB: 'binancecoin', MATIC: 'matic-network', POL: 'matic-network', WMATIC: 'wmatic',
  AVAX: 'avalanche-2', WAVAX: 'wrapped-avax', LINK: 'chainlink', UNI: 'uniswap',
  AAVE: 'aave', CRV: 'curve-dao-token', SOL: 'solana', ADA: 'cardano', DOT: 'polkadot',
  SHIB: 'shiba-inu', PEPE: 'pepe', ARB: 'arbitrum', OP: 'optimism', LDO: 'lido-dao',
  FTM: 'fantom', IMX: 'immutable-x', APE: 'apecoin', SAND: 'the-sandbox',
  MANA: 'decentraland', AXS: 'axie-infinity', CAKE: 'pancakeswap-token',
  STETH: 'staked-ether', CBETH: 'coinbase-wrapped-staked-eth', RETH: 'rocket-pool-eth',
  WBNB: 'wbnb', SNX: 'synthetix-network-token', MKR: 'maker', GRT: 'the-graph',
  BAL: 'balancer', RPL: 'rocket-pool', BLUR: 'blur', DYDX: 'dydx',
}

const STABLECOINS = new Set(['USDT','USDC','DAI','BUSD','FRAX','LUSD','TUSD','FDUSD'])

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get('symbol') ?? '').toUpperCase().trim()

  if (!symbol) return NextResponse.json({ error: 'Missing symbol' }, { status: 400 })

  // Stablecoins — flat $1 for past 12 months
  if (STABLECOINS.has(symbol)) {
    const now = Date.now()
    const prices: [number, number][] = Array.from({ length: 12 }, (_, i) => [
      now - (11 - i) * 30 * 24 * 60 * 60 * 1000, 1.0,
    ])
    return NextResponse.json({ symbol, prices, source: 'stable' })
  }

  // ── Primary: Kraken OHLC (weekly candles = interval 10080 mins) ────────────
  const krakenPair = SYMBOL_TO_KRAKEN_PAIR[symbol]
  if (krakenPair) {
    try {
      const since = Math.floor(Date.now() / 1000) - 370 * 24 * 3600
      const url = `https://api.kraken.com/0/public/OHLC?pair=${krakenPair}&interval=10080&since=${since}`
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
      if (res.ok) {
        const json = await res.json()
        if (!json.error?.length) {
          const pairKey = Object.keys(json.result ?? {}).find((k) => k !== 'last')
          const candles: number[][] = pairKey ? json.result[pairKey] : []
          if (candles.length >= 4) {
            // Sample evenly to get ~12 points (one per month)
            const step = Math.max(1, Math.floor(candles.length / 12))
            const sampled: [number, number][] = []
            for (let i = 0; i < candles.length && sampled.length < 12; i += step) {
              const c = candles[i]
              sampled.push([c[0] * 1000, parseFloat(c[4])]) // [openTime ms, close price]
            }
            // Always append the very latest candle
            const last = candles[candles.length - 1]
            const lastTs = last[0] * 1000
            if (sampled[sampled.length - 1]?.[0] !== lastTs) {
              if (sampled.length >= 12) sampled.pop()
              sampled.push([lastTs, parseFloat(last[4])])
            }
            return NextResponse.json({ symbol, prices: sampled, source: 'kraken' })
          }
        }
      }
    } catch (e) {
      console.error('[price-history] Kraken OHLC error:', String(e))
    }
  }

  // ── Fallback: CoinGecko with API key ───────────────────────────────────────
  const cgKey = process.env.COINGECKO_API_KEY ?? ''
  const cgId = SYMBOL_TO_CG_ID[symbol]
  if (cgId && cgKey) {
    try {
      const isDemo = cgKey.startsWith('CG-')
      const baseUrl = isDemo
        ? `https://api.coingecko.com/api/v3/coins/${cgId}/market_chart`
        : `https://pro-api.coingecko.com/api/v3/coins/${cgId}/market_chart`
      const headerKey = isDemo ? 'x-cg-demo-api-key' : 'x-cg-pro-api-key'
      const url = `${baseUrl}?vs_currency=usd&days=365`
      const res = await fetch(url, {
        headers: { [headerKey]: cgKey },
        signal: AbortSignal.timeout(10000),
      })
      if (res.ok) {
        const json = await res.json()
        const allPrices: [number, number][] = json.prices ?? []
        // Sample ~12 points evenly from the full daily data
        if (allPrices.length >= 4) {
          const step = Math.max(1, Math.floor(allPrices.length / 12))
          const sampled: [number, number][] = []
          for (let i = 0; i < allPrices.length && sampled.length < 12; i += step) {
            sampled.push(allPrices[i])
          }
          const last = allPrices[allPrices.length - 1]
          if (sampled[sampled.length - 1]?.[0] !== last[0]) {
            if (sampled.length >= 12) sampled.pop()
            sampled.push(last)
          }
          return NextResponse.json({ symbol, prices: sampled, source: 'coingecko' })
        }
      }
    } catch (e) {
      console.error('[price-history] CoinGecko error:', String(e))
    }
  }

  return NextResponse.json({ symbol, prices: [], error: `No price history available for ${symbol}` })
}
