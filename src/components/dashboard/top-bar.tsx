"use client"

import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { Sun, Moon, RefreshCw } from "lucide-react"
import Link from "next/link"
import { type TradeType } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import InsiderInsightsLogo from "@/components/logo"

type Props = {
  typeFilter: TradeType | "ALL"
  onTypeFilterChange: (type: TradeType | "ALL") => void
  onRefresh?: () => Promise<void>
  isRefreshing?: boolean
}

const FILTER_META: Record<
  TradeType | "ALL",
  { label: string; title: string; description: string }
> = {
  ALL: {
    label: "ALL",
    title: "All trade types",
    description:
      "Show every disclosed transaction — buys, sells, calls, and puts — across all tracked insiders.",
  },
  BUY: {
    label: "BUY",
    title: "Direct stock purchases",
    description:
      "Insider acquired shares outright at market price. Signals conviction in the company's near-term prospects.",
  },
  SELL: {
    label: "SELL",
    title: "Direct stock sales",
    description:
      "Insider disposed of shares. Elevated disclosure lag on sells can indicate strategic timing ahead of news.",
  },
  CALL: {
    label: "CALL",
    title: "Call option purchases",
    description:
      "Bullish leveraged bet on upside. The insider pays a premium for the right to buy shares at a set strike price.",
  },
  PUT: {
    label: "PUT",
    title: "Put option purchases",
    description:
      "Bearish or hedging position. The insider pays a premium for the right to sell shares — often a hedge against existing longs.",
  },
}

const TYPES: (TradeType | "ALL")[] = ["ALL", "BUY", "SELL", "CALL", "PUT"]

export function TopBar({ typeFilter, onTypeFilterChange, onRefresh, isRefreshing }: Props) {
  const { resolvedTheme, setTheme } = useTheme()
  const router = useRouter()
  const { data: session } = authClient.useSession()

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <header className="h-20 border-b border-border bg-background grid grid-cols-[auto_1fr_auto] items-center px-6 gap-6 shrink-0">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity duration-100">
          <InsiderInsightsLogo size={0.95} className="text-primary" />
        </Link>

        <div className="h-5 w-px bg-border" />

        <div className="flex items-center gap-2">
        {TYPES.map((t) => {
          const meta = FILTER_META[t]
          return (
            <Tooltip key={t} delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onTypeFilterChange(t)}
                  className={cn(
                    "px-3.5 py-1.5 font-mono text-[13px] tracking-wider border transition-colors duration-100",
                    typeFilter === t
                      ? "bg-primary/15 border-primary/50 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                  )}
                >
                  {meta.label}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="start"
                sideOffset={8}
                className="max-w-[240px] py-2.5 px-3"
              >
                <div className="font-mono">
                  <div className="text-[12px] font-bold mb-1 opacity-100">
                    {meta.title}
                  </div>
                  <div className="text-[11px] leading-relaxed opacity-70 whitespace-normal">
                    {meta.description}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
        </div>
      </div>

      <div className="flex justify-center pointer-events-none">
        <span className="font-mono text-[18px] uppercase tracking-[0.2em] text-foreground whitespace-nowrap">
          Dashboard
        </span>
      </div>

      <div className="flex items-center gap-4 text-[12px] font-mono text-muted-foreground tracking-wide justify-end">
        {onRefresh && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-foreground transition-colors duration-100 disabled:opacity-40"
                aria-label="Refresh data from AI pipeline"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="py-2 px-3">
              <div className="font-mono text-[11px]">
                {isRefreshing ? "Fetching live data…" : "Refresh from AI pipeline"}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-foreground transition-colors duration-100"
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        {session?.user && (
          <>
            <span className="text-foreground/15">|</span>
            <Link
              href="/profile"
              className="group flex items-center gap-2.5 hover:opacity-80 transition-opacity duration-100"
              aria-label="View profile"
            >
              <div className="w-8 h-8 border border-border bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary group-hover:border-primary/50 transition-colors duration-100 overflow-hidden shrink-0">
                {session.user.image ? (
                  <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  session.user.name?.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() ?? "?"
                )}
              </div>
              <span className="font-mono text-[11px] text-muted-foreground/70 max-w-[140px] truncate hidden sm:block">
                {session.user.name || session.user.email}
              </span>
            </Link>
            <button
              onClick={handleSignOut}
              className="px-2.5 py-1 font-mono text-[11px] tracking-wider border border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground transition-colors duration-100 uppercase"
            >
              Exit
            </button>
          </>
        )}
      </div>
    </header>
  )
}
