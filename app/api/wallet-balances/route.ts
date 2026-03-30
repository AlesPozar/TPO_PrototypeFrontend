import { NextRequest, NextResponse } from 'next/server'

// Multi-chain wallet balance fetcher.
// Pricing: Kraken public REST (no key, no geo-block) → CoinGecko (Demo or Pro key) for gaps.
// Balances: Moralis API (with key) → public RPC native fallback.

// ─── Chain config ─────────────────────────────────────────────────────────────

type Chain = {
  id: string
  name: string
  nativeSymbol: string
  nativeName: string
  rpc: string
  moralisChain: string
}

const CHAINS: Chain[] = [
  { id: 'eth',       name: 'Ethereum',  nativeSymbol: 'ETH',  nativeName: 'Ethereum',  rpc: 'https://ethereum.publicnode.com',            moralisChain: '0x1'    },
  { id: 'bsc',       name: 'BNB Chain', nativeSymbol: 'BNB',  nativeName: 'BNB',       rpc: 'https://bsc.publicnode.com',                 moralisChain: '0x38'   },
  { id: 'polygon',   name: 'Polygon',   nativeSymbol: 'POL',  nativeName: 'POL',       rpc: 'https://polygon.publicnode.com',             moralisChain: '0x89'   },
  { id: 'base',      name: 'Base',      nativeSymbol: 'ETH',  nativeName: 'Ethereum',  rpc: 'https://base.publicnode.com',                moralisChain: '0x2105' },
  { id: 'arbitrum',  name: 'Arbitrum',  nativeSymbol: 'ETH',  nativeName: 'Ethereum',  rpc: 'https://arbitrum-one.publicnode.com',        moralisChain: '0xa4b1' },
  { id: 'optimism',  name: 'Optimism',  nativeSymbol: 'ETH',  nativeName: 'Ethereum',  rpc: 'https://optimism.publicnode.com',            moralisChain: '0xa'    },
  { id: 'avalanche', name: 'Avalanche', nativeSymbol: 'AVAX', nativeName: 'Avalanche', rpc: 'https://avalanche-c-chain.publicnode.com',   moralisChain: '0xa86a' },
]

export type TokenHolding = {
  symbol: string
  name: string
  balance: number
  usdValue: number
  pricePerToken: number
  contractAddress: string
  chain: string
}

function isEthAddress(addr: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(addr)
}

async function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 10000) {
  return fetch(url, { ...opts, signal: AbortSignal.timeout(ms) })
}

const STABLECOINS = new Set([
  'USDT','USDC','DAI','BUSD','FRAX','LUSD','TUSD','USDD','FDUSD','USDP','GUSD','SUSD','CRVUSD','PYUSD',
])

// ─── Kraken public REST price API ─────────────────────────────────────────────
// No API key needed. Globally accessible from Vercel servers.
// Returns last trade price for each pair.

const KRAKEN_PAIRS: Record<string, string> = {
  BTC: 'XXBTZUSD', ETH: 'XETHZUSD', WETH: 'XETHZUSD',
  BNB: 'BNBUSD',   WBNB: 'BNBUSD',  SOL: 'SOLUSD',
  ADA: 'ADAUSD',   DOT: 'DOTUSD',   AVAX: 'AVAXUSD', WAVAX: 'AVAXUSD',
  LINK: 'LINKUSD', UNI: 'UNIUSD',   AAVE: 'AAVEUSD', CRV: 'CRVUSD',
  SNX: 'SNXUSD',   MKR: 'MKRUSD',   COMP: 'COMPUSD', YFI: 'YFIUSD',
  GRT: 'GRTUSD',   LRC: 'LRCUSD',   BAT: 'BATUSD',   MANA: 'MANAUSD',
  SAND: 'SANDUSD', AXS: 'AXSUSD',   APE: 'APEUSD',   ENJ: 'ENJUSD',
  FTM: 'FTMUSD',   ARB: 'ARBUSD',   OP: 'OPUSD',     LDO: 'LDOUSD',
  IMX: 'IMXUSD',   BLUR: 'BLURUSD', BAL: 'BALUSD',   RPL: 'RPLUSD',
  SHIB: 'SHIBUSD', DYDX: 'DYDXUSD', CVX: 'CVXUSD',   PEPE: 'PEPEUSD',
  WBTC: 'WBTCUSD',
  // Wrapped/staked ETH variants → same price as ETH
  STETH: 'XETHZUSD', WSTETH: 'XETHZUSD', CBETH: 'XETHZUSD', RETH: 'XETHZUSD',
}

