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

      {/* grid */}
      {[40, 80, 120].map(y => (
        <line key={y} x1={0} y1={y} x2={W} y2={y}
          stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      ))}

      {/* event lines */}
      {eventLines.map(([x, label]) => (
        <g key={x}>
          <line x1={x} y1={0} x2={x} y2={H}
            stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="3 3" />
          <text x={Number(x) + 4} y={11} fill="rgba(255,255,255,0.28)"
            fontSize={8} fontFamily="monospace" letterSpacing="1">
            {label}
          </text>
        </g>
      ))}

      {/* area + line */}
      <path d={areaPath} fill="url(#lp-area)" />
      <path d={linePath} fill="none" stroke="rgba(245,158,11,0.65)" strokeWidth={1.5} />

      {/* BUY triangles (pointing up) */}
      {buyMarkers.map(([x, y]) => (
        <polygon key={x}
          points={`${x},${y - 14} ${x - 5.5},${y - 4} ${x + 5.5},${y - 4}`}
          fill="rgba(74,222,128,0.75)" />
      ))}

      {/* SELL triangles (pointing down) */}
      {sellMarkers.map(([x, y]) => (
        <polygon key={x}
          points={`${x},${y + 14} ${x - 5.5},${y + 4} ${x + 5.5},${y + 4}`}
          fill="rgba(248,113,113,0.75)" />
      ))}

      {/* x-axis month labels */}
      {months.map((m, i) => (
        <text key={m} x={i * 112} y={H + 16} fill="rgba(255,255,255,0.18)"
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
        @media (max-width: 768px) {
          .lp-feat-grid  { grid-template-columns: 1fr !important; }
          .lp-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-cards-grid { grid-template-columns: 1fr !important; }
          .lp-nav-cta    { display: none !important; }
        }
        @media (max-width: 480px) {
          .lp-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="dark" style={{ background: "#000", color: "#fff", minHeight: "100vh" }}>

        {/* ── NAV ──────────────────────────────────────────────────────────── */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 clamp(20px, 5vw, 80px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}>
          <InsiderInsightsLogo size={0.82} color="#f59e0b" />
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link href="/sign-in" style={{
              fontFamily: "var(--font-geist-mono)", fontSize: 10,
              letterSpacing: "0.16em", color: "rgba(255,255,255,0.38)",
              textTransform: "uppercase", textDecoration: "none",
            }}>
              SIGN IN
            </Link>
            <Link href="/sign-up" className="lp-nav-cta" style={{
              fontFamily: "var(--font-geist-mono)", fontSize: 10,
              letterSpacing: "0.16em",
              padding: "6px 16px",
              border: "1px solid rgba(245,158,11,0.45)",
              color: "#f59e0b",
              textTransform: "uppercase", textDecoration: "none",
              transition: "background 0.15s",
            }}>
              GET ACCESS
            </Link>
          </div>
        </nav>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section style={{
          position: "relative", minHeight: "100vh", overflow: "hidden",
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "clamp(110px, 16vh, 200px) clamp(20px, 7vw, 120px) clamp(80px, 10vh, 140px)",
        }}>
          <AuthBackground />

          {/* amber radial tint */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
            background: "radial-gradient(ellipse 70% 55% at 25% 65%, rgba(245,158,11,0.07) 0%, transparent 70%)",
          }} />

          <div style={{ position: "relative", zIndex: 2, maxWidth: 920 }}>

            {/* eyebrow */}
            <div className="lp-fade" style={{ animationDelay: "0ms", marginBottom: 28 }}>
              <span style={{
                fontFamily: "var(--font-geist-mono)", fontSize: 10,
                letterSpacing: "0.24em", color: "rgba(245,158,11,0.55)",
                textTransform: "uppercase",
              }}>
                EDGAR · FORM 4 · STOCK ACT DISCLOSURES
              </span>
            </div>

            {/* headline */}
            <h1 className="lp-fade" style={{
              animationDelay: "80ms",
              fontFamily: "var(--font-oxanium)", fontWeight: 800,
              fontSize: "clamp(44px, 8vw, 120px)",
              lineHeight: 0.93, letterSpacing: "-0.01em",
              textTransform: "uppercase", color: "#fff",
              margin: "0 0 clamp(20px, 3vw, 36px)",
            }}>
              THE TRADES THEY MAKE BEFORE THE MARKET OPENS.
            </h1>

            {/* subhead */}
            <p className="lp-fade" style={{
              animationDelay: "160ms",
              fontFamily: "var(--font-geist-mono)",
              fontSize: "clamp(11px, 1.3vw, 14px)",
              lineHeight: 1.8, color: "rgba(255,255,255,0.4)",
              maxWidth: 560, margin: "0 0 clamp(36px, 5vw, 52px)",
            }}>
              Insider Insights monitors disclosed trades by the most market-moving names in
              Washington and Silicon Valley. Form 4 filings, STOCK Act reports: timed,
              annotated, and AI-enriched the moment they file.
            </p>

            {/* CTA row */}
            <div className="lp-fade" style={{
              animationDelay: "240ms",
              display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
            }}>
              <Link href="/sign-up" style={{
                fontFamily: "var(--font-geist-mono)", fontSize: 11,
                letterSpacing: "0.2em", textTransform: "uppercase",
                textDecoration: "none",
                padding: "13px 36px",
                background: "#f59e0b", color: "#000", fontWeight: 700,
                display: "inline-block",
              }}>
                GET ACCESS
              </Link>
              <Link href="/sign-in" style={{
                fontFamily: "var(--font-geist-mono)", fontSize: 10,
                letterSpacing: "0.14em", textTransform: "uppercase",
                textDecoration: "none", color: "rgba(255,255,255,0.28)",
              }}>
                Already have access? Sign in →
              </Link>
            </div>
          </div>

          {/* scroll indicator */}
          <div className="lp-fade" style={{
            animationDelay: "500ms",
            position: "absolute", bottom: 32, left: "50%",
            transform: "translateX(-50%)", zIndex: 2,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 1, height: 36,
              background: "linear-gradient(to bottom, rgba(245,158,11,0.5), transparent)",
            }} />
            <span style={{
              fontFamily: "var(--font-geist-mono)", fontSize: 8,
              letterSpacing: "0.22em", color: "rgba(255,255,255,0.18)",
              textTransform: "uppercase",
            }}>
              SCROLL
            </span>
          </div>
        </section>

        {/* ── STATS STRIP ──────────────────────────────────────────────────── */}
        <section style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.018)",
          padding: "clamp(28px, 4vw, 52px) clamp(20px, 7vw, 120px)",
        }}>
          <div className="lp-stats-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "clamp(24px, 4vw, 64px)",
          }}>
            {[
              { n: "127+",  label: "Trades tracked" },
              { n: "$148M+", label: "Total disclosed" },
              { n: "~12D",  label: "Avg. disclosure lag" },
              { n: "4",     label: "Tracked insiders" },
            ].map(({ n, label }) => (
              <div key={label}>
                <div style={{
                  fontFamily: "var(--font-oxanium)", fontWeight: 800,
                  fontSize: "clamp(28px, 3.5vw, 54px)",
                  color: "#f59e0b", lineHeight: 1, marginBottom: 6,
                }}>
                  {n}
                </div>
                <div style={{
                  fontFamily: "var(--font-geist-mono)", fontSize: 9,
                  letterSpacing: "0.18em", color: "rgba(255,255,255,0.28)",
                  textTransform: "uppercase",
                }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURE 1: TIMELINE ──────────────────────────────────────────── */}
        <section style={{
          padding: "clamp(72px, 11vh, 152px) clamp(20px, 7vw, 120px)",
        }}>
          <div className="lp-feat-grid" style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(40px, 7vw, 100px)",
            alignItems: "center",
          }}>

            {/* chart viz */}
            <div style={{
              background: "#080808",
              border: "1px solid rgba(255,255,255,0.07)",
              padding: "20px 20px 14px",
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 16,
              }}>
                <span style={{
                  fontFamily: "var(--font-geist-mono)", fontSize: 9,
                  letterSpacing: "0.14em", color: "rgba(255,255,255,0.2)",
                  textTransform: "uppercase",
                }}>
                  NVDA · 2025 YTD
                </span>
                <span style={{
                  fontFamily: "var(--font-geist-mono)", fontSize: 10,
                  color: "#4ade80", letterSpacing: "0.06em",
                }}>
                  +22.7%
                </span>
              </div>

              <TimelineViz />

              <div style={{
                display: "flex", gap: 18, marginTop: 12,
                borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10,
              }}>
                {[
                  { symbol: "▲", label: "BUY",   color: "rgba(74,222,128,0.7)" },
                  { symbol: "▼", label: "SELL",  color: "rgba(248,113,113,0.7)" },
                  { symbol: "┊", label: "EVENT", color: "rgba(255,255,255,0.2)" },
                ].map(({ symbol, label, color }) => (
                  <span key={label} style={{
                    fontFamily: "var(--font-geist-mono)", fontSize: 9,
                    color, letterSpacing: "0.12em",
                    display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <span>{symbol}</span> {label}
                  </span>
                ))}
              </div>
            </div>

            {/* copy */}
            <div>
              <div style={{
                fontFamily: "var(--font-geist-mono)", fontSize: 9,
                letterSpacing: "0.22em", color: "rgba(245,158,11,0.5)",
                textTransform: "uppercase", marginBottom: 20,
              }}>
                01 / TRADE TIMELINE
              </div>
              <h2 style={{
                fontFamily: "var(--font-oxanium)", fontWeight: 800,
                fontSize: "clamp(26px, 3.5vw, 52px)",
                lineHeight: 1.05, textTransform: "uppercase",
                color: "#fff", margin: "0 0 20px",
              }}>
                Every trade, placed in time.
              </h2>
              <p style={{
                fontFamily: "var(--font-geist-mono)", fontSize: 13,
                lineHeight: 1.78, color: "rgba(255,255,255,0.36)",
                maxWidth: 420, margin: 0,
              }}>
                A chronological view of what insiders bought and sold, mapped against the events
                that followed. Policy announcements, earnings, executive moves. The signal is
                in the sequence.
              </p>
            </div>
          </div>
        </section>

        {/* ── FEATURE 2: LEADERBOARD ───────────────────────────────────────── */}
        <section style={{
          padding: "clamp(72px, 11vh, 152px) clamp(20px, 7vw, 120px)",
          background: "rgba(255,255,255,0.014)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div className="lp-feat-grid" style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(40px, 7vw, 100px)",
            alignItems: "center",
          }}>

            {/* copy */}
            <div>
              <div style={{
                fontFamily: "var(--font-geist-mono)", fontSize: 9,
                letterSpacing: "0.22em", color: "rgba(245,158,11,0.5)",
                textTransform: "uppercase", marginBottom: 20,
              }}>
                02 / INSIDER LEADERBOARD
              </div>
              <h2 style={{
                fontFamily: "var(--font-oxanium)", fontWeight: 800,
                fontSize: "clamp(26px, 3.5vw, 52px)",
                lineHeight: 1.05, textTransform: "uppercase",
                color: "#fff", margin: "0 0 20px",
              }}>
                Know who{"'"}s winning before you follow.
              </h2>
              <p style={{
                fontFamily: "var(--font-geist-mono)", fontSize: 13,
                lineHeight: 1.78, color: "rgba(255,255,255,0.36)",
                maxWidth: 400, margin: 0,
              }}>
                Rank insiders by estimated edge: the gap between where they entered and
                where the market caught up. Four names. One question: who{"'"}s positioned best
                right now?
              </p>
            </div>

            {/* leaderboard viz */}
            <div style={{
              background: "#080808",
              border: "1px solid rgba(255,255,255,0.07)",
              overflow: "hidden",
            }}>
              {/* header */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 80px 48px",
                padding: "10px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                gap: 8,
              }}>
                {["INSIDER", "EDGE", "TRADES"].map(h => (
                  <span key={h} style={{
                    fontFamily: "var(--font-geist-mono)", fontSize: 9,
                    letterSpacing: "0.14em", color: "rgba(255,255,255,0.22)",
                    textTransform: "uppercase",
                  }}>
                    {h}
                  </span>
                ))}
              </div>

              {/* rows */}
              {leaderboard.map((ins, i) => (
                <div key={ins.name} style={{
                  display: "grid", gridTemplateColumns: "1fr 80px 48px",
                  padding: "13px 16px",
                  borderBottom: i < leaderboard.length - 1
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "none",
                  gap: 8, alignItems: "center",
                }}>
                  {/* name + indicator */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: ins.color, flexShrink: 0,
                    }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontFamily: "var(--font-geist-mono)", fontSize: 11,
                        color: "rgba(255,255,255,0.75)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {ins.name}
                      </div>
                      <div style={{
                        fontFamily: "var(--font-geist-mono)", fontSize: 9,
                        color: "rgba(255,255,255,0.22)", letterSpacing: "0.08em",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {ins.title}
                      </div>
                    </div>
                  </div>

                  {/* edge + bar */}
                  <div>
                    <div style={{
                      fontFamily: "var(--font-geist-mono)", fontSize: 11,
                      color: "#f59e0b", marginBottom: 5,
                    }}>
                      {ins.edge}%
                    </div>
                    <div style={{
                      height: 2, background: "rgba(255,255,255,0.07)", borderRadius: 1,
                    }}>
                      <div style={{
                        height: "100%", width: `${ins.edge}%`,
                        background: ins.color, borderRadius: 1, opacity: 0.7,
                      }} />
                    </div>
                  </div>

                  {/* trade count */}
                  <div style={{
                    fontFamily: "var(--font-geist-mono)", fontSize: 11,
                    color: "rgba(255,255,255,0.35)",
                  }}>
                    {ins.trades}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURE 3: DISCLOSURE INTELLIGENCE ──────────────────────────── */}
        <section style={{
          padding: "clamp(72px, 11vh, 152px) clamp(20px, 7vw, 120px)",
        }}>
          <div style={{ marginBottom: "clamp(40px, 6vw, 72px)" }}>
            <div style={{
              fontFamily: "var(--font-geist-mono)", fontSize: 9,
              letterSpacing: "0.22em", color: "rgba(245,158,11,0.5)",
              textTransform: "uppercase", marginBottom: 20,
            }}>
              03 / DISCLOSURE INTELLIGENCE
            </div>
            <h2 style={{
              fontFamily: "var(--font-oxanium)", fontWeight: 800,
              fontSize: "clamp(26px, 3.5vw, 52px)",
              lineHeight: 1.05, textTransform: "uppercase",
              color: "#fff", margin: "0 0 16px", maxWidth: 620,
            }}>
              The Form 4 lands 12 days after the trade.
            </h2>
            <p style={{
              fontFamily: "var(--font-geist-mono)", fontSize: 13,
              lineHeight: 1.78, color: "rgba(255,255,255,0.36)",
              maxWidth: 500, margin: 0,
            }}>
              We read it the moment it files. Every disclosure is timestamped, annotated, and
              correlated with surrounding market events by the time you open the terminal.
            </p>
          </div>

          {/* trade card grid */}
          <div className="lp-cards-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            {sampleTrades.map((t, i) => {
              const isPositive = t.type === "BUY" || t.type === "CALL"
              return (
                <div key={t.ticker} style={{
                  background: "#070707",
                  padding: "20px",
                  borderRight: i < sampleTrades.length - 1
                    ? "1px solid rgba(255,255,255,0.07)"
                    : "none",
                }}>
                  {/* row 1: insider + type badge */}
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", marginBottom: 14,
                  }}>
                    <div>
                      <div style={{
                        fontFamily: "var(--font-geist-mono)", fontSize: 9,
                        letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)",
                        marginBottom: 5, textTransform: "uppercase",
                      }}>
                        {t.insider}
                      </div>
                      <div style={{
                        fontFamily: "var(--font-oxanium)", fontWeight: 800,
                        fontSize: 22, color: "#fff", letterSpacing: "-0.01em",
                        lineHeight: 1,
                      }}>
                        {t.ticker}
                      </div>
                    </div>
                    <div style={{
                      fontFamily: "var(--font-geist-mono)", fontSize: 9,
                      letterSpacing: "0.1em",
                      padding: "3px 7px",
                      background: isPositive ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)",
                      color: isPositive ? "#4ade80" : "#f87171",
                      border: `1px solid ${isPositive ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
                    }}>
                      {t.type}
                    </div>
                  </div>

                  {/* notional + return */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    padding: "12px 0", marginBottom: 12,
                  }}>
                    <div>
                      <div style={{
                        fontFamily: "var(--font-geist-mono)", fontSize: 9,
                        color: "rgba(255,255,255,0.22)", marginBottom: 4,
                        textTransform: "uppercase", letterSpacing: "0.1em",
                      }}>
                        NOTIONAL
                      </div>
                      <div style={{
                        fontFamily: "var(--font-geist-mono)", fontSize: 13, color: "#fff",
                      }}>
                        {t.amount}
                      </div>
                    </div>
                    <div>
                      <div style={{
                        fontFamily: "var(--font-geist-mono)", fontSize: 9,
                        color: "rgba(255,255,255,0.22)", marginBottom: 4,
                        textTransform: "uppercase", letterSpacing: "0.1em",
                      }}>
                        RETURN
                      </div>
                      <div style={{
                        fontFamily: "var(--font-geist-mono)", fontSize: 13, color: "#4ade80",
                      }}>
                        {t.returnPct}
                      </div>
                    </div>
                  </div>

                  {/* disclosure lag + date */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
                  }}>
                    <span style={{
                      fontFamily: "var(--font-geist-mono)", fontSize: 9,
                      letterSpacing: "0.1em",
                      padding: "2px 6px",
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.22)",
                      color: "#f59e0b",
                    }}>
                      LAG +{t.lag}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-geist-mono)", fontSize: 9,
                      color: "rgba(255,255,255,0.2)",
                    }}>
                      {t.date}
                    </span>
                  </div>

                  {/* AI annotation */}
                  <p style={{
                    fontFamily: "var(--font-geist-mono)", fontSize: 10,
                    lineHeight: 1.68, color: "rgba(255,255,255,0.28)",
                    margin: 0,
                    borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12,
                  }}>
                    {t.note}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section style={{
          padding: "clamp(80px, 14vw, 180px) clamp(20px, 7vw, 120px)",
          textAlign: "center",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(245,158,11,0.08) 0%, transparent 70%)",
        }}>
          <div style={{
            fontFamily: "var(--font-geist-mono)", fontSize: 9,
            letterSpacing: "0.24em", color: "rgba(245,158,11,0.45)",
            textTransform: "uppercase", marginBottom: 28,
          }}>
            INSIDER INSIGHTS
          </div>
          <h2 style={{
            fontFamily: "var(--font-oxanium)", fontWeight: 800,
            fontSize: "clamp(52px, 9vw, 140px)",
            lineHeight: 0.9, textTransform: "uppercase",
            color: "#fff", margin: "0 0 52px",
            letterSpacing: "-0.02em",
          }}>
            FOLLOW<br />THE MONEY.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Link href="/sign-up" style={{
              fontFamily: "var(--font-geist-mono)", fontSize: 12,
              letterSpacing: "0.2em", textTransform: "uppercase",
              textDecoration: "none",
              padding: "14px 44px",
              background: "#f59e0b", color: "#000", fontWeight: 700,
              display: "inline-block",
            }}>
              GET ACCESS
            </Link>
            <Link href="/sign-in" style={{
              fontFamily: "var(--font-geist-mono)", fontSize: 10,
              letterSpacing: "0.14em",
              color: "rgba(255,255,255,0.22)", textDecoration: "none",
            }}>
              Already have access? Sign in →
            </Link>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <footer style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "20px clamp(20px, 7vw, 120px)",
          display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 10,
        }}>
          <span style={{
            fontFamily: "var(--font-geist-mono)", fontSize: 10,
            letterSpacing: "0.1em", color: "rgba(255,255,255,0.18)",
          }}>
            INSIDER INSIGHTS · EDGAR (Form 4) · STOCK Act · Congress.gov · AI-enriched context
          </span>
          <span style={{
            fontFamily: "var(--font-geist-mono)", fontSize: 10,
            color: "rgba(255,255,255,0.14)",
          }}>
            Not investment advice. · v0.2.0
          </span>
        </footer>

      </div>
    </>
  )
}
