'use client';

import { useState } from 'react';
import { runValuationAction } from '@/app/actions/valuation';
import { type ValuationParams } from '@/types/valuation';
import { ArrowLeft, Calculator, Check, AlertCircle, TrendingUp, Info } from 'lucide-react';
import Link from 'next/link';

// Helper to safely extract number from AI response
function safeNumber(val: any): number {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseInt(val.replace(/[^\d]/g, ''), 10) || 0;
    return 0;
}

// Helper to safely get string
function safeString(val: any): string {
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
    return String(val || '');
}

// Normalize AI response to expected format
function normalizeResult(raw: any) {
    const estimatedPrice = safeNumber(
        raw.estimated_market_price || raw.listing_price || raw.market_price || raw.price || raw.value || 0
    );

    const priceMin = safeNumber(
        raw.price_range?.min || raw.quick_sale_price || raw.min_price || estimatedPrice * 0.9
    );

    const priceMax = safeNumber(
        raw.price_range?.max || raw.listing_price || raw.max_price || estimatedPrice * 1.1
    );

    const priceScore = safeNumber(
        raw.price_score || raw.score || raw.rating || 5
    );

    const rentalYield = raw.rental_yield || raw.yield || raw.rental_return || null;

    const marketComparison = safeString(
        raw.market_comparison || raw.analysis || raw.comparison || raw.market_analysis || 'Pazar verisi mevcut değil.'
    );

    // Enhanced Recommendations Parsing
    let recommendations = 'Önerimiz bulunmamaktadır.';

    if (typeof raw.recommendations === 'string') {
        recommendations = raw.recommendations;
    } else if (typeof raw.recommendations === 'object' && raw.recommendations !== null) {
        const parts = [];

        // Add Notes first if available
        if (raw.recommendations.notes) {
            parts.push(raw.recommendations.notes);
            parts.push(''); // Spacer
        }

        // Comprehensive Price Keys Mapping
        const labels: { [key: string]: string } = {
            suggested_list_price: 'Önerilen Liste Fiyatı',
            list_price: 'Liste Fiyatı',
            sale_price: 'Satış Fiyatı',
            normal_price: 'Piyasa Fiyatı',
            quick_sale_price: 'Hızlı Satış Fiyatı',
            premium_price: 'Premium Fiyat',
            min_price: 'Minimum Fiyat',
            max_price: 'Maksimum Fiyat'
        };

        // Iterate through known labels
        Object.keys(labels).forEach(key => {
            if (raw.recommendations[key] !== undefined) {
                const val = raw.recommendations[key];
                if (typeof val === 'number') {
                    parts.push(`${labels[key]}: ${val.toLocaleString('tr-TR')} ₺`);
                } else if (typeof val === 'string') {
                    parts.push(`${labels[key]}: ${val}`);
                }
            }
        });

        // If explicitly no known keys matched but we have other keys, dump them prettily
        if (parts.length === 0 || (parts.length === 2 && !raw.recommendations.notes)) {
            Object.entries(raw.recommendations).forEach(([k, v]) => {
                if (k === 'notes') return; // Already handled
                if (labels[k]) return; // Already handled
                if (typeof v === 'object') return; // Skip complex objects

                // Auto-format key: "suggested_price" -> "Suggested Price"
                const label = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const val = typeof v === 'number' ? `${v.toLocaleString('tr-TR')} ₺` : v;
                parts.push(`${label}: ${val}`);
            });
        }

        if (parts.length > 0) {
            recommendations = parts.join('\n');
        } else {
            recommendations = JSON.stringify(raw.recommendations);
        }
    } else if (raw.recommendation) {
        recommendations = String(raw.recommendation);
    } else if (raw.advice) {
        recommendations = String(raw.advice);
    } else if (raw.suggestions) {
        recommendations = String(raw.suggestions);
    }

    return {
        estimated_market_price: estimatedPrice,
        price_range: { min: priceMin, max: priceMax },
        price_score: Math.min(10, Math.max(0, priceScore)),
        rental_yield: rentalYield,
        market_comparison: marketComparison,
        recommendations: recommendations
    };
}

