'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, CheckCircle2, Calculator } from 'lucide-react';

interface PriceAnalysisFormProps {
    listingId?: string;
    listingPrice?: number;
    onAnalysisComplete: (result: any) => void;
}

export function PriceAnalysisForm({
    listingId,
    listingPrice,
    onAnalysisComplete,
}: PriceAnalysisFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        rooms: '3+1',
        age: 'new',
        sqm: 150,
        condition: 'excellent',
        floor: 2,
        total_floors: 3,
        city: 'muğla',
        district: 'marmaris',
        listing_type: 'villa',
        features: ['Havuz', 'Doğalgaz', 'Asansör', 'Otopark'],
        distance_to_sea: 300,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const response = await fetch('/api/price-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listing_id: listingId || 'standalone',
                    analysis_params: formData,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            if (data.success) {
                setSuccess(true);
                onAnalysisComplete(data.analysis);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            console.error('Analysis error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-8 max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-blue-600" />
                    Fiyat Analizi
                </h2>
                {listingPrice && (
                    <p className="text-sm text-gray-500 mt-1">
                        Mevcut Fiyat: <span className="font-semibold text-gray-900">{listingPrice.toLocaleString('tr-TR')} ₺</span>
                    </p>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-red-800">Hata</p>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm font-semibold text-green-800">Analiz başarıyla tamamlandı!</p>
                </div>
            )}

            {/* Konum */}
            <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-700">Konum</h3>
                <div className="grid grid-cols-2 gap-4">
                    <select
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    >
                        <option value="muğla">Muğla</option>
                        <option value="istanbul">İstanbul</option>
                        <option value="ankara">Ankara</option>
                        <option value="izmir">İzmir</option>
                        <option value="antalya">Antalya</option>
                    </select>

                    <input
                        type="text"
                        placeholder="İlçe (örn: marmaris)"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    />
                </div>
            </div>

            {/* Temel Özellikler */}
            <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-700">Temel Özellikler</h3>
                <div className="grid grid-cols-3 gap-4">
                    <select
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={formData.listing_type}
                        onChange={(e) => setFormData({ ...formData, listing_type: e.target.value })}
                    >
                        <option value="villa">Villa</option>
                        <option value="apartment">Daire</option>
                        <option value="land">Arsa</option>
                    </select>

                    <select
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={formData.rooms}
                        onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                    >
                        <option value="2+1">2+1</option>
                        <option value="3+1">3+1</option>
                        <option value="4+1">4+1</option>
                        <option value="5+1">5+1</option>
                    </select>

                    <input
                        type="number"
                        placeholder="m²"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={formData.sqm}
                        onChange={(e) => setFormData({ ...formData, sqm: parseInt(e.target.value) || 0 })}
                    />
                </div>
            </div>

            {/* Bina Yaşı */}
            <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-700">Bina Bilgileri</h3>
                <div className="grid grid-cols-3 gap-4">
                    <select
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    >
                        <option value="new">Yeni (0-2 yıl)</option>
                        <option value="0-5_years">2-5 yıl</option>
                        <option value="5-10_years">5-10 yıl</option>
                        <option value="10+_years">10+ yıl</option>
                    </select>

                    <input
                        type="number"
                        placeholder="Kat"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={formData.floor}
                        onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
                    />

                    <input
                        type="number"
                        placeholder="Toplam Kat"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={formData.total_floors}
                        onChange={(e) => setFormData({ ...formData, total_floors: parseInt(e.target.value) || 0 })}
                    />
                </div>
            </div>

            {/* Denize Uzaklık */}
            <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-700">Lokasyon Avantajları</h3>
                <input
                    type="number"
                    placeholder="Denize uzaklığı (metre)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={formData.distance_to_sea}
                    onChange={(e) => setFormData({ ...formData, distance_to_sea: parseInt(e.target.value) || 0 })}
                />
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all active:scale-[0.98] shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analiz Yapılıyor...
                    </>
                ) : (
                    <>
                        <Calculator className="w-5 h-5" />
                        Analiz Yap
                    </>
                )}
            </button>
        </form>
    );
}
