'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import ListingStats from '@/components/listings/listing-stats';
import { useViewTracker } from '@/hooks/use-view-tracker';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function ListingStatsPage() {
    const params = useParams();
    const listingId = params.id as string;

    // Track this page view too
    useViewTracker({ listingId, enabled: !!listingId });

    return (
        <div className="p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/listings/${listingId}`}
                        className="p-2 hover:bg-white rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                            <BarChart3 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900">Portföy İstatistikleri</h1>
                            <p className="text-gray-500">Görüntülenme, sorgu ve paylaşım verileri</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Component */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <ListingStats listingId={listingId} />
            </div>
        </div>
    );
}