// Listing prop optional for Standalone mode
export default function ValuationClient({ listing }: { listing?: any }) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initial Params
    const [params, setParams] = useState<ValuationParams>({
        city: listing?.city || '',
        district: listing?.district || '',
        type: listing?.type || 'apartment',
        rooms: listing?.rooms || '3+1',
        sqm: listing?.sqm || 100,
        age: listing?.building_age || 0,
        floor: listing?.floor || 1,
        features: listing ? [
            listing.has_elevator ? 'Asansör' : '',
            listing.has_parking ? 'Otopark' : '',
            listing.has_balcony ? 'Balkon' : '',
            listing.has_garden ? 'Bahçe' : '',
            listing.is_furnished ? 'Eşyalı' : '',
        ].filter(Boolean) : []
    });

    const handleRunValuation = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await runValuationAction(listing?.id || null, params, listing?.price);
            const normalized = normalizeResult(data);
            setResult(normalized);
        } catch (e: any) {
            setError(e.message || 'Analiz hatası');
        } finally {
            setLoading(false);
        }
    };

    if (result) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setResult(null)}
                        className="flex items-center text-sm font-bold text-gray-500 hover:text-blue-600"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Analize Dön
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Değerleme Raporu</h1>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Calculator className="h-32 w-32" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Tahmini Piyasa Değeri</h3>
                                <div className="text-4xl font-black text-blue-600">
                                    {result.estimated_market_price?.toLocaleString('tr-TR')} ₺
                                </div>
                                <div className="flex items-center mt-2 text-sm text-gray-500 font-medium">
                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg mr-2">
                                        {result.price_range?.min?.toLocaleString('tr-TR')} - {result.price_range?.max?.toLocaleString('tr-TR')} ₺
                                    </span>
                                    aralığında
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-gray-700">Fiyat Skoru</span>
                                    <span className={`text-xl font-black ${result.price_score >= 7 ? 'text-green-600' : result.price_score >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {result.price_score}/10
                                    </span>
                                </div>
                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${result.price_score >= 7 ? 'bg-green-500' : result.price_score >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${result.price_score * 10}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    10 = Peynir ekmek gibi satılır, 0 = Çok pahalı
                                </p>
                            </div>

                            {result.rental_yield && (
                                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl border border-green-100 text-green-800">
                                    <TrendingUp className="h-8 w-8 text-green-600" />
                                    <div>
                                        <div className="text-xs font-bold opacity-70 uppercase">Yıllık Kira Getirisi</div>
                                        <div className="text-xl font-black">
                                            {typeof result.rental_yield === 'number' ? `%${result.rental_yield}` :
                                                typeof result.rental_yield === 'object' ? `%${result.rental_yield.rental_yield_percentage || result.rental_yield.yield || 0}` :
                                                    result.rental_yield.toString()}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold text-gray-900 mb-2 flex items-center">
                                    <Info className="h-5 w-5 mr-2 text-blue-500" />
                                    Pazar Analizi
                                </h4>
                                <p className="text-gray-600 text-sm leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-50 whitespace-pre-wrap">
                                    {result.market_comparison}
                                </p>
                            </div>

                            <div>
                                <h4 className="font-bold text-gray-900 mb-2 flex items-center">
                                    <Check className="h-5 w-5 mr-2 text-green-500" />
                                    Öneriler
                                </h4>
                                <p className="text-gray-600 text-sm leading-relaxed bg-green-50/50 p-4 rounded-xl border border-green-50 whitespace-pre-wrap">
                                    {result.recommendations}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8">
            <div className="mb-8">
                {listing ? (
                    <Link href={`/listings/${listing.id}`} className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-gray-600 mb-4 transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        İlana Dön
                    </Link>
                ) : (
                    <div className="text-sm font-bold text-gray-400 mb-4">Hızlı Değerleme Aracı (v1.2)</div>
                )}
                <h1 className="text-3xl font-extrabold text-gray-900">Fiyat Analizi & Değerleme</h1>
                <p className="text-gray-500 mt-2">
                    Yapay zeka desteği ile bölge emsalleri, özellikler ve piyasa koşullarına göre detaylı değerleme yapın.
                </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700">Şehir & İlçe</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={params.city}
                                onChange={(e) => setParams({ ...params, city: e.target.value })}
                                placeholder="Şehir"
                            />
                            <input
                                type="text"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={params.district}
                                onChange={(e) => setParams({ ...params, district: e.target.value })}
                                placeholder="İlçe"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700">Tip & Oda</label>
                        <div className="flex gap-2">
                            <select
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={params.type}
                                onChange={(e) => setParams({ ...params, type: e.target.value })}
                            >
                                <option value="apartment">Daire</option>
                                <option value="villa">Villa</option>
                                <option value="commercial">Ticari</option>
                                <option value="land">Arsa</option>
                            </select>
                            <input
                                type="text"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={params.rooms}
                                onChange={(e) => setParams({ ...params, rooms: e.target.value })}
                                placeholder="Örn: 3+1"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700">Metrekare & Yaş</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={params.sqm}
                                onChange={(e) => setParams({ ...params, sqm: Number(e.target.value) })}
                                placeholder="m2"
                            />
                            <input
                                type="number"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={params.age}
                                onChange={(e) => setParams({ ...params, age: Number(e.target.value) })}
                                placeholder="Yaş"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700">Kat</label>
                        <input
                            type="number"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={params.floor}
                            onChange={(e) => setParams({ ...params, floor: Number(e.target.value) })}
                            placeholder="Kat No"
                        />
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-900 rounded-xl flex items-center border border-red-100">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                        <span className="font-semibold">{error}</span>
                    </div>
                )}

                <button
                    onClick={handleRunValuation}
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
                >
                    {loading ? (
                        <>Analiz Yapılıyor...</>
                    ) : (
                        <>
                            <Calculator className="h-5 w-5 mr-2" />
                            Değerleme Başlat
                        </>
                    )}
                </button>
                <div className="mt-4 text-center text-xs text-gray-400">
                    Not: Analiz sonuçları yalnızca tavsiye niteliğindedir.
                </div>
            </div>
        </div>
    );
}
