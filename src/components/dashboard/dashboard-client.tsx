'use client';

import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import Link from 'next/link';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import {
    Home,
    Users,
    Flame,
    FileText,
    Plus,
    Map,
    Brain,
    Calendar,
    Clock,
    ArrowUpRight,
    TrendingUp,
    UserPlus,
    Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import NewsWidget from '@/components/dashboard/news-widget';
import FollowUpList from '@/components/follow-up/follow-up-list';

interface DashboardData {
    agent: any;
    stats: {
        totalListings: number;
        totalClients: number;
        hotClients: number;
        pdfExports: number;
    };
    recentListings: any[];
    weeklyData: { name: string; portfoy: number; musteri: number }[];
    activities: { type: string; title: string; time: string }[];
}

export default function DashboardClient({ data }: { data: DashboardData }) {
    const { agent, stats, recentListings, weeklyData, activities } = data;

    // Format time ago
    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes} dk önce`;
        if (hours < 24) return `${hours} saat önce`;
        if (days < 7) return `${days} gün önce`;
        return date.toLocaleDateString('tr-TR');
    };

    // Get current date
    const today = new Date().toLocaleDateString('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="space-y-6 p-1">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Hoş geldin,{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                            {agent?.full_name?.split(' ')[0] || 'Danışman'}
                        </span>
                    </h1>
                    <p className="text-gray-500 mt-1 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {today}
                    </p>
                </div>
            </motion.div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Toplam Portföy"
                    value={stats.totalListings}
                    icon={<Home className="h-6 w-6" />}
                    color="blue"
                    trend={weeklyData.reduce((sum, d) => sum + d.portfoy, 0)}
                    delay={0}
                />
                <StatCard
                    title="Toplam Müşteri"
                    value={stats.totalClients}
                    icon={<Users className="h-6 w-6" />}
                    color="green"
                    trend={weeklyData.reduce((sum, d) => sum + d.musteri, 0)}
                    delay={0.1}
                />
                <StatCard
                    title="Sıcak Müşteri"
                    value={stats.hotClients}
                    icon={<Flame className="h-6 w-6" />}
                    color="orange"
                    delay={0.2}
                />
                <StatCard
                    title="Bu Hafta PDF"
                    value={stats.pdfExports}
                    icon={<FileText className="h-6 w-6" />}
                    color="purple"
                    delay={0.3}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Chart & Listings */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Weekly Activity Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-100/50 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center">
                                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                                Haftalık Aktivite
                            </h2>
                            <Badge variant="secondary">Son 7 gün</Badge>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={weeklyData}>
                                    <defs>
                                        <linearGradient id="colorPortfoy" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorMusteri" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="portfoy"
                                        name="Portföy"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorPortfoy)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="musteri"
                                        name="Müşteri"
                                        stroke="#22c55e"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorMusteri)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Recent Listings */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-100/50 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Son Eklenen Portföyler</h2>
                            <Link
                                href="/listings"
                                className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center"
                            >
                                Tümünü Gör
                                <ArrowUpRight className="h-4 w-4 ml-1" />
                            </Link>
                        </div>

                        {recentListings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <span className="mb-2 p-3 bg-white rounded-full shadow-sm"><Home className="w-6 h-6 text-gray-400" /></span>
                                <p className="text-sm font-medium">Henüz portföy eklenmemiş</p>
                                <Link
                                    href="/listings/new"
                                    className="mt-3 text-sm font-bold text-blue-600 hover:underline"
                                >
                                    İlk portföyü ekle →
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {recentListings.slice(0, 3).map((listing: any, i: number) => (
                                    <motion.div
                                        key={listing.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.4 + i * 0.1 }}
                                    >
                                        <Link
                                            href={`/listings/${listing.id}`}
                                            className="group block relative rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all"
                                        >
                                            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                                {listing.listing_media?.[0] ? (
                                                    <img
                                                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-media/${listing.listing_media.find((m: any) => m.is_cover)?.storage_path || listing.listing_media[0].storage_path}`}
                                                        alt={listing.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <Home className="h-12 w-12" />
                                                    </div>
                                                )}
                                                {/* Price Badge */}
                                                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-blue-600">
                                                    {listing.price?.toLocaleString('tr-TR')} {listing.currency}
                                                </div>
                                            </div>
                                            <div className="p-3 bg-white">
                                                <p className="text-sm font-bold text-gray-900 truncate">{listing.title}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {listing.district}, {listing.city}
                                                </p>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Right Column - Quick Actions & Activity */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-100/50 border border-gray-100"
                    >
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Rocket className="h-5 w-5 text-blue-600" />
                            Hızlı Aksiyonlar
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <QuickActionCard
                                title="Portföy Ekle"
                                icon={<Home className="h-5 w-5" />}
                                href="/listings/new"
                                color="blue"
                            />
                            <QuickActionCard
                                title="Müşteri Ekle"
                                icon={<Users className="h-5 w-5" />}
                                href="/clients/new"
                                color="green"
                            />
                            <QuickActionCard
                                title="Harita"
                                icon={<Map className="h-5 w-5" />}
                                href="/listings/map"
                                color="orange"
                            />
                            <QuickActionCard
                                title="Eşleştir"
                                icon={<Brain className="h-5 w-5" />}
                                href="/clients"
                                color="purple"
                            />
                        </div>
                    </motion.div>

                    {/* Follow Ups */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 }}
                        className="h-80"
                    >
                        <FollowUpList />
                    </motion.div>

                    {/* News Widget */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="h-80"
                    >
                        <NewsWidget />
                    </motion.div>

                    {/* Activity Feed */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-100/50 border border-gray-100"
                    >
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Clock className="h-5 w-5 mr-2 text-blue-600" />
                            Son Aktiviteler
                        </h2>
                        {activities.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">
                                Henüz aktivite yok
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {activities.map((activity, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + i * 0.1 }}
                                        className="flex items-start gap-3"
                                    >
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm border border-blue-100">
                                            {activity.type === 'listing' ? <Home className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900 truncate">{activity.title}</p>
                                            <p className="text-xs text-gray-400">{formatTimeAgo(activity.time)}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    color,
    trend,
    delay = 0
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'orange' | 'purple';
    trend?: number;
    delay?: number;
}) {
    const colors = {
        blue: {
            bg: 'bg-blue-50',
            icon: 'bg-blue-500 text-white',
            text: 'text-blue-600',
            shadow: 'shadow-blue-500/20'
        },
        green: {
            bg: 'bg-green-50',
            icon: 'bg-green-500 text-white',
            text: 'text-green-600',
            shadow: 'shadow-green-500/20'
        },
        orange: {
            bg: 'bg-orange-50',
            icon: 'bg-orange-500 text-white',
            text: 'text-orange-600',
            shadow: 'shadow-orange-500/20'
        },
        purple: {
            bg: 'bg-purple-50',
            icon: 'bg-purple-500 text-white',
            text: 'text-purple-600',
            shadow: 'shadow-purple-500/20'
        }
    };

    const c = colors[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={cn(
                'relative overflow-hidden rounded-2xl p-6 bg-white border border-gray-100',
                'shadow-xl shadow-gray-100/50 hover:shadow-2xl transition-all duration-300',
                'group hover:scale-[1.02]'
            )}
        >
            {/* Background gradient decoration */}
            <div className={cn(
                'absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-2xl',
                c.bg.replace('50', '500')
            )} />

            <div className="relative flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {title}
                    </p>
                    <p className="text-3xl font-black text-gray-900">
                        <CountUp end={value} duration={1.5} />
                    </p>
                    {trend !== undefined && trend > 0 && (
                        <p className={cn('text-xs font-bold mt-2 flex items-center', c.text)}>
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +{trend} bu hafta
                        </p>
                    )}
                </div>
                <div className={cn(
                    'p-4 rounded-2xl shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6',
                    c.icon, c.shadow
                )}>
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}

function QuickActionCard({
    title,
    icon,
    href,
    color
}: {
    title: string;
    icon: React.ReactNode;
    href: string;
    color: 'blue' | 'green' | 'orange' | 'purple';
}) {
    const colors = {
        blue: 'hover:bg-blue-600 hover:text-white hover:border-blue-600',
        green: 'hover:bg-green-600 hover:text-white hover:border-green-600',
        orange: 'hover:bg-orange-500 hover:text-white hover:border-orange-500',
        purple: 'hover:bg-purple-600 hover:text-white hover:border-purple-600',
    };

    return (
        <Link
            href={href}
            className={cn(
                'flex flex-col items-center justify-center p-4 rounded-xl',
                'bg-gray-50 border border-gray-100 text-gray-600',
                'transition-all duration-200 hover:shadow-lg active:scale-95',
                colors[color]
            )}
        >
            <div className="mb-2">{icon}</div>
            <span className="text-xs font-bold">{title}</span>
        </Link>
    );
}
