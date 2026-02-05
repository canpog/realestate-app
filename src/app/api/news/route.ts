import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    // Auth check optional for public news, but stricter is better
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const importantOnly = searchParams.get('important_only') === 'true';

    let query = supabase
        .from('news_articles')
        .select('*, news_sources(name)')
        .order('published_at', { ascending: false })
        .limit(limit);

    if (category && category !== 'all') {
        query = query.eq('category', category);
    }

    if (importantOnly) {
        query = query.gte('importance_score', 0.8);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
}
