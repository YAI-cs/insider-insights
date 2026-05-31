import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { insiderNews as mockNews } from '@/lib/mock-data'
import { transformNews } from '@/lib/data-pipeline'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const insiderId = searchParams.get('insiderId')

  try {
    const dbNews = await prisma.insiderNews.findMany({
      where: insiderId ? { insiderId } : undefined,
      orderBy: { date: 'desc' },
    })

    if (dbNews.length > 0) {
      return NextResponse.json(dbNews.map(transformNews))
    }
  } catch (error) {
    console.error('[api/news] DB error:', error)
  }

  let result = mockNews
  if (insiderId) result = result.filter((n) => n.insiderId === insiderId)
  return NextResponse.json(result)
}
