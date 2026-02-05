'use client';

import { useState, useEffect } from 'react';
import { FollowUp, FollowUpType } from '@/types/follow-up';
import { Phone, MessageCircle, Users, Mail, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FollowUpListProps {
    clientId: string;
    refreshTrigger?: number; // Prop to trigger refetch
}

const TYPE_CONFIG = {
    call: { icon: Phone, color: 'text-green-600 bg-green-50' },
    message: { icon: MessageCircle, color: 'text-blue-600 bg-blue-50' },
    meeting: { icon: Users, color: 'text-purple-600 bg-purple-50' },
    email: { icon: Mail, color: 'text-orange-600 bg-orange-50' },
};

export default function FollowUpList({ clientId, refreshTrigger }: FollowUpListProps) {
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFollowUps = async () => {
        try {
            const res = await fetch(`/api/follow-ups?client_id=${clientId}`);
            if (res.ok) {
                const data = await res.json();
                setFollowUps(data);
            }
        } catch (error) {
            console.error('Failed to fetch follow-ups', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFollowUps();
    }, [clientId, refreshTrigger]);

    const handleComplete = async (id: string) => {
        try {
            const res = await fetch(`/api/follow-ups/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' }),
            });
            if (res.ok) fetchFollowUps();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu takibi silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/follow-ups/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) fetchFollowUps();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return <div className="text-center py-4 text-gray-500">Yükleniyor...</div>;
    }

    if (followUps.length === 0) {
        return (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Clock className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">Planlanmış takip bulunmuyor.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <AnimatePresence>
                {followUps.map((item) => {
                    const Config = TYPE_CONFIG[item.follow_up_type] || TYPE_CONFIG.call;
                    const isCompleted = item.status === 'completed';
                    const isMissed = item.status === 'pending' && new Date(item.scheduled_at) < new Date();

                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`p-4 rounded-xl border transition-all ${isCompleted ? 'bg-gray-50 border-gray-100 opacity-75' :
                                isMissed ? 'bg-red-50/50 border-red-100' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${Config.color}`}>
                                        <Config.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900">
                                                {new Date(item.scheduled_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {new Date(item.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMissed && !isCompleted && (
                                                <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Gecikmiş</span>
                                            )}
                                            {isCompleted && (
                                                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Tamamlandı</span>
                                            )}
                                        </div>
                                        {item.notes && <p className="text-sm text-gray-600">{item.notes}</p>}
                                    </div>
                                </div>

                                {!isCompleted && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleComplete(item.id)}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            title="Tamamla"
                                        >
                                            <CheckCircle className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Sil"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
