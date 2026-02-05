'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, TrendingUp, DollarSign, Globe, ExternalLink, Calendar, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // Checking if exists, if not using simple span

interface NewsArticle {
    id: string;
    title: string;
    description: string;
    article_url: string;
    image_url?: string;
    published_at: string;
    category: string;
    news_sources?: {
        name: string;
    };
}

const CATEGORIES = [
    { id: 'all', label: 'Tümü', icon: Globe },
    { id: 'real_estate', label: 'Gayrimenkul', icon: Newspaper },
    { id: 'economy', label: 'Ekonomi', icon: TrendingUp },
    { id: 'finance', label: 'Finans', icon: DollarSign },
];

export default function NewsFeed() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNews();
    }, [activeCategory]);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/news?category=${activeCategory}&limit=50`);
            const data = await res.json();
            setArticles(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Featured is the first article (if exists)
    const featured = articles.length > 0 ? articles[0] : null;
    const list = articles.length > 0 ? articles.slice(1) : [];

    return (
        <div className="space-y-8">
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm w-full sm:w-auto overflow-x-auto">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeCategory === cat.id
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <cat.icon className="h-4 w-4 mr-2" />
                            {cat.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => fetch("/api/cron/fetch-news").then(() => fetchNews())}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                    <Filter className="h-4 w-4 mr-2" />
                    Yenile
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 bg-gray-200 rounded-2xl"></div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Featured Article */}
                    {featured && activeCategory === 'all' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative rounded-3xl overflow-hidden bg-gray-900 text-white shadow-xl aspect-[21/9] flex items-end group"
                        >
                            {/* Background Image (Mock if no image) */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 z-10" />
                            {featured.image_url ? (
                                <img src={featured.image_url} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            ) : (
                                <div className="absolute inset-0 bg-blue-900/50" />
                            )}

                            <div className="relative z-20 p-8 max-w-3xl">
                                <span className="px-3 py-1 bg-blue-600 text-xs font-bold uppercase tracking-wider rounded-full mb-4 inline-block">
                                    Günün Manşeti
                                </span>
                                <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                                    <a href={featured.article_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                        {featured.title}
                                    </a>
                                </h2>
                                <p className="text-gray-300 line-clamp-2 md:text-lg mb-4">
                                    {featured.description}
                                </p>
                                <div className="flex items-center text-sm text-gray-400 gap-4">
                                    <span className="flex items-center">
                                        <Newspaper className="h-4 w-4 mr-1" />
                                        {featured.news_sources?.name || 'Kaynak'}
                                    </span>
                                    <span className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        {new Date(featured.published_at).toLocaleDateString('tr-TR')}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(activeCategory === 'all' ? list : articles).map((article, index) => (
                            <motion.article
                                key={article.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all group flex flex-col h-full"
                            >
                                <div className="h-48 overflow-hidden relative bg-gray-100">
                                    {article.image_url ? (
                                        <img src={article.image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <Newspaper className="h-10 w-10" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-gray-900 shadow-sm">
                                        {article.category === 'real_estate' ? 'Gayrimenkul' : 'Ekonomi'}
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex items-center text-xs text-gray-500 mb-3 gap-2">
                                        <span className="font-semibold text-blue-600">{article.news_sources?.name}</span>
                                        <span>•</span>
                                        <span>{new Date(article.published_at).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        <a href={article.article_url} target="_blank" rel="noopener noreferrer">
                                            {article.title}
                                        </a>
                                    </h3>
                                    <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-1">
                                        {article.description}
                                    </p>
                                    <a
                                        href={article.article_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mt-auto"
                                    >
                                        Haberi Oku <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                </div>
                            </motion.article>
                        ))}
                    </div>

                    {articles.length === 0 && (
                        <div className="text-center py-20">
                            <Newspaper className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Haber bulunamadı</h3>
                            <p className="text-gray-500">Bu kategoride henüz haber yok veya yüklenirken hata oluştu.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
