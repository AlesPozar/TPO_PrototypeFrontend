'use client'

import { useState, useCallback } from 'react'
import { Plus, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Wallet, Building2, Info, Beaker } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStore, type WalletIcon } from '@/lib/store'
import { WalletIcon as WalletIconDisplay, WALLET_ICON_OPTIONS } from './wallet-icons'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type EntryType = 'pick-entry-type' | 'crypto-wallet' | 'binance' | 'bank'
type FetchState = 'idle' | 'loading' | 'success' | 'error'

type FetchedHolding = {
  symbol: string
  name: string
  balance: number
  usdValue: number
  pricePerToken: number
  chain?: string
  contractAddress?: string
}

type AddWalletDialogProps = {
  onCreated?: (view: string) => void
}

// ─── Binance icon ─────────────────────────────────────────────────────────────

function BinanceLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Binance">
      <path d="M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.352 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595zm4.6366-4.6366L24 12l-2.7175 2.7164L18.568 12l2.693-2.7164zm-9.272 0l2.7175 2.7164-2.7175 2.7164-2.7164-2.7164 2.7164-2.7164zM12 0l7.353 7.353-2.7175 2.7164L12 5.4l-4.6366 4.6695L4.647 7.353 12 0z"/>
    </svg>
  )
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

export function AddWalletDialog({ onCreated }: AddWalletDialogProps) {
  const addWallet = useStore((s) => s.addWallet)
  const setWalletHoldingsFromFetch = useStore((s) => s.setWalletHoldingsFromFetch)
  const addBinanceAccount = useStore((s) => s.addBinanceAccount)
  const addBankAccount = useStore((s) => s.addBankAccount)
  const loadTestBankData = useStore((s) => s.loadTestBankData)
  const loadTestCryptoData = useStore((s) => s.loadTestCryptoData)
  const currency = useStore((s) => s.userProfile.displayedCurrency ?? '$')

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<EntryType>('pick-entry-type')

  // Crypto wallet state
  const [selectedIcon, setSelectedIcon] = useState<WalletIcon>('metamask')
  const [walletName, setWalletName] = useState('My MetaMask')
  const [address, setAddress] = useState('')
  const [addressError, setAddressError] = useState('')
  const [fetchState, setFetchState] = useState<FetchState>('idle')
  const [fetchedHoldings, setFetchedHoldings] = useState<FetchedHolding[]>([])
  const [fetchError, setFetchError] = useState('')

  // Binance state
  const [binanceName, setBinanceName] = useState('My Binance')
  const [binanceApiKey, setBinanceApiKey] = useState('')
  const [binanceSecretKey, setBinanceSecretKey] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [binanceError, setBinanceError] = useState('')

  // Bank account state
  const [bankName, setBankName] = useState('My Bank Account')
  const [bankBalance, setBankBalance] = useState('')
  const [bankError, setBankError] = useState('')

  function reset() {
    setStep('pick-entry-type')
    setSelectedIcon('metamask')
    setWalletName('My MetaMask')
    setAddress('')
    setAddressError('')
    setFetchState('idle')
    setFetchedHoldings([])
    setFetchError('')
    setBinanceName('My Binance')
    setBinanceApiKey('')
    setBinanceSecretKey('')
    setShowSecret(false)
    setBinanceError('')
    setBankName('My Bank Account')
    setBankBalance('')
    setBankError('')
  }

  // ── Crypto wallet ────────────────────────────────────────────────────────────

  function handlePickIcon(icon: WalletIcon) {
    setSelectedIcon(icon)
    const opt = WALLET_ICON_OPTIONS.find((o) => o.type === icon)
    setWalletName(`My ${opt?.label ?? 'Wallet'}`)
  }

  const lookupAddress = useCallback(async (addr: string) => {
    if (!addr || addr.length < 10) return
    setFetchState('loading')
    setFetchedHoldings([])
    setFetchError('')
    try {
      const res = await fetch(`/api/wallet-balances?address=${encodeURIComponent(addr)}`)
      const json = await res.json()
      if (!res.ok || json.error) {
        setFetchError(json.error ?? 'Could not fetch wallet data.')
        setFetchState('error')
        return
      }
      setFetchedHoldings(json.holdings ?? [])
      setFetchState('success')
    } catch {
      setFetchError('Network error — check your connection.')
      setFetchState('error')
    }
  }, [])

  function handleCreateWallet() {
    const trimmed = address.trim()
    if (!trimmed) { setAddressError('Please enter a public wallet address.'); return }
    if (trimmed.length < 10) { setAddressError('Address looks too short.'); return }
    const name = walletName.trim() || WALLET_ICON_OPTIONS.find((o) => o.type === selectedIcon)?.label || 'My Wallet'
    const id = addWallet(name, selectedIcon, trimmed)
    if (fetchedHoldings.length > 0) setWalletHoldingsFromFetch(id, fetchedHoldings)
    onCreated?.(`wallet:${id}`)
    setOpen(false)
    reset()
  }

  // ── Binance ──────────────────────────────────────────────────────────────────

  function handleCreateBinance() {
    if (!binanceApiKey.trim()) { setBinanceError('API key is required.'); return }
    if (!binanceSecretKey.trim()) { setBinanceError('Secret key is required.'); return }
    if (binanceApiKey.trim().length < 20) { setBinanceError('API key seems too short — please check it.'); return }
    const id = addBinanceAccount(
      binanceName.trim() || 'My Binance',
      binanceApiKey.trim(),
      binanceSecretKey.trim()
    )
    onCreated?.(`binance:${id}`)
    setOpen(false)
    reset()
  }

  // ── Bank account ─────────────────────────────────────────────────────────────

  function handleCreateBank() {
    const bal = parseFloat(bankBalance)
    if (!bankName.trim()) { setBankError('Please enter an account name.'); return }
    if (isNaN(bal) || bal < 0) { setBankError('Please enter a valid balance.'); return }
    addBankAccount(bankName.trim(), '', bal)
    onCreated?.('bank')
    setOpen(false)
    reset()
  }

  function handleLoadTestBank() {
    loadTestBankData()
    onCreated?.('bank')
    setOpen(false)
    reset()
  }

  function handleLoadTestCrypto() {
    loadTestCryptoData()
    onCreated?.('crypto')
    setOpen(false)
    reset()
  }

  const totalUsd = fetchedHoldings.reduce((s, h) => s + h.usdValue, 0)

  // ─── Entry type picker ───────────────────────────────────────────────────────

  const entryTypes = [
    {
      id: 'crypto-wallet' as const,
      label: 'Crypto Wallet',
      desc: 'Track any EVM wallet by address',
      icon: <WalletIconDisplay type="metamask" className="w-8 h-8" />,
    },
    {
      id: 'binance' as const,
      label: 'Binance Account',
      desc: 'Connect with a read-only API key',
      icon: <BinanceLogo className="w-8 h-8 text-[#F3BA2F]" />,
    },
    {
      id: 'bank' as const,
      label: 'Traditional Asset (Bank account)',
      desc: 'Manually track a bank balance',
      icon: <Building2 className="w-8 h-8 text-muted-foreground" />,
    },
  ]

  const testDashboardTypes = [
    {
      id: 'test-crypto' as const,
      label: 'Test Crypto Dashboard',
      desc: 'Load preset crypto data to explore the app',
      icon: <Beaker className="w-8 h-8 text-[oklch(0.70_0.16_155)]" />,
      onClick: handleLoadTestCrypto,
    },
    {
      id: 'test-bank' as const,
      label: 'Test Bank Dashboard',
      desc: 'Load preset bank data to explore the app',
      icon: <Beaker className="w-8 h-8 text-[oklch(0.65_0.15_200)]" />,
      onClick: handleLoadTestBank,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <button
          className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-[oklch(0.20_0_0)] transition-all duration-200"
          title="Add investment"
          aria-label="Add investment"
        >
          <Plus className="w-5 h-5" />
        </button>
      </DialogTrigger>

      <DialogContent className="bg-[oklch(0.14_0_0)] border-border max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {step === 'pick-entry-type' && 'Add Investment'}
            {step === 'crypto-wallet' && 'Add Crypto Wallet'}
            {step === 'binance' && 'Connect Binance'}
            {step === 'bank' && 'Add New Investment To Track'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Add a new investment to track — crypto wallet, Binance, or bank overview.
          </DialogDescription>
        </DialogHeader>

        {/* ── Step 1: Pick entry type ─────────────────────────────────────── */}
        {step === 'pick-entry-type' && (
          <div className="flex flex-col gap-3 mt-2">
            <p className="text-xs text-muted-foreground">Connect an account</p>
            <div className="flex flex-col gap-2">
              {entryTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setStep(t.id)}
                  className="flex items-center gap-4 rounded-xl border border-border bg-[oklch(0.18_0_0)] hover:bg-[oklch(0.22_0_0)] hover:border-[oklch(0.72_0.19_45_/_0.5)] transition-all duration-200 p-4 text-left"
                >
                  <div className="shrink-0">{t.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="w-full h-px bg-border my-1" />

            <p className="text-xs text-muted-foreground">Or explore with test data</p>
            <div className="flex flex-col gap-2">
              {testDashboardTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={t.onClick}
                  className="flex items-center gap-4 rounded-xl border border-dashed border-border bg-[oklch(0.16_0_0)] hover:bg-[oklch(0.20_0_0)] hover:border-[oklch(0.72_0.19_45_/_0.5)] transition-all duration-200 p-4 text-left"
                >
                  <div className="shrink-0">{t.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Crypto Wallet ────────────────────────────────────────────────── */}
        {step === 'crypto-wallet' && (
          <div className="flex flex-col gap-4 mt-2">
            {/* Icon picker */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Wallet Icon</Label>
              <div className="grid grid-cols-3 gap-2">
                {WALLET_ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => handlePickIcon(opt.type)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-200',
                      selectedIcon === opt.type
                        ? 'border-[oklch(0.72_0.19_45)] bg-[oklch(0.72_0.19_45_/_0.12)]'
                        : 'border-border bg-[oklch(0.18_0_0)] hover:bg-[oklch(0.22_0_0)]'
                    )}
                  >
                    <WalletIconDisplay type={opt.type} className="w-8 h-8" />
                    <span className="text-[10px] text-muted-foreground leading-tight text-center">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Wallet Name</Label>
              <Input
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="My MetaMask Wallet"
                className="bg-[oklch(0.18_0_0)] border-border text-foreground h-9 text-sm"
              />
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Public Wallet Address</Label>
              <div className="flex gap-2">
                <Input
                  value={address}
                  onChange={(e) => { setAddress(e.target.value); setAddressError(''); setFetchState('idle'); setFetchedHoldings([]) }}
                  placeholder="0x..."
                  className={cn(
                    'bg-[oklch(0.18_0_0)] border-border text-foreground h-9 text-sm font-mono flex-1',
                    addressError && 'border-[oklch(0.60_0.20_25)]'
                  )}
                />
                <Button
                  variant="outline"
                  className="h-9 px-3 border-border text-muted-foreground hover:text-foreground bg-transparent shrink-0"
                  onClick={() => lookupAddress(address.trim())}
                  disabled={fetchState === 'loading' || address.trim().length < 10}
                  aria-label="Look up address"
                >
                  {fetchState === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Look up'}
                </Button>
              </div>
              {addressError && <p className="text-xs text-[oklch(0.60_0.20_25)]">{addressError}</p>}
              <p className="text-xs text-muted-foreground">Only your public address is needed — no private keys required.</p>
            </div>

            {/* Fetch result */}
            {fetchState === 'error' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[oklch(0.60_0.20_25_/_0.10)] border border-[oklch(0.60_0.20_25_/_0.3)]">
                <AlertCircle className="w-4 h-4 text-[oklch(0.60_0.20_25)] mt-0.5 shrink-0" />
                <p className="text-xs text-[oklch(0.60_0.20_25)]">{fetchError}</p>
              </div>
            )}
            {fetchState === 'success' && fetchedHoldings.length === 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[oklch(0.20_0_0)] border border-border">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">No token balances found. You can still add this wallet and track it manually.</p>
              </div>
            )}
            {fetchState === 'success' && fetchedHoldings.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[oklch(0.70_0.16_155)]" />
                    <span className="text-xs font-medium text-[oklch(0.70_0.16_155)]">
                      {fetchedHoldings.length} token{fetchedHoldings.length !== 1 ? 's' : ''} found
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {'≈ '}{currency}{totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto rounded-lg bg-[oklch(0.18_0_0)] border border-border p-2">
                  {fetchedHoldings.map((h, i) => (
                    <div key={`${h.symbol}-${h.chain ?? i}`} className="flex items-center justify-between px-2 py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-semibold text-foreground shrink-0">{h.symbol}</span>
                        {h.chain && (
                          <span className="text-[10px] text-muted-foreground bg-[oklch(0.22_0_0)] px-1.5 py-0.5 rounded shrink-0">{h.chain}</span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-foreground">
                          {currency}{h.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {h.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {h.symbol}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-border text-muted-foreground hover:text-foreground bg-transparent h-9" onClick={() => setStep('pick-entry-type')}>Back</Button>
              <Button className="flex-1 bg-[oklch(0.72_0.19_45)] text-black hover:bg-[oklch(0.66_0.19_45)] h-9" onClick={handleCreateWallet} disabled={fetchState === 'loading'}>Connect Wallet</Button>
            </div>
          </div>
        )}

        {/* ── Binance Account ──────────────────────────────────────────────── */}
        {step === 'binance' && (
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[oklch(0.18_0_0)] border border-border">
              <Info className="w-4 h-4 text-[oklch(0.70_0.16_155)] mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Only use <span className="text-foreground font-medium">read-only API keys</span>. Never enable trading or withdrawal permissions. In Binance, create a key with only <span className="text-foreground font-medium">&ldquo;Enable Reading&rdquo;</span> checked.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Account Name</Label>
              <Input value={binanceName} onChange={(e) => setBinanceName(e.target.value)} placeholder="My Binance" className="bg-[oklch(0.18_0_0)] border-border text-foreground h-9 text-sm" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">API Key</Label>
              <Input
                value={binanceApiKey}
                onChange={(e) => { setBinanceApiKey(e.target.value); setBinanceError('') }}
                placeholder="Paste your Binance API key"
                className="bg-[oklch(0.18_0_0)] border-border text-foreground h-9 text-sm font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Secret Key</Label>
              <div className="relative">
                <Input
                  type={showSecret ? 'text' : 'password'}
                  value={binanceSecretKey}
                  onChange={(e) => { setBinanceSecretKey(e.target.value); setBinanceError('') }}
                  placeholder="Paste your secret key"
                  className="bg-[oklch(0.18_0_0)] border-border text-foreground h-9 text-sm font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showSecret ? 'Hide secret key' : 'Show secret key'}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Keys are stored locally in your browser and never sent anywhere except Binance.</p>
            </div>

            {binanceError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[oklch(0.60_0.20_25_/_0.10)] border border-[oklch(0.60_0.20_25_/_0.3)]">
                <AlertCircle className="w-4 h-4 text-[oklch(0.60_0.20_25)] mt-0.5 shrink-0" />
                <p className="text-xs text-[oklch(0.60_0.20_25)]">{binanceError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-border text-muted-foreground hover:text-foreground bg-transparent h-9" onClick={() => setStep('pick-entry-type')}>Back</Button>
              <Button className="flex-1 bg-[oklch(0.72_0.19_45)] text-black hover:bg-[oklch(0.66_0.19_45)] h-9" onClick={handleCreateBinance}>Connect Binance</Button>
            </div>
          </div>
        )}

        {/* ── Bank Account ─────────────────────────────────────────────────── */}
        {step === 'bank' && (
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Account Name</Label>
              <Input
                value={bankName}
                onChange={(e) => { setBankName(e.target.value); setBankError('') }}
                placeholder="e.g. Main Checking, Savings"
                className="bg-[oklch(0.18_0_0)] border-border text-foreground h-9 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Current Balance ({currency})</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={bankBalance}
                onChange={(e) => { setBankBalance(e.target.value); setBankError('') }}
                placeholder="0.00"
                className="bg-[oklch(0.18_0_0)] border-border text-foreground h-9 text-sm"
              />
              <p className="text-xs text-muted-foreground">You can update this balance at any time from the bank dashboard.</p>
            </div>

            {bankError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[oklch(0.60_0.20_25_/_0.10)] border border-[oklch(0.60_0.20_25_/_0.3)]">
                <AlertCircle className="w-4 h-4 text-[oklch(0.60_0.20_25)] mt-0.5 shrink-0" />
                <p className="text-xs text-[oklch(0.60_0.20_25)]">{bankError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-border text-muted-foreground hover:text-foreground bg-transparent h-9" onClick={() => setStep('pick-entry-type')}>Back</Button>
              <Button className="flex-1 bg-[oklch(0.72_0.19_45)] text-black hover:bg-[oklch(0.66_0.19_45)] h-9" onClick={handleCreateBank}>Add Investment</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
