'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Users, Home, Sparkles, ArrowRight, Loader2, MapPin, Banknote, Bed, Bath, Ruler, Check, X, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Client {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    status: string;
    budget_min: number;
    budget_max: number;
    preferred_location: string;
    property_type: string;
    notes: string;
    wanted_city?: string;
    wanted_districts?: string[];
}

interface Listing {
    id: string;
    title: string;
    price: number;
    currency: string;
    city: string;
    district: string;
    neighborhood: string;
    property_type: string;
    bedrooms: number;
    bathrooms: number;
    area_sqm: number;
    rooms?: string;
    sqm?: number;
    listing_media: { storage_path: string; is_cover: boolean }[];
}

// API response format
interface APIMatchResult {
    listing_id: string;
    score: number;
    reason: string;
    pros: string[];
    cons: string[];
}

// UI display format
interface DisplayMatch {
    listing: Listing;
    score: number;
    reason: string;
    pros: string[];
    cons: string[];
}

export default function MatchingClient({ clients, listings }: { clients: Client[]; listings: Listing[] }) {
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [matches, setMatches] = useState<DisplayMatch[]>([]);
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const runMatching = async () => {
        if (!selectedClient) return;

        setLoading(true);
        setError('');
        setMatches([]);
        setSummary('');

        try {
            const response = await fetch('/api/ai/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: selectedClient.id })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Eşleştirme başarısız');
            }

            // Transform API response to display format
            const apiMatches: APIMatchResult[] = data.matches || [];
            const displayMatches: DisplayMatch[] = [];

            for (const apiMatch of apiMatches) {
                // Find the listing from our listings array
                const listing = listings.find(l => l.id === apiMatch.listing_id);
                if (listing) {
                    displayMatches.push({
                        listing,
                        score: apiMatch.score,
                        reason: apiMatch.reason,
                        pros: apiMatch.pros || [],
                        cons: apiMatch.cons || []
                    });
                }
            }

            setMatches(displayMatches);
            setSummary(data.summary || '');
        } catch (err: any) {
            setError(err.message || 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'hot': return 'bg-red-100 text-red-700';
            case 'warm': return 'bg-orange-100 text-orange-700';
            case 'cold': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                        <Brain className="h-8 w-8 text-purple-600" />
                        AI Eşleştirme
                    </h1>
                    <p className="text-gray-500 mt-1">Müşterileriniz için en uygun portföyleri bulun</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Client Selection */}
                <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-100/50 border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        Müşteri Seçin
                    </h2>

                    {clients.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <Users className="h-12 w-12 mx-auto mb-3" />
                            <p>Henüz müşteri yok</p>
                            <a href="/clients/new" className="mt-3 inline-block text-sm font-bold text-blue-600 hover:underline">
                                + Müşteri Ekle
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {clients.map((client) => (
                                <motion.button
                                    key={client.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedClient(client)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedClient?.id === client.id
                                        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500/20'
                                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-gray-900">{client.full_name}</p>
                                            <p className="text-sm text-gray-500">
                                                {client.wanted_city || client.preferred_location || 'Konum belirtilmemiş'}
                                            </p>
                                        </div>
                                        <Badge className={getStatusColor(client.status)}>
                                            {client.status === 'hot' ? '🔥 Sıcak' : client.status === 'warm' ? '☀️ Ilık' : '❄️ Soğuk'}
                                        </Badge>
                                    </div>
                                    {(client.budget_min || client.budget_max) && (
                                        <p className="text-xs text-gray-400 mt-2 flex items-center">
                                            <Banknote className="h-3 w-3 mr-1" />
                                            {client.budget_min?.toLocaleString('tr-TR') || '?'} - {client.budget_max?.toLocaleString('tr-TR') || '?'} TL
                                        </p>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    )}

                    {/* Run Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={runMatching}
                        disabled={!selectedClient || loading || listings.length === 0}
                        className={`w-full mt-4 py-3 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${selectedClient && !loading && listings.length > 0
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/20'
                            : 'bg-gray-300 cursor-not-allowed'
                            }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                AI Analiz Ediyor...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-5 w-5" />
                                Eşleştir
                            </>
                        )}
                    </motion.button>

                    {listings.length === 0 && (
                        <p className="text-xs text-amber-600 mt-2 flex items-center justify-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Eşleştirme için portföy eklemeniz gerekiyor
                        </p>
                    )}
                </div>

                {/* Results */}
                <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-100/50 border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Home className="h-5 w-5 text-green-600" />
                        Eşleşen Portföyler
                    </h2>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl mb-4 flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">Hata</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    {summary && (
                        <div className="p-4 bg-purple-50 text-purple-700 rounded-xl mb-4">
                            <p className="text-sm font-medium">{summary}</p>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-16"
                            >
                                <div className="relative">
                                    <Brain className="h-16 w-16 text-purple-600 animate-pulse" />
                                    <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-2 -right-2 animate-bounce" />
                                </div>
                                <p className="mt-4 text-gray-500 font-medium">AI portföyleri analiz ediyor...</p>
                            </motion.div>
                        ) : matches.length === 0 && !error && !summary ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-16 text-gray-400"
                            >
                                <Brain className="h-12 w-12 mx-auto mb-3" />
                                <p>Müşteri seçip "Eşleştir" butonuna tıklayın</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4 max-h-[500px] overflow-y-auto pr-2"
                            >
                                {matches.length === 0 && summary && (
                                    <div className="text-center py-8 text-gray-400">
                                        <Home className="h-12 w-12 mx-auto mb-3" />
                                        <p>Uygun eşleşme bulunamadı</p>
                                    </div>
                                )}
                                {matches.map((match, index) => (
                                    <motion.a
                                        key={match.listing.id}
                                        href={`/listings/${match.listing.id}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="block p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all"
                                    >
                                        <div className="flex gap-4">
                                            {/* Image */}
                                            <div className="h-20 w-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                                                {match.listing.listing_media?.[0] ? (
                                                    <img
                                                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-media/${match.listing.listing_media.find(m => m.is_cover)?.storage_path || match.listing.listing_media[0].storage_path}`}
                                                        alt={match.listing.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <Home className="h-8 w-8" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-bold text-gray-900 truncate">{match.listing.title}</p>
                                                        <p className="text-sm text-gray-500 flex items-center mt-1">
                                                            <MapPin className="h-3 w-3 mr-1" />
                                                            {match.listing.district}, {match.listing.city}
                                                        </p>
                                                    </div>
                                                    <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                                                        %{match.score}
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                                                    <span className="flex items-center">
                                                        <Banknote className="h-3 w-3 mr-1" />
                                                        {match.listing.price?.toLocaleString('tr-TR')} {match.listing.currency}
                                                    </span>
                                                    {(match.listing.bedrooms || match.listing.rooms) && (
                                                        <span className="flex items-center">
                                                            <Bed className="h-3 w-3 mr-1" />
                                                            {match.listing.bedrooms || match.listing.rooms}
                                                        </span>
                                                    )}
                                                    {(match.listing.area_sqm || match.listing.sqm) && (
                                                        <span className="flex items-center">
                                                            <Ruler className="h-3 w-3 mr-1" />
                                                            {match.listing.area_sqm || match.listing.sqm}m²
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Match Reason */}
                                                {match.reason && (
                                                    <p className="text-xs text-purple-600 mt-2 italic">
                                                        "{match.reason}"
                                                    </p>
                                                )}

                                                {/* Pros */}
                                                {match.pros && match.pros.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {match.pros.slice(0, 3).map((pro, i) => (
                                                            <span
                                                                key={i}
                                                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700"
                                                            >
                                                                <Check className="h-3 w-3 mr-0.5" />
                                                                {pro}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.a>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase">Toplam Müşteri</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{clients.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase">Toplam Portföy</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{listings.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase">Sıcak Müşteriler</p>
                    <p className="text-2xl font-black text-red-600 mt-1">{clients.filter(c => c.status === 'hot').length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase">Eşleşme Bulundu</p>
                    <p className="text-2xl font-black text-purple-600 mt-1">{matches.length}</p>
                </div>
            </div>
        </div>
    );
}
