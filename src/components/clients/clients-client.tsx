'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
    Plus, Search, Users, Phone, Mail, MessageCircle, Calendar, MapPin,
    MoreVertical, Edit, Trash2, Eye, Grid3X3, List, LayoutTemplate,
    ArrowUpDown, SlidersHorizontal, X, Check, Flame, Snowflake, Sun,
    Clock, Banknote, Home, ChevronRight, UserCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Client {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    status: 'new' | 'following' | 'hot' | 'cold' | 'closed';
    budget_min: number;
    budget_max: number;
    currency: string;
    wanted_types: string[];
    wanted_city: string;
    wanted_districts: string[];
    wanted_purpose: string;
    notes: string;
    created_at: string;
    updated_at: string;
    last_contact_at: string;
}

type ViewMode = 'list' | 'grid' | 'kanban';
type SortField = 'created_at' | 'full_name' | 'budget_max' | 'status';

const STATUS_CONFIG = {
    new: { label: 'Yeni', color: 'bg-blue-100 text-blue-700', icon: Users, emoji: '🆕' },
    following: { label: 'Takipte', color: 'bg-purple-100 text-purple-700', icon: Eye, emoji: '👀' },
    hot: { label: 'Sıcak', color: 'bg-red-100 text-red-700', icon: Flame, emoji: '🔥' },
    cold: { label: 'Soğuk', color: 'bg-cyan-100 text-cyan-700', icon: Snowflake, emoji: '❄️' },
    closed: { label: 'Kapandı', color: 'bg-green-100 text-green-700', icon: UserCheck, emoji: '✅' },
};

