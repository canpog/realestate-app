'use client';

import { useState } from 'react';
import { PriceAnalysisForm } from '@/components/price-analysis/price-analysis-form';
import { PriceAnalysisResults } from '@/components/price-analysis/price-analysis-results';
import { ArrowLeft, TrendingUp, MapPin } from 'lucide-react';

// DEMO LISTING - Marmaris Villa
const DEMO_LISTING = {
    id: 'demo-marmaris-villa',
    title: '3+1 Yeni Villa - Marmaris İçmeler',
    price: 3800000,
    sqm: 150,
};

export default function PriceAnalysisPage() {
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                            <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900">Fiyat Analizi</h1>
                            <p className="text-gray-500 mt-1">
                                Claude AI + Pazar Verileri ile akıllı değerleme
                            </p>
                        </div>
                    </div>
                </div>

                {!analysisResult ? (
                    /* Form Gösterimi */
                    <div className="space-y-6">
                        <PriceAnalysisForm
                            listingId={DEMO_LISTING.id}
                            listingPrice={DEMO_LISTING.price}
                            onAnalysisComplete={setAnalysisResult}
                        />

                        {/* Info Box */}
                        <div className="max-w-2xl mx-auto p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-bold text-blue-900 mb-2">Test Bilgisi</h3>
                                    <p className="text-sm text-blue-800">
                                        Bu sayfada <span className="font-semibold">Marmaris</span> bölgesi için detaylı pazar verileri mevcuttur.
                                        Form'daki varsayılan değerler Marmaris İçmeler'deki 3+1 villalar içindir.
                                        Farklı senaryolar için şehir, ilçe ve diğer parametreleri değiştirebilirsiniz.
                                    </p>
                                    <p className="text-xs text-blue-600 mt-3">
                                        Desteklenen bölgeler: Marmaris, İstanbul (Maltepe, Beşiktaş, Kadıköy), Ankara (Çankaya), İzmir (Alsancak, Karşıyaka), Antalya (Konyaaltı, Lara)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Sonuç Gösterimi */
                    <div>
                        <button
                            onClick={() => setAnalysisResult(null)}
                            className="mb-6 px-4 py-2 text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Yeni Analiz Yap
                        </button>
                        <PriceAnalysisResults
                            analysis={analysisResult}
                            listingPrice={DEMO_LISTING.price}
                            listingTitle={DEMO_LISTING.title}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
