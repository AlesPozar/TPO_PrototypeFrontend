'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CryptoEntry = {
  id: string
  coin: string
  symbol: string
  value: number
  timestamp: number
}

export type BankEntry = {
  id: string
  account: string
  value: number
  timestamp: number
}

export type CryptoHolding = {
  id: string
  coin: string
  symbol: string
  rawBalance?: number // optional token quantity if known
  snapshots: { value: number; timestamp: number }[]
}

export type BankAccount = {
  id: string
  name: string
  color: string
  snapshots: { value: number; timestamp: number }[]
}

export type WalletIcon =
  | 'metamask' | 'trust' | 'ronin' | 'phantom' | 'exodus'
  | 'ledger' | 'coinbase' | 'rainbow' | 'generic'

// Keep WalletType as alias for backwards compat with persisted data
export type WalletType = WalletIcon

export type WalletHolding = {
  id: string
  coin: string
  symbol: string
  rawBalance?: number  // actual token quantity (e.g. 0.5 ETH)
  snapshots: { value: number; timestamp: number }[]
}

export type CryptoWallet = {
  id: string
  name: string
  type: WalletType   // icon identifier
  address: string
  holdings: WalletHolding[]
}

export type BinanceAccount = {
  id: string
  name: string
  apiKey: string
  secretKey: string
  holdings: WalletHolding[]
}

export type UserProfile = {
  nickname: string
  avatarUrl: string | null // base64 data URL or null
  displayedCurrency?: '€' | '$'
}

type AppStore = {
  cryptoHoldings: CryptoHolding[]
  bankAccounts: BankAccount[]
  cryptoWallets: CryptoWallet[]
  binanceAccounts: BinanceAccount[]

  // User profile
  userProfile: UserProfile
  updateProfile: (patch: Partial<UserProfile>) => void
  resetAccount: () => void  // delete account — clears everything

  // Dashboard titles (rename support)
  dashboardTitles: {
    overview: string
    crypto: string
    bank: string
  }

  // Crypto actions
  addCryptoHolding: (coin: string, symbol: string, value: number, timestamp?: number) => void
  addCryptoSnapshot: (holdingId: string, value: number, timestamp?: number) => void
  removeCryptoHolding: (holdingId: string) => void

  // Bank actions
  addBankAccount: (name: string, color: string, value: number, timestamp?: number) => void
  addBankSnapshot: (accountId: string, value: number, timestamp?: number) => void
  removeBankAccount: (accountId: string) => void
  renameBankAccount: (accountId: string, name: string) => void

  // Binance account actions
  addBinanceAccount: (name: string, apiKey: string, secretKey: string) => string
  removeBinanceAccount: (id: string) => void
  renameBinanceAccount: (id: string, name: string) => void
  setBinanceHoldingsFromFetch: (id: string, fetched: { symbol: string; name: string; usdValue: number; balance?: number }[]) => void

  // Wallet actions
  addWallet: (name: string, type: WalletType, address: string) => string
  removeWallet: (walletId: string) => void
  renameWallet: (walletId: string, name: string) => void
  addWalletHolding: (walletId: string, coin: string, symbol: string, value: number, timestamp?: number) => void
  addWalletHoldingSnapshot: (walletId: string, holdingId: string, value: number, timestamp?: number) => void
  removeWalletHolding: (walletId: string, holdingId: string) => void

  // Bulk-upsert holdings fetched live from chain — adds a new snapshot for each
  setWalletHoldingsFromFetch: (
    walletId: string,
    fetched: { symbol: string; name: string; usdValue: number; balance?: number }[]
  ) => void

  // Rename dashboards
  renameDashboard: (key: 'overview' | 'crypto' | 'bank', title: string) => void

  // Load test data
  loadTestBankData: () => void
  loadTestCryptoData: () => void

  // Clear all data for a dashboard
  clearAllBankData: () => void
  clearAllCryptoData: () => void
}

const COIN_COLORS: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  BNB: '#F3BA2F',
  SOL: '#9945FF',
  ADA: '#0033AD',
  XRP: '#346AA9',
  DOT: '#E6007A',
  AVAX: '#E84142',
  MATIC: '#8247E5',
  LINK: '#2A5ADA',
}

