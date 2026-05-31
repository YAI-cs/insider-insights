import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { marketEvents as mockEvents } from '@/lib/mock-data'
import { transformMarketEvent } from '@/lib/data-pipeline'

export async function GET() {
  try {
    const dbEvents = await prisma.marketEvent.findMany({ orderBy: { date: 'asc' } })
    if (dbEvents.length > 0) {
      return NextResponse.json(dbEvents.map(transformMarketEvent))
    }
  } catch (error) {
    console.error('[api/market-events] DB error:', error)
  }
  return NextResponse.json(mockEvents)
}
