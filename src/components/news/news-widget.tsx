'use client';

import { useEffect, useState } from 'react';
import { SupabaseNewsService } from '@/lib/news/supabase-news';
import { ParsedNewsArticle, NewsCategory } from '@/types/news';
import { Newspaper, TrendingUp, DollarSign, Building2, Landmark } from 'lucide-react';

const CATEGORY_ICONS: Record<NewsCategory, React.ReactNode> = {
  gayrimenkul: <Building2 className="w-4 h-4" />,
  borsa: <TrendingUp className="w-4 h-4" />,
  ekonomi: <DollarSign className="w-4 h-4" />,
  merkez_bankasi: <Landmark className="w-4 h-4" />,
  konut_kredisi: <DollarSign className="w-4 h-4" />,
  yatirim: <TrendingUp className="w-4 h-4" />,
  diger: <Newspaper className="w-4 h-4" />,
};

const CATEGORY_LABELS: Record<NewsCategory, string> = {
  gayrimenkul: 'Gayrimenkul',
  borsa: 'Borsa',
  ekonomi: 'Ekonomi',
  merkez_bankasi: 'Merkez Bankası',
  konut_kredisi: 'Konut Kredisi',
  yatirim: 'Yatırım',
  diger: 'Diğer',
};

interface NewsWidgetProps {
  limit?: number;
  featured?: boolean;
}

export function NewsWidget({ limit = 5, featured = false }: NewsWidgetProps) {
  const [news, setNews] = useState<ParsedNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        const newsData = featured
          ? await SupabaseNewsService.getFeaturedNews(limit)
          : await SupabaseNewsService.getLatestNews(undefined, limit);

        setNews(newsData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error loading news';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();

    // Her 30 dakikada bir yenile
    const interval = setInterval(fetchNews, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [limit, featured]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="bg-gray-200 h-16 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Haberler yüklenirken hata: {error}
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Haber bulunamadı
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {news.map((article) => (
        <a
          key={article.article_url}
          href={article.article_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-3">
            {article.image_url && (
              <img
                src={article.image_url}
                alt={article.title}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 rounded">
                  {CATEGORY_ICONS[article.category || 'diger']}
                  {CATEGORY_LABELS[article.category || 'diger']}
                </span>
                {article.is_featured && (
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                    ÖNEMLİ
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-sm line-clamp-2">
                {article.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(article.published_at).toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}