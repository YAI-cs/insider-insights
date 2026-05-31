const USER_AGENT = 'InsiderInsights bordasyailan@gmail.com'
const SUBMISSIONS_BASE = 'https://data.sec.gov/submissions'
const ARCHIVES_BASE = 'https://www.sec.gov/Archives/edgar/data'

export type EdgarFiling = {
  accessionNo: string
  filingDate: string
}

export type ParsedTrade = {
  date: string
  filingDate: string
  ticker: string
  company: string
  type: 'BUY' | 'SELL'
  shares: number
  priceAtTrade: number
  notional: number
}

/** Get list of Form 4 filing accession numbers for a given reporter CIK */
export async function getForm4Filings(
  reporterCik: string,
  startDate = '2024-01-01'
): Promise<EdgarFiling[]> {
  const paddedCik = reporterCik.replace(/^0+/, '').padStart(10, '0')
  const url = `${SUBMISSIONS_BASE}/CIK${paddedCik}.json`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []

    const data = await res.json()
    const recent = data?.filings?.recent ?? {}
    const forms: string[] = recent.form ?? []
    const dates: string[] = recent.filingDate ?? []
    const accessions: string[] = recent.accessionNumber ?? []

    return forms
      .map((form, i) => ({ form, date: dates[i], acc: accessions[i] }))
      .filter((f) => f.form === '4' && f.date >= startDate)
      .map((f) => ({ accessionNo: f.acc, filingDate: f.date }))
  } catch {
    return []
  }
}

/** Get the primary XML document URL from a filing's index page */
async function getXMLUrlFromIndex(
  reporterCik: string,
  accessionNo: string
): Promise<string | null> {
  const cikPath = reporterCik.replace(/^0+/, '')
  const accClean = accessionNo.replace(/-/g, '')
  const indexUrl = `${ARCHIVES_BASE}/${cikPath}/${accClean}/${accessionNo}-index.htm`

  try {
    const res = await fetch(indexUrl, {
      headers: { 'User-Agent': USER_AGENT },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const html = await res.text()

    // Find all XML hrefs (prefer the unformatted one without xslF345 path)
    const xmlMatches = [...html.matchAll(/href="(\/Archives\/edgar\/data\/[^"]+\.xml)"/gi)]
    if (xmlMatches.length === 0) return null

    // Prefer documents without the XSL stylesheet path
    const plain = xmlMatches.find((m) => !m[1].includes('xsl'))
    const url = plain ? plain[1] : xmlMatches[0][1]
    return `https://www.sec.gov${url}`
  } catch {
    return null
  }
}

/** Parse Form 4 XML and extract BUY/SELL stock transactions */
function parseForm4XML(
  xml: string,
  filingDate: string
): Omit<ParsedTrade, 'date' | 'filingDate'>[] {
  const trades: Omit<ParsedTrade, 'date' | 'filingDate'>[] = []

  const ticker =
    xml.match(/<issuerTradingSymbol>(.*?)<\/issuerTradingSymbol>/)?.[1]?.trim() ?? ''
  const company =
    xml.match(/<issuerName>(.*?)<\/issuerName>/)?.[1]?.trim() ?? ''

  // Extract non-derivative (stock) transactions only
  const blocks = [...xml.matchAll(/<nonDerivativeTransaction>([\s\S]*?)<\/nonDerivativeTransaction>/g)]

  for (const match of blocks) {
    const block = match[1]
    const code =
      block.match(/<transactionCode>(.*?)<\/transactionCode>/)?.[1]?.trim()

    // Only include P (Purchase) and S (Sale)
    if (code !== 'P' && code !== 'S') continue

    const price = parseFloat(
      block.match(/<transactionPricePerShare>[\s\S]*?<value>([\d.]+)<\/value>/)?.[1] ?? '0'
    )
    const shares = parseFloat(
      block.match(/<transactionShares>[\s\S]*?<value>([\d.]+)<\/value>/)?.[1] ?? '0'
    )

    if (shares <= 0 || price <= 0) continue

    trades.push({
      ticker,
      company,
      type: code === 'P' ? 'BUY' : 'SELL',
      shares,
      priceAtTrade: price,
      notional: Math.round(shares * price),
    })
  }

  return trades
}

/** Fetch and parse all BUY/SELL Form 4 transactions for a reporter since startDate */
export async function fetchInsiderTrades(
  reporterCik: string,
  startDate = '2024-01-01'
): Promise<ParsedTrade[]> {
  const filings = await getForm4Filings(reporterCik, startDate)
  const results: ParsedTrade[] = []

  // Process in parallel, but limit concurrency
  const batches = chunk(filings, 3)
  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(async ({ accessionNo, filingDate }) => {
        const xmlUrl = await getXMLUrlFromIndex(reporterCik.replace(/^0+/, ''), accessionNo)
        if (!xmlUrl) return []

        try {
          const res = await fetch(xmlUrl, {
            headers: { 'User-Agent': USER_AGENT },
            next: { revalidate: 86400 },
          })
          if (!res.ok) return []
          const xml = await res.text()

          // Get the transaction date from the XML
          const date = xml.match(/<periodOfReport>(.*?)<\/periodOfReport>/)?.[1]?.trim()
          if (!date) return []

          const transactions = parseForm4XML(xml, filingDate)
          return transactions.map((t) => ({ ...t, date, filingDate }))
        } catch {
          return []
        }
      })
    )
    results.push(...batchResults.flat())
  }

  return results
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}