async function fetchKrakenPrices(symbols: string[]): Promise<Record<string, number>> {
  const result: Record<string, number> = {}
  for (const sym of symbols) {
    if (STABLECOINS.has(sym.toUpperCase())) result[sym.toUpperCase()] = 1.0
  }

  const pairs = Array.from(new Set(
    symbols.map((s) => KRAKEN_PAIRS[s.toUpperCase()]).filter(Boolean) as string[]
  ))
  if (!pairs.length) return result

  try {
    const url = `https://api.kraken.com/0/public/Ticker?pair=${pairs.join(',')}`
    const res = await fetchWithTimeout(url, {}, 10000)
    if (!res.ok) throw new Error(`Kraken ${res.status}`)
    const json = await res.json()
    if (json.error?.length) throw new Error(json.error[0])

    const pairData: Record<string, { c: string[] }> = json.result ?? {}
    // Kraken may rename pairs (e.g. XXBTZUSD) — build lookup both ways
    const priceByPair: Record<string, number> = {}
    for (const [k, v] of Object.entries(pairData)) {
      priceByPair[k] = parseFloat(v.c[0])
    }

    for (const sym of symbols) {
      const upper = sym.toUpperCase()
      const wantedPair = KRAKEN_PAIRS[upper]
      if (!wantedPair) continue
      // Try the requested pair name first, then look through all returned keys
      const price =
        priceByPair[wantedPair] ??
        Object.entries(priceByPair).find(([k]) =>
          k.replace('Z', '').replace('X', '') === wantedPair.replace('X', '').replace('Z', '')
        )?.[1] ??
        0
      if (price > 0) result[upper] = price
    }
  } catch (e) {
    console.error('[wallet-balances] Kraken error:', String(e))
  }

  return result
}

// ─── CoinGecko price API ───────────────────────────────────────────────────────
// Supports both Demo keys (free tier, api.coingecko.com + x-cg-demo-api-key)
// and Pro keys (pro-api.coingecko.com + x-cg-pro-api-key).
// Without a key it will 401 — we only call this when a key is present.

const CG_ID: Record<string, string> = {
  ETH: 'ethereum',       WETH: 'weth',              BTC: 'bitcoin',
  WBTC: 'wrapped-bitcoin', USDT: 'tether',           USDC: 'usd-coin',
  DAI: 'dai',            BUSD: 'binance-usd',        FRAX: 'frax',
  BNB: 'binancecoin',    WBNB: 'wbnb',               MATIC: 'matic-network',
  POL: 'matic-network',  WMATIC: 'wmatic',           AVAX: 'avalanche-2',
  WAVAX: 'wrapped-avax', LINK: 'chainlink',           UNI: 'uniswap',
  AAVE: 'aave',          CRV: 'curve-dao-token',     SNX: 'synthetix-network-token',
  MKR: 'maker',          COMP: 'compound-governance-token', YFI: 'yearn-finance',
  SUSHI: 'sushi',        '1INCH': '1inch',            GRT: 'the-graph',
  LRC: 'loopring',       BAT: 'basic-attention-token', ZRX: '0x',
  ENJ: 'enjincoin',      MANA: 'decentraland',        SAND: 'the-sandbox',
  AXS: 'axie-infinity',  APE: 'apecoin',              SHIB: 'shiba-inu',
  PEPE: 'pepe',          ARB: 'arbitrum',             OP: 'optimism',
  LDO: 'lido-dao',       RPL: 'rocket-pool',          CVX: 'convex-finance',
  FTM: 'fantom',         IMX: 'immutable-x',          BLUR: 'blur',
  DYDX: 'dydx',          BAL: 'balancer',             CAKE: 'pancakeswap-token',
  GMT: 'stepn',          CBETH: 'coinbase-wrapped-staked-eth', RETH: 'rocket-pool-eth',
  STETH: 'staked-ether', WSTETH: 'wrapped-steth',    SOL: 'solana',
  ADA: 'cardano',        DOT: 'polkadot',             DOG: 'dogecoin',
  DOGE: 'dogecoin',      LTC: 'litecoin',             XRP: 'ripple',
  ATOM: 'cosmos',        NEAR: 'near',                INJ: 'injective-protocol',
  SUI: 'sui',            SEI: 'sei-network',          TIA: 'celestia',
  PYTH: 'pyth-network',  JTO: 'jito-governance-token', WIF: 'dogwifcoin',
  BONK: 'bonk',          FLOKI: 'floki',              TURBO: 'turbo',
  BRETT: 'based-brett',  MOG: 'mog-coin',
}

