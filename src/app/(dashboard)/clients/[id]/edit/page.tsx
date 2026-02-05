'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Save, ArrowLeft, User, Target, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ClientFormData {
    full_name: string;
    email: string;
    phone: string;
    status: string;
    budget_min: number | null;
    budget_max: number | null;
    currency: string;
    wanted_types: string[];
    wanted_purpose: string;
    wanted_city: string;
    wanted_districts: string[];
}

export default function EditClientPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState<ClientFormData>({
        full_name: '',
        email: '',
        phone: '',
        status: 'new',
        budget_min: null,
        budget_max: null,
        currency: 'TRY',
        wanted_types: [],
        wanted_purpose: 'sale',
        wanted_city: '',
        wanted_districts: []
    });

    useEffect(() => {
        loadClient();
    }, [params.id]);

    const loadClient = async () => {
        const { data: client } = await supabase
            .from('clients')
            .select('*')
            .eq('id', params.id)
            .single();

        if (client) {
            setFormData({
                full_name: client.full_name || '',
                email: client.email || '',
                phone: client.phone || '',
                status: client.status || 'new',
                budget_min: client.budget_min || null,
                budget_max: client.budget_max || null,
                currency: client.currency || 'TRY',
                wanted_types: client.wanted_types || [],
                wanted_purpose: client.wanted_purpose || 'sale',
                wanted_city: client.wanted_city || '',
                wanted_districts: client.wanted_districts || []
            });
        }
        setFetching(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value ? Number(value) : null) : value
        }));
    };

    const handleTypeToggle = (type: string) => {
        setFormData(prev => ({
            ...prev,
            wanted_types: prev.wanted_types.includes(type)
                ? prev.wanted_types.filter(t => t !== type)
                : [...prev.wanted_types, type]
        }));
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.full_name.trim()) {
            alert('Ad soyad zorunludur');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('clients')
                .update(formData)
                .eq('id', params.id);

            if (error) throw error;

            router.push(`/clients/${params.id}`);
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const propertyTypes = [
        { value: 'apartment', label: 'Daire' },
        { value: 'villa', label: 'Villa' },
        { value: 'land', label: 'Arsa' },
        { value: 'commercial', label: 'Ticari' },
        { value: 'office', label: 'Ofis' },
        { value: 'shop', label: 'Dükkan' }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Link
                    href={`/clients/${params.id}`}
                    className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Vazgeç
                </Link>
                <button
                    onClick={onSubmit}
                    disabled={loading}
                    className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    <Save className="h-5 w-5 mr-2" />
                    {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
            </div>

            <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center mb-6">
                            <User className="h-5 w-5 mr-2 text-blue-600" />
                            Kişisel Bilgiler
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                                <input
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none"
                                >
                                    <option value="new">Yeni</option>
                                    <option value="following">Takipte</option>
                                    <option value="hot">Sıcak</option>
                                    <option value="cold">Soğuk</option>
                                    <option value="closed">Kapandı</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none"
                                    placeholder="05xx..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none"
                                />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center mb-6">
                            <Target className="h-5 w-5 mr-2 text-blue-600" />
                            İstekler ve Bütçe
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Bütçe</label>
                                    <input
                                        name="budget_max"
                                        type="number"
                                        value={formData.budget_max || ''}
                                        onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi</label>
                                    <select
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none"
                                    >
                                        <option value="TRY">TRY (₺)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Emlak Amacı</label>
                                <select
                                    name="wanted_purpose"
                                    value={formData.wanted_purpose}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none"
                                >
                                    <option value="sale">Satılık</option>
                                    <option value="rent">Kiralık</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Aranan Şehir</label>
                                <input
                                    name="wanted_city"
                                    value={formData.wanted_city}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none"
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Tercih Edilen Tipler</label>
                            <div className="flex flex-wrap gap-2">
                                {propertyTypes.map(type => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => handleTypeToggle(type.value)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.wanted_types.includes(type.value)
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </form>
        </div>
    );
}