export function getCoinColor(symbol: string, index: number): string {
  return COIN_COLORS[symbol.toUpperCase()] ?? `hsl(${(index * 67) % 360}, 70%, 60%)`
}

const BANK_COLORS = [
  '#F97316', '#22C55E', '#3B82F6', '#A855F7', '#EF4444',
  '#14B8A6', '#F59E0B', '#EC4899',
]

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

const SEED_CRYPTO: CryptoHolding[] = [
  {
    id: 'btc-1',
    coin: 'Bitcoin',
    symbol: 'BTC',
    snapshots: [
      { value: 5200, timestamp: Date.now() - 30 * 86400000 },
      { value: 5800, timestamp: Date.now() - 25 * 86400000 },
      { value: 5400, timestamp: Date.now() - 20 * 86400000 },
      { value: 6100, timestamp: Date.now() - 10 * 86400000 },
      { value: 6800, timestamp: Date.now() - 3 * 86400000 },
      { value: 7200, timestamp: Date.now() },
    ],
  },
  {
    id: 'eth-1',
    coin: 'Ethereum',
    symbol: 'ETH',
    snapshots: [
      { value: 2100, timestamp: Date.now() - 28 * 86400000 },
      { value: 2300, timestamp: Date.now() - 21 * 86400000 },
      { value: 2200, timestamp: Date.now() - 14 * 86400000 },
      { value: 2600, timestamp: Date.now() - 7 * 86400000 },
      { value: 2800, timestamp: Date.now() },
    ],
  },
  {
    id: 'bnb-1',
    coin: 'BNB',
    symbol: 'BNB',
    snapshots: [
      { value: 800, timestamp: Date.now() - 22 * 86400000 },
      { value: 950, timestamp: Date.now() - 11 * 86400000 },
      { value: 1050, timestamp: Date.now() },
    ],
  },
  {
    id: 'sol-1',
    coin: 'Solana',
    symbol: 'SOL',
    snapshots: [
      { value: 400, timestamp: Date.now() - 18 * 86400000 },
      { value: 550, timestamp: Date.now() - 9 * 86400000 },
      { value: 620, timestamp: Date.now() },
    ],
  },
]

