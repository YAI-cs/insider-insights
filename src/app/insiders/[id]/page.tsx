import { prisma } from "@/lib/prisma"
import {
  insiders as mockInsiders,
  trades as mockTrades,
  insiderNews as mockNews,
  marketEvents as mockEvents,
} from "@/lib/mock-data"
import {
  transformInsider,
  transformTrade,
  transformNews,
  transformMarketEvent,
} from "@/lib/data-pipeline"
import { InsiderProfile } from "@/components/insider/insider-profile"
import { notFound } from "next/navigation"

export default async function InsiderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [dbInsider, dbTrades, dbNews, dbEvents] = await Promise.all([
    prisma.insider.findUnique({ where: { id } }).catch(() => null),
    prisma.trade.findMany({ where: { insiderId: id }, orderBy: { date: "desc" } }).catch(() => []),
    prisma.insiderNews.findMany({ where: { insiderId: id }, orderBy: { date: "desc" } }).catch(() => []),
    prisma.marketEvent.findMany({ orderBy: { date: "asc" } }).catch(() => []),
  ])

  const insider = dbInsider
    ? transformInsider(dbInsider)
    : mockInsiders.find((i) => i.id === id)

  if (!insider) notFound()

  const trades = dbTrades.length > 0
    ? dbTrades.map(transformTrade)
    : mockTrades.filter((t) => t.insiderId === id)

  const news = dbNews.length > 0
    ? dbNews.map(transformNews)
    : mockNews.filter((n) => n.insiderId === id)

  const marketEvents = dbEvents.length > 0
    ? dbEvents.map(transformMarketEvent)
    : mockEvents

  return (
    <InsiderProfile
      insider={insider}
      trades={trades}
      news={news}
      marketEvents={marketEvents}
    />
  )
}
