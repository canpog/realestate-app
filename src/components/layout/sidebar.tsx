'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
    Home,
    LayoutDashboard,
    Users,
    Map as MapIcon,
    Settings,
    User,
    PlusSquare,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Bell,
    LogOut,
    FileText,
    Brain,
    Flame,
    Moon,
    Sun,
    Newspaper,
    Calculator,
    DollarSign,
    FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { createClient } from '@/lib/supabase/client';

interface NavItem {
    name: string;
    href: string;
    icon: any;
    badge?: number;
    children?: { name: string; href: string; badge?: number }[];
}

const navItems: NavItem[] = [
    { name: 'Kontrol Paneli', href: '/dashboard', icon: LayoutDashboard },
    {
        name: 'Portföyler',
        href: '/listings',
        icon: Home,
        children: [
            { name: 'Tüm Portföyler', href: '/listings' },
            { name: 'Harita Görünümü', href: '/listings/map' },
            { name: '+ Yeni Ekle', href: '/listings/new' },
        ]
    },
    {
        name: 'Müşteriler',
        href: '/clients',
        icon: Users,
        children: [
            { name: 'Tüm Müşteriler', href: '/clients' },
            { name: 'Sıcak Müşteriler', href: '/clients?status=hot', badge: 5 },
            { name: '+ Yeni Ekle', href: '/clients/new' },
        ]
    },
    { name: 'PDF\'lerim', href: '/pdfs', icon: FileText },
    { name: 'AI Eşleştirme', href: '/matching', icon: Brain },
    { name: 'Değerleme', href: '/valuation', icon: Calculator },
    { name: 'Satış & Komisyon', href: '/sales', icon: DollarSign },
    { name: 'Haberler', href: '/news', icon: Newspaper },
];

