import { prisma } from './prisma'
import { chatJSON } from './llm'
import { fetchInsiderTrades } from './edgar'
import { fetchStockData, getPriceOnDate } from './yahoo-finance'
import {
  insiders as mockInsiders,
  trades as mockTrades,
  type Trade,
  type InsiderNewsItem,
  type MarketEvent,
} from './mock-data'

// Known EDGAR CIKs for insiders whose trades are filed via SEC Form 4
// Congressional trades (Pelosi) use House Clerk PTRs, not SEC EDGAR
const EDGAR_CIKS: Record<string, string> = {
  musk: '0001494730',  // Elon Musk (TSLA Form 4 filings)
  trump: '0000947033', // TRUMP DONALD J (TMTG/DJT Form 4 filings)
}

type InsiderConfig = {
  id: string
  name: string
  title: string
  affiliation: string
  party: string
  tickers: string[]
}

const INSIDER_CONFIGS: InsiderConfig[] = [
  {
    id: 'trump',
    name: 'Donald Trump',
    title: '47th President',
    affiliation: 'Executive Office',
    party: 'R',
    tickers: ['DJT'],
  },
  {
    id: 'pelosi',
    name: 'Nancy Pelosi',
    title: 'House Minority Leader',
    affiliation: 'US House, D-CA',
    party: 'D',
    tickers: ['NVDA', 'AAPL', 'MSFT', 'GOOGL'],
  },
  {
    id: 'musk',
    name: 'Elon Musk',
    title: 'CEO, Tesla / X / SpaceX',
    affiliation: 'DOGE Advisor',
    party: 'N',
    tickers: ['TSLA'],
  },
  {
    id: 'rfk',
    name: 'Robert F. Kennedy Jr.',
    title: 'Secretary of HHS',
    affiliation: 'HHS, Cabinet',
    party: 'N',
    tickers: ['XLV', 'XBI', 'UNH', 'MRNA'],
  },
]

function normalizeTradeType(raw: string | undefined): 'BUY' | 'SELL' | 'CALL' | 'PUT' | null {
  if (!raw) return null
  const s = raw.toUpperCase().trim()
  if (s === 'BUY' || s === 'PURCHASE' || s === 'P') return 'BUY'
  if (s === 'SELL' || s === 'SALE' || s === 'S') return 'SELL'
  if (s === 'CALL') return 'CALL'
  if (s === 'PUT') return 'PUT'
  return null
}

function normalizeNewsCategory(raw: string | undefined): InsiderNewsItem['category'] {
  if (!raw) return 'trade'
  const s = raw.toLowerCase()
  if (s.includes('politic') || s.includes('election') || s.includes('congress')) return 'political'
  if (s.includes('market') || s.includes('earnings') || s.includes('stock')) return 'market'
  if (s.includes('regulat') || s.includes('sec') || s.includes('law') || s.includes('stock act')) return 'regulatory'
  return 'trade'
}

/** Fetch current + historical prices for a set of tickers */
async function fetchAllPrices(
  tickers: string[]
): Promise<Record<string, Awaited<ReturnType<typeof fetchStockData>>>> {
  const priceData: Record<string, Awaited<ReturnType<typeof fetchStockData>>> = {}
  await Promise.all(
    tickers.map(async (ticker) => {
      priceData[ticker] = await fetchStockData(ticker).catch(() => ({ currentPrice: 0, history: [] }))
    })
  )
  return priceData
}

/** Enrich a trade record with live price data */
function enrichTrade(
  trade: Trade,
  priceData: Record<string, Awaited<ReturnType<typeof fetchStockData>>>
): Trade {
  const stockData = priceData[trade.ticker]
  if (!stockData || stockData.currentPrice <= 0) return trade

  const priceNow = stockData.currentPrice
  // Try to get historical price at trade date, fall back to recorded priceAtTrade
  const historicalPrice = getPriceOnDate(stockData.history, trade.date)
  const priceAtTrade = historicalPrice > 0 ? historicalPrice : trade.priceAtTrade
  const returnPct = priceAtTrade > 0 ? ((priceNow - priceAtTrade) / priceAtTrade) * 100 : trade.returnPct

  return {
    ...trade,
    priceAtTrade: Math.round(priceAtTrade * 100) / 100,
    priceNow: Math.round(priceNow * 100) / 100,
    returnPct: Math.round(returnPct * 10) / 10,
  }
}

