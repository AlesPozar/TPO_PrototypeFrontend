'use client'

import { useState } from 'react'
import { Sidebar, type ActiveView } from '@/components/sidebar'
import { TopHeader } from '@/components/top-header'
import { OverviewDashboard } from '@/components/overview-dashboard'
import { CryptoDashboard } from '@/components/crypto-dashboard'
import { BankDashboard } from '@/components/bank-dashboard'
import { WalletDashboard } from '@/components/wallet-dashboard'
import { UserProfile } from '@/components/user-profile'

export default function Home() {
  const [active, setActive] = useState<ActiveView>('overview')
  const [showProfile, setShowProfile] = useState(false)

  const walletId = active.startsWith('wallet:') ? active.slice(7) : null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Slim sidebar */}
      <Sidebar active={active} onChange={(v) => { setShowProfile(false); setActive(v) }} />

      {/* Right panel: header + content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopHeader onProfileClick={() => setShowProfile((p) => !p)} />

        <main className="flex-1 overflow-y-auto">
          {showProfile ? (
            <UserProfile onBack={() => setShowProfile(false)} />
          ) : (
            <>
              {active === 'overview' && <OverviewDashboard />}
              {active === 'crypto' && <CryptoDashboard />}
              {active === 'bank' && <BankDashboard />}
              {walletId && (
                <WalletDashboard
                  walletId={walletId}
                  onDeleted={() => setActive('overview')}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
