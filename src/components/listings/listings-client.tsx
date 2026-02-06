'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Filter, Grid3X3, List, Table, MapPin, Bed, Bath, Ruler,
    MoreVertical, FileText, Edit, Trash2, Eye, Heart, X, ChevronDown,
    ArrowUpDown, Check, SlidersHorizontal, Home
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PDFModal from '@/components/pdf/pdf-modal';

import { type Listing } from '@/types/listing';
import { PORTFOLIO_CATEGORIES } from '@/types/portfolio';

type ViewMode = 'grid' | 'list' | 'table';
type SortField = 'created_at' | 'price' | 'title' | 'sqm';
type SortOrder = 'asc' | 'desc';

const PROPERTY_TYPES = [
    { value: 'apartment', label: 'Daire' },
    { value: 'villa', label: 'Villa' },
    { value: 'land', label: 'Arsa' },
    { value: 'commercial', label: 'Ticari' },
    { value: 'office', label: 'Ofis' },
];

const CATEGORY_OPTIONS = Object.entries(PORTFOLIO_CATEGORIES).map(([key, value]) => ({
    value: key,
    label: value.label,
    icon: value.icon
}));

const STATUS_OPTIONS = [
    { value: 'available', label: 'Aktif', color: 'bg-green-100 text-green-700' },
    { value: 'reserved', label: 'Rezerve', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'sold', label: 'Satıldı', color: 'bg-red-100 text-red-700' },
    { value: 'rented', label: 'Kiralandı', color: 'bg-blue-100 text-blue-700' },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function ListingsClient({ listings: initialListings }: { listings: Listing[] }) {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000000]);
    const [sqmRange, setSqmRange] = useState<[number, number]>([0, 1000]);
    const [selectedListingForPdf, setSelectedListingForPdf] = useState<Listing | null>(null);

    // Filter and sort
    const filteredListings = useMemo(() => {
        let result = [...initialListings];

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(l =>
                l.title?.toLowerCase().includes(search) ||
                l.city?.toLowerCase().includes(search) ||
                l.district?.toLowerCase().includes(search)
            );
        }

        // Category filter
        if (selectedCategories.length > 0) {
            result = result.filter(l => l.category && selectedCategories.includes(l.category));
        }

        // Type filter
        if (selectedTypes.length > 0) {
            result = result.filter(l => selectedTypes.includes(l.type));
        }

        // Status filter
        if (selectedStatuses.length > 0) {
            result = result.filter(l => selectedStatuses.includes(l.status));
        }

        // Price filter
        result = result.filter(l => l.price >= priceRange[0] && l.price <= priceRange[1]);

        // Sqm filter
        result = result.filter(l => !l.sqm || (l.sqm >= sqmRange[0] && l.sqm <= sqmRange[1]));

        // Sort
        result.sort((a, b) => {
            let aVal: any = a[sortField];
            let bVal: any = b[sortField];

            if (sortField === 'created_at') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            }

            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        return result;
    }, [initialListings, searchTerm, selectedCategories, selectedTypes, selectedStatuses, sortField, sortOrder, priceRange, sqmRange]);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedIds.length === filteredListings.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredListings.map(l => l.id));
        }
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedTypes([]);
        setSelectedStatuses([]);
        setPriceRange([0, 100000000]);
        setSqmRange([0, 1000]);
        setSearchTerm('');
    };

    const getStatusBadge = (status: string) => {
        const option = STATUS_OPTIONS.find(o => o.value === status);
        return option ? (
            <Badge className={option.color}>{option.label}</Badge>
        ) : (
            <Badge variant="secondary">{status}</Badge>
        );
    };

    const getImageUrl = (listing: Listing) => {
        const cover = listing.listing_media?.find(m => m.is_cover) || listing.listing_media?.[0];
        if (cover) {
            return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-media/${cover.storage_path}`;
        }
        return null;
    };

    const formatPrice = (price: number, currency: string) => {
        return `${price.toLocaleString('tr-TR')} ${currency}`;
    };

    const activeFiltersCount = selectedCategories.length + selectedTypes.length + selectedStatuses.length +
        (priceRange[0] > 0 || priceRange[1] < 100000000 ? 1 : 0) +
        (sqmRange[0] > 0 || sqmRange[1] < 1000 ? 1 : 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                        <Home className="h-8 w-8 text-blue-600" />
                        Portföyler
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {filteredListings.length} portföy listeleniyor
                        {activeFiltersCount > 0 && ` (${activeFiltersCount} filtre aktif)`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/listings/map"
                        className="flex items-center px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <MapPin className="h-4 w-4 mr-2" />
                        Harita
                    </Link>
                    <Link
                        href="/listings/new"
                        className="flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Yeni Portföy
                    </Link>
                </div>
            </div>

            {/* Search & Controls */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Portföy ara... (başlık, şehir, ilçe)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* View Mode */}
                    <div className="flex items-center bg-gray-100 rounded-xl p-1">
                        {[
                            { mode: 'grid' as ViewMode, icon: Grid3X3, label: 'Grid' },
                            { mode: 'list' as ViewMode, icon: List, label: 'Liste' },
                            { mode: 'table' as ViewMode, icon: Table, label: 'Tablo' },
                        ].map(({ mode, icon: Icon, label }) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`flex items-center px-3 py-2 rounded-lg font-medium transition-all ${viewMode === mode
                                    ? 'bg-white shadow-sm text-gray-900'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Icon className="h-4 w-4 mr-1.5" />
                                <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <select
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value as SortField)}
                            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium"
                        >
                            <option value="created_at">Tarih</option>
                            <option value="price">Fiyat</option>
                            <option value="title">Başlık</option>
                            <option value="sqm">m²</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50"
                        >
                            <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Filter Button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center px-4 py-2.5 rounded-xl border font-medium transition-all ${showFilters || activeFiltersCount > 0
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Filtreler
                        {activeFiltersCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Filter Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 mt-4 border-t border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Category */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Kategori</label>
                                        <div className="flex flex-wrap gap-2">
                                            {CATEGORY_OPTIONS.map(cat => (
                                                <button
                                                    key={cat.value}
                                                    onClick={() => setSelectedCategories(prev =>
                                                        prev.includes(cat.value)
                                                            ? prev.filter(c => c !== cat.value)
                                                            : [...prev, cat.value]
                                                    )}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${selectedCategories.includes(cat.value)
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    <cat.icon className="w-3.5 h-3.5" />
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Property Type */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Emlak Tipi</label>
                                        <div className="flex flex-wrap gap-2">
                                            {PROPERTY_TYPES.map(type => (
                                                <button
                                                    key={type.value}
                                                    onClick={() => setSelectedTypes(prev =>
                                                        prev.includes(type.value)
                                                            ? prev.filter(t => t !== type.value)
                                                            : [...prev, type.value]
                                                    )}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedTypes.includes(type.value)
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Durum</label>
                                        <div className="flex flex-wrap gap-2">
                                            {STATUS_OPTIONS.map(status => (
                                                <button
                                                    key={status.value}
                                                    onClick={() => setSelectedStatuses(prev =>
                                                        prev.includes(status.value)
                                                            ? prev.filter(s => s !== status.value)
                                                            : [...prev, status.value]
                                                    )}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedStatuses.includes(status.value)
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {status.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Price Range */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Fiyat Aralığı
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                value={priceRange[0] || ''}
                                                onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                            />
                                            <span className="text-gray-400">-</span>
                                            <input
                                                type="number"
                                                placeholder="Max"
                                                value={priceRange[1] === 100000000 ? '' : priceRange[1]}
                                                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 100000000])}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Sqm Range */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            m² Aralığı
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                value={sqmRange[0] || ''}
                                                onChange={(e) => setSqmRange([parseInt(e.target.value) || 0, sqmRange[1]])}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                            />
                                            <span className="text-gray-400">-</span>
                                            <input
                                                type="number"
                                                placeholder="Max"
                                                value={sqmRange[1] === 1000 ? '' : sqmRange[1]}
                                                onChange={(e) => setSqmRange([sqmRange[0], parseInt(e.target.value) || 1000])}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Clear Filters */}
                                {activeFiltersCount > 0 && (
                                    <button
                                        onClick={clearFilters}
                                        className="mt-4 text-sm font-medium text-red-600 hover:text-red-700 flex items-center"
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Filtreleri Temizle
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bulk Actions */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between"
                    >
                        <span className="font-medium text-blue-700">
                            {selectedIds.length} portföy seçildi
                        </span>
                        <div className="flex items-center gap-2">
                            <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200">
                                <FileText className="h-4 w-4 inline mr-1" />
                                PDF
                            </button>
                            <button className="px-3 py-1.5 bg-red-100 rounded-lg text-sm font-medium text-red-700 hover:bg-red-200">
                                <Trash2 className="h-4 w-4 inline mr-1" />
                                Sil
                            </button>
                            <button
                                onClick={() => setSelectedIds([])}
                                className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
                            >
                                İptal
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Listings */}
            {filteredListings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
                    <Home className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Portföy bulunamadı</h3>
                    <p className="text-gray-500 mb-6">Filtreleri değiştirin veya yeni bir portföy ekleyin.</p>
                    <Link
                        href="/listings/new"
                        className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Yeni Portföy Ekle
                    </Link>
                </div>
            ) : viewMode === 'grid' ? (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {filteredListings.map((listing) => (
                        <motion.div
                            key={listing.id}
                            variants={item}
                            className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all"
                        >
                            {/* Image */}
                            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                                {getImageUrl(listing) ? (
                                    <img
                                        src={getImageUrl(listing)!}
                                        alt={listing.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Home className="h-16 w-16" />
                                    </div>
                                )}

                                {/* Price Badge */}
                                <div className="absolute bottom-3 left-3">
                                    <span className="px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white font-bold rounded-lg text-sm">
                                        {formatPrice(listing.price, listing.currency)}
                                    </span>
                                </div>

                                {/* Select Checkbox */}
                                <button
                                    onClick={() => toggleSelect(listing.id)}
                                    className={`absolute top-3 left-3 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.includes(listing.id)
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100'
                                        }`}
                                >
                                    {selectedIds.includes(listing.id) && <Check className="h-4 w-4" />}
                                </button>

                                {/* Quick Actions */}
                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link
                                        href={`/listings/${listing.id}`}
                                        className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
                                    >
                                        <Eye className="h-4 w-4 text-gray-700" />
                                    </Link>
                                    <Link
                                        href={`/listings/${listing.id}/edit`}
                                        className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
                                    >
                                        <Edit className="h-4 w-4 text-gray-700" />
                                    </Link>
                                    <button
                                        onClick={() => setSelectedListingForPdf(listing)}
                                        className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
                                    >
                                        <FileText className="h-4 w-4 text-gray-700" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <Link href={`/listings/${listing.id}`} className="block p-4">
                                <h3 className="font-bold text-gray-900 truncate mb-1">{listing.title}</h3>
                                <p className="text-sm text-gray-500 flex items-center mb-3">
                                    <MapPin className="h-3.5 w-3.5 mr-1" />
                                    {listing.district}, {listing.city}
                                </p>

                                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                                    {listing.rooms && (
                                        <span className="flex items-center">
                                            <Bed className="h-3.5 w-3.5 mr-1" />
                                            {listing.rooms}
                                        </span>
                                    )}
                                    {listing.sqm && (
                                        <span className="flex items-center">
                                            <Ruler className="h-3.5 w-3.5 mr-1" />
                                            {listing.sqm}m²
                                        </span>
                                    )}
                                </div>

                                {getStatusBadge(listing.status)}
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            ) : viewMode === 'list' ? (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-3"
                >
                    {filteredListings.map((listing) => (
                        <motion.div
                            key={listing.id}
                            variants={item}
                            className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-lg transition-all"
                        >
                            {/* Checkbox */}
                            <button
                                onClick={() => toggleSelect(listing.id)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${selectedIds.includes(listing.id)
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'border-gray-300'
                                    }`}
                            >
                                {selectedIds.includes(listing.id) && <Check className="h-3 w-3" />}
                            </button>

                            {/* Image */}
                            <div className="h-16 w-24 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                {getImageUrl(listing) ? (
                                    <img
                                        src={getImageUrl(listing)!}
                                        alt={listing.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Home className="h-6 w-6" />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <Link href={`/listings/${listing.id}`} className="font-bold text-gray-900 hover:text-blue-600 truncate block">
                                    {listing.title}
                                </Link>
                                <p className="text-sm text-gray-500">
                                    {listing.district}, {listing.city}
                                </p>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                                <p className="font-bold text-gray-900">{formatPrice(listing.price, listing.currency)}</p>
                                <p className="text-xs text-gray-500">{listing.rooms} • {listing.sqm}m²</p>
                            </div>

                            {/* Status */}
                            <div className="flex-shrink-0">
                                {getStatusBadge(listing.status)}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                                <Link href={`/listings/${listing.id}`} className="p-2 rounded-lg hover:bg-gray-100">
                                    <Eye className="h-4 w-4 text-gray-500" />
                                </Link>
                                <Link href={`/listings/${listing.id}/edit`} className="p-2 rounded-lg hover:bg-gray-100">
                                    <Edit className="h-4 w-4 text-gray-500" />
                                </Link>
                                <button onClick={() => setSelectedListingForPdf(listing)} className="p-2 rounded-lg hover:bg-gray-100">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                /* Table View */
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="w-10 p-3">
                                        <button
                                            onClick={selectAll}
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedIds.length === filteredListings.length && filteredListings.length > 0
                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                : 'border-gray-300'
                                                }`}
                                        >
                                            {selectedIds.length === filteredListings.length && filteredListings.length > 0 && <Check className="h-3 w-3" />}
                                        </button>
                                    </th>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase">Görsel</th>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase">Başlık</th>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase">Konum</th>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase">Fiyat</th>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase">Tip</th>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase">Durum</th>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredListings.map((listing) => (
                                    <tr key={listing.id} className="hover:bg-gray-50">
                                        <td className="p-3">
                                            <button
                                                onClick={() => toggleSelect(listing.id)}
                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedIds.includes(listing.id)
                                                    ? 'bg-blue-600 border-blue-600 text-white'
                                                    : 'border-gray-300'
                                                    }`}
                                            >
                                                {selectedIds.includes(listing.id) && <Check className="h-3 w-3" />}
                                            </button>
                                        </td>
                                        <td className="p-3">
                                            <div className="h-10 w-14 rounded bg-gray-100 overflow-hidden">
                                                {getImageUrl(listing) ? (
                                                    <img
                                                        src={getImageUrl(listing)!}
                                                        alt={listing.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <Home className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <Link href={`/listings/${listing.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                                                {listing.title}
                                            </Link>
                                        </td>
                                        <td className="p-3 text-sm text-gray-500">
                                            {listing.district}, {listing.city}
                                        </td>
                                        <td className="p-3 font-medium text-gray-900">
                                            {formatPrice(listing.price, listing.currency)}
                                        </td>
                                        <td className="p-3 text-sm text-gray-500 capitalize">
                                            {PROPERTY_TYPES.find(t => t.value === listing.type)?.label || listing.type}
                                        </td>
                                        <td className="p-3">
                                            {getStatusBadge(listing.status)}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-1">
                                                <Link href={`/listings/${listing.id}`} className="p-1.5 rounded hover:bg-gray-100">
                                                    <Eye className="h-4 w-4 text-gray-500" />
                                                </Link>
                                                <Link href={`/listings/${listing.id}/edit`} className="p-1.5 rounded hover:bg-gray-100">
                                                    <Edit className="h-4 w-4 text-gray-500" />
                                                </Link>
                                                <button onClick={() => setSelectedListingForPdf(listing)} className="p-1.5 rounded hover:bg-gray-100">
                                                    <FileText className="h-4 w-4 text-gray-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {/* PDF Modal */}
            {selectedListingForPdf && (
                <PDFModal
                    isOpen={!!selectedListingForPdf}
                    onClose={() => setSelectedListingForPdf(null)}
                    listingId={selectedListingForPdf.id}
                    listingTitle={selectedListingForPdf.title}
                    media={selectedListingForPdf.listing_media || []}
                />
            )}
        </div>
    );
}
