'use client';

import { LogOut, User as UserIcon, Search } from 'lucide-react';
import NotificationsMenu from '@/components/layout/notifications-menu';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Header({ user }: { user: any }) {
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
            {/* Mobile Logo */}
            <div className="flex items-center md:hidden">
                <h1 className="text-lg font-bold text-blue-600">TR Danışman</h1>
            </div>

            {/* Command Palette Hint */}
            <div className="hidden md:flex items-center text-gray-400 text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                <Search className="h-4 w-4 mr-2" />
                <span>Hızlı Arama</span>
                <kbd className="ml-3 px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-500">
                    ⌘K
                </kbd>
            </div>

            <div className="ml-auto flex items-center space-x-4">
                {/* Notifications */}
                <NotificationsMenu />

                <div className="flex items-center space-x-3 border-l pl-4 ml-4 border-gray-200">
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-sm font-bold text-gray-900">{user?.email?.split('@')[0]}</span>
                        <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Danışman</span>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-100">
                        <UserIcon className="h-5 w-5" />
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Çıkış Yap"
                        className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-all ml-2"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
