'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type InlineRenameProps = {
  value: string
  onSave: (newValue: string) => void
  className?: string
  inputClassName?: string
}

export function InlineRename({ value, onSave, className, inputClassName }: InlineRenameProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(value)
      setTimeout(() => inputRef.current?.select(), 0)
    }
  }, [editing, value])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed) onSave(trimmed)
    setEditing(false)
  }

  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') cancel()
          }}
          className={cn(
            'bg-[oklch(0.18_0_0)] border border-[oklch(0.72_0.19_45_/_0.6)] rounded-md px-2 py-0.5 text-foreground text-xl font-semibold leading-none focus:outline-none focus:border-[oklch(0.72_0.19_45)]',
            inputClassName
          )}
        />
        <button
          onClick={commit}
          className="text-[oklch(0.70_0.16_155)] hover:text-[oklch(0.70_0.16_155_/_0.8)] transition-colors"
          aria-label="Save"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={cancel}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2 group', className)}>
      <span>{value}</span>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all duration-150"
        aria-label="Rename"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
