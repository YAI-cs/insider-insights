import Link from "next/link"
import InsiderInsightsLogo from "@/components/logo"
import { AuthBackground } from "@/components/auth-background"

// ── static marketing data ─────────────────────────────────────────────────────

const leaderboard = [
  { name: "Donald Trump",  title: "47th President",        edge: 87.3, trades: 14, color: "#f59e0b" },
  { name: "Nancy Pelosi",  title: "House Minority Leader", edge: 71.2, trades: 9,  color: "#22d3ee" },
  { name: "Elon Musk",     title: "CEO, Tesla / SpaceX",   edge: 64.8, trades: 7,  color: "#fb923c" },
  { name: "RFK Jr.",       title: "Former HHS Secretary",  edge: 52.1, trades: 3,  color: "#a78bfa" },
]

const sampleTrades = [
  {
    insider: "D. Trump",  ticker: "DJT",  type: "BUY",  amount: "$5.2M",
    date: "2025-01-08",  lag: "8d",  returnPct: "+34.1%",
    note: "Purchased ahead of Truth Social Q1 earnings surprise. Disclosure filed 8 days post-execution.",
  },
  {
    insider: "N. Pelosi", ticker: "NVDA", type: "CALL", amount: "$1.1M",
    date: "2025-02-21", lag: "11d", returnPct: "+22.7%",
    note: "LEAP calls opened 11 days before Senate AI infrastructure bill cleared committee.",
  },
  {
    insider: "E. Musk",   ticker: "TSLA", type: "BUY",  amount: "$2.8M",
    date: "2025-03-14", lag: "14d", returnPct: "+18.4%",
    note: "Open-market purchase during active DOJ review period. Price +18.4% within 20 days.",
  },
]

// ── mini trade timeline SVG ───────────────────────────────────────────────────

const W = 560
const H = 160

const pts: [number, number][] = [
  [0,140],[29,132],[59,138],[88,125],[118,118],[147,122],[176,110],
  [206,104],[235,112],[264,99],[294,92],[323,98],[353,85],[382,78],
  [411,84],[441,71],[470,65],[499,72],[529,58],[560,50],
]

const linePath = `M ${pts.map(([x, y]) => `${x},${y}`).join(" L ")}`
const areaPath = `${linePath} L${W},${H} L0,${H} Z`

const buyMarkers:  [number, number][] = [[59,138],[147,122],[264,99]]
const sellMarkers: [number, number][] = [[441,71]]
const eventLines:  [number, string][] = [[176,"POLICY"],[353,"FORM 4"]]
const months = ["JAN","MAR","MAY","JUL","SEP","NOV"]

function TimelineViz() {
  return (
    <svg
      viewBox={`0 0 ${W} ${H + 20}`}
      width="100%"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lp-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f59e0b" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {[40, 80, 120].map(y => (
        <line key={y} x1={0} y1={y} x2={W} y2={y}
          stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      ))}

      {eventLines.map(([x, label]) => (
        <g key={x}>
          <line x1={x} y1={0} x2={x} y2={H}
            stroke="rgba(255,255,255,0.18)" strokeWidth={1} strokeDasharray="3 3" />
          <text x={Number(x) + 4} y={11} fill="rgba(255,255,255,0.65)"
            fontSize={8} fontFamily="monospace" letterSpacing="1">
            {label}
          </text>
        </g>
      ))}

      <path d={areaPath} fill="url(#lp-area)" />
      <path d={linePath} fill="none" stroke="rgba(245,158,11,0.65)" strokeWidth={1.5} />

      {buyMarkers.map(([x, y]) => (
        <polygon key={x}
          points={`${x},${y - 14} ${x - 5.5},${y - 4} ${x + 5.5},${y - 4}`}
          fill="rgba(74,222,128,0.85)" />
      ))}

      {sellMarkers.map(([x, y]) => (
        <polygon key={x}
          points={`${x},${y + 14} ${x - 5.5},${y + 4} ${x + 5.5},${y + 4}`}
          fill="rgba(248,113,113,0.85)" />
      ))}

      {months.map((m, i) => (
        <text key={m} x={i * 112} y={H + 16} fill="rgba(255,255,255,0.55)"
          fontSize={8} fontFamily="monospace" letterSpacing="1">
          {m}
        </text>
      ))}
    </svg>
  )
}