const SEED_BANK: BankAccount[] = [
  {
    id: 'bank-1',
    name: 'Main Checking',
    color: BANK_COLORS[0],
    snapshots: [
      { value: 8500, timestamp: Date.now() - 35 * 86400000 },
      { value: 9200, timestamp: Date.now() - 28 * 86400000 },
      { value: 8800, timestamp: Date.now() - 21 * 86400000 },
      { value: 10100, timestamp: Date.now() - 14 * 86400000 },
      { value: 9700, timestamp: Date.now() - 7 * 86400000 },
      { value: 11200, timestamp: Date.now() },
    ],
  },
  {
    id: 'bank-2',
    name: 'Savings',
    color: BANK_COLORS[1],
    snapshots: [
      { value: 25000, timestamp: Date.now() - 30 * 86400000 },
      { value: 26500, timestamp: Date.now() - 15 * 86400000 },
      { value: 28000, timestamp: Date.now() },
    ],
  },
]

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      cryptoHoldings: [],
      bankAccounts: [],
      cryptoWallets: [],
      binanceAccounts: [],

      userProfile: {
        nickname: 'Investor',
        avatarUrl: null,
        displayedCurrency: '$',
      },

      updateProfile: (patch) =>
        set((state) => ({
          userProfile: { ...state.userProfile, ...patch },
        })),

      resetAccount: () =>
        set({
          cryptoHoldings: [],
          bankAccounts: [],
          cryptoWallets: [],
          binanceAccounts: [],
          userProfile: { nickname: 'Investor', avatarUrl: null, displayedCurrency: '$' },
          dashboardTitles: {
            overview: 'Portfolio Overview',
            crypto: 'Crypto Portfolio',
            bank: 'Bank Accounts',
          },
        }),

      dashboardTitles: {
        overview: 'Portfolio Overview',
        crypto: 'Crypto Portfolio',
        bank: 'Bank Accounts',
      },

      addCryptoHolding: (coin, symbol, value, timestamp) =>
        set((state) => ({
          cryptoHoldings: [
            ...state.cryptoHoldings,
            {
              id: generateId(),
              coin,
              symbol: symbol.toUpperCase(),
              snapshots: [{ value, timestamp: timestamp ?? Date.now() }],
            },
          ],
        })),

      addCryptoSnapshot: (holdingId, value, timestamp) =>
        set((state) => ({
          cryptoHoldings: state.cryptoHoldings.map((h) =>
            h.id === holdingId
              ? {
                  ...h,
                  snapshots: [
                    ...h.snapshots,
                    { value, timestamp: timestamp ?? Date.now() },
                  ].sort((a, b) => a.timestamp - b.timestamp),
                }
              : h
          ),
        })),

      removeCryptoHolding: (holdingId) =>
        set((state) => ({
          cryptoHoldings: state.cryptoHoldings.filter((h) => h.id !== holdingId),
        })),

      addBankAccount: (name, color, value, timestamp) =>
        set((state) => {
          const usedColors = state.bankAccounts.map((b) => b.color)
          const autoColor =
            color || BANK_COLORS.find((c) => !usedColors.includes(c)) || BANK_COLORS[0]
          return {
            bankAccounts: [
              ...state.bankAccounts,
              {
                id: generateId(),
                name,
                color: autoColor,
                snapshots: [{ value, timestamp: timestamp ?? Date.now() }],
              },
            ],
          }
        }),

      addBankSnapshot: (accountId, value, timestamp) =>
        set((state) => ({
          bankAccounts: state.bankAccounts.map((a) =>
            a.id === accountId
              ? {
                  ...a,
                  snapshots: [
                    ...a.snapshots,
                    { value, timestamp: timestamp ?? Date.now() },
                  ].sort((a, b) => a.timestamp - b.timestamp),
                }
              : a
          ),
        })),

      removeBankAccount: (accountId) =>
        set((state) => ({
          bankAccounts: state.bankAccounts.filter((a) => a.id !== accountId),
        })),

      renameBankAccount: (accountId, name) =>
        set((state) => ({
          bankAccounts: state.bankAccounts.map((a) =>
            a.id === accountId ? { ...a, name } : a
          ),
        })),

      addBinanceAccount: (name, apiKey, secretKey) => {
        const id = generateId()
        set((state) => ({
          binanceAccounts: [
            ...state.binanceAccounts,
            { id, name, apiKey, secretKey, holdings: [] },
          ],
        }))
        return id
      },

      removeBinanceAccount: (id) =>
        set((state) => ({
          binanceAccounts: state.binanceAccounts.filter((b) => b.id !== id),
        })),

      renameBinanceAccount: (id, name) =>
        set((state) => ({
          binanceAccounts: state.binanceAccounts.map((b) =>
            b.id === id ? { ...b, name } : b
          ),
        })),

      setBinanceHoldingsFromFetch: (id, fetched) =>
        set((state) => ({
          binanceAccounts: state.binanceAccounts.map((b) => {
            if (b.id !== id) return b
            const now = Date.now()
            const updated = [...b.holdings]
            for (const f of fetched) {
              const sym = f.symbol.toUpperCase()
              const existing = updated.find((h) => h.symbol === sym)
              if (existing) {
                if (f.balance !== undefined) existing.rawBalance = f.balance
                const last = existing.snapshots[existing.snapshots.length - 1]
                if (!last || now - last.timestamp > 30_000) {
                  existing.snapshots = [...existing.snapshots, { value: f.usdValue, timestamp: now }]
                } else {
                  existing.snapshots = [...existing.snapshots.slice(0, -1), { value: f.usdValue, timestamp: last.timestamp }]
                }
              } else {
                updated.push({
                  id: generateId(),
                  coin: f.name,
                  symbol: sym,
                  rawBalance: f.balance,
                  snapshots: [{ value: f.usdValue, timestamp: now }],
                })
              }
            }
            return { ...b, holdings: updated }
          }),
        })),

      addWallet: (name, type, address) => {
        const id = generateId()
        set((state) => ({
          cryptoWallets: [
            ...state.cryptoWallets,
            { id, name, type, address, holdings: [] },
          ],
        }))
        return id
      },

      removeWallet: (walletId) =>
        set((state) => ({
          cryptoWallets: state.cryptoWallets.filter((w) => w.id !== walletId),
        })),

      renameWallet: (walletId, name) =>
        set((state) => ({
          cryptoWallets: state.cryptoWallets.map((w) =>
            w.id === walletId ? { ...w, name } : w
          ),
        })),

      addWalletHolding: (walletId, coin, symbol, value, timestamp) =>
        set((state) => ({
          cryptoWallets: state.cryptoWallets.map((w) =>
            w.id === walletId
              ? {
                  ...w,
                  holdings: [
                    ...w.holdings,
                    {
                      id: generateId(),
                      coin,
                      symbol: symbol.toUpperCase(),
                      snapshots: [{ value, timestamp: timestamp ?? Date.now() }],
                    },
                  ],
                }
              : w
          ),
        })),

      addWalletHoldingSnapshot: (walletId, holdingId, value, timestamp) =>
        set((state) => ({
          cryptoWallets: state.cryptoWallets.map((w) =>
            w.id === walletId
              ? {
                  ...w,
                  holdings: w.holdings.map((h) =>
                    h.id === holdingId
                      ? {
                          ...h,
                          snapshots: [
                            ...h.snapshots,
                            { value, timestamp: timestamp ?? Date.now() },
                          ].sort((a, b) => a.timestamp - b.timestamp),
                        }
                      : h
                  ),
                }
              : w
          ),
        })),

      removeWalletHolding: (walletId, holdingId) =>
        set((state) => ({
          cryptoWallets: state.cryptoWallets.map((w) =>
            w.id === walletId
              ? { ...w, holdings: w.holdings.filter((h) => h.id !== holdingId) }
              : w
          ),
        })),

      setWalletHoldingsFromFetch: (walletId, fetched) =>
        set((state) => ({
          cryptoWallets: state.cryptoWallets.map((w) => {
            if (w.id !== walletId) return w
            const now = Date.now()
            const updatedHoldings = [...w.holdings]

            for (const f of fetched) {
              const sym = f.symbol.toUpperCase()
              const existing = updatedHoldings.find((h) => h.symbol === sym)
              if (existing) {
                // Update raw balance
                if (f.balance !== undefined) existing.rawBalance = f.balance
                // Add new snapshot (avoid duplicate timestamps within 30s)
                const lastSnap = existing.snapshots[existing.snapshots.length - 1]
                if (!lastSnap || now - lastSnap.timestamp > 30_000) {
                  existing.snapshots = [
                    ...existing.snapshots,
                    { value: f.usdValue, timestamp: now },
                  ]
                } else {
                  // Update the last snapshot value in-place if called too rapidly
                  existing.snapshots = [
                    ...existing.snapshots.slice(0, -1),
                    { value: f.usdValue, timestamp: lastSnap.timestamp },
                  ]
                }
              } else {
                // Brand-new holding
                updatedHoldings.push({
                  id: generateId(),
                  coin: f.name,
                  symbol: sym,
                  rawBalance: f.balance,
                  snapshots: [{ value: f.usdValue, timestamp: now }],
                })
              }
            }

            return { ...w, holdings: updatedHoldings }
          }),
        })),

      renameDashboard: (key, title) =>
        set((state) => ({
          dashboardTitles: { ...state.dashboardTitles, [key]: title },
        })),

      loadTestBankData: () =>
        set((state) => ({
          bankAccounts: state.bankAccounts.length > 0 ? state.bankAccounts : SEED_BANK,
        })),

      loadTestCryptoData: () =>
        set((state) => ({
          cryptoHoldings: state.cryptoHoldings.length > 0 ? state.cryptoHoldings : SEED_CRYPTO,
        })),

      clearAllBankData: () =>
        set({
          bankAccounts: [],
        }),

      clearAllCryptoData: () =>
        set({
          cryptoHoldings: [],
        }),
    }),
    {
      name: 'solara-finance-store',
    }
  )
)
