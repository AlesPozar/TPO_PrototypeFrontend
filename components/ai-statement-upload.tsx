'use client'

import { useState, useRef, useCallback } from 'react'
import { Sparkles, Plus, Upload, FileText, X, Loader2, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import type { Transaction } from '@/lib/store'

type UploadState = 'idle' | 'uploading' | 'success'

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function buildDemoTransactions(): Transaction[] {
  return [
    // Expenses
    { id: generateId(), name: 'Grocery Store', value: 142.50, type: 'Food', category: 'expense' },
    { id: generateId(), name: 'Restaurant Dinner', value: 68.90, type: 'Food', category: 'expense' },
    { id: generateId(), name: 'Coffee Shop', value: 24.30, type: 'Food', category: 'expense' },
    { id: generateId(), name: 'H&M Purchase', value: 89.99, type: 'Clothes', category: 'expense' },
    { id: generateId(), name: 'Nike Shoes', value: 134.00, type: 'Clothes', category: 'expense' },
    { id: generateId(), name: 'Electronics Store', value: 215.00, type: 'Accessories', category: 'expense' },
    { id: generateId(), name: 'Phone Accessories', value: 42.00, type: 'Accessories', category: 'expense' },
    { id: generateId(), name: 'Bus Pass', value: 35.00, type: 'Transport', category: 'expense' },
    { id: generateId(), name: 'Uber Rides', value: 47.20, type: 'Transport', category: 'expense' },
    { id: generateId(), name: 'Cinema Tickets', value: 28.50, type: 'Entertainment', category: 'expense' },
    { id: generateId(), name: 'Streaming Services', value: 22.98, type: 'Entertainment', category: 'expense' },
    { id: generateId(), name: 'Pharmacy', value: 54.10, type: 'Healthcare', category: 'expense' },
    { id: generateId(), name: 'Electricity Bill', value: 112.40, type: 'Utilities', category: 'expense' },
    { id: generateId(), name: 'Internet Bill', value: 49.99, type: 'Utilities', category: 'expense' },
    // Income
    { id: generateId(), name: 'Monthly Salary', value: 3200.00, type: 'Job', category: 'income' },
    { id: generateId(), name: 'Overtime Pay', value: 320.00, type: 'After Job', category: 'income' },
    { id: generateId(), name: 'Weekend Shifts', value: 180.00, type: 'After Job', category: 'income' },
    { id: generateId(), name: 'Dividend Payout', value: 450.00, type: 'Investment Payout', category: 'income' },
    { id: generateId(), name: 'Stock Sale Gain', value: 275.00, type: 'Investment Payout', category: 'income' },
    { id: generateId(), name: 'Web Design Project', value: 650.00, type: 'Freelance', category: 'income' },
    { id: generateId(), name: 'Apartment Rental', value: 900.00, type: 'Rental Income', category: 'income' },
  ]
}

export function AIStatementUpload() {
  const addAnalyzedStatement = useStore((s) => s.addAnalyzedStatement)

  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setFile(null)
    setUploadState('idle')
    setDragActive(false)
  }

  function handleFileSelect(selectedFile: File | null) {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }, [])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  function handleAnalyze() {
    if (!file) return
    setUploadState('uploading')
    setTimeout(() => {
      // Build demo data and persist to store
      addAnalyzedStatement({
        fileName: file.name,
        analyzedAt: Date.now(),
        transactions: buildDemoTransactions(),
      })
      setUploadState('success')
    }, 2000)
  }

  function handleClose() {
    setOpen(false)
    setTimeout(reset, 200)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setTimeout(reset, 200) }}>
        <DialogTrigger asChild>
          <button
            className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-full bg-[oklch(0.72_0.19_45)] text-black font-medium text-sm shadow-lg hover:bg-[oklch(0.66_0.19_45)] transition-all duration-200 hover:scale-105 z-50"
            aria-label="AI Statement Analysis"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI</span>
            <Plus className="w-3.5 h-3.5" />
          </button>
        </DialogTrigger>

        <DialogContent className="bg-[oklch(0.14_0_0)] border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[oklch(0.72_0.19_45)]" />
              AI Statement Analysis
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Upload a PDF bank statement and our AI will extract and classify your transactions automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-4">
            {uploadState === 'idle' && (
              <>
                {/* Drop zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
                    dragActive
                      ? 'border-[oklch(0.72_0.19_45)] bg-[oklch(0.72_0.19_45_/_0.08)]'
                      : file
                        ? 'border-[oklch(0.70_0.16_155)] bg-[oklch(0.70_0.16_155_/_0.08)]'
                        : 'border-border bg-[oklch(0.18_0_0)] hover:bg-[oklch(0.20_0_0)] hover:border-muted-foreground'
                  )}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleInputChange}
                    className="sr-only"
                  />

                  {file ? (
                    <>
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[oklch(0.70_0.16_155_/_0.15)]">
                        <FileText className="w-6 h-6 text-[oklch(0.70_0.16_155)]" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFile(null) }}
                        className="absolute top-3 right-3 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[oklch(0.22_0_0)] transition-colors"
                        aria-label="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[oklch(0.20_0_0)]">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">Drop your bank statement here</p>
                        <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60">PDF files only, up to 10MB</p>
                    </>
                  )}
                </div>

                {/* Info box */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[oklch(0.18_0_0)] border border-border">
                  <Sparkles className="w-4 h-4 text-[oklch(0.72_0.19_45)] mt-0.5 shrink-0" />
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <p className="text-foreground font-medium mb-1">What the AI will do:</p>
                    <ul className="space-y-0.5 list-disc list-inside">
                      <li>Extract all transactions from your statement</li>
                      <li>Classify expenses into categories</li>
                      <li>Calculate spending summaries and trends</li>
                    </ul>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-border text-muted-foreground hover:text-foreground bg-transparent h-10"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-[oklch(0.72_0.19_45)] text-black hover:bg-[oklch(0.66_0.19_45)] h-10"
                    onClick={handleAnalyze}
                    disabled={!file}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Statement
                  </Button>
                </div>
              </>
            )}

            {uploadState === 'uploading' && (
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-[oklch(0.72_0.19_45_/_0.15)] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[oklch(0.72_0.19_45)] animate-spin" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Analyzing your statement...</p>
                  <p className="text-xs text-muted-foreground mt-1">This may take a few moments</p>
                </div>
                <div className="w-full max-w-xs h-1.5 bg-[oklch(0.20_0_0)] rounded-full overflow-hidden">
                  <div className="h-full bg-[oklch(0.72_0.19_45)] rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            )}

            {uploadState === 'success' && (
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <div className="w-16 h-16 rounded-full bg-[oklch(0.70_0.16_155_/_0.15)] flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-[oklch(0.70_0.16_155)]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Analysis complete!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    21 transactions extracted and classified. Check the Bank dashboard to review your results.
                  </p>
                </div>
                <Button
                  className="bg-[oklch(0.72_0.19_45)] text-black hover:bg-[oklch(0.66_0.19_45)] h-10 px-6"
                  onClick={handleClose}
                >
                  View Results
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
