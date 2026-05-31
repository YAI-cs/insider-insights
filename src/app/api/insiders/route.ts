import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { insiders as mockInsiders } from '@/lib/mock-data'
import { transformInsider } from '@/lib/data-pipeline'

export async function GET() {
  try {
    const dbInsiders = await prisma.insider.findMany({ orderBy: { estimatedEdge: 'desc' } })
    if (dbInsiders.length > 0) {
      return NextResponse.json(dbInsiders.map(transformInsider))
    }
  } catch (error) {
    console.error('[api/insiders] DB error:', error)
  }
  return NextResponse.json(mockInsiders)
}