const bottomNavItems: NavItem[] = [
    { name: 'Ayarlar', href: '/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const { theme, setTheme } = useTheme();
    const [collapsed, setCollapsed] = useState(false);
    const [openMenus, setOpenMenus] = useState<string[]>(['Portföyler', 'Müşteriler']);
    const [agent, setAgent] = useState<any>(null);

    useEffect(() => {
        const fetchAgent = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('agents')
                    .select('*')
                    .eq('auth_user_id', user.id)
                    .single();
                setAgent(data);
            }
        };
        fetchAgent();
    }, []);

    const toggleMenu = (name: string) => {
        setOpenMenus(prev =>
            prev.includes(name)
                ? prev.filter(m => m !== name)
                : [...prev, name]
        );
    };

    const toggleDarkMode = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === href;
        return pathname.startsWith(href);
    };

    const sidebarWidth = collapsed ? 'w-20' : 'w-64';

    return (
        <TooltipProvider delayDuration={0}>
            <motion.aside
                initial={false}
                animate={{ width: collapsed ? 80 : 256 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className={cn(
                    'hidden md:flex flex-col bg-slate-900 text-white relative',
                    'border-r border-slate-800'
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <AnimatePresence mode="wait">
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center"
                            >
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3">
                                    <Home className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                    TR Danışman
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center gap-2">
                        {/* Notifications */}


                        {/* Collapse Toggle */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setCollapsed(!collapsed)}
                                    className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    {collapsed ? (
                                        <ChevronRight className="h-5 w-5 text-slate-400" />
                                    ) : (
                                        <ChevronLeft className="h-5 w-5 text-slate-400" />
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                {collapsed ? 'Genişlet' : 'Daralt'}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        const hasChildren = item.children && item.children.length > 0;
                        const isOpen = openMenus.includes(item.name);

                        if (collapsed) {
                            return (
                                <Tooltip key={item.name}>
                                    <TooltipTrigger asChild>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                'flex items-center justify-center p-3 rounded-xl transition-all duration-200',
                                                active
                                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                            )}
                                        >
                                            <item.icon className="h-5 w-5" />
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">{item.name}</TooltipContent>
                                </Tooltip>
                            );
                        }

                        if (hasChildren) {
                            return (
                                <Collapsible
                                    key={item.name}
                                    open={isOpen}
                                    onOpenChange={() => toggleMenu(item.name)}
                                >
                                    <CollapsibleTrigger asChild>
                                        <button
                                            className={cn(
                                                'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200',
                                                active
                                                    ? 'bg-slate-800 text-white'
                                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                            )}
                                        >
                                            <div className="flex items-center">
                                                <item.icon className="h-5 w-5 mr-3" />
                                                <span className="font-medium">{item.name}</span>
                                            </div>
                                            <ChevronDown
                                                className={cn(
                                                    'h-4 w-4 transition-transform duration-200',
                                                    isOpen && 'rotate-180'
                                                )}
                                            />
                                        </button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-1 ml-4 pl-4 border-l border-slate-700 space-y-1">
                                        {item.children?.map((child) => {
                                            const childActive = pathname === child.href || pathname.startsWith(child.href + '/');
                                            return (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                    className={cn(
                                                        'flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                                                        childActive
                                                            ? 'bg-blue-600/20 text-blue-400'
                                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                                    )}
                                                >
                                                    <span>{child.name}</span>
                                                    {child.badge && (
                                                        <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                                                            <Flame className="h-3 w-3 mr-0.5" />
                                                            {child.badge}
                                                        </Badge>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </CollapsibleContent>
                                </Collapsible>
                            );
                        }

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center px-3 py-2.5 rounded-xl transition-all duration-200',
                                    active
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                )}
                            >
                                <item.icon className="h-5 w-5 mr-3" />
                                <span className="font-medium">{item.name}</span>
                                {item.badge && (
                                    <Badge className="ml-auto">{item.badge}</Badge>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="px-3 py-4 space-y-2 border-t border-slate-800">
                    {/* Dark Mode Toggle */}
                    {!collapsed && (
                        <button
                            onClick={toggleDarkMode}
                            className="w-full flex items-center px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                            {theme === 'dark' ? (
                                <>
                                    <Sun className="h-5 w-5 mr-3" />
                                    <span className="font-medium">Açık Tema</span>
                                </>
                            ) : (
                                <>
                                    <Moon className="h-5 w-5 mr-3" />
                                    <span className="font-medium">Koyu Tema</span>
                                </>
                            )}
                        </button>
                    )}

                    {/* Settings */}
                    {bottomNavItems.map((item) => (
                        collapsed ? (
                            <Tooltip key={item.name}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'flex items-center justify-center p-3 rounded-xl transition-colors',
                                            isActive(item.href)
                                                ? 'bg-slate-800 text-white'
                                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right">{item.name}</TooltipContent>
                            </Tooltip>
                        ) : (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center px-3 py-2.5 rounded-xl transition-colors',
                                    isActive(item.href)
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                )}
                            >
                                <item.icon className="h-5 w-5 mr-3" />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        )
                    ))}

                    {/* User Profile */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                'w-full flex items-center p-2 rounded-xl hover:bg-slate-800 transition-colors',
                                collapsed ? 'justify-center' : 'px-3'
                            )}>
                                <Avatar className="h-9 w-9 border-2 border-slate-700">
                                    <AvatarImage src={agent?.avatar_url} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold">
                                        {agent?.full_name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                {!collapsed && (
                                    <div className="ml-3 text-left flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">
                                            {agent?.full_name || 'Kullanıcı'}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {agent?.email || ''}
                                        </p>
                                    </div>
                                )}
                                {!collapsed && <ChevronDown className="h-4 w-4 text-slate-400 ml-2" />}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push('/profile')}>
                                <User className="mr-2 h-4 w-4" />
                                Profil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/settings')}>
                                <Settings className="mr-2 h-4 w-4" />
                                Ayarlar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                                <LogOut className="mr-2 h-4 w-4" />
                                Çıkış Yap
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </motion.aside>
        </TooltipProvider>
    );
}
