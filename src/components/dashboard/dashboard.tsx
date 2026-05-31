"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { TopBar } from "./top-bar"
import { InsiderLeaderboard } from "./insider-leaderboard"
import { TradeTimeline } from "./trade-timeline"
import { TradeTable } from "./trade-table"
import {
  type TradeType,
  type Trade,
  type Insider,
  type MarketEvent,
} from "@/lib/mock-data"

type SortConfig = { column: keyof Trade; direction: "asc" | "desc" }

type Props = {
  insiders: Insider[]
  trades: Trade[]
  marketEvents: MarketEvent[]
}

export function Dashboard({ insiders, trades, marketEvents }: Props) {
  const router = useRouter()
  const [selectedInsiderId, setSelectedInsiderId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<TradeType | "ALL">("ALL")
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: "date", direction: "desc" })
  const [isRefreshing, setIsRefreshing] = useState(false)

  const filteredTrades = useMemo(() => {
    if (typeFilter === "ALL") return trades
    return trades.filter((t) => t.type === typeFilter)
  }, [typeFilter, trades])

  const tableData = useMemo(() => {
    if (!selectedInsiderId) return filteredTrades
    return filteredTrades.filter((t) => t.insiderId === selectedInsiderId)
  }, [filteredTrades, selectedInsiderId])

  function handleSort(column: keyof Trade) {
    setSortConfig((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { column, direction: "desc" }
    )
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      const res = await fetch("/api/data/refresh", { method: "POST" })
      if (res.ok) {
        router.refresh()
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-mono">
      <TopBar
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main body: sidebar + content */}
      <main className="flex flex-1 overflow-hidden min-h-0">
        {/* Left sidebar */}
        <div
          className="border-r border-border shrink-0 overflow-hidden"
          style={{ width: "26%", minWidth: 220, maxWidth: 380, display: "flex", flexDirection: "column" }}
        >
          <InsiderLeaderboard
            insiders={insiders}
            trades={filteredTrades}
            selectedInsiderId={selectedInsiderId}
            onSelect={setSelectedInsiderId}
          />
        </div>

        {/* Right content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-hidden min-h-0">
            <TradeTimeline
              trades={filteredTrades}
              events={marketEvents}
              insiders={insiders}
              selectedInsiderId={selectedInsiderId}
            />
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            <TradeTable
              trades={tableData}
              insiders={insiders}
              selectedInsiderId={selectedInsiderId}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          </div>
        </div>
      </main>

      <footer className="h-7 border-t border-border bg-background flex items-center px-4 shrink-0">
        <div className="flex items-center gap-4 font-mono text-[10px] text-muted-foreground/70 tracking-wide w-full">
          <span className="text-primary/80 font-bold tracking-[0.12em]">INSIDER INSIGHTS</span>
          <span aria-hidden="true" className="text-muted-foreground/40">·</span>
          <span>EDGAR (Form 4) · STOCK Act Disclosures · Congress.gov</span>
          <span aria-hidden="true" className="text-muted-foreground/40">·</span>
          <span>AI-enriched data. Not investment advice.</span>
          <span className="ml-auto">v0.2.0</span>
        </div>
      </footer>
    </div>
  )
}
