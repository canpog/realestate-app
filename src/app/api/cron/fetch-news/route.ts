export const dynamic = 'force-dynamic';

import { SupabaseNewsService } from '@/lib/news/supabase-news';

export async function GET(request: Request) {
  // Cron Secret kontrolü (Güvenlik)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.warn('Unauthorized cron request');
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('[Cron] Starting news fetch job...');
    const startTime = Date.now();

    // Haberler çek ve kaydet
    const result = await SupabaseNewsService.fetchAndSaveNews();

    const duration = Date.now() - startTime;

    console.log(
      `[Cron] News fetch completed in ${duration}ms. Added: ${result.articlesAdded}`
    );

    if (result.errors.length > 0) {
      console.warn('[Cron] Errors:', result.errors);
    }

    return Response.json({
      success: result.success,
      articlesAdded: result.articlesAdded,
      duration: `${duration}ms`,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Fatal error:', error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Alternatif: POST method (bazı cron service'ler POST ister)
export async function POST(request: Request) {
  return GET(request);
}