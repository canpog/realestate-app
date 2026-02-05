'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Phone, MessageCircle, Mail, Users, CheckSquare } from 'lucide-react';
import { FollowUpType } from '@/types/follow-up';

interface FollowUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientId: string;
    clientName: string;
    onSuccess: () => void;
}

export default function FollowUpModal({ isOpen, onClose, clientId, clientName, onSuccess }: FollowUpModalProps) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [type, setType] = useState<FollowUpType>('call');
    const [notes, setNotes] = useState('');
    const [reminders, setReminders] = useState({
        min15: true,
        hour1: true,
        day1: false
    });
    const [loading, setLoading] = useState(false);

    // Reset form on open
    useEffect(() => {
        if (isOpen) {
            // Default tomorrow 10:00
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setDate(tomorrow.toISOString().split('T')[0]);
            setTime('10:00');
            setNotes('');
            setType('call');
            setReminders({ min15: true, hour1: true, day1: false });
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const scheduledAt = new Date(`${date}T${time}`).toISOString();

            const res = await fetch('/api/follow-ups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: clientId,
                    scheduled_at: scheduledAt,
                    follow_up_type: type,
                    notes,
                    remind_15_min: reminders.min15,
                    remind_1_hour: reminders.hour1,
                    remind_1_day: reminders.day1,
                }),
            });

            if (!res.ok) throw new Error('Failed to create follow-up');

            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Takip Planla</h2>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            {/* Client Info */}
                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                    {clientName.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Müşteri</p>
                                    <p className="font-bold text-gray-900">{clientName}</p>
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="date"
                                            required
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Saat</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="time"
                                            required
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Takip Türü</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { id: 'call', label: 'Arama', icon: Phone },
                                        { id: 'message', label: 'Mesaj', icon: MessageCircle },
                                        { id: 'meeting', label: 'Toplantı', icon: Users },
                                        { id: 'email', label: 'E-posta', icon: Mail },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setType(t.id as FollowUpType)}
                                            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${type === t.id
                                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <t.icon className="h-5 w-5 mb-1" />
                                            <span className="text-xs font-medium">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                                <textarea
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] text-sm"
                                    placeholder="Takip ile ilgili notlar..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            {/* Reminders */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hatırlatmalar</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={reminders.min15}
                                            onChange={(e) => setReminders({ ...reminders, min15: e.target.checked })}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-600">15 dakika önce</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={reminders.hour1}
                                            onChange={(e) => setReminders({ ...reminders, hour1: e.target.checked })}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-600">1 saat önce</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={reminders.day1}
                                            onChange={(e) => setReminders({ ...reminders, day1: e.target.checked })}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-600">1 gün önce</span>
                                    </label>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-2.5 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Planlanıyor...' : (
                                        <>
                                            <CheckSquare className="h-4 w-4" />
                                            Planla
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
