'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Phone, Calendar, Check, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Client {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    status: string;
    budget_max?: number;
    currency: string;
    last_contact_at?: string;
}

export default function ClientsTable({ initialClients }: { initialClients: Client[] }) {
    const supabase = createClient();
    const [clients, setClients] = useState<Client[]>(initialClients);

    // Inline edit states
    const [editingStatus, setEditingStatus] = useState<string | null>(null);
    const [editingBudget, setEditingBudget] = useState<string | null>(null);
    const [budgetValue, setBudgetValue] = useState('');
    const [saving, setSaving] = useState(false);

    const updateStatus = async (clientId: string, newStatus: string) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('clients')
                .update({ status: newStatus })
                .eq('id', clientId);

            if (!error) {
                setClients(clients.map(c =>
                    c.id === clientId ? { ...c, status: newStatus } : c
                ));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
            setEditingStatus(null);
        }
    };

    const updateBudget = async (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        if (!client) return;

        setSaving(true);
        try {
            const newBudget = budgetValue ? Number(budgetValue.replace(/\D/g, '')) : null;

            const { error } = await supabase
                .from('clients')
                .update({ budget_max: newBudget })
                .eq('id', clientId);

            if (!error) {
                setClients(clients.map(c =>
                    c.id === clientId ? { ...c, budget_max: newBudget || undefined } : c
                ));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
            setEditingBudget(null);
        }
    };

    const startEditBudget = (client: Client) => {
        setEditingBudget(client.id);
        setBudgetValue(client.budget_max?.toString() || '');
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bütçe</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Son İletişim</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksiyon</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {clients.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-gray-500 italic">
                                Henüz müşteri kaydı bulunmuyor.
                            </td>
                        </tr>
                    ) : (
                        clients.map((client) => (
                            <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {client.full_name.charAt(0)}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{client.full_name}</div>
                                            <div className="text-xs text-gray-500 flex items-center space-x-2">
                                                {client.phone && <span className="flex items-center"><Phone className="h-3 w-3 mr-1" /> {client.phone}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* DURUM - Inline Dropdown */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingStatus === client.id ? (
                                        <select
                                            autoFocus
                                            value={client.status}
                                            onChange={(e) => updateStatus(client.id, e.target.value)}
                                            onBlur={() => setEditingStatus(null)}
                                            disabled={saving}
                                            className="text-xs font-semibold rounded-full px-3 py-1 border-2 border-blue-500 outline-none bg-white"
                                        >
                                            <option value="new">Yeni</option>
                                            <option value="following">Takipte</option>
                                            <option value="hot">Sıcak</option>
                                            <option value="cold">Soğuk</option>
                                            <option value="closed">Kapandı</option>
                                        </select>
                                    ) : (
                                        <button
                                            onClick={() => setEditingStatus(client.id)}
                                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-blue-400 transition-all ${getStatusColor(client.status)}`}
                                        >
                                            {getStatusLabel(client.status)}
                                        </button>
                                    )}
                                </td>

                                {/* BÜTÇE - Inline Edit */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {editingBudget === client.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                autoFocus
                                                value={budgetValue}
                                                onChange={(e) => setBudgetValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') updateBudget(client.id);
                                                    if (e.key === 'Escape') setEditingBudget(null);
                                                }}
                                                className="w-32 border-2 border-blue-500 rounded px-2 py-1 text-sm outline-none"
                                                placeholder="Bütçe"
                                            />
                                            <button
                                                onClick={() => updateBudget(client.id)}
                                                disabled={saving}
                                                className="text-green-600 hover:text-green-700"
                                            >
                                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                            </button>
                                            <button
                                                onClick={() => setEditingBudget(null)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => startEditBudget(client)}
                                            className="hover:bg-gray-100 px-2 py-1 rounded cursor-pointer transition-colors"
                                        >
                                            {client.budget_max
                                                ? `${client.budget_max.toLocaleString('tr-TR')} ${client.currency}`
                                                : <span className="text-gray-400 italic">Tıkla</span>
                                            }
                                        </button>
                                    )}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        {client.last_contact_at ? new Date(client.last_contact_at).toLocaleDateString('tr-TR') : '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link href={`/clients/${client.id}`} className="text-blue-600 hover:text-blue-900">
                                        Detay
                                    </Link>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'hot': return 'bg-red-100 text-red-800';
        case 'following': return 'bg-amber-100 text-amber-800';
        case 'new': return 'bg-blue-100 text-blue-800';
        case 'cold': return 'bg-gray-100 text-gray-800';
        case 'closed': return 'bg-emerald-100 text-emerald-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case 'hot': return 'Sıcak';
        case 'following': return 'Takipte';
        case 'new': return 'Yeni';
        case 'cold': return 'Soğuk';
        case 'closed': return 'Kapandı';
        default: return status;
    }
}
