"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import {
  INSIDER_COLORS,
  formatDate,
  formatNotional,
  type Insider,
  type Trade,
  type TradeType,
  type InsiderNewsItem,
  type MarketEvent,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import InsiderInsightsLogo from "@/components/logo";

const PARTY_COLORS: Record<string, string> = {
  R: "text-red-400 bg-red-400/10 border-red-400/20",
  D: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  I: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  N: "text-muted-foreground bg-muted border-border",
};

const PARTY_LABEL: Record<string, string> = {
  R: "Republican",
  D: "Democrat",
  I: "Independent",
  N: "Non-partisan",
};

const MARK_SYMBOLS: Record<TradeType, string> = {
  BUY: "▲",
  SELL: "▽",
  CALL: "◆",
  PUT: "◇",
};

const NEWS_CAT_COLORS: Record<InsiderNewsItem["category"], string> = {
  trade: "text-primary bg-primary/8 border-primary/20",
  political: "text-chart-5 bg-chart-5/8 border-chart-5/20",
  market: "text-chart-1 bg-chart-1/8 border-chart-1/20",
  regulatory: "text-chart-2 bg-chart-2/8 border-chart-2/20",
};

const NEWS_CAT_LABELS: Record<InsiderNewsItem["category"], string> = {
  trade: "TRADE",
  political: "POLITICAL",
  market: "MARKET",
  regulatory: "REGULATORY",
};

function TypeBadge({ type }: { type: TradeType }) {
  const isUp = type === "BUY" || type === "CALL";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-mono font-bold tracking-wide",
        isUp ? "text-chart-1 bg-chart-1/10" : "text-chart-2 bg-chart-2/10",
      )}
    >
      <span className="text-[10px]">{MARK_SYMBOLS[type]}</span>
      {type}
    </span>
  );
}

function LagBadge({ lag }: { lag: number }) {
  const color =
    lag > 30 ? "text-chart-2" : lag > 10 ? "text-primary" : "text-chart-1";
  return (
    <span className={cn("font-mono tabular-nums text-[12px]", color)}>
      {lag}d
    </span>
  );
}