// ── landing page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes lp-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lp-fade {
          opacity: 0;
          animation: lp-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="dark bg-black text-white min-h-screen">

        {/* ── NAV ──────────────────────────────────────────────────────────── */}
        <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-[clamp(20px,5vw,80px)] border-b border-white/[0.06] bg-black/75 backdrop-blur-xl">
          <InsiderInsightsLogo size={0.82} color="#f59e0b" />
          <div className="flex items-center gap-5">
            <Link href="/sign-in" className="font-mono text-[10px] tracking-[0.16em] text-white/65 uppercase no-underline transition-colors hover:text-white/85">
              SIGN IN
            </Link>
            <Link href="/sign-up" className="font-mono text-[10px] tracking-[0.16em] px-4 py-1.5 border border-amber-400/45 text-amber-400 uppercase no-underline max-md:hidden">
              GET ACCESS
            </Link>
          </div>
        </nav>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="relative min-h-screen overflow-hidden flex flex-col justify-center pt-[clamp(110px,16vh,200px)] pb-[clamp(80px,10vh,140px)] px-[clamp(20px,7vw,120px)]">
          <AuthBackground />

          <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_70%_55%_at_25%_65%,rgba(245,158,11,0.07)_0%,transparent_70%)]" />

          <div className="relative z-20 max-w-[920px]">
            <div className="lp-fade [animation-delay:0ms] mb-7">
              <span className="font-mono text-[10px] tracking-[0.24em] text-amber-400/75 uppercase">
                EDGAR · FORM 4 · STOCK ACT DISCLOSURES
              </span>
            </div>

            <h1 className="lp-fade [animation-delay:80ms] font-[family-name:var(--font-oxanium)] font-extrabold text-[clamp(44px,8vw,120px)] leading-[0.93] tracking-[-0.01em] uppercase text-white mb-[clamp(20px,3vw,36px)]">
              THE TRADES THEY MAKE BEFORE THE MARKET OPENS.
            </h1>

            <p className="lp-fade [animation-delay:160ms] font-mono text-[clamp(11px,1.3vw,14px)] leading-[1.8] text-white/65 max-w-[560px] mb-[clamp(36px,5vw,52px)]">
              Insider Insights monitors disclosed trades by the most market-moving names in
              Washington and Silicon Valley. Form 4 filings, STOCK Act reports: timed,
              annotated, and AI-enriched the moment they file.
            </p>

            <div className="lp-fade [animation-delay:240ms] flex items-center gap-6 flex-wrap">
              <Link href="/sign-up" className="font-mono text-[11px] tracking-[0.2em] uppercase no-underline py-3 px-9 bg-amber-400 text-black font-bold inline-block">
                GET ACCESS
              </Link>
              <Link href="/sign-in" className="font-mono text-[10px] tracking-[0.14em] uppercase no-underline text-white/55">
                Already have access? Sign in →
              </Link>
            </div>
          </div>

          <div className="lp-fade [animation-delay:500ms] absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
            <div className="w-px h-9 bg-[linear-gradient(to_bottom,rgba(245,158,11,0.5),transparent)]" />
            <span className="font-mono text-[8px] tracking-[0.22em] text-white/45 uppercase">SCROLL</span>
          </div>
        </section>

        {/* ── STATS STRIP ──────────────────────────────────────────────────── */}
        <section className="border-y border-white/[0.07] bg-white/[0.018] py-[clamp(28px,4vw,52px)] px-[clamp(20px,7vw,120px)]">
          <div className="grid grid-cols-4 max-md:grid-cols-2 max-sm:grid-cols-1 gap-[clamp(24px,4vw,64px)]">
            {[
              { n: "127+",   label: "Trades tracked" },
              { n: "$148M+", label: "Total disclosed" },
              { n: "~12D",   label: "Avg. disclosure lag" },
              { n: "4",      label: "Tracked insiders" },
            ].map(({ n, label }) => (
              <div key={label}>
                <div className="font-[family-name:var(--font-oxanium)] font-extrabold text-[clamp(28px,3.5vw,54px)] text-amber-400 leading-none mb-1.5">
                  {n}
                </div>
                <div className="font-mono text-[9px] tracking-[0.18em] text-white/55 uppercase">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURE 1: TIMELINE ──────────────────────────────────────────── */}
        <section className="py-[clamp(72px,11vh,152px)] px-[clamp(20px,7vw,120px)]">
          <div className="grid grid-cols-2 max-md:grid-cols-1 gap-[clamp(40px,7vw,100px)] items-center">

            <div className="bg-[#080808] border border-white/[0.07] p-5 pb-3.5">
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-[9px] tracking-[0.14em] text-white/55 uppercase">
                  NVDA · 2025 YTD
                </span>
                <span className="font-mono text-[10px] text-green-400 tracking-[0.06em]">
                  +22.7%
                </span>
              </div>
              <TimelineViz />
              <div className="flex gap-[18px] mt-3 border-t border-white/[0.05] pt-2.5">
                <span className="font-mono text-[9px] text-green-400/85 tracking-[0.12em] flex items-center gap-1.5">▲ BUY</span>
                <span className="font-mono text-[9px] text-red-400/85 tracking-[0.12em] flex items-center gap-1.5">▼ SELL</span>
                <span className="font-mono text-[9px] text-white/55 tracking-[0.12em] flex items-center gap-1.5">┊ EVENT</span>
              </div>
            </div>

            <div>
              <div className="font-mono text-[9px] tracking-[0.22em] text-amber-400/75 uppercase mb-5">
                01 / TRADE TIMELINE
              </div>
              <h2 className="font-[family-name:var(--font-oxanium)] font-extrabold text-[clamp(26px,3.5vw,52px)] leading-[1.05] uppercase text-white mb-5">
                Every trade, placed in time.
              </h2>
              <p className="font-mono text-[13px] leading-[1.78] text-white/65 max-w-[420px]">
                A chronological view of what insiders bought and sold, mapped against the events
                that followed. Policy announcements, earnings, executive moves. The signal is
                in the sequence.
              </p>
            </div>
          </div>
        </section>

        {/* ── FEATURE 2: LEADERBOARD ───────────────────────────────────────── */}
        <section className="py-[clamp(72px,11vh,152px)] px-[clamp(20px,7vw,120px)] bg-white/[0.014] border-y border-white/[0.06]">
          <div className="grid grid-cols-2 max-md:grid-cols-1 gap-[clamp(40px,7vw,100px)] items-center">

            <div>
              <div className="font-mono text-[9px] tracking-[0.22em] text-amber-400/75 uppercase mb-5">
                02 / INSIDER LEADERBOARD
              </div>
              <h2 className="font-[family-name:var(--font-oxanium)] font-extrabold text-[clamp(26px,3.5vw,52px)] leading-[1.05] uppercase text-white mb-5">
                Know who{"'"}s winning before you follow.
              </h2>
              <p className="font-mono text-[13px] leading-[1.78] text-white/65 max-w-[400px]">
                Rank insiders by estimated edge: the gap between where they entered and
                where the market caught up. Four names. One question: who{"'"}s positioned best
                right now?
              </p>
            </div>

            <div className="bg-[#080808] border border-white/[0.07] overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_48px] px-4 py-2.5 border-b border-white/[0.06] gap-2">
                {["INSIDER", "EDGE", "TRADES"].map(h => (
                  <span key={h} className="font-mono text-[9px] tracking-[0.14em] text-white/55 uppercase">
                    {h}
                  </span>
                ))}
              </div>

              {leaderboard.map((ins, i) => (
                <div key={ins.name} className={`grid grid-cols-[1fr_80px_48px] px-4 py-[13px] gap-2 items-center${i < leaderboard.length - 1 ? " border-b border-white/[0.04]" : ""}`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ins.color }} />
                    <div className="min-w-0">
                      <div className="font-mono text-[11px] text-white/80 truncate">{ins.name}</div>
                      <div className="font-mono text-[9px] text-white/50 tracking-[0.08em] truncate">{ins.title}</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[11px] text-amber-400 mb-[5px]">{ins.edge}%</div>
                    <div className="h-0.5 bg-white/[0.07] rounded-sm">
                      <div className="h-full rounded-sm opacity-70" style={{ width: `${ins.edge}%`, background: ins.color }} />
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-white/55">{ins.trades}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURE 3: DISCLOSURE INTELLIGENCE ──────────────────────────── */}
        <section className="py-[clamp(72px,11vh,152px)] px-[clamp(20px,7vw,120px)]">
          <div className="mb-[clamp(40px,6vw,72px)]">
            <div className="font-mono text-[9px] tracking-[0.22em] text-amber-400/75 uppercase mb-5">
              03 / DISCLOSURE INTELLIGENCE
            </div>
            <h2 className="font-[family-name:var(--font-oxanium)] font-extrabold text-[clamp(26px,3.5vw,52px)] leading-[1.05] uppercase text-white mb-4 max-w-[620px]">
              The Form 4 lands 12 days after the trade.
            </h2>
            <p className="font-mono text-[13px] leading-[1.78] text-white/65 max-w-[500px]">
              We read it the moment it files. Every disclosure is timestamped, annotated, and
              correlated with surrounding market events by the time you open the terminal.
            </p>
          </div>

          <div className="grid grid-cols-3 max-md:grid-cols-1 border border-white/[0.07]">
            {sampleTrades.map((t, i) => {
              const isPositive = t.type === "BUY" || t.type === "CALL"
              const cardBorder = i < sampleTrades.length - 1
                ? "border-r border-white/[0.07] max-md:border-r-0 max-md:border-b border-b-white/[0.07]"
                : ""
              return (
                <div key={t.ticker} className={`bg-[#070707] p-5 ${cardBorder}`}>
                  <div className="flex justify-between items-start mb-3.5">
                    <div>
                      <div className="font-mono text-[9px] tracking-[0.14em] text-white/55 uppercase mb-[5px]">
                        {t.insider}
                      </div>
                      <div className="font-[family-name:var(--font-oxanium)] font-extrabold text-[22px] text-white tracking-[-0.01em] leading-none">
                        {t.ticker}
                      </div>
                    </div>
                    <div className={`font-mono text-[9px] tracking-[0.1em] px-[7px] py-[3px] ${isPositive ? "bg-green-400/[0.08] text-green-400 border border-green-400/20" : "bg-red-400/[0.08] text-red-400 border border-red-400/20"}`}>
                      {t.type}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-y border-white/[0.05] py-3 mb-3">
                    <div>
                      <div className="font-mono text-[9px] text-white/55 uppercase tracking-[0.1em] mb-1">NOTIONAL</div>
                      <div className="font-mono text-[13px] text-white">{t.amount}</div>
                    </div>
                    <div>
                      <div className="font-mono text-[9px] text-white/55 uppercase tracking-[0.1em] mb-1">RETURN</div>
                      <div className="font-mono text-[13px] text-green-400">{t.returnPct}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3.5">
                    <span className="font-mono text-[9px] tracking-[0.1em] px-1.5 py-0.5 bg-amber-400/[0.08] border border-amber-400/[0.22] text-amber-400">
                      LAG +{t.lag}
                    </span>
                    <span className="font-mono text-[9px] text-white/50">{t.date}</span>
                  </div>

                  <p className="font-mono text-[10px] leading-[1.68] text-white/60 m-0 border-t border-white/[0.05] pt-3">
                    {t.note}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section className="py-[clamp(80px,14vw,180px)] px-[clamp(20px,7vw,120px)] text-center border-t border-white/[0.06] bg-[radial-gradient(ellipse_60%_70%_at_50%_50%,rgba(245,158,11,0.08)_0%,transparent_70%)]">
          <div className="font-mono text-[9px] tracking-[0.24em] text-amber-400/75 uppercase mb-7">
            INSIDER INSIGHTS
          </div>
          <h2 className="font-[family-name:var(--font-oxanium)] font-extrabold text-[clamp(52px,9vw,140px)] leading-[0.9] uppercase text-white mb-[52px] tracking-[-0.02em]">
            FOLLOW<br />THE MONEY.
          </h2>
          <div className="flex flex-col items-center gap-[18px]">
            <Link href="/sign-up" className="font-mono text-[12px] tracking-[0.2em] uppercase no-underline py-[14px] px-11 bg-amber-400 text-black font-bold inline-block">
              GET ACCESS
            </Link>
            <Link href="/sign-in" className="font-mono text-[10px] tracking-[0.14em] text-white/55 no-underline">
              Already have access? Sign in →
            </Link>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <footer className="border-t border-white/[0.06] px-[clamp(20px,7vw,120px)] py-5 flex justify-between items-center flex-wrap gap-2.5">
          <span className="font-mono text-[10px] tracking-[0.1em] text-white/55">
            INSIDER INSIGHTS · EDGAR (Form 4) · STOCK Act · Congress.gov · AI-enriched context
          </span>
          <span className="font-mono text-[10px] text-white/50">
            Not investment advice. · v0.2.0
          </span>
        </footer>

      </div>
    </>
  )
}
