type ChartResult = {
  meta: { regularMarketPrice: number; symbol: string }
  timestamp: number[]
  indicators: { quote: [{ close: (number | null)[] }] }
}

export type StockData = {
  currentPrice: number
  history: { date: string; close: number }[]
}

export async function fetchStockData(ticker: string): Promise<StockData> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=2y`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; InsiderInsights/1.0)',
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) return { currentPrice: 0, history: [] }

    const data = await res.json()
    const result: ChartResult | undefined = data.chart?.result?.[0]
    if (!result) return { currentPrice: 0, history: [] }

    const currentPrice = result.meta?.regularMarketPrice ?? 0
    const timestamps = result.timestamp ?? []
    const closes = result.indicators?.quote?.[0]?.close ?? []

    const history = timestamps
      .map((ts: number, i: number) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        close: closes[i] ?? null,
      }))
      .filter((h): h is { date: string; close: number } => h.close !== null && h.close > 0)

    return { currentPrice, history }
  } catch {
    return { currentPrice: 0, history: [] }
  }
}

export function getPriceOnDate(
  history: { date: string; close: number }[],
  targetDate: string
): number {
  const target = new Date(targetDate).getTime()
  let closest: { date: string; close: number } | undefined
  let minDiff = Infinity

  for (const entry of history) {
    const d = new Date(entry.date).getTime()
    const diff = Math.abs(target - d)
    if (diff < minDiff) {
      minDiff = diff
      closest = entry
    }
  }

  return closest?.close ?? 0
}
