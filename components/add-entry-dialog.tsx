'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStore } from '@/lib/store'

type Mode =
  | 'new-crypto'
  | 'update-crypto'
  | 'new-bank'
  | 'update-bank'
  | 'new-wallet-holding'
  | 'update-wallet-holding'

type AddEntryDialogProps = {
  mode: Mode
  holdingId?: string
  accountId?: string
  walletId?: string
  triggerLabel?: string
  triggerVariant?: 'default' | 'ghost' | 'outline'
  triggerSize?: 'default' | 'sm' | 'icon'
}

export function AddEntryDialog({
  mode,
  holdingId,
  accountId,
  walletId,
  triggerLabel,
  triggerVariant = 'default',
  triggerSize = 'default',
}: AddEntryDialogProps) {
  const [open, setOpen] = useState(false)
  const [coin, setCoin] = useState('')
  const [symbol, setSymbol] = useState('')
  const [accountName, setAccountName] = useState('')
  const [value, setValue] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16))
  const [error, setError] = useState('')

  const addCryptoHolding = useStore((s) => s.addCryptoHolding)
  const addCryptoSnapshot = useStore((s) => s.addCryptoSnapshot)
  const addBankAccount = useStore((s) => s.addBankAccount)
  const addBankSnapshot = useStore((s) => s.addBankSnapshot)
  const addWalletHolding = useStore((s) => s.addWalletHolding)
  const addWalletHoldingSnapshot = useStore((s) => s.addWalletHoldingSnapshot)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const numVal = parseFloat(value)
    if (isNaN(numVal) || numVal < 0) {
      setError('Please enter a valid value.')
      return
    }

    const ts = new Date(date).getTime()
    if (isNaN(ts)) {
      setError('Please enter a valid date.')
      return
    }

    if (mode === 'new-crypto') {
      if (!coin.trim() || !symbol.trim()) { setError('Please fill in all fields.'); return }
      addCryptoHolding(coin.trim(), symbol.trim(), numVal, ts)
    } else if (mode === 'update-crypto' && holdingId) {
      addCryptoSnapshot(holdingId, numVal, ts)
    } else if (mode === 'new-bank') {
      if (!accountName.trim()) { setError('Please enter an account name.'); return }
      addBankAccount(accountName.trim(), '', numVal, ts)
    } else if (mode === 'update-bank' && accountId) {
      addBankSnapshot(accountId, numVal, ts)
    } else if (mode === 'new-wallet-holding' && walletId) {
      if (!coin.trim() || !symbol.trim()) { setError('Please fill in all fields.'); return }
      addWalletHolding(walletId, coin.trim(), symbol.trim(), numVal, ts)
    } else if (mode === 'update-wallet-holding' && walletId && holdingId) {
      addWalletHoldingSnapshot(walletId, holdingId, numVal, ts)
    }

    setCoin('')
    setSymbol('')
    setAccountName('')
    setValue('')
    setDate(new Date().toISOString().slice(0, 16))
    setOpen(false)
  }

  const titles: Record<Mode, string> = {
    'new-crypto': 'Add Crypto Holding',
    'update-crypto': 'Update Value',
    'new-bank': 'Add Bank Account',
    'update-bank': 'Update Balance',
    'new-wallet-holding': 'Add Holding',
    'update-wallet-holding': 'Update Value',
  }

  const isNew = mode === 'new-crypto' || mode === 'new-wallet-holding'
  const isBank = mode === 'new-bank'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerSize === 'icon' ? (
          <Button
            variant={triggerVariant}
            size="icon"
            className="h-7 w-7"
            aria-label={titles[mode]}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <Button
            variant={triggerVariant}
            size={triggerSize}
            className={
              triggerVariant === 'default'
                ? 'bg-[oklch(0.72_0.19_45)] text-[oklch(0.12_0_0)] hover:bg-[oklch(0.65_0.19_45)] font-semibold text-sm'
                : ''
            }
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            {triggerLabel ?? titles[mode]}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="bg-[oklch(0.16_0_0)] border-border max-w-sm">
        <DialogHeader>
            <DialogTitle className="text-foreground">{titles[mode]}</DialogTitle>
            <DialogDescription className="sr-only">
              Enter the details for your portfolio entry.
            </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {isNew && (
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1.5">
                <Label htmlFor="coin" className="text-xs text-muted-foreground">Name</Label>
                <Input
                  id="coin"
                  placeholder="Bitcoin"
                  value={coin}
                  onChange={(e) => setCoin(e.target.value)}
                  className="bg-[oklch(0.20_0_0)] border-border text-sm"
                />
              </div>
              <div className="w-24 flex flex-col gap-1.5">
                <Label htmlFor="symbol" className="text-xs text-muted-foreground">Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="BTC"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="bg-[oklch(0.20_0_0)] border-border text-sm uppercase"
                />
              </div>
            </div>
          )}

          {isBank && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="account" className="text-xs text-muted-foreground">Account Name</Label>
              <Input
                id="account"
                placeholder="Main Checking"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="bg-[oklch(0.20_0_0)] border-border text-sm"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="value" className="text-xs text-muted-foreground">Value (USD)</Label>
            <Input
              id="value"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="bg-[oklch(0.20_0_0)] border-border text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date" className="text-xs text-muted-foreground">Date & Time</Label>
            <Input
              id="date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-[oklch(0.20_0_0)] border-border text-sm"
            />
          </div>

          {error && <p className="text-xs text-[oklch(0.60_0.20_25)]">{error}</p>}

          <Button
            type="submit"
            className="bg-[oklch(0.72_0.19_45)] text-[oklch(0.12_0_0)] hover:bg-[oklch(0.65_0.19_45)] font-semibold"
          >
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
