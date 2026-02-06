'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Home, Users, FileText, Settings, Plus, Map,
    LogOut, User, LayoutDashboard, ChevronRight,
    ArrowUp, ArrowDown, CornerDownLeft
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type CommandGroup = 'pages' | 'actions' | 'listings' | 'clients';

interface SearchResult {
    id: string;
    title: string;
    type: 'listing' | 'client';
    url: string;
    description?: string;
}

export default function CommandMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const supabase = createClient();

    // Toggle with Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Search logic
    useEffect(() => {
        const search = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                // Search listings
                const { data: listings } = await supabase
                    .from('listings')
                    .select('id, title, city, district')
                    .ilike('title', `%${query}%`)
                    .limit(3);

                // Search clients
                const { data: clients } = await supabase
                    .from('clients')
                    .select('id, first_name, last_name, email')
                    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
                    .limit(3);

                const newResults: SearchResult[] = [
                    ...(listings?.map(l => ({
                        id: l.id,
                        title: l.title,
                        type: 'listing' as const,
                        url: `/listings/${l.id}`,
                        description: `${l.district}, ${l.city}`
                    })) || []),
                    ...(clients?.map(c => ({
                        id: c.id,
                        title: `${c.first_name} ${c.last_name}`,
                        type: 'client' as const,
                        url: `/clients/${c.id}`,
                        description: c.email || 'Müşteri'
                    })) || [])
                ];

                setResults(newResults);
                setSelectedIndex(0);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    // Navigation logic
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;

        const allItems = query ? results : STATIC_COMMANDS;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % allItems.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const selected = allItems[selectedIndex];
            if (selected) {
                runCommand(selected.url);
            }
        }
    };

    const runCommand = (url: string) => {
        setIsOpen(false);
        router.push(url);
    };

    const STATIC_COMMANDS = [
        { id: 'home', title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, type: 'page' },
        { id: 'listings', title: 'Portföyler', url: '/listings', icon: Home, type: 'page' },
        { id: 'clients', title: 'Müşteriler', url: '/clients', icon: Users, type: 'page' },
        { id: 'pdfs', title: 'PDF & Paylaşımlar', url: '/pdfs', icon: FileText, type: 'page' },
        { id: 'new-listing', title: 'Yeni Portföy Ekle', url: '/listings/new', icon: Plus, type: 'action' },
        { id: 'new-client', title: 'Yeni Müşteri Ekle', url: '/clients/new', icon: Plus, type: 'action' },
        { id: 'map', title: 'Harita Görünümü', url: '/listings/map', icon: Map, type: 'action' },
        { id: 'profile', title: 'Profilim', url: '/profile', icon: User, type: 'page' },
    ];

    const displayItems = query ? results : STATIC_COMMANDS;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-4 flex items-start justify-center pt-[15vh]"
                onClick={() => setIsOpen(false)}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Input */}
                    <div className="flex items-center border-b border-gray-100 px-4 py-3">
                        <Search className="w-5 h-5 text-gray-400 mr-3" />
                        <input
                            autoFocus
                            placeholder="Ne aramak istiyorsun? (Portföy, müşteri veya sayfa)"
                            className="flex-1 bg-transparent outline-none text-lg text-gray-900 placeholder:text-gray-400"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <div className="hidden sm:flex gap-1">
                            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500 font-medium">ESC</kbd>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500 text-sm">Aranıyor...</div>
                        ) : displayItems.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">Sonuç bulunamadı</div>
                        ) : (
                            <div className="space-y-1">
                                {!query && <div className="px-2 py-1 text-xs font-bold text-gray-400 uppercase">Hızlı Erişim</div>}

                                {displayItems.map((item, index) => {
                                    const isSelected = index === selectedIndex;
                                    const Icon = (item as any).icon || (item.type === 'listing' ? Home : Users);

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => runCommand(item.url)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={`flex items-center px-3 py-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-lg mr-3 ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                                <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{item.title}</div>
                                                {item.description && (
                                                    <div className={`text-xs truncate ${isSelected ? 'text-blue-600/70' : 'text-gray-400'}`}>
                                                        {item.description}
                                                    </div>
                                                )}
                                            </div>
                                            {isSelected && <ChevronRight className="w-4 h-4 text-blue-500 opacity-50" />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex gap-3">
                            <span><strong className="font-medium text-gray-700 flex items-center gap-0.5"><ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" /></strong> Seç</span>
                            <span><strong className="font-medium text-gray-700 flex items-center gap-0.5"><CornerDownLeft className="w-3 h-3" /></strong> Git</span>
                        </div>
                        <div>
                            Portföy ve Müşterilerde arama yapar
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