/** Generate news for an insider's trades using anonymized prompts (no names) */
async function generateNewsForInsider(
  config: InsiderConfig,
  trades: Trade[]
): Promise<InsiderNewsItem[]> {
  if (trades.length === 0) return []

  const tradeSummary = trades
    .slice(0, 10)
    .map(
      (t) =>
        `${t.date} disclosed ${t.disclosureDate} (${t.disclosureLag}d lag): ${t.type} ${t.ticker} $${(t.notional / 1e6).toFixed(1)}M @ $${t.priceAtTrade}, now $${t.priceNow} (${t.returnPct >= 0 ? '+' : ''}${t.returnPct.toFixed(1)}%)`
    )
    .join('\n')

  const system = `You are a financial news assistant. Generate factual news items for SEC Form 4 insider trade disclosures. Output ONLY a raw JSON array.`

  const user = `Write brief factual news headlines for these publicly disclosed SEC Form 4 transactions. Include both trade disclosure items and 1-2 relevant political or regulatory context items for this insider (${config.name}, ${config.affiliation}).

Transactions:
${tradeSummary}

Return ONLY a JSON array (no prose, no markdown):
[{"id":"${config.id}_n1","date":"YYYY-MM-DD","headline":"Factual headline about the disclosure","source":"EDGAR Form 4","category":"trade"}]

category must be: trade, political, market, or regulatory
source options: "EDGAR Form 4", "Reuters", "Bloomberg", "Wall Street Journal", "ProPublica", "Unusual Whales", "C-SPAN"
Generate at least ${Math.min(trades.length + 2, 8)} items.`

  try {
    const raw = await chatJSON<
      { id?: string; date?: string; headline?: string; source?: string; category?: string }[]
      | { news?: { id?: string; date?: string; headline?: string; source?: string; category?: string }[] }
    >(system, user)

    const arr = Array.isArray(raw) ? raw : ((raw as { news?: unknown[] }).news ?? [])

    return (arr as { id?: string; date?: string; headline?: string; source?: string; category?: string }[])
      .filter((n) => n.date && n.headline)
      .map((n, i) => ({
        id: n.id ?? `${config.id}_news_${i + 1}`,
        insiderId: config.id,
        date: n.date!,
        headline: n.headline!,
        source: n.source ?? 'EDGAR Form 4',
        category: normalizeNewsCategory(n.category),
      }))
  } catch {
    return []
  }
}

/** Generate market events with LLM (confirmed works) */
async function generateMarketEvents(
  allTrades: Trade[]
): Promise<{ date: string; label: string; category: string }[]> {
  const summary =
    allTrades.length > 0
      ? allTrades
          .map(
            (t) =>
              `${t.date}: ${t.insiderId} ${t.type} ${t.ticker} $${(t.notional / 1e6).toFixed(1)}M`
          )
          .join('\n')
      : 'Generate key US market events from 2024-2026.'

  const system = `You are a financial market analyst. Output ONLY a raw JSON array, no prose, no markdown.`
  const user = `Generate 12-15 key US market events from 2024-2026 that provide context for insider trading activity:

${summary}

Include earnings reports, Fed decisions, political events, major tech announcements.

Return ONLY a JSON array:
[{"date":"YYYY-MM-DD","label":"Short event description (max 60 chars)","category":"earnings"}]

category: policy, earnings, announcement, or political`

  try {
    const raw = await chatJSON<
      { date?: string; label?: string; category?: string }[]
      | { events?: { date?: string; label?: string; category?: string }[] }
    >(system, user)

    const arr = Array.isArray(raw) ? raw : ((raw as { events?: unknown[] }).events ?? [])
    return (arr as { date?: string; label?: string; category?: string }[])
      .filter((e) => e.date && e.label)
      .map((e) => ({
        date: e.date!,
        label: e.label!.slice(0, 100),
        category: e.category ?? 'announcement',
      }))
  } catch {
    return []
  }
}