function ReturnBadge({ pct }: { pct: number }) {
  const pos = pct >= 0;
  return (
    <span
      className={cn(
        "font-mono tabular-nums font-semibold text-[12px]",
        pos ? "text-chart-1" : "text-chart-2",
      )}
    >
      {pos ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

function TradeSparkline({ trades, color }: { trades: Trade[]; color: string }) {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return null;

  const START = new Date("2024-01-01").getTime();
  const END = new Date("2026-01-01").getTime();
  const RANGE = END - START;

  const W = 320;
  const H = 48;

  const Y_MIN = Math.min(...sorted.map((t) => t.returnPct)) - 10;
  const Y_MAX = Math.max(...sorted.map((t) => t.returnPct)) + 10;
  const Y_RANGE = Y_MAX - Y_MIN;

  function x(d: string) {
    return ((new Date(d).getTime() - START) / RANGE) * W;
  }
  function y(pct: number) {
    return H - ((pct - Y_MIN) / Y_RANGE) * H;
  }

  const points = sorted.map((t) => `${x(t.date)},${y(t.returnPct)}`).join(" ");
  const zeroY = y(0);

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      preserveAspectRatio="none"
    >
      <line
        x1={0}
        y1={zeroY}
        x2={W}
        y2={zeroY}
        stroke="currentColor"
        strokeWidth={0.5}
        strokeDasharray="3,3"
        className="text-muted-foreground/25"
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
        opacity={0.7}
      />
      {sorted.map((t) => (
        <circle
          key={t.id}
          cx={x(t.date)}
          cy={y(t.returnPct)}
          r={3}
          fill={color}
          opacity={0.9}
        />
      ))}
    </svg>
  );
}

type SortKey = keyof Trade;
type SortDir = "asc" | "desc";

type Props = {
  insider: Insider;
  trades: Trade[];
  news: InsiderNewsItem[];
  marketEvents: MarketEvent[];
};

export function InsiderProfile({
  insider,
  trades: insiderTrades,
  news,
  marketEvents,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const { resolvedTheme, setTheme } = useTheme();

  const sortedNews = [...news].sort((a, b) => b.date.localeCompare(a.date));

  const totalNotional = insiderTrades.reduce((s, t) => s + t.notional, 0);
  const avgEdge = insider.estimatedEdge;
  const avgLag = insiderTrades.length
    ? Math.round(
        insiderTrades.reduce((s, t) => s + t.disclosureLag, 0) /
          insiderTrades.length,
      )
    : 0;
  const winRate = insiderTrades.length
    ? Math.round(
        (insiderTrades.filter((t) => t.returnPct > 0).length /
          insiderTrades.length) *
          100,
      )
    : 0;

  const color = INSIDER_COLORS[insider.id] ?? "var(--color-primary)";
  const initials = insider.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  const sortedTrades = [...insiderTrades].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === "number" && typeof bv === "number")
      return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIndicator({ col }: { col: SortKey }) {
    if (sortKey !== col)
      return <span className="text-muted-foreground/60 ml-1">↕</span>;
    return (
      <span className="text-primary ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
    );
  }

  const COLS: { key: SortKey; label: string; align: "left" | "right" }[] = [
    { key: "date", label: "Date", align: "left" },
    { key: "ticker", label: "Ticker", align: "left" },
    { key: "type", label: "Type", align: "left" },
    { key: "notional", label: "Notional", align: "right" },
    { key: "disclosureLag", label: "Lag", align: "right" },
    { key: "priceAtTrade", label: "Price@Trade", align: "right" },
    { key: "priceNow", label: "Price Now", align: "right" },
    { key: "returnPct", label: "Stock △", align: "right" },
  ];

  const relevantEvents = marketEvents
    .filter((e) => {
      const id = insider.id;
      if (id === "trump")
        return ["announcement", "political"].includes(e.category);
      if (id === "pelosi")
        return ["earnings", "announcement"].includes(e.category);
      if (id === "musk")
        return ["earnings", "announcement", "policy"].includes(e.category);
      if (id === "rfk") return ["policy", "announcement"].includes(e.category);
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-mono">
      {/* Top nav */}
      <nav
        aria-label="Page navigation"
        className="h-20 border-b border-border relative flex items-center px-6 shrink-0"
      >
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="hover:opacity-80 transition-opacity duration-100"
          >
            <InsiderInsightsLogo size={0.95} className="text-primary" />
          </Link>
          <div className="h-5 w-px bg-border" />
          <Link
            href="/dashboard"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <span className="text-[12px]">←</span> Dashboard
          </Link>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 font-mono text-[18px] uppercase tracking-[0.2em] text-foreground">
          {insider.name}
        </div>
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="ml-auto flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-foreground transition-colors duration-100"
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </nav>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Profile hero */}
        <section
          aria-label="Profile overview"
          className="border-b border-border px-6 py-4 shrink-0"
        >
          <div className="flex items-start gap-5">
            <div
              className="w-14 h-14 flex items-center justify-center text-xl font-bold shrink-0 border border-border/60"
              style={{ backgroundColor: `${color}14`, color }}
            >
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-foreground tracking-tight leading-none">
                  {insider.name}
                </h1>
                <span
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border font-mono",
                    PARTY_COLORS[insider.party],
                  )}
                >
                  {PARTY_LABEL[insider.party]}
                </span>
              </div>
              <div className="mt-1 font-mono text-[12px] text-muted-foreground">
                {insider.title}
                <span className="text-border mx-2">·</span>
                {insider.affiliation}
              </div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground/75">
                Last trade: {formatDate(insider.lastTradeDate)}
              </div>
            </div>

            <div className="w-72 shrink-0 hidden lg:block">
              <div className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-wide mb-1.5">
                Trade returns
              </div>
              <TradeSparkline trades={insiderTrades} color={color} />
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-4 gap-3">
            {[
              {
                label: "Total Notional",
                value: formatNotional(totalNotional),
                accent: false,
              },
              {
                label: "Trades Filed",
                value: insiderTrades.length,
                accent: false,
              },
              {
                label: "Avg Edge",
                value: `${avgEdge >= 0 ? "+" : ""}${avgEdge.toFixed(1)}%`,
                accent: true,
                positive: avgEdge >= 0,
              },
              {
                label: "Win Rate",
                value: `${winRate}%`,
                accent: true,
                positive: winRate >= 50,
              },
            ].map(({ label, value, accent, positive }) => (
              <div
                key={label}
                className="bg-card border border-border px-3 py-2.5"
              >
                <div className="font-mono text-[10px] text-muted-foreground/75 uppercase tracking-wide mb-1">
                  {label}
                </div>
                <div
                  className={cn(
                    "font-mono text-base font-bold tabular-nums",
                    accent
                      ? positive
                        ? "text-chart-1"
                        : "text-chart-2"
                      : "text-foreground",
                  )}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Main two-pane body */}
        <main className="flex-1 flex overflow-hidden min-h-0">
          {/* Left sidebar — no border-r here; the separator div below draws the vertical line so border-b lines form clean T-junctions */}
          <div
            className="shrink-0 flex flex-col overflow-hidden"
            style={{ width: "22%", minWidth: 200, maxWidth: 280 }}
          >
            <div className="px-4 py-4 border-b border-border shrink-0 flex items-center">
              <span className="font-mono text-[13px] uppercase tracking-[0.15em] text-muted-foreground">
                Overview
              </span>
            </div>
            <div className="px-4 py-4 border-b border-border shrink-0 flex flex-col gap-4">
              <div>
                <div className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-wide mb-1">
                  Avg Disclosure Lag
                </div>
                <div
                  className={cn(
                    "font-mono text-lg font-bold tabular-nums",
                    avgLag > 30
                      ? "text-chart-2"
                      : avgLag > 10
                        ? "text-primary"
                        : "text-chart-1",
                  )}
                >
                  {avgLag} days
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-wide mb-1">
                  Tickers Traded
                </div>
                <div className="font-mono text-sm font-bold text-foreground leading-snug">
                  {[...new Set(insiderTrades.map((t) => t.ticker))].join(", ")}
                </div>
              </div>
              {insiderTrades.length > 0 && (
                <div>
                  <div className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-wide mb-1">
                    Largest Trade
                  </div>
                  <div className="font-mono text-lg font-bold text-foreground">
                    {formatNotional(
                      Math.max(...insiderTrades.map((t) => t.notional)),
                    )}
                  </div>
                </div>
              )}
            </div>

            {relevantEvents.length > 0 && (
              <>
                <div className="px-4 py-4 border-b border-border shrink-0 flex items-center">
                  <span className="font-mono text-[13px] uppercase tracking-[0.15em] text-muted-foreground">
                    Related Events
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto" tabIndex={0}>
                  {relevantEvents.map((ev) => (
                    <div
                      key={ev.date + ev.label}
                      className="px-4 py-2.5 border-b border-border/40 flex items-start gap-2"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: color, opacity: 0.6 }}
                      />
                      <div>
                        <p className="font-mono text-[11px] text-foreground/70 leading-snug">
                          {ev.label}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground/70 mt-0.5">
                          {formatDate(ev.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Vertical separator — drawn as its own element so border-b lines on both sides form unbroken T-junctions */}
          <div className="w-px bg-border shrink-0" />

          {/* Right: news feed + trade history */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <section
              aria-label="News feed"
              className="flex flex-col border-b border-border"
              style={{ height: "44%" }}
            >
              <div className="px-4 py-4 border-b border-border flex items-center justify-between shrink-0">
                <span className="font-mono text-[13px] uppercase tracking-[0.15em] text-muted-foreground">
                  News Feed
                </span>
                <span className="font-mono text-[11px] text-muted-foreground/70">
                  {sortedNews.length} items
                </span>
              </div>
              <div
                className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 content-start"
                tabIndex={0}
              >
                {sortedNews.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 border-b border-r border-border/50 hover:bg-accent/40 transition-colors duration-75"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border font-mono",
                          NEWS_CAT_COLORS[item.category],
                        )}
                      >
                        {NEWS_CAT_LABELS[item.category]}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground/70">
                        {formatDate(item.date)}
                      </span>
                    </div>
                    <p className="font-mono text-[12px] text-foreground/85 leading-relaxed">
                      {item.headline}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground/70 mt-1">
                      {item.source}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section
              aria-label="Trade history"
              className="flex-1 flex flex-col overflow-hidden min-w-0"
            >
              <div className="px-4 py-4 border-b border-border flex items-center justify-between shrink-0">
                <span className="font-mono text-[13px] uppercase tracking-[0.15em] text-muted-foreground">
                  Trade History
                </span>
                <span className="font-mono text-[11px] text-muted-foreground/70">
                  {sortedTrades.length} disclosures
                </span>
              </div>
              <div className="flex-1 overflow-auto" tabIndex={0}>
                <table className="w-full min-w-[640px] border-collapse">
                  <thead className="sticky top-0 z-10 bg-background">
                    <tr className="border-b border-border">
                      {COLS.map((col) => (
                        <th
                          key={col.key}
                          className={cn(
                            "px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/80 cursor-pointer select-none whitespace-nowrap",
                            "hover:text-muted-foreground transition-colors duration-100",
                            col.align === "right" ? "text-right" : "text-left",
                          )}
                          onClick={() => handleSort(col.key)}
                        >
                          {col.label}
                          <SortIndicator col={col.key} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTrades.map((trade, idx) => (
                      <tr
                        key={trade.id}
                        className={cn(
                          "border-b border-border/50 hover:bg-accent/60 transition-colors duration-75",
                          idx % 2 === 0 ? "bg-background" : "bg-card",
                        )}
                      >
                        <td className="px-3 py-2.5 font-mono text-[12px] tabular-nums text-foreground/70 whitespace-nowrap">
                          {formatDate(trade.date)}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[13px] font-bold text-foreground">
                              {trade.ticker}
                            </span>
                            <span className="font-mono text-[11px] text-muted-foreground/75 hidden xl:inline">
                              {trade.company.split(" ").slice(0, 2).join(" ")}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <TypeBadge type={trade.type} />
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[12px] tabular-nums text-right text-foreground/80">
                          {formatNotional(trade.notional)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <LagBadge lag={trade.disclosureLag} />
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[12px] tabular-nums text-right text-foreground/60">
                          ${trade.priceAtTrade.toFixed(0)}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[12px] tabular-nums text-right text-foreground/80">
                          ${trade.priceNow.toFixed(0)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <ReturnBadge pct={trade.returnPct} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>

      <footer className="h-7 border-t border-border bg-background flex items-center px-4 shrink-0">
        <div className="flex items-center gap-4 font-mono text-[10px] text-muted-foreground/80 tracking-wide w-full">
          <span className="text-primary font-bold tracking-[0.12em]">
            INSIDER INSIGHTS
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-muted-foreground/60">
            AI-enriched data — not investment advice
          </span>
          <span className="ml-auto text-muted-foreground/40">v0.2.0</span>
        </div>
      </footer>
    </div>
  );
}
