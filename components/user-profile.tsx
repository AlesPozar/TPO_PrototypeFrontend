'use client'

import { useState, useRef } from 'react'
import { Camera, Pencil, Check, X, LogOut, Trash2, AlertTriangle, User, Euro, DollarSign, Coins } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type UserProfileProps = {
  onBack: () => void
}

export function UserProfile({ onBack }: UserProfileProps) {
  const userProfile = useStore((s) => s.userProfile)
  const updateProfile = useStore((s) => s.updateProfile)
  const resetAccount = useStore((s) => s.resetAccount)

  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState(userProfile.nickname)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  const selectedCurrency = userProfile.displayedCurrency ?? '$'

  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = (userProfile.nickname ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      // Resize to 256×256 via canvas
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 256
        const ctx = canvas.getContext('2d')!
        const size = Math.min(img.width, img.height)
        const ox = (img.width - size) / 2
        const oy = (img.height - size) / 2
        ctx.drawImage(img, ox, oy, size, size, 0, 0, 256, 256)
        updateProfile({ avatarUrl: canvas.toDataURL('image/jpeg', 0.85) })
      }
      img.src = result
    }
    reader.readAsDataURL(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  function saveNickname() {
    const trimmed = nicknameInput.trim()
    if (trimmed) updateProfile({ nickname: trimmed })
    setEditingNickname(false)
  }

  function cancelNickname() {
    setNicknameInput(userProfile.nickname)
    setEditingNickname(false)
  }

  function handleSignOut() {
    // In this local-state app, "sign out" resets the view to overview
    setShowSignOutConfirm(false)
    onBack()
  }

  function handleDeleteAccount() {
    resetAccount()
    setShowDeleteConfirm(false)
    onBack()
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[oklch(0.20_0_0)] transition-colors"
          aria-label="Go back"
        >
          <X className="w-4 h-4" />
        </button>
        <h1 className="text-base font-semibold text-foreground">Profile Settings</h1>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 py-10 gap-8 max-w-lg mx-auto w-full">

        {/* Avatar section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[oklch(0.72_0.19_45_/_0.15)] ring-2 ring-[oklch(0.72_0.19_45_/_0.4)] flex items-center justify-center">
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-[oklch(0.72_0.19_45)]">{initials}</span>
              )}
            </div>
            {/* Edit overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Change profile picture"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              aria-label="Upload profile picture"
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-[oklch(0.72_0.19_45)] hover:text-[oklch(0.80_0.19_45)] transition-colors"
          >
            Change profile picture
          </button>
          {userProfile.avatarUrl && (
            <button
              onClick={() => updateProfile({ avatarUrl: null })}
              className="text-xs text-muted-foreground hover:text-[oklch(0.60_0.20_25)] transition-colors -mt-2"
            >
              Remove photo
            </button>
          )}
        </div>

        {/* Profile section */}
        <div className="w-full bg-[oklch(0.16_0_0)] rounded-xl border border-border p-5 flex flex-col gap-3">
          {/* Display name section */}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Display Name</span>
          </div>
          {editingNickname ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveNickname()
                  if (e.key === 'Escape') cancelNickname()
                }}
                maxLength={32}
                className="flex-1 h-9 px-3 rounded-lg bg-[oklch(0.20_0_0)] border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[oklch(0.72_0.19_45_/_0.5)]"
                aria-label="Edit display name"
              />
              <button
                onClick={saveNickname}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-[oklch(0.72_0.19_45_/_0.15)] text-[oklch(0.72_0.19_45)] hover:bg-[oklch(0.72_0.19_45_/_0.25)] transition-colors"
                aria-label="Save nickname"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={cancelNickname}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[oklch(0.20_0_0)] transition-colors"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-foreground">{userProfile.nickname}</span>
              <button
                onClick={() => { setNicknameInput(userProfile.nickname); setEditingNickname(true) }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-[oklch(0.20_0_0)]"
                aria-label="Edit display name"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
            </div>
          )}

          {/* Currency section */}
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Displayed Currency</span>
          </div>
          
          <div className="w-full flex items-center bg-[oklch(0.20_0_0)] rounded-lg p-1 border border-border">
            <button
              onClick={() => updateProfile({ displayedCurrency: '€' })}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md font-medium text-sm transition-all',
                selectedCurrency === '€'
                  ? 'bg-[oklch(0.72_0.19_45_/_0.4)] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Euro className="w-4 h-4" />
              EUR
            </button>
            <button
              onClick={() => updateProfile({ displayedCurrency: '$' })}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md font-medium text-sm transition-all',
                selectedCurrency === '$'
                  ? 'bg-[oklch(0.72_0.19_45_/_0.4)] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <DollarSign className="w-4 h-4" />
              USD
            </button>
          </div>
        </div>

        {/* Actions section */}
        <div className="w-full flex flex-col gap-3">
          {/* Sign out */}
          {!showSignOutConfirm ? (
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="flex items-center gap-3 w-full px-5 py-4 rounded-xl bg-[oklch(0.16_0_0)] border border-border hover:border-[oklch(0.30_0_0)] hover:bg-[oklch(0.18_0_0)] transition-all text-left group"
            >
              <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-sm font-medium text-foreground">Sign out</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 w-full px-5 py-4 rounded-xl bg-[oklch(0.20_0_0)] border border-border">
              <span className="text-sm text-muted-foreground flex-1">Sign out and return to overview?</span>
              <button
                onClick={handleSignOut}
                className="text-xs font-medium text-foreground px-3 py-1.5 rounded-lg bg-[oklch(0.25_0_0)] hover:bg-[oklch(0.30_0_0)] transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Delete account */}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-3 w-full px-5 py-4 rounded-xl bg-[oklch(0.16_0_0)] border border-[oklch(0.60_0.20_25_/_0.2)] hover:border-[oklch(0.60_0.20_25_/_0.5)] hover:bg-[oklch(0.60_0.20_25_/_0.05)] transition-all text-left group"
            >
              <Trash2 className="w-4 h-4 text-[oklch(0.60_0.20_25)] opacity-70 group-hover:opacity-100 transition-opacity" />
              <div>
                <span className="text-sm font-medium text-[oklch(0.60_0.20_25)]">Delete account</span>
                <p className="text-xs text-muted-foreground mt-0.5">Permanently clears all portfolio data and settings</p>
              </div>
            </button>
          ) : (
            <div className="flex flex-col gap-3 w-full px-5 py-4 rounded-xl bg-[oklch(0.60_0.20_25_/_0.08)] border border-[oklch(0.60_0.20_25_/_0.35)]">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[oklch(0.60_0.20_25)] shrink-0 mt-0.5" />
                <p className="text-sm text-foreground font-medium">This will permanently delete all your portfolio data</p>
              </div>
              <p className="text-xs text-muted-foreground">All crypto holdings, bank accounts, connected wallets, and settings will be erased. This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 text-xs font-semibold text-white px-3 py-2 rounded-lg bg-[oklch(0.50_0.20_25)] hover:bg-[oklch(0.55_0.20_25)] transition-colors"
                >
                  Yes, delete everything
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 text-xs text-muted-foreground px-3 py-2 rounded-lg bg-[oklch(0.20_0_0)] hover:text-foreground hover:bg-[oklch(0.25_0_0)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
