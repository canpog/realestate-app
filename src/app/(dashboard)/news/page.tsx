
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Newspaper, ExternalLink, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface NewsArticle {
    id: string;
    title: string;
    description: string;
    source_id: string;
    category: string;
    published_at: string;
    article_url: string;
    image_url: string | null;
    source: { name: string };
}

export default function NewsPage() {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const supabase = createClient();

    useEffect(() => {
        fetchNews();
    }, [category]);

    const fetchNews = async () => {
        setLoading(true);
        let query = supabase
            .from('news_articles')
            .select('*, source:news_sources(name)')
            .order('published_at', { ascending: false });

        if (category !== 'all') {
            query = query.eq('category', category);
        }

        const { data } = await query;
        if (data) {
            // @ts-ignore - Supabase type inference might need adjustment for join
            setNews(data);
        }
        setLoading(false);
    };

    const filteredNews = news.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                        <Newspaper className="h-8 w-8 text-blue-600" />
                        Haberler & Piyasa
                    </h1>
                    <p className="text-gray-500 mt-1">Gayrimenkul ve finans dünyasından güncel gelişmeler</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Haberlerde ara..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-[200px]">
                        <Filter className="mr-2 h-4 w-4 text-gray-500" />
                        <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Kategoriler</SelectItem>
                        <SelectItem value="real_estate">Gayrimenkul</SelectItem>
                        <SelectItem value="economy">Ekonomi</SelectItem>
                        <SelectItem value="finance">Finans</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNews.map((item) => (
                    <article key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
                        {item.image_url ? (
                            <div className="h-48 w-full overflow-hidden">
                                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <Newspaper className="h-12 w-12 text-gray-400" />
                            </div>
                        )}
                        <div className="p-5 flex flex-col flex-1">
                            <div className="flex items-center justify-between mb-3">
                                <Badge variant="outline" className={cn(
                                    item.category === 'real_estate' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                        item.category === 'economy' ? "bg-green-50 text-green-700 border-green-200" :
                                            "bg-purple-50 text-purple-700 border-purple-200"
                                )}>
                                    {item.category === 'real_estate' ? 'Emlak' :
                                        item.category === 'economy' ? 'Ekonomi' : 'Finans'}
                                </Badge>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    {formatDistanceToNow(new Date(item.published_at), { addSuffix: true, locale: tr })}
                                </span>
                            </div>

                            <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                                {item.title}
                            </h2>
                            <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
                                {item.description}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                <span className="text-xs font-medium text-gray-500">
                                    {/* @ts-ignore */}
                                    {item.source?.name || 'Kaynak'}
                                </span>
                                <Button size="sm" variant="ghost" className="h-8 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                                    <a href={item.article_url} target="_blank" rel="noopener noreferrer">
                                        Haberi Oku <ExternalLink className="h-3 w-3" />
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {loading && (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}

            {!loading && filteredNews.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100 border-dashed">
                    <Newspaper className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Haber bulunamadı.</p>
                </div>
            )}
        </div>
    );
}
