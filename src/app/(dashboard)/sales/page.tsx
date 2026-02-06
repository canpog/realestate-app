'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    TrendingUp, Plus, DollarSign, Home,
    CheckCircle2, Loader2, X, Calendar, Percent
} from 'lucide-react';

interface Transaction {
    id: string;
    transaction_type: 'sale' | 'rental';
    transaction_date: string;
    selling_price: number;
    commission_rate: number;
    commission_amount: number;
    status: string;
    notes?: string;
    listing?: {
        id: string;
        title: string;
        type: string;
        price: number;
    };
    client?: {
        id: string;
        full_name: string;
        phone: string;
    };
}

interface Summary {
    totalSales: number;
    totalRentals: number;
    totalSalesAmount: number;
    totalRentalsAmount: number;
    totalCommission: number;
    totalTax: number;
    netIncome: number;
}

interface Listing {
    id: string;
    title: string;
    price: number;
    type: string;
}

interface Client {
    id: string;
    full_name: string;
    phone: string;
}

export default function SalesPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [listings, setListings] = useState<Listing[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [loadingData, setLoadingData] = useState(false);

    const [formData, setFormData] = useState({
        listing_id: '',
        client_id: '',
        transaction_type: 'sale' as 'sale' | 'rental',
        transaction_date: new Date().toISOString().slice(0, 10),
        selling_price: 0,
        commission_percent: 5,
        notes: '',
    });

    const supabase = createClient();

    useEffect(() => {
        fetchTransactions();
    }, [filter]);

    async function fetchTransactions() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter !== 'all') params.set('status', filter);
            const response = await fetch(`/api/sales?${params.toString()}`);
            const data = await response.json();
            setTransactions(data.transactions || []);
            setSummary(data.summary || null);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchListingsAndClients() {
        setLoadingData(true);
        try {
            const { data: listingsData } = await supabase
                .from('listings')
                .select('id, title, price, type')
                .in('status', ['available', 'reserved'])
                .order('created_at', { ascending: false })
                .limit(100);

            const { data: clientsData } = await supabase
                .from('clients')
                .select('id, full_name, phone')
                .order('created_at', { ascending: false })
                .limit(100);

            setListings(listingsData || []);
            setClients(clientsData || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoadingData(false);
        }
    }

    async function openModal() {
        setShowModal(true);
        await fetchListingsAndClients();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!formData.listing_id || !formData.selling_price) {
            alert('Portföy ve fiyat zorunlu');
            return;
        }

        setSubmitting(true);
        try {
            // Kira: 1 aylık kira = %100, Satış: yüzdelik oran
            const commission_rate = formData.transaction_type === 'rental'
                ? 1 // %100 = 1 aylık kira
                : formData.commission_percent / 100;

            const response = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, commission_rate }),
            });

            const data = await response.json();

            if (data.success) {
                setShowModal(false);
                setFormData({
                    listing_id: '',
                    client_id: '',
                    transaction_type: 'sale',
                    transaction_date: new Date().toISOString().slice(0, 10),
                    selling_price: 0,
                    commission_percent: 5,
                    notes: '',
                });
                fetchTransactions();
            } else {
                alert(data.error || 'Bir hata oluştu');
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('Bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    }

    async function updateStatus(id: string, status: string) {
        try {
            await fetch('/api/sales', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, paid_date: status === 'paid' ? new Date().toISOString().slice(0, 10) : undefined }),
            });
            fetchTransactions();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    }

    const formatCurrency = (amount: number) => amount.toLocaleString('tr-TR') + ' ₺';
    const formatDate = (date: string) => new Date(date).toLocaleDateString('tr-TR');

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-700',
        completed: 'bg-blue-100 text-blue-700',
        paid: 'bg-green-100 text-green-700',
        cancelled: 'bg-red-100 text-red-700',
    };

    const statusLabels: Record<string, string> = {
        pending: 'Beklemede',
        completed: 'Tamamlandı',
        paid: 'Ödendi',
        cancelled: 'İptal',
    };

    // Kira = 1 aylık kira, Satış = yüzdelik
    const commissionAmount = formData.transaction_type === 'rental'
        ? formData.selling_price
        : formData.selling_price * (formData.commission_percent / 100);
    const kdvAmount = commissionAmount * 0.20;
    const netAmount = commissionAmount - kdvAmount;

    return (
        <div className="p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-600 rounded-2xl shadow-lg shadow-green-200">
                        <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Satış &amp; Komisyon</h1>
                        <p className="text-gray-500">Satış/kira takibi ve komisyon hesaplama</p>
                    </div>
                </div>
                <button onClick={openModal} className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Yeni Satış
                </button>
            </div>

            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg"><Home className="w-5 h-5 text-blue-600" /></div>
                            <span className="text-sm text-gray-500">Toplam Satış</span>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{summary.totalSales}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(summary.totalSalesAmount)}</p>
                    </div>
                    <div className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100 rounded-lg"><Home className="w-5 h-5 text-purple-600" /></div>
                            <span className="text-sm text-gray-500">Toplam Kira</span>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{summary.totalRentals}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(summary.totalRentalsAmount)}</p>
                    </div>
                    <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-200 rounded-lg"><DollarSign className="w-5 h-5 text-green-700" /></div>
                            <span className="text-sm text-green-700">Toplam Komisyon</span>
                        </div>
                        <p className="text-2xl font-black text-green-700">{formatCurrency(summary.totalCommission)}</p>
                        <p className="text-xs text-green-600">KDV: {formatCurrency(summary.totalTax)}</p>
                    </div>
                    <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-200 rounded-lg"><TrendingUp className="w-5 h-5 text-blue-700" /></div>
                            <span className="text-sm text-blue-700">Net Gelir</span>
                        </div>
                        <p className="text-2xl font-black text-blue-700">{formatCurrency(summary.netIncome)}</p>
                        <p className="text-xs text-blue-600">KDV düşüldükten sonra</p>
                    </div>
                </div>
            )}

            <div className="flex gap-2 mb-6">
                {['all', 'pending', 'completed', 'paid'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl font-medium transition-all ${filter === f ? (f === 'all' ? 'bg-gray-900 text-white' : f === 'pending' ? 'bg-yellow-500 text-white' : f === 'completed' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white') : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                        {f === 'all' ? 'Tümü' : f === 'pending' ? 'Beklemede' : f === 'completed' ? 'Tamamlandı' : 'Ödendi'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl">
                    <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Henüz satış kaydı yok</h3>
                    <p className="text-gray-500 mb-4">İlk satışınızı kaydedin</p>
                    <button onClick={openModal} className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700">
                        <Plus className="w-4 h-4 inline mr-2" />Yeni Satış Ekle
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {transactions.map((t) => (
                        <div key={t.id} className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-lg ${t.transaction_type === 'sale' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {t.transaction_type === 'sale' ? 'Satış' : 'Kira'}
                                        </span>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-lg ${statusColors[t.status]}`}>{statusLabels[t.status]}</span>
                                        <span className="text-sm text-gray-500">{formatDate(t.transaction_date)}</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1">{t.listing?.title || 'Portföy'}</h3>
                                    {t.client && <p className="text-sm text-gray-500">Müşteri: {t.client.full_name} • {t.client.phone}</p>}
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-gray-900">{formatCurrency(t.selling_price)}</p>
                                    <p className="text-sm text-green-600 font-medium">Komisyon: {formatCurrency(t.commission_amount)} (%{(t.commission_rate * 100).toFixed(0)})</p>
                                </div>
                            </div>
                            {t.status !== 'paid' && t.status !== 'cancelled' && (
                                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                                    {t.status === 'pending' && <button onClick={() => updateStatus(t.id, 'completed')} className="px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">Tamamla</button>}
                                    {t.status === 'completed' && <button onClick={() => updateStatus(t.id, 'paid')} className="px-3 py-1.5 text-sm font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200">Ödeme Yapıldı</button>}
                                    <button onClick={() => updateStatus(t.id, 'cancelled')} className="px-3 py-1.5 text-sm font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200">İptal</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-xl"><DollarSign className="w-6 h-6 text-green-600" /></div>
                                <h2 className="text-xl font-bold text-gray-900">Yeni Satış Kaydı</h2>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">İşlem Türü</label>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setFormData({ ...formData, transaction_type: 'sale' })} className={`flex-1 py-3 rounded-xl font-medium transition-all ${formData.transaction_type === 'sale' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Satış</button>
                                    <button type="button" onClick={() => setFormData({ ...formData, transaction_type: 'rental' })} className={`flex-1 py-3 rounded-xl font-medium transition-all ${formData.transaction_type === 'rental' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Kira</button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Portföy *</label>
                                {loadingData ? (
                                    <div className="flex items-center gap-2 p-3 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" />Yükleniyor...</div>
                                ) : (
                                    <select value={formData.listing_id} onChange={(e) => { const listing = listings.find(l => l.id === e.target.value); setFormData({ ...formData, listing_id: e.target.value, selling_price: listing?.price || 0 }); }} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent" required>
                                        <option value="">Portföy seçin... ({listings.length} portföy)</option>
                                        {listings.map(l => <option key={l.id} value={l.id}>{l.title} - {l.price?.toLocaleString('tr-TR')} ₺</option>)}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Müşteri (opsiyonel)</label>
                                {loadingData ? (
                                    <div className="flex items-center gap-2 p-3 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" />Yükleniyor...</div>
                                ) : (
                                    <select value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                        <option value="">Müşteri seçin... ({clients.length} müşteri)</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.full_name} - {c.phone}</option>)}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">İşlem Tarihi</label>
                                <div className="relative">
                                    <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="date" value={formData.transaction_date} onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })} className="w-full p-3 pl-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{formData.transaction_type === 'sale' ? 'Satış Fiyatı' : 'Aylık Kira'} *</label>
                                <div className="relative">
                                    <DollarSign className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="number" value={formData.selling_price || ''} onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })} placeholder="0" className="w-full p-3 pl-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent" required />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">₺</span>
                                </div>
                            </div>

                            {formData.transaction_type === 'sale' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Komisyon Oranı (%)</label>
                                    <div className="relative">
                                        <Percent className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="number" step="0.1" min="0" max="100" value={formData.commission_percent} onChange={(e) => setFormData({ ...formData, commission_percent: Number(e.target.value) })} className="w-full p-3 pl-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                    </div>
                                </div>
                            )}

                            {formData.selling_price > 0 && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                    <div className="flex justify-between text-sm text-green-700 mb-1">
                                        <span className="font-medium">{formData.transaction_type === 'rental' ? 'Komisyon (1 aylık kira):' : `Komisyon (%${formData.commission_percent}):`}</span>
                                        <span className="font-bold">{formatCurrency(commissionAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-green-600 mb-1">
                                        <span>KDV (%20):</span>
                                        <span>-{formatCurrency(kdvAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-green-800 font-bold pt-2 border-t border-green-200">
                                        <span>Net Gelir:</span>
                                        <span>{formatCurrency(netAmount)}</span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notlar</label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Ek notlar..." rows={3} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none" />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50">İptal</button>
                                <button type="submit" disabled={submitting || !formData.listing_id || !formData.selling_price} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
