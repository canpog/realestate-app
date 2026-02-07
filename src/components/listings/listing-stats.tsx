'use client';

import { useState, useEffect } from 'react';
import {
    Eye, MessageCircle, Share2, TrendingUp,
    Smartphone, Monitor, Tablet, Clock,
    BarChart3, Loader2
} from 'lucide-react';

interface StatsData {
    views: {
        total: number;
        last7Days: number;
        last30Days: number;
        uniqueVisitors: number;
    };
    inquiries: {
        total: number;
        pending: number;
        replied: number;
        converted: number;
        byType: Record<string, number>;
    };
    shares: {
        total: number;
        totalClicks: number;
        byType: Record<string, number>;
    };
    devices: {
        desktop: number;
        mobile: number;
        tablet: number;
    };
    referers: Record<string, number>;
    conversionRate: string;
    dailyStats: Array<{
        stat_date: string;
        views_count: number;
        inquiries_count: number;
    }>;
}

interface ListingStatsProps {
    listingId: string;
}

export default function ListingStats({ listingId }: ListingStatsProps) {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, [listingId]);

    async function fetchStats() {
        try {
            setLoading(true);
            const response = await fetch(`/api/listings/${listingId}/stats`);
            const data = await response.json();

            if (data.success) {
                setStats(data.stats);
            } else {
                setError(data.error || 'İstatistikler yüklenemedi');
            }
        } catch (err) {
            setError('İstatistikler yüklenemedi');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{error || 'İstatistik verisi bulunamadı'}</p>
            </div>
        );
    }

    const totalDeviceViews = stats.devices.desktop + stats.devices.mobile + stats.devices.tablet;
    const desktopPercent = totalDeviceViews > 0 ? (stats.devices.desktop / totalDeviceViews * 100).toFixed(0) : 0;
    const mobilePercent = totalDeviceViews > 0 ? (stats.devices.mobile / totalDeviceViews * 100).toFixed(0) : 0;
    const tabletPercent = totalDeviceViews > 0 ? (stats.devices.tablet / totalDeviceViews * 100).toFixed(0) : 0;

    return (
        <div className="space-y-6">
            {/* Main Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-200 rounded-lg">
                            <Eye className="w-5 h-5 text-blue-700" />
                        </div>
                        <span className="text-sm text-blue-700 font-medium">Görüntülenme</span>
                    </div>
                    <p className="text-3xl font-black text-blue-900">{stats.views.total.toLocaleString('tr-TR')}</p>
                    <p className="text-xs text-blue-600 mt-1">Son 7 gün: {stats.views.last7Days}</p>
                </div>

                <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-200 rounded-lg">
                            <MessageCircle className="w-5 h-5 text-green-700" />
                        </div>
                        <span className="text-sm text-green-700 font-medium">Sorgular</span>
                    </div>
                    <p className="text-3xl font-black text-green-900">{stats.inquiries.total}</p>
                    <p className="text-xs text-green-600 mt-1">Bekleyen: {stats.inquiries.pending}</p>
                </div>

                <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-200 rounded-lg">
                            <Share2 className="w-5 h-5 text-purple-700" />
                        </div>
                        <span className="text-sm text-purple-700 font-medium">Paylaşım</span>
                    </div>
                    <p className="text-3xl font-black text-purple-900">{stats.shares.total}</p>
                    <p className="text-xs text-purple-600 mt-1">Tıklama: {stats.shares.totalClicks}</p>
                </div>

                <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-200 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-orange-700" />
                        </div>
                        <span className="text-sm text-orange-700 font-medium">Konversiyon</span>
                    </div>
                    <p className="text-3xl font-black text-orange-900">%{stats.conversionRate}</p>
                    <p className="text-xs text-orange-600 mt-1">{stats.inquiries.converted} dönüşüm</p>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Device Distribution */}
                <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-gray-500" />
                        Cihaz Dağılımı
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600 flex items-center gap-2">
                                    <Monitor className="w-4 h-4" /> Masaüstü
                                </span>
                                <span className="font-medium">{stats.devices.desktop} (%{desktopPercent})</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${desktopPercent}%` }} />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600 flex items-center gap-2">
                                    <Smartphone className="w-4 h-4" /> Mobil
                                </span>
                                <span className="font-medium">{stats.devices.mobile} (%{mobilePercent})</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${mobilePercent}%` }} />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600 flex items-center gap-2">
                                    <Tablet className="w-4 h-4" /> Tablet
                                </span>
                                <span className="font-medium">{stats.devices.tablet} (%{tabletPercent})</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${tabletPercent}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inquiry Types */}
                <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-gray-500" />
                        Sorgu Türleri
                    </h3>
                    <div className="space-y-2">
                        {Object.entries(stats.inquiries.byType).length === 0 ? (
                            <p className="text-gray-400 text-sm">Henüz sorgu yok</p>
                        ) : (
                            Object.entries(stats.inquiries.byType).map(([type, count]) => (
                                <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                    <span className="text-gray-700 capitalize">
                                        {type === 'whatsapp' ? 'WhatsApp' :
                                            type === 'phone' ? 'Telefon' :
                                                type === 'email' ? 'E-posta' :
                                                    type === 'form' ? 'Form' : type}
                                    </span>
                                    <span className="font-bold text-gray-900">{count}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Referer Sources */}
            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-gray-500" />
                    Trafik Kaynakları
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(stats.referers).length === 0 ? (
                        <p className="text-gray-400 text-sm col-span-4">Henüz trafik verisi yok</p>
                    ) : (
                        Object.entries(stats.referers).map(([source, count]) => (
                            <div key={source} className="p-3 bg-gray-50 rounded-xl text-center">
                                <p className="text-2xl font-black text-gray-900">{count}</p>
                                <p className="text-xs text-gray-500 capitalize">
                                    {source === 'direct' ? 'Doğrudan' :
                                        source === 'social' ? 'Sosyal Medya' :
                                            source === 'search' ? 'Arama Motoru' :
                                                source === 'whatsapp' ? 'WhatsApp' :
                                                    source === 'email' ? 'E-posta' : source}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Unique Visitors */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                    <span className="text-gray-600">Tekil ziyaretçi sayısı: </span>
                    <span className="font-bold text-gray-900">{stats.views.uniqueVisitors.toLocaleString('tr-TR')}</span>
                </div>
            </div>
        </div>
    );
}
