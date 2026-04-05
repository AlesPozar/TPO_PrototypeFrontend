'use client'

import { useState, useMemo } from 'react'
import { Pencil, Check, X, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import type { Transaction, TransactionType } from '@/lib/store'

const EXPENSE_TYPES: TransactionType[] = [
  'Food', 'Accessories', 'Clothes', 'Transport', 'Entertainment', 'Healthcare', 'Utilities', 'Other Expense',
]
const INCOME_TYPES: TransactionType[] = [
  'Job', 'After Job', 'Investment Payout', 'Freelance', 'Rental Income', 'Other Income',
]

const EXPENSE_COLORS = [
  '#F97316', '#EF4444', '#F59E0B', '#A855F7', '#EC4899', '#14B8A6', '#3B82F6', '#84CC16',
]
const INCOME_COLORS = [
  '#22C55E', '#10B981', '#06B6D4', '#6366F1', '#8B5CF6', '#F472B6',
]

function typeColor(type: TransactionType, index: number): string {
  if (EXPENSE_TYPES.includes(type)) return EXPENSE_COLORS[EXPENSE_TYPES.indexOf(type) % EXPENSE_COLORS.length]
  return INCOME_COLORS[INCOME_TYPES.indexOf(type) % INCOME_COLORS.length]
}

type EditingRow = {
  id: string
  name: string
  value: string
  type: TransactionType
}

interface TransactionTableProps {
  transactions: Transaction[]
  statementId: string
  currency: string
}

function TransactionTable({ transactions, statementId, currency }: TransactionTableProps) {
  const updateTransaction = useStore((s) => s.updateTransaction)
  const [editing, setEditing] = useState<EditingRow | null>(null)

  const allTypes = transactions[0]?.category === 'expense' ? EXPENSE_TYPES : INCOME_TYPES

  function startEdit(t: Transaction) {
    setEditing({ id: t.id, name: t.name, value: String(t.value), type: t.type })
  }

  function cancelEdit() {
    setEditing(null)
  }

  function saveEdit() {
    if (!editing) return
    const numVal = parseFloat(editing.value)
    if (isNaN(numVal) || numVal < 0) return
    updateTransaction(statementId, editing.id, {
      name: editing.name.trim() || undefined,
      value: numVal,
      type: editing.type,
    })
    setEditing(null)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-muted-foreground font-medium w-[40%]">Name</th>
            <th className="text-right py-2 px-3 text-muted-foreground font-medium">Amount</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th>
            <th className="py-2 px-2 w-8" />
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, i) => {
            const isEditing = editing?.id === t.id
            const color = typeColor(t.type, i)
            return (
              <tr
                key={t.id}
                className={cn(
                  'border-b border-border/50 transition-colors',
                  isEditing ? 'bg-[oklch(0.20_0_0)]' : 'hover:bg-[oklch(0.19_0_0)]'
                )}
              >
                {isEditing ? (
                  <>
                    <td className="py-1.5 px-2">
                      <Input
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        className="h-7 text-xs bg-[oklch(0.22_0_0)] border-border"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <Input
                        value={editing.value}
                        onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                        className="h-7 text-xs bg-[oklch(0.22_0_0)] border-border text-right w-24"
                        type="number"
                        min={0}
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <Select
                        value={editing.type}
                        onValueChange={(v) => setEditing({ ...editing, type: v as TransactionType })}
                      >
                        <SelectTrigger className="h-7 text-xs bg-[oklch(0.22_0_0)] border-border min-w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[oklch(0.18_0_0)] border-border">
                          {allTypes.map((type) => (
                            <SelectItem key={type} value={type} className="text-xs">
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-1.5 px-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={saveEdit}
                          className="p-1 rounded text-[oklch(0.70_0.16_155)] hover:bg-[oklch(0.70_0.16_155_/_0.12)] transition-colors"
                          aria-label="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-[oklch(0.22_0_0)] transition-colors"
                          aria-label="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 px-3 font-medium text-foreground">{t.name}</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-foreground">
                      {currency}{t.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ background: `${color}22`, color }}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => startEdit(t)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-[oklch(0.22_0_0)] transition-colors"
                        aria-label="Edit transaction"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function buildPieData(transactions: Transaction[]) {
  const grouped: Record<string, number> = {}
  for (const t of transactions) {
    grouped[t.type] = (grouped[t.type] ?? 0) + t.value
  }
  return Object.entries(grouped).map(([name, value]) => ({ name, value }))
}

const CUSTOM_TOOLTIP = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { fill: string } }[] }) => {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-[oklch(0.16_0_0)] border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-foreground">{item.name}</p>
      <p className="text-muted-foreground mt-0.5">
        ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  )
}

interface AIStatementAnalysisProps {
  statementId: string
  isExpanded: boolean
  onToggle: () => void
}

export function AIStatementAnalysis({ statementId, isExpanded, onToggle }: AIStatementAnalysisProps) {
  const statement = useStore((s) => s.analyzedStatements.find((st) => st.id === statementId))
  const removeAnalyzedStatement = useStore((s) => s.removeAnalyzedStatement)
  const currency = useStore((s) => s.userProfile.displayedCurrency ?? '$')
  const [activeCategory, setActiveCategory] = useState<'both' | 'expenses' | 'income'>('both')

  const expenses = useMemo(() => statement?.transactions.filter((t) => t.category === 'expense') ?? [], [statement])
  const income = useMemo(() => statement?.transactions.filter((t) => t.category === 'income') ?? [], [statement])

  const expensePieData = useMemo(() => buildPieData(expenses), [expenses])
  const incomePieData = useMemo(() => buildPieData(income), [income])

  const totalExpenses = useMemo(() => expenses.reduce((s, t) => s + t.value, 0), [expenses])
  const totalIncome = useMemo(() => income.reduce((s, t) => s + t.value, 0), [income])

  if (!statement) return null

  const date = new Date(statement.analyzedAt)
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header bar — always visible, acts as top toggle */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[oklch(0.18_0_0)] transition-colors text-left group"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[oklch(0.72_0.19_45_/_0.15)]">
          <span className="text-[oklch(0.72_0.19_45)] text-[10px] font-bold">AI</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{statement.fileName}</p>
          <p className="text-[10px] text-muted-foreground">Analyzed {dateStr} · {statement.transactions.length} transactions</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] font-medium text-[oklch(0.60_0.20_25)] bg-[oklch(0.60_0.20_25_/_0.12)] px-1.5 py-0.5 rounded">
            -{currency}{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] font-medium text-[oklch(0.70_0.16_155)] bg-[oklch(0.70_0.16_155_/_0.12)] px-1.5 py-0.5 rounded">
            +{currency}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); removeAnalyzedStatement(statementId) }}
            className="p-1 rounded text-muted-foreground hover:text-[oklch(0.60_0.20_25)] hover:bg-[oklch(0.60_0.20_25_/_0.10)] transition-colors"
            aria-label="Remove statement"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Pie charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Expenses pie */}
            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Expenses</p>
                  <p className="text-xs text-muted-foreground">
                    Total: <span className="text-[oklch(0.60_0.20_25)] font-medium">
                      {currency}{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </p>
                </div>
              </div>
              {expensePieData.length > 0 ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {expensePieData.map((entry, index) => (
                          <Cell key={entry.name} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CUSTOM_TOOLTIP />} />
                      <Legend
                        formatter={(value) => (
                          <span className="text-[10px] text-muted-foreground">{value}</span>
                        )}
                        iconSize={8}
                        wrapperStyle={{ fontSize: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">No expense transactions</p>
              )}
            </div>

            {/* Income pie */}
            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Income</p>
                  <p className="text-xs text-muted-foreground">
                    Total: <span className="text-[oklch(0.70_0.16_155)] font-medium">
                      {currency}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </p>
                </div>
              </div>
              {incomePieData.length > 0 ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {incomePieData.map((entry, index) => (
                          <Cell key={entry.name} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CUSTOM_TOOLTIP />} />
                      <Legend
                        formatter={(value) => (
                          <span className="text-[10px] text-muted-foreground">{value}</span>
                        )}
                        iconSize={8}
                        wrapperStyle={{ fontSize: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">No income transactions</p>
              )}
            </div>
          </div>

          {/* Transaction tables row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border border-t border-border">
            {/* Expense table */}
            <div className="p-4">
              <p className="text-xs font-semibold text-foreground mb-3 px-1">Expense Transactions</p>
              {expenses.length > 0 ? (
                <TransactionTable transactions={expenses} statementId={statementId} currency={currency} />
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">No expense transactions</p>
              )}
            </div>

            {/* Income table */}
            <div className="p-4">
              <p className="text-xs font-semibold text-foreground mb-3 px-1">Income Transactions</p>
              {income.length > 0 ? (
                <TransactionTable transactions={income} statementId={statementId} currency={currency} />
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">No income transactions</p>
              )}
            </div>
          </div>

          {/* Bottom collapse toggle */}
          <div className="border-t border-border">
            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-[oklch(0.18_0_0)] transition-colors"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              Collapse
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