async function fetchCGPrices(symbols: string[]): Promise<Record<string, number>> {
  const cgKey = process.env.COINGECKO_API_KEY ?? ''
  if (!cgKey || !symbols.length) return {}

  const ids = Array.from(new Set(
    symbols.map((s) => CG_ID[s.toUpperCase()]).filter(Boolean) as string[]
  ))
  if (!ids.length) return {}

  // Detect key type: Demo keys start with "CG-", Pro keys are longer hex strings
  const isDemo = cgKey.startsWith('CG-')
  const baseUrl = isDemo
    ? 'https://api.coingecko.com/api/v3/simple/price'
    : 'https://pro-api.coingecko.com/api/v3/simple/price'
  const headerKey = isDemo ? 'x-cg-demo-api-key' : 'x-cg-pro-api-key'

  try {
    const url = new URL(baseUrl)
    url.searchParams.set('ids', ids.join(','))
    url.searchParams.set('vs_currencies', 'usd')

    const res = await fetchWithTimeout(url.toString(), {
      headers: { [headerKey]: cgKey },
    }, 10000)

    if (!res.ok) {
      console.error('[wallet-balances] CoinGecko error:', res.status)
      return {}
    }

    const json = await res.json()
    const result: Record<string, number> = {}
    for (const sym of symbols) {
      const upper = sym.toUpperCase()
      const id = CG_ID[upper]
      if (id && json[id]?.usd) result[upper] = json[id].usd
    }
    return result
  } catch (e) {
    console.error('[wallet-balances] CoinGecko error:', String(e))
    return {}
  }
}

// ─── Combined prices: Kraken primary → CoinGecko fills gaps ──────────────────

async function fetchPrices(symbols: string[]): Promise<Record<string, number>> {
  if (!symbols.length) return {}
  const unique = Array.from(new Set(symbols.map((s) => s.toUpperCase())))
  const [kraken, cg] = await Promise.all([fetchKrakenPrices(unique), fetchCGPrices(unique)])
  // Merge: Kraken wins where available (more real-time), CG fills the rest
  return { ...cg, ...kraken }
}

// ─── Moralis EVM API ──────────────────────────────────────────────────────────

async function getMoralisBalances(address: string, moralisKey: string): Promise<TokenHolding[]> {
  const results: TokenHolding[] = []

  await Promise.allSettled(
    CHAINS.map(async (chain) => {
      try {
        // ERC-20 tokens
        const url = new URL(`https://deep-index.moralis.io/api/v2.2/${address}/tokens`)
        url.searchParams.set('chain', chain.moralisChain)
        url.searchParams.set('exclude_spam', 'true')

        const res = await fetchWithTimeout(url.toString(), {
          headers: { 'X-API-Key': moralisKey },
        }, 12000)

        if (res.ok) {
          const json = await res.json()
          const tokens: {
            symbol: string; name: string; balance: string; decimals: string
            usd_price?: number; usd_value?: number; token_address: string; possible_spam?: boolean
          }[] = json.result ?? []

          for (const t of tokens) {
            if (t.possible_spam) continue
            const decimals = parseInt(t.decimals) || 18
            const balance = parseFloat(t.balance) / Math.pow(10, decimals)
            if (balance <= 0.000001) continue
            results.push({
              symbol: (t.symbol ?? 'UNKNOWN').toUpperCase(),
              name: t.name,
              balance,
              usdValue: t.usd_value ?? 0,
              pricePerToken: t.usd_price ?? 0,
              contractAddress: t.token_address,
              chain: chain.name,
            })
          }
        }

        // Native balance
        const nativeRes = await fetchWithTimeout(
          `https://deep-index.moralis.io/api/v2.2/${address}/balance?chain=${chain.moralisChain}`,
          { headers: { 'X-API-Key': moralisKey } },
          8000
        )
        if (nativeRes.ok) {
          const nativeJson = await nativeRes.json()
          const nativeBal = parseFloat(nativeJson.balance ?? '0') / 1e18
          if (nativeBal > 0.000001) {
            results.push({
              symbol: chain.nativeSymbol,
              name: `${chain.nativeName} (${chain.name})`,
              balance: nativeBal,
              usdValue: 0,
              pricePerToken: 0,
              contractAddress: '',
              chain: chain.name,
            })
          }
        }
      } catch (e) {
        console.error(`[wallet-balances] Moralis error on ${chain.id}:`, String(e))
      }
    })
  )

  return results
}

