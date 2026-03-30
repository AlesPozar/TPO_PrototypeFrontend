'use client'

import { Search } from 'lucide-react'
import { useStore } from '@/lib/store'

type TopHeaderProps = {
  onProfileClick: () => void
}

export function TopHeader({ onProfileClick }: TopHeaderProps) {
  const userProfile = useStore((s) => s.userProfile)

  // Avatar initials fallback
  const initials = (userProfile.nickname ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="flex items-center h-14 px-4 gap-4 border-b border-border bg-[oklch(0.14_0_0)] shrink-0">
      {/* Left spacer — aligns with sidebar width (w-14 = 56px) */}
      <div className="w-0 shrink-0" />

      {/* Search bar — centered */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search assets, wallets, accounts..."
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-[oklch(0.20_0_0)] border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[oklch(0.72_0.19_45_/_0.5)] transition-all"
            readOnly
            aria-label="Search (coming soon)"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 shrink-0">
        {/* User avatar */}
        <button
          onClick={onProfileClick}
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[oklch(0.20_0_0)] transition-colors group"
          aria-label="Open user profile"
        >
          <div className="w-7 h-7 rounded-full overflow-hidden bg-[oklch(0.72_0.19_45_/_0.2)] ring-1 ring-[oklch(0.72_0.19_45_/_0.4)] flex items-center justify-center shrink-0">
            {userProfile.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.nickname}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[11px] font-semibold text-[oklch(0.72_0.19_45)]">{initials}</span>
            )}
          </div>
          <span className="text-xs font-medium text-foreground group-hover:text-foreground/80 max-w-[80px] truncate hidden sm:block">
            {userProfile.nickname}
          </span>
        </button>
      </div>
    </header>
  )
}
