'use client';

import { Download, Send, TrendingUp, Home, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AnalysisResult {
    estimated_market_price: number;
    price_range: { min: number; max: number };
    price_score: number;
    price_per_sqm: number;
    comparison: string;
    recommendations?: {
        normal_price: number;
        quick_sale_price: number;
        premium_price: number;
        notes: string;
    };
    rental_analysis?: {
        estimated_monthly_rent: number;
        annual_rent: number;
        rental_yield_percentage: number;
        notes: string;
    };
    valuation_notes: string;
    investment_potential?: string;
}

interface PriceAnalysisResultsProps {
    analysis: AnalysisResult;
    listingPrice?: number;
    listingTitle?: string;
}

export function PriceAnalysisResults({
    analysis,
    listingPrice = 0,
    listingTitle = 'Değerleme Raporu',
}: PriceAnalysisResultsProps) {
    const scoreColor =
        analysis.price_score >= 7
            ? 'text-green-600'
            : analysis.price_score >= 5
                ? 'text-yellow-600'
                : 'text-red-600';

    const priceDiff = listingPrice - analysis.estimated_market_price;
    const priceDiffPercent = analysis.estimated_market_price > 0
        ? ((priceDiff / analysis.estimated_market_price) * 100).toFixed(1)
        : '0';

    // Safe accessors for optional nested objects
    const recommendations = analysis.recommendations || {
        normal_price: analysis.estimated_market_price,
        quick_sale_price: analysis.estimated_market_price * 0.95,
        premium_price: analysis.estimated_market_price * 1.05,
        notes: ''
    };

    const rentalAnalysis = analysis.rental_analysis || {
        estimated_monthly_rent: 0,
        annual_rent: 0,
        rental_yield_percentage: 0,
        notes: ''
    };

    return (
        <div className="space-y-6 p-6 max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100">
            {/* Başlık */}
            <div className="mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-bold text-gray-900">Değerleme Raporu</h2>
                <p className="text-sm text-gray-500 mt-1">{listingTitle}</p>
            </div>

            {/* Özet Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tahmini Pazar Değeri */}
                <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl">
                    <p className="text-sm text-blue-700 font-medium mb-1">Tahmini Pazar Değeri</p>
                    <p className="text-3xl font-black text-blue-600">
                        {analysis.estimated_market_price?.toLocaleString('tr-TR')} ₺
                    </p>
                    {listingPrice > 0 && (
                        <p className="text-xs text-blue-600/70 mt-2 flex items-center gap-1">
                            {priceDiff > 0 ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            {priceDiff > 0 ? '+' : ''}{priceDiff.toLocaleString('tr-TR')} ₺ ({priceDiffPercent}%)
                        </p>
                    )}
                </div>

                {/* Fiyat Skoru */}
                <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl">
                    <p className="text-sm text-purple-700 font-medium mb-1">Fiyat Skoru</p>
                    <p className={`text-3xl font-black ${scoreColor}`}>
                        {analysis.price_score?.toFixed(1)}/10
                    </p>
                    <p className="text-xs text-purple-600/70 mt-2">
                        {analysis.price_score >= 7 ? '✓ İyi Fiyat' : analysis.price_score >= 5 ? '○ Orta' : '✗ Pahalı'}
                    </p>
                </div>

                {/* Fiyat/m² */}
                <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl">
                    <p className="text-sm text-green-700 font-medium mb-1">Fiyat/m²</p>
                    <p className="text-3xl font-black text-green-600">
                        {analysis.price_per_sqm?.toLocaleString('tr-TR')} ₺
                    </p>
                    <p className="text-xs text-green-600/70 mt-2">Bölge Ortalaması</p>
                </div>
            </div>

            {/* Fiyat Aralığı */}
            <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Home className="w-5 h-5 text-gray-600" />
                    Tahmini Fiyat Aralığı
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Minimum</span>
                        <span className="font-bold text-red-600">
                            {analysis.price_range?.min?.toLocaleString('tr-TR')} ₺
                        </span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all"
                            style={{
                                width: `${Math.min(100, Math.max(0,
                                    ((analysis.estimated_market_price - analysis.price_range?.min) /
                                        (analysis.price_range?.max - analysis.price_range?.min)) * 100
                                ))}%`
                            }}
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Maksimum</span>
                        <span className="font-bold text-green-600">
                            {analysis.price_range?.max?.toLocaleString('tr-TR')} ₺
                        </span>
                    </div>
                </div>
            </div>

            {/* Pazar Analizi */}
            <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl">
                <h3 className="font-bold text-blue-900 mb-2">Pazar Analizi</h3>
                <p className="text-sm text-blue-800 leading-relaxed">{analysis.comparison}</p>
            </div>

            {/* Fiyatlandırma Önerileri */}
            <div className="p-5 bg-yellow-50 border border-yellow-200 rounded-2xl">
                <h3 className="font-bold text-yellow-900 mb-4">Fiyatlandırma Önerileri</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-white border border-yellow-200 rounded-xl text-center">
                        <p className="text-xs text-gray-600 mb-1">Normal Fiyat</p>
                        <p className="text-xl font-black text-blue-600">
                            {recommendations.normal_price?.toLocaleString('tr-TR')} ₺
                        </p>
                    </div>
                    <div className="p-4 bg-white border border-yellow-200 rounded-xl text-center">
                        <p className="text-xs text-gray-600 mb-1">Hızlı Satış</p>
                        <p className="text-xl font-black text-orange-600">
                            {recommendations.quick_sale_price?.toLocaleString('tr-TR')} ₺
                        </p>
                    </div>
                    <div className="p-4 bg-white border border-yellow-200 rounded-xl text-center">
                        <p className="text-xs text-gray-600 mb-1">Premium</p>
                        <p className="text-xl font-black text-green-600">
                            {recommendations.premium_price?.toLocaleString('tr-TR')} ₺
                        </p>
                    </div>
                </div>
                {recommendations.notes && (
                    <p className="text-sm text-yellow-800 mt-4">{recommendations.notes}</p>
                )}
            </div>

            {/* Yatırım Analizi */}
            {(rentalAnalysis.estimated_monthly_rent > 0 || rentalAnalysis.rental_yield_percentage > 0) && (
                <div className="p-5 bg-purple-50 border border-purple-200 rounded-2xl">
                    <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Yatırım Analizi
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-600">Tahmini Aylık Kira</p>
                            <p className="text-2xl font-black text-purple-600">
                                {rentalAnalysis.estimated_monthly_rent?.toLocaleString('tr-TR')} ₺
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600">Yıllık Getiri</p>
                            <p className="text-2xl font-black text-green-600">
                                %{rentalAnalysis.rental_yield_percentage?.toFixed(1)}
                            </p>
                        </div>
                    </div>
                    {rentalAnalysis.notes && (
                        <p className="text-sm text-purple-800 mt-4">{rentalAnalysis.notes}</p>
                    )}
                </div>
            )}

            {/* Detaylı Notlar */}
            <div className="p-5 border border-gray-200 rounded-2xl">
                <h3 className="font-bold text-gray-900 mb-2">Detaylı Değerleme</h3>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">{analysis.valuation_notes}</p>
                {analysis.investment_potential && (
                    <div className="p-4 bg-gray-100 rounded-xl">
                        <p className="text-xs text-gray-600 mb-1">Yatırım Potansiyeli</p>
                        <p className="text-sm font-bold text-gray-800">{analysis.investment_potential}</p>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                    <Download className="w-5 h-5" />
                    PDF İndir
                </button>
                <button className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                    <Send className="w-5 h-5" />
                    Müşteriye Gönder
                </button>
            </div>
        </div>
    );
}
