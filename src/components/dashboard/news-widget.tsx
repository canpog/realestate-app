
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NewsArticle {
    id: string;
    title: string;
    source_id: string;
    category: string;
    published_at: string;
    article_url: string;
    image_url: string | null;
}

export default function NewsWidget() {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchNews = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('news_articles')
            .select('*')
            .order('published_at', { ascending: false })
            .limit(5);

        if (data) {
            setNews(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchNews();
    }, []);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Piyasa Haberleri</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={fetchNews} disabled={loading} className="h-8 w-8">
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="divide-y divide-gray-100">
                    {news.length === 0 && !loading ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            Henüz haber bulunmuyor.
                        </div>
                    ) : (
                        news.map((item) => (
                            <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors group">
                                <a
                                    href={item.article_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                            {item.title}
                                        </h4>
                                        {item.image_url && (
                                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                                                <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                                            {item.category === 'real_estate' ? 'Emlak' :
                                                item.category === 'economy' ? 'Ekonomi' : 'Finans'}
                                        </Badge>
                                        <span>•</span>
                                        <span>{formatDistanceToNow(new Date(item.published_at), { addSuffix: true, locale: tr })}</span>
                                    </div>
                                </a>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
            <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
                <Link href="/news" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1">
                    Tüm Haberleri Gör <ExternalLink className="h-3 w-3" />
                </Link>
            </div>
        </div>
    );
}
