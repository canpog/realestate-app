
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow manual trigger in dev environment or via specific admin check if needed
    // For now, we'll strict check but locally we might need to bypass or set env
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createClient();
  const parser = new Parser();

  try {
    // Fetch active sources
    const { data: sources } = await supabase
      .from('news_sources')
      .select('*')
      .eq('is_active', true);

    if (!sources?.length) {
      return NextResponse.json({ message: 'No active sources' });
    }

    let addedCount = 0;

    for (const source of sources) {
      if (source.source_type === 'rss' && source.feed_url) {
        try {
          const feed = await parser.parseURL(source.feed_url);

          for (const item of feed.items) {
            // Check if exists
            const { data: existing } = await supabase
              .from('news_articles')
              .select('id')
              .eq('article_url', item.link)
              .single();

            if (!existing && item.link && item.title) {
              await supabase.from('news_articles').insert({
                source_id: source.id,
                title: item.title,
                description: item.contentSnippet?.substring(0, 500), // Truncate
                content: item.content,
                article_url: item.link,
                image_url: item.enclosure?.url,
                category: source.category || 'general',
                published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                importance_score: 0.5 // Default
              });
              addedCount++;
            }
          }
        } catch (e) {
          console.error(`Error parsing feed ${source.name}:`, e);
        }
      }
    }

    return NextResponse.json({ success: true, added: addedCount });
  } catch (error) {
    console.error('News fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}