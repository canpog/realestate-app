'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, AlertCircle, Calendar, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    follow_up_id?: string;
}

export default function NotificationsMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const init = async () => {
            // Trigger check for missed followups first
            await fetch('/api/notifications/check-missed', { method: 'POST' });
            fetchNotifications();
        };
        init();

        // Realtime subscription for new notifications
        const channel = supabase
            .channel('notifications_realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: any) => !n.is_read).length);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications', { method: 'PATCH' });
            // Optimistic update
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error(error);
        }
    };

    const toggleMenu = () => {
        if (!isOpen && unreadCount > 0) {
            markAllAsRead();
        }
        setIsOpen(!isOpen);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'missed': return <div className="p-2 bg-red-100 rounded-full text-red-600"><AlertCircle className="h-4 w-4" /></div>;
            case 'reminder': return <div className="p-2 bg-blue-100 rounded-full text-blue-600"><Clock className="h-4 w-4" /></div>;
            case 'completed': return <div className="p-2 bg-green-100 rounded-full text-green-600"><Check className="h-4 w-4" /></div>;
            default: return <div className="p-2 bg-gray-100 rounded-full text-gray-600"><MessageSquare className="h-4 w-4" /></div>;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={toggleMenu}
                className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
                <Bell className="h-6 w-6 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="font-bold text-gray-900">Bildirimler</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                    >
                                        <Check className="h-3 w-3" />
                                        Tümünü okundu say
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[400px] overflow-y-auto">
                                {loading && notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400">
                                        <Clock className="h-6 w-6 mx-auto mb-2 animate-pulse" />
                                        Yükleniyor...
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400">
                                        <Bell className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                        Henüz bildirim yok.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className="flex-shrink-0">
                                                        {getIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 mt-2 flex items-center">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            {new Date(notification.created_at).toLocaleString('tr-TR')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
