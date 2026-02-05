'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { useState, useCallback } from 'react';

export default function ListingFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [type, setType] = useState(searchParams.get('type') || '');
    const [status, setStatus] = useState(searchParams.get('status') || '');

    const updateFilters = useCallback((key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`${pathname}?${params.toString()}`);
    }, [searchParams, router, pathname]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateFilters('search', search);
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setType(val);
        updateFilters('type', val);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setStatus(val);
        updateFilters('status', val);
    };

    const clearFilters = () => {
        setSearch('');
        setType('');
        setStatus('');
        router.push(pathname);
    };

    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50 flex flex-wrap gap-4 items-center">
            <form onSubmit={handleSearch} className="flex-1 min-w-[240px] relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                    type="text"
                    placeholder="Başlık veya konum ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border border-gray-100 bg-gray-50/50 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
            </form>

            <select
                value={type}
                onChange={handleTypeChange}
                className="border border-gray-100 bg-gray-50/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer font-bold text-gray-700"
            >
                <option value="">Tüm Tipler</option>
                <option value="apartment">Daire</option>
                <option value="villa">Villa</option>
                <option value="land">Arsa</option>
                <option value="commercial">Ticari</option>
                <option value="office">Ofis</option>
                <option value="shop">Dükkan</option>
            </select>

            <select
                value={status}
                onChange={handleStatusChange}
                className="border border-gray-100 bg-gray-50/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer font-bold text-gray-700"
            >
                <option value="">Tüm Durumlar</option>
                <option value="available">Aktif</option>
                <option value="sold">Satıldı</option>
                <option value="reserved">Rezerve</option>
            </select>

            {(search || type || status) && (
                <button
                    onClick={clearFilters}
                    className="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1 transition-colors"
                >
                    Temizle
                </button>
            )}
        </div>
    );
}
