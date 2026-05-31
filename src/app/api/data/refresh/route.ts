import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { runDataPipeline } from '@/lib/data-pipeline'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runDataPipeline()
    return NextResponse.json({
      success: true,
      counts: {
        insiders: result.insiders,
        trades: result.trades,
        news: result.news,
        events: result.events,
      },
      errors: result.errors,
    })
  } catch (error) {
    console.error('[data/refresh] Pipeline fatal error:', error)
    return NextResponse.json(
      { error: 'Pipeline failed', detail: String(error) },
      { status: 500 }
    )
  }
}
