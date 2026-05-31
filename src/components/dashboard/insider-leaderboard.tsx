import Link from "next/link"
import { type Insider, type Trade, INSIDER_COLORS, formatDate } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

type Props = {
  insiders: Insider[]
  trades: Trade[]
  selectedInsiderId: string | null
  onSelect: (id: string | null) => void
}

const PARTY_LABEL: Record<string, string> = {
  R: "Rep.",
  D: "Dem.",
  I: "Ind.",
  N: "",
}

export function InsiderLeaderboard({ insiders, trades, selectedInsiderId, onSelect }: Props) {
  const ranked = [...insiders].sort((a, b) => b.estimatedEdge - a.estimatedEdge)

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-background">
      <div className="h-14 px-4 border-b border-border flex items-center justify-between">
        <span className="font-mono text-[13px] uppercase tracking-[0.15em] text-muted-foreground">
          Insiders
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {insiders.length} tracked
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {ranked.map((insider, i) => {
          const insiderTrades = trades.filter((t) => t.insiderId === insider.id)
          const isSelected = selectedInsiderId === insider.id
          const isDimmed = selectedInsiderId !== null && !isSelected
          const color = INSIDER_COLORS[insider.id]
          const party = PARTY_LABEL[insider.party] ?? ""
          const lastTrade = insiderTrades
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))[0]

          return (
            <div
              key={insider.id}
              className={cn(
                "group relative border-b border-border transition-colors duration-100",
                isSelected && "bg-primary/8",
                isDimmed && "opacity-40"
              )}
            >
              {/* Full-card selection button sits behind content — no interactive children */}
              <button
                aria-pressed={isSelected}
                aria-label={`${isSelected ? "Deselect" : "Select"} ${insider.name}`}
                onClick={() => onSelect(isSelected ? null : insider.id)}
                className="absolute inset-0 w-full hover:bg-accent focus-visible:outline-none focus-visible:bg-accent"
              />

              {/* Card content — pointer-events-none so the button above receives clicks */}
              <div className="relative pointer-events-none px-4 py-3.5">
                {/* Top row: name/title + edge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex flex-col items-center gap-1.5 pt-0.5 shrink-0">
                      <span className="font-mono text-xs font-bold text-muted-foreground/70 w-4 text-center">
                        {i + 1}
                      </span>
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "font-mono text-[13px] font-semibold leading-tight truncate",
                            isSelected ? "text-primary" : "text-foreground"
                          )}
                        >
                          {insider.name}
                        </span>
                        {party && (
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                            {party}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground mt-0.5 truncate">
                        {insider.title}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div
                      className={cn(
                        "font-mono text-sm font-bold tabular-nums",
                        insider.estimatedEdge >= 0 ? "text-chart-1" : "text-chart-2"
                      )}
                    >
                      {insider.estimatedEdge >= 0 ? "+" : ""}
                      {insider.estimatedEdge.toFixed(1)}%
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground/80 mt-0.5 uppercase tracking-wide">
                      avg edge
                    </div>
                  </div>
                </div>

                {/* Bottom row: full-width, trades/date on left, profile link on right */}
                <div className="flex items-center justify-between mt-2 pl-7">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {insiderTrades.length} trades
                    </span>
                    {lastTrade && (
                      <>
                        <span className="text-muted-foreground/50 text-[10px]">·</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          Last {formatDate(lastTrade.date)}
                        </span>
                      </>
                    )}
                  </div>
                  {/* pointer-events-auto re-enables click on the link only */}
                  <Link
                    href={`/insiders/${insider.id}`}
                    className={cn(
                      "pointer-events-auto font-mono text-[10px] uppercase tracking-wide shrink-0",
                      "px-2 py-0.5 border border-border text-muted-foreground",
                      "opacity-0 group-hover:opacity-100 transition-opacity duration-100",
                      "hover:text-primary hover:border-primary/60"
                    )}
                  >
                    Profile →
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-4 py-2 border-t border-border">
        <p className="font-mono text-[10px] text-muted-foreground/70 leading-relaxed">
          Edge = avg stock delta since disclosure date across all disclosed trades. Not investment advice.
        </p>
      </div>
    </div>
  )
}