const KANBAN_COLUMNS: Array<{ status: keyof typeof STATUS_CONFIG; label: string; emoji: string }> = [
    { status: 'new', label: 'Yeni', emoji: '🆕' },
    { status: 'following', label: 'Takipte', emoji: '👀' },
    { status: 'hot', label: 'Sıcak', emoji: '🔥' },
    { status: 'closed', label: 'Kapandı', emoji: '✅' },
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

export default function ClientsClient({ clients: initialClients }: { clients: Client[] }) {
    const [clients, setClients] = useState(initialClients);
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [draggedClient, setDraggedClient] = useState<Client | null>(null);

    // Filter and sort
    const filteredClients = useMemo(() => {
        let result = [...clients];

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.full_name?.toLowerCase().includes(search) ||
                c.email?.toLowerCase().includes(search) ||
                c.phone?.includes(search) ||
                c.wanted_city?.toLowerCase().includes(search)
            );
        }

        // Status filter
        if (selectedStatuses.length > 0) {
            result = result.filter(c => selectedStatuses.includes(c.status));
        }

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
    }, [clients, searchTerm, selectedStatuses, sortField, sortOrder]);

    // Group by status for Kanban
    const clientsByStatus = useMemo(() => {
        const grouped: Record<string, Client[]> = {};
        KANBAN_COLUMNS.forEach(col => {
            grouped[col.status] = filteredClients.filter(c => c.status === col.status);
        });
        return grouped;
    }, [filteredClients]);

    const handleDragStart = (client: Client) => {
        setDraggedClient(client);
    };

    const handleDragEnd = () => {
        setDraggedClient(null);
    };

    const handleDrop = async (newStatus: string) => {
        if (!draggedClient || draggedClient.status === newStatus) return;

        // Optimistic update
        setClients(prev => prev.map(c =>
            c.id === draggedClient.id ? { ...c, status: newStatus as Client['status'] } : c
        ));

        // API call to update status
        try {
            await fetch(`/api/clients/${draggedClient.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (error) {
            // Revert on error
            setClients(prev => prev.map(c =>
                c.id === draggedClient.id ? { ...c, status: draggedClient.status } : c
            ));
        }

        setDraggedClient(null);
    };

    const formatBudget = (min: number, max: number, currency: string) => {
        const formatNum = (n: number) => {
            if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
            if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
            return n.toString();
        };
        return `${formatNum(min)} - ${formatNum(max)} ${currency}`;
    };

    const getTimeAgo = (dateStr: string) => {
        if (!dateStr) return 'Bilinmiyor';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (days > 0) return `${days} gün önce`;
        if (hours > 0) return `${hours} saat önce`;
        return 'Az önce';
    };

    const activeFiltersCount = selectedStatuses.length;

    const ClientCard = ({ client, compact = false }: { client: Client; compact?: boolean }) => {
        const StatusIcon = STATUS_CONFIG[client.status]?.icon || Users;

        return (
            <motion.div
                layout
                draggable
                onDragStart={() => handleDragStart(client)}
                onDragEnd={handleDragEnd}
                className={`bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg hover:border-gray-200 transition-all cursor-grab active:cursor-grabbing group ${compact ? 'p-3' : 'p-4'
                    }`}
            >
                <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className={`rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 ${compact ? 'h-10 w-10 text-sm' : 'h-12 w-12'
                        }`}>
                        {client.full_name?.charAt(0).toUpperCase() || '?'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <Link
                                href={`/clients/${client.id}`}
                                className="font-bold text-gray-900 hover:text-blue-600 truncate"
                            >
                                {client.full_name}
                            </Link>
                            {!compact && (
                                <Badge className={STATUS_CONFIG[client.status]?.color || 'bg-gray-100 text-gray-700'}>
                                    {STATUS_CONFIG[client.status]?.emoji} {STATUS_CONFIG[client.status]?.label}
                                </Badge>
                            )}
                        </div>

                        {/* Budget */}
                        {(client.budget_min || client.budget_max) && (
                            <p className={`text-gray-500 flex items-center ${compact ? 'text-xs mt-1' : 'text-sm mt-1'}`}>
                                <Banknote className="h-3.5 w-3.5 mr-1" />
                                {formatBudget(client.budget_min || 0, client.budget_max || 0, client.currency || 'TRY')}
                            </p>
                        )}

                        {/* Wanted Types */}
                        {client.wanted_types && client.wanted_types.length > 0 && !compact && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {client.wanted_types.slice(0, 3).map((type, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                        {type}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Location */}
                        {client.wanted_city && !compact && (
                            <p className="text-xs text-gray-400 flex items-center mt-2">
                                <MapPin className="h-3 w-3 mr-1" />
                                {client.wanted_city}
                                {client.wanted_districts?.length > 0 && ` / ${client.wanted_districts.slice(0, 2).join(', ')}`}
                            </p>
                        )}

                        {/* Last Contact */}
                        <p className={`text-gray-400 flex items-center ${compact ? 'text-xs mt-1' : 'text-xs mt-2'}`}>
                            <Clock className="h-3 w-3 mr-1" />
                            {getTimeAgo(client.last_contact_at || client.updated_at || client.created_at)}
                        </p>
                    </div>
                </div>

                {/* Quick Actions (on hover) */}
                {!compact && (
                    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                            href={`/clients/${client.id}`}
                            className="flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100"
                        >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Görüntüle
                        </Link>
                        {client.phone && (
                            <a
                                href={`tel:${client.phone}`}
                                className="flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-medium text-green-600 hover:bg-green-50"
                            >
                                <Phone className="h-3.5 w-3.5 mr-1" />
                                Ara
                            </a>
                        )}
                        {client.phone && (
                            <a
                                href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                className="flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                            >
                                <MessageCircle className="h-3.5 w-3.5 mr-1" />
                                WhatsApp
                            </a>
                        )}
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">👥 Müşteriler (CRM)</h1>
                    <p className="text-gray-500 mt-1">
                        {filteredClients.length} müşteri
                        {activeFiltersCount > 0 && ` (${activeFiltersCount} filtre aktif)`}
                    </p>
                </div>
                <Link
                    href="/clients/new"
                    className="flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Yeni Müşteri
                </Link>
            </div>

            {/* Search & Controls */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Müşteri ara... (isim, e-posta, telefon)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* View Mode */}
                    <div className="flex items-center bg-gray-100 rounded-xl p-1">
                        {[
                            { mode: 'kanban' as ViewMode, icon: LayoutTemplate, label: 'Kanban' },
                            { mode: 'grid' as ViewMode, icon: Grid3X3, label: 'Grid' },
                            { mode: 'list' as ViewMode, icon: List, label: 'Liste' },
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
                                <label className="block text-sm font-bold text-gray-700 mb-2">Durum Filtresi</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                                        <button
                                            key={status}
                                            onClick={() => setSelectedStatuses(prev =>
                                                prev.includes(status)
                                                    ? prev.filter(s => s !== status)
                                                    : [...prev, status]
                                            )}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${selectedStatuses.includes(status)
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {config.emoji} {config.label}
                                        </button>
                                    ))}
                                </div>

                                {activeFiltersCount > 0 && (
                                    <button
                                        onClick={() => setSelectedStatuses([])}
                                        className="mt-3 text-sm font-medium text-red-600 hover:text-red-700 flex items-center"
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

            {/* Content */}
            {filteredClients.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
                    <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Müşteri bulunamadı</h3>
                    <p className="text-gray-500 mb-6">Filtreleri değiştirin veya yeni müşteri ekleyin.</p>
                    <Link
                        href="/clients/new"
                        className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Yeni Müşteri Ekle
                    </Link>
                </div>
            ) : viewMode === 'kanban' ? (
                /* Kanban View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {KANBAN_COLUMNS.map((column) => (
                        <div
                            key={column.status}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(column.status)}
                            className={`bg-gray-50 rounded-2xl p-4 min-h-[400px] ${draggedClient && draggedClient.status !== column.status
                                ? 'ring-2 ring-blue-300 ring-dashed bg-blue-50/50'
                                : ''
                                }`}
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{column.emoji}</span>
                                    <span className="font-bold text-gray-700">{column.label}</span>
                                    <Badge variant="secondary" className="ml-1">
                                        {clientsByStatus[column.status]?.length || 0}
                                    </Badge>
                                </div>
                            </div>

                            {/* Cards */}
                            <div className="space-y-3">
                                {clientsByStatus[column.status]?.map((client) => (
                                    <ClientCard key={client.id} client={client} compact />
                                ))}
                            </div>

                            {/* Empty State */}
                            {(!clientsByStatus[column.status] || clientsByStatus[column.status].length === 0) && (
                                <div className="text-center py-8 text-gray-400">
                                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Bu durumda müşteri yok</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : viewMode === 'grid' ? (
                /* Grid View */
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                    {filteredClients.map((client) => (
                        <motion.div
                            key={client.id}
                            variants={item}
                        >
                            <ClientCard client={client} />
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                /* List View */
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase">Müşteri</th>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase">İletişim</th>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase">Bütçe</th>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase">Konum</th>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase">Durum</th>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase">Son İletişim</th>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredClients.map((client) => (
                                    <tr key={client.id} className="hover:bg-gray-50">
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {client.full_name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <Link href={`/clients/${client.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                                                    {client.full_name}
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="text-sm">
                                                {client.phone && <p className="text-gray-600">{client.phone}</p>}
                                                {client.email && <p className="text-gray-400 text-xs">{client.email}</p>}
                                            </div>
                                        </td>
                                        <td className="p-3 text-sm text-gray-600">
                                            {client.budget_min || client.budget_max
                                                ? formatBudget(client.budget_min || 0, client.budget_max || 0, client.currency || 'TRY')
                                                : '-'}
                                        </td>
                                        <td className="p-3 text-sm text-gray-600">
                                            {client.wanted_city || '-'}
                                        </td>
                                        <td className="p-3">
                                            <Badge className={STATUS_CONFIG[client.status]?.color || 'bg-gray-100 text-gray-700'}>
                                                {STATUS_CONFIG[client.status]?.emoji} {STATUS_CONFIG[client.status]?.label}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-sm text-gray-500">
                                            {getTimeAgo(client.last_contact_at || client.updated_at)}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-1">
                                                <Link href={`/clients/${client.id}`} className="p-1.5 rounded hover:bg-gray-100">
                                                    <Eye className="h-4 w-4 text-gray-500" />
                                                </Link>
                                                <Link href={`/clients/${client.id}/edit`} className="p-1.5 rounded hover:bg-gray-100">
                                                    <Edit className="h-4 w-4 text-gray-500" />
                                                </Link>
                                                {client.phone && (
                                                    <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} target="_blank" className="p-1.5 rounded hover:bg-green-100">
                                                        <MessageCircle className="h-4 w-4 text-green-600" />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <div key={status} className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <span>{config.emoji}</span>
                            <span className="text-xs font-bold text-gray-400 uppercase">{config.label}</span>
                        </div>
                        <p className="text-2xl font-black text-gray-900">
                            {clients.filter(c => c.status === status).length}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