export type PipelineResult = {
  insiders: number
  trades: number
  news: number
  events: number
  errors: string[]
}

export async function runDataPipeline(): Promise<PipelineResult> {
  const errors: string[] = []
  let totalTrades = 0
  let totalNews = 0
  const allSavedTrades: Trade[] = []

  for (const config of INSIDER_CONFIGS) {
    try {
      // 1. Start with mock data as the base (real known historical trades)
      const baseTrades = mockTrades.filter((t) => t.insiderId === config.id)

      // 2. Fetch live prices for all tickers
      const priceData = await fetchAllPrices(config.tickers)

      // 3. Enrich mock trades with live prices
      const enrichedBase = baseTrades.map((t) => enrichTrade(t, priceData))

      // 4. Try to fetch additional REAL trades from EDGAR (for insiders with known CIKs)
      const additionalTrades: Trade[] = []
      const edgarCik = EDGAR_CIKS[config.id]

      if (edgarCik) {
        // Fetch Form 4 filings from EDGAR (only P/S transactions, post-mock-data cutoff)
        const mockCutoff = enrichedBase.reduce((max, t) => t.date > max ? t.date : max, '2024-01-01')
        const edgarTrades = await fetchInsiderTrades(edgarCik, mockCutoff).catch((e) => {
          errors.push(`[${config.id}] EDGAR fetch error: ${String(e)}`)
          return []
        })

        for (const et of edgarTrades) {
          // Skip if we already have this date/ticker in mock data
          const alreadyHave = enrichedBase.some(
            (t) => t.date === et.date && t.ticker === et.ticker && t.type === et.type
          )
          if (alreadyHave) continue

          // Enrich with live prices
          const stockData = priceData[et.ticker]
          const priceNow = stockData?.currentPrice ?? et.priceAtTrade
          const returnPct = et.priceAtTrade > 0
            ? ((priceNow - et.priceAtTrade) / et.priceAtTrade) * 100
            : 0
          const disclosureLag = Math.max(
            0,
            Math.round(
              (new Date(et.filingDate).getTime() - new Date(et.date).getTime()) / 86400000
            )
          )

          additionalTrades.push({
            id: `${config.id}_edgar_${et.date}_${et.ticker}`,
            insiderId: config.id,
            date: et.date,
            disclosureDate: et.filingDate,
            ticker: et.ticker,
            company: et.company,
            type: et.type,
            notional: et.notional,
            disclosureLag,
            priceAtTrade: et.priceAtTrade,
            priceNow: Math.round(priceNow * 100) / 100,
            returnPct: Math.round(returnPct * 10) / 10,
          })
        }

        if (additionalTrades.length > 0) {
          console.log(`[${config.id}] EDGAR added ${additionalTrades.length} new trade(s)`)
        }
      }

      const allTrades = [...enrichedBase, ...additionalTrades].sort(
        (a, b) => b.date.localeCompare(a.date)
      )

      // 5. Compute insider stats
      const lastTradeDate = allTrades[0]?.date ?? new Date().toISOString().split('T')[0]
      const buyOrCall = allTrades.filter((t) => t.type === 'BUY' || t.type === 'CALL')
      const estimatedEdge = buyOrCall.length > 0
        ? Math.round((buyOrCall.reduce((s, t) => s + t.returnPct, 0) / buyOrCall.length) * 10) / 10
        : 0

      // 6. Save insider
      await prisma.insider.upsert({
        where: { id: config.id },
        create: {
          id: config.id,
          name: config.name,
          title: config.title,
          affiliation: config.affiliation,
          party: config.party,
          tradeCount: allTrades.length,
          lastTradeDate: new Date(lastTradeDate),
          estimatedEdge,
        },
        update: {
          tradeCount: allTrades.length,
          lastTradeDate: new Date(lastTradeDate),
          estimatedEdge,
        },
      })

      // 7. Save trades (replace all for this insider)
      await prisma.trade.deleteMany({ where: { insiderId: config.id } })
      if (allTrades.length > 0) {
        await prisma.trade.createMany({
          data: allTrades.map((t) => ({
            id: t.id,
            insiderId: t.insiderId,
            date: new Date(t.date),
            disclosureDate: new Date(t.disclosureDate),
            ticker: t.ticker,
            company: t.company,
            type: t.type,
            notional: t.notional,
            disclosureLag: t.disclosureLag,
            priceAtTrade: t.priceAtTrade,
            priceNow: t.priceNow,
            returnPct: t.returnPct,
          })),
          skipDuplicates: true,
        })
        totalTrades += allTrades.length
        allSavedTrades.push(...allTrades)
      }

      // 8. Generate news (separate LLM call per insider, anonymized prompts)
      const news = await generateNewsForInsider(config, allTrades)
      if (news.length > 0) {
        await prisma.insiderNews.deleteMany({ where: { insiderId: config.id } })
        await prisma.insiderNews.createMany({
          data: news.map((n) => ({
            id: n.id,
            insiderId: n.insiderId,
            date: new Date(n.date),
            headline: n.headline,
            source: n.source,
            category: n.category,
          })),
          skipDuplicates: true,
        })
        totalNews += news.length
      }
    } catch (err) {
      errors.push(`[${config.id}] error: ${String(err)}`)
    }
  }

  // 9. Market events (one LLM call with all trades)
  const marketEvents = await generateMarketEvents(allSavedTrades)
  if (marketEvents.length > 0) {
    await prisma.marketEvent.deleteMany()
    await prisma.marketEvent.createMany({
      data: marketEvents.map((e) => ({
        date: new Date(e.date),
        label: e.label,
        category: e.category,
      })),
    })
  }

  return {
    insiders: INSIDER_CONFIGS.length,
    trades: totalTrades,
    news: totalNews,
    events: marketEvents.length,
    errors,
  }
}

