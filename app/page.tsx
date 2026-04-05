'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar, type ActiveView } from '@/components/sidebar'
import { TopHeader } from '@/components/top-header'
import { OverviewDashboard } from '@/components/overview-dashboard'
import { CryptoDashboard } from '@/components/crypto-dashboard'
import { BankDashboard } from '@/components/bank-dashboard'
import { WalletDashboard } from '@/components/wallet-dashboard'
import { UserProfile } from '@/components/user-profile'
import { ChartSearchView } from '@/components/chart-search-view'
import { AIStatementUpload } from '@/components/ai-statement-upload'

export default function Home() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState<ActiveView>('overview')
  const [showProfile, setShowProfile] = useState(false)
  const [searchPair, setSearchPair] = useState<string | null>(null)

  const walletId = active.startsWith('wallet:') ? active.slice(7) : null

  // Prototype auth gate: redirect to sign-in if not yet "logged in" this session
  useEffect(() => {
    const authed = sessionStorage.getItem('solara_authed')
    if (!authed) {
      router.replace('/sign-in')
    } else {
      setReady(true)
    }
  }, [router])

  if (!ready) return null

  function handleSearch(pair: string) {
    setSearchPair(pair)
    setShowProfile(false)
  }

  function handleClearSearch() {
    setSearchPair(null)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AIStatementUpload />
      {/* Slim sidebar */}
      <Sidebar active={active} onChange={(v) => { setShowProfile(false); setSearchPair(null); setActive(v) }} />

      {/* Right panel: header + content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopHeader
          onProfileClick={() => { setShowProfile((p) => !p); setSearchPair(null) }}
          onSearch={handleSearch}
        />

        <main className="flex-1 overflow-y-auto">
          {showProfile ? (
            <UserProfile onBack={() => setShowProfile(false)} />
          ) : searchPair ? (
            <ChartSearchView pair={searchPair} onClose={handleClearSearch} />
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