// ─── Public RPC native balance fallback ───────────────────────────────────────

async function getNativeBalancesViaRPC(address: string): Promise<TokenHolding[]> {
  const rawResults = await Promise.allSettled(
    CHAINS.map(async (chain) => {
      const res = await fetchWithTimeout(chain.rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] }),
      }, 8000)
      if (!res.ok) throw new Error(`RPC ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      const balance = parseInt(json.result, 16) / 1e18
      return { chain, balance }
    })
  )

  const nonZero = rawResults
    .filter((r): r is PromiseFulfilledResult<{ chain: Chain; balance: number }> =>
      r.status === 'fulfilled' && r.value.balance > 0.000001
    )
    .map((r) => r.value)

  if (!nonZero.length) return []

  const prices = await fetchPrices(Array.from(new Set(nonZero.map((n) => n.chain.nativeSymbol))))

  return nonZero.map(({ chain, balance }) => {
    const price = prices[chain.nativeSymbol.toUpperCase()] ?? 0
    return {
      symbol: chain.nativeSymbol,
      name: `${chain.nativeName} (${chain.name})`,
      balance,
      usdValue: balance * price,
      pricePerToken: price,
      contractAddress: '',
      chain: chain.name,
    }
  })
}

// ─── Merge & deduplicate ──────────────────────────────────────────────────────

function mergeHoldings(holdings: TokenHolding[]): TokenHolding[] {
  const map = new Map<string, TokenHolding>()
  for (const h of holdings) {
    const key = `${h.symbol.toUpperCase()}::${h.chain}`
    const existing = map.get(key)
    if (existing) {
      existing.balance += h.balance
      existing.usdValue += h.usdValue
    } else {
      map.set(key, { ...h, symbol: h.symbol.toUpperCase() })
    }
  }
  return Array.from(map.values())
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')?.trim() ?? ''

  if (!address) return NextResponse.json({ error: 'Missing address' }, { status: 400 })
  if (!isEthAddress(address)) {
    return NextResponse.json(
      { error: 'Only EVM-compatible addresses (0x…) are supported.' },
      { status: 400 }
    )
  }

  let holdings: TokenHolding[] = []
  const moralisKey = process.env.MORALIS_API_KEY ?? ''

  if (moralisKey) {
    try {
      holdings = await getMoralisBalances(address, moralisKey)
    } catch (e) {
      console.error('[wallet-balances] Moralis failed:', String(e))
    }
  }

  if (!holdings.length) {
    try {
      holdings = await getNativeBalancesViaRPC(address)
    } catch (e) {
      console.error('[wallet-balances] RPC fallback failed:', String(e))
    }
  }

  // Enrich ALL holdings that have $0 value but a non-zero balance
  const needsPrice = holdings.filter((h) => h.usdValue === 0 && h.balance > 0)
  if (needsPrice.length > 0) {
    const syms = Array.from(new Set(needsPrice.map((h) => h.symbol.toUpperCase())))
    const prices = await fetchPrices(syms)
    for (const h of holdings) {
      if (h.usdValue === 0 && h.balance > 0) {
        const price = prices[h.symbol.toUpperCase()] ?? 0
        h.pricePerToken = price
        h.usdValue = h.balance * price
      }
    }
  }

  holdings = mergeHoldings(holdings)
    .filter((h) => h.balance > 0.000001)
    .sort((a, b) => b.usdValue - a.usdValue || a.symbol.localeCompare(b.symbol))

  return NextResponse.json({
    holdings,
    fetchedAt: Date.now(),
    source: moralisKey ? 'moralis+kraken+coingecko' : 'rpc+kraken+coingecko',
    moralisKeyMissing: !moralisKey,
  })
}
