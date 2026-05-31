import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { trades as mockTrades } from '@/lib/mock-data'
import { transformTrade } from '@/lib/data-pipeline'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const insiderId = searchParams.get('insiderId')
  const type = searchParams.get('type')

  try {
    const where: Record<string, string> = {}
    if (insiderId) where.insiderId = insiderId
    if (type && type !== 'ALL') where.type = type

    const dbTrades = await prisma.trade.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    if (dbTrades.length > 0) {
      return NextResponse.json(dbTrades.map(transformTrade))
    }
  } catch (error) {
    console.error('[api/trades] DB error:', error)
  }

  // Fallback to mock data with same filters applied
  let result = mockTrades
  if (insiderId) result = result.filter((t) => t.insiderId === insiderId)
  if (type && type !== 'ALL') result = result.filter((t) => t.type === type)
  return NextResponse.json(result)
}
