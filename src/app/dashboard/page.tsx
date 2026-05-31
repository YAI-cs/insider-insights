import { prisma } from "@/lib/prisma"
import {
  insiders as mockInsiders,
  trades as mockTrades,
  marketEvents as mockEvents,
} from "@/lib/mock-data"
import {
  transformInsider,
  transformTrade,
  transformMarketEvent,
} from "@/lib/data-pipeline"
import { Dashboard } from "@/components/dashboard/dashboard"

export default async function DashboardPage() {
  const [dbInsiders, dbTrades, dbEvents] = await Promise.all([
    prisma.insider.findMany({ orderBy: { estimatedEdge: "desc" } }).catch(() => []),
    prisma.trade.findMany({ orderBy: { date: "desc" } }).catch(() => []),
    prisma.marketEvent.findMany({ orderBy: { date: "asc" } }).catch(() => []),
  ])

  const insiders = dbInsiders.length > 0 ? dbInsiders.map(transformInsider) : mockInsiders
  const trades = dbTrades.length > 0 ? dbTrades.map(transformTrade) : mockTrades
  const marketEvents = dbEvents.length > 0 ? dbEvents.map(transformMarketEvent) : mockEvents

  return <Dashboard insiders={insiders} trades={trades} marketEvents={marketEvents} />
}