// ─── Transform functions (Prisma → app types) ──────────────────────────────

export function transformInsider(i: {
  id: string
  name: string
  title: string
  affiliation: string
  party: string
  tradeCount: number
  lastTradeDate: Date
  estimatedEdge: number
}): import('./mock-data').Insider {
  return {
    id: i.id,
    name: i.name,
    title: i.title,
    affiliation: i.affiliation,
    party: i.party as 'R' | 'D' | 'I' | 'N',
    tradeCount: i.tradeCount,
    lastTradeDate: i.lastTradeDate.toISOString().split('T')[0],
    estimatedEdge: i.estimatedEdge,
  }
}

export function transformTrade(t: {
  id: string
  insiderId: string
  date: Date
  disclosureDate: Date
  ticker: string
  company: string
  type: string
  notional: number
  disclosureLag: number
  priceAtTrade: number
  priceNow: number
  returnPct: number
}): Trade {
  return {
    id: t.id,
    insiderId: t.insiderId,
    date: t.date.toISOString().split('T')[0],
    disclosureDate: t.disclosureDate.toISOString().split('T')[0],
    ticker: t.ticker,
    company: t.company,
    type: t.type as Trade['type'],
    notional: t.notional,
    disclosureLag: t.disclosureLag,
    priceAtTrade: t.priceAtTrade,
    priceNow: t.priceNow,
    returnPct: t.returnPct,
  }
}

export function transformMarketEvent(e: {
  id: string
  date: Date
  label: string
  category: string
}): MarketEvent {
  return {
    date: e.date.toISOString().split('T')[0],
    label: e.label,
    category: e.category as MarketEvent['category'],
  }
}

export function transformNews(n: {
  id: string
  insiderId: string
  date: Date
  headline: string
  source: string
  category: string
}): InsiderNewsItem {
  return {
    id: n.id,
    insiderId: n.insiderId,
    date: n.date.toISOString().split('T')[0],
    headline: n.headline,
    source: n.source,
    category: n.category as InsiderNewsItem['category'],
  }
}
