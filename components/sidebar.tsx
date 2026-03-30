'use client'

import { Wallet } from 'lucide-react'
import { SolaraLogo } from './logo'
import { AddWalletDialog } from './add-wallet-dialog'
import { WalletIcon, WALLET_ICON_OPTIONS } from './wallet-icons'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export type ActiveView =
  | 'overview'
  | 'crypto'
  | 'bank'
  | `wallet:${string}`
  | `binance:${string}`

function BinanceLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Binance">
      <path d="M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.352 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595zm4.6366-4.6366L24 12l-2.7175 2.7164L18.568 12l2.693-2.7164zm-9.272 0l2.7175 2.7164-2.7175 2.7164-2.7164-2.7164 2.7164-2.7164zM12 0l7.353 7.353-2.7175 2.7164L12 5.4l-4.6366 4.6695L4.647 7.353 12 0z"/>
    </svg>
  )
}

type SidebarProps = {
  active: ActiveView
  onChange: (view: ActiveView) => void
}

export function Sidebar({ active, onChange }: SidebarProps) {
  const cryptoWallets = useStore((s) => s.cryptoWallets)
  const binanceAccounts = useStore((s) => s.binanceAccounts)
  const bankAccounts = useStore((s) => s.bankAccounts)
  const cryptoHoldings = useStore((s) => s.cryptoHoldings)

  function handleCreated(view: string) {
    onChange(view as ActiveView)
  }

  // Only show bank/crypto nav items if they have been added (not empty seed data scenario)
  // These will show after user adds a test dashboard or connects real accounts
  const showBankDashboard = bankAccounts.length > 0
  const showCryptoDashboard = cryptoHoldings.length > 0

  const hasWallets = cryptoWallets.length > 0 || binanceAccounts.length > 0

  return (
    <aside className="flex flex-col items-center w-14 min-h-screen bg-[oklch(0.14_0_0)] border-r border-border py-3 gap-1.5 shrink-0">
      {/* Overview */}
      <button
        onClick={() => onChange('overview')}
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 mb-2',
          active === 'overview'
            ? 'bg-[oklch(0.72_0.19_45_/_0.2)] ring-1 ring-[oklch(0.72_0.19_45)]'
            : 'hover:bg-[oklch(0.20_0_0)]'
        )}
        title="Overview"
        aria-label="Go to overview"
      >
        <SolaraLogo size={28} />
      </button>

      <div className="w-6 h-px bg-border mb-0.5" />

      {/* Core nav — only show if dashboards have data */}
      {showCryptoDashboard && (
        <button
          onClick={() => onChange('crypto')}
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
            active === 'crypto'
              ? 'bg-[oklch(0.72_0.19_45_/_0.2)] text-[oklch(0.72_0.19_45)] ring-1 ring-[oklch(0.72_0.19_45)]'
              : 'text-muted-foreground hover:text-foreground hover:bg-[oklch(0.20_0_0)]'
          )}
          title="Crypto Portfolio"
          aria-label="Go to Crypto Portfolio"
        >
          <BinanceLogo className="w-5 h-5" />
        </button>
      )}

      {showBankDashboard && (
        <button
          onClick={() => onChange('bank')}
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
            active === 'bank'
              ? 'bg-[oklch(0.72_0.19_45_/_0.2)] text-[oklch(0.72_0.19_45)] ring-1 ring-[oklch(0.72_0.19_45)]'
              : 'text-muted-foreground hover:text-foreground hover:bg-[oklch(0.20_0_0)]'
          )}
          title="Bank Accounts"
          aria-label="Go to Bank Accounts"
        >
          <Wallet className="w-5 h-5" />
        </button>
      )}

      {/* Connected accounts section */}
      {hasWallets && (
        <>
          <div className="w-6 h-px bg-border my-0.5" />

          {/* Crypto wallets */}
          {cryptoWallets.map((wallet) => {
            const viewId: ActiveView = `wallet:${wallet.id}`
            const isActive = active === viewId
            const option = WALLET_ICON_OPTIONS.find((o) => o.type === wallet.type)
            return (
              <button
                key={wallet.id}
                onClick={() => onChange(viewId)}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 relative',
                  isActive
                    ? 'bg-[oklch(0.72_0.19_45_/_0.2)] ring-1 ring-[oklch(0.72_0.19_45)]'
                    : 'hover:bg-[oklch(0.20_0_0)]'
                )}
                title={wallet.name}
                aria-label={`Go to ${wallet.name}`}
              >
                <WalletIcon type={wallet.type} className="w-5 h-5" />
                <span
                  className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: option?.color ?? '#888' }}
                />
              </button>
            )
          })}

          {/* Binance accounts */}
          {binanceAccounts.map((account) => {
            const viewId: ActiveView = `binance:${account.id}`
            const isActive = active === viewId
            return (
              <button
                key={account.id}
                onClick={() => onChange(viewId)}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 relative',
                  isActive
                    ? 'bg-[oklch(0.72_0.19_45_/_0.2)] ring-1 ring-[oklch(0.72_0.19_45)]'
                    : 'hover:bg-[oklch(0.20_0_0)]'
                )}
                title={account.name}
                aria-label={`Go to ${account.name}`}
              >
                <BinanceLogo className="w-5 h-5 text-[#F3BA2F]" />
                <span className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#F3BA2F]" />
              </button>
            )
          })}
        </>
      )}

      <div className="w-6 h-px bg-border my-0.5" />

      {/* Add account button */}
      <AddWalletDialog onCreated={handleCreated} />
    </aside>
  )
}
