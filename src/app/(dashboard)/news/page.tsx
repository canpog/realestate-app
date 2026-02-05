import { Metadata } from 'next';
import NewsFeed from '@/components/news/news-feed';

export const metadata: Metadata = {
    title: 'Haberler & Piyasa',
    description: 'Güncel gayrimenkul ve ekonomi haberleri.',
};

export default function NewsPage() {
    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Haberler & Piyasa</h1>
                <p className="text-gray-500 mt-2 text-lg">Gayrimenkul sektörü ve ekonomiden son gelişmeler.</p>
            </div>
            <NewsFeed />
        </div>
    );
}
