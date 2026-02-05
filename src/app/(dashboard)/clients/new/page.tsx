'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, ArrowLeft, User, Phone, Mail, Target, Wallet } from 'lucide-react';
import Link from 'next/link';

const clientSchema = z.object({
    full_name: z.string().min(3, 'Ad soyad en az 3 karakter olmalıdır'),
    email: z.string().email('Geçerli bir e-posta giriniz').or(z.literal('')),
    phone: z.string().min(10, 'Geçerli bir telefon giriniz').or(z.literal('')),
    status: z.enum(['new', 'following', 'hot', 'cold', 'closed']).default('new'),
    budget_min: z.coerce.number().optional(),
    budget_max: z.coerce.number().optional(),
    currency: z.string().default('TRY'),
    wanted_types: z.array(z.string()).optional(),
    wanted_purpose: z.enum(['sale', 'rent']).default('sale'),
    wanted_city: z.string().optional(),
    wanted_districts: z.array(z.string()).optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function NewClientPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            status: 'new',
            currency: 'TRY',
            wanted_purpose: 'sale',
            wanted_types: [],
        }
    });

    const onSubmit = async (values: ClientFormValues) => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: agent } = await supabase
                .from('agents')
                .select('id')
                .eq('auth_user_id', user?.id)
                .single();

            if (!agent) throw new Error('Agent not found');

            const { data, error } = await supabase
                .from('clients')
                .insert({
                    ...values,
                    agent_id: agent.id
                })
                .select()
                .single();

            if (error) throw error;

            router.push(`/clients/${data.id}`);
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Link
                    href="/clients"
                    className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Vazgeç
                </Link>
                <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={loading}
                    className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    <Save className="h-5 w-5 mr-2" />
                    {loading ? 'Kaydediliyor...' : 'Müşteriyi Kaydet'}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                                    {...register('full_name')}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                                <select
                                    {...register('status')}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none"
                                >
                                    <option value="new">Yeni</option>
                                    <option value="following">Takipte</option>
                                    <option value="hot">Sıcak</option>
                                    <option value="cold">Soğuk</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                                <input
                                    {...register('phone')}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none"
                                    placeholder="05xx..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                                <input
                                    {...register('email')}
                                    type="email"
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
                                        {...register('budget_max')}
                                        type="number"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi</label>
                                    <select
                                        {...register('currency')}
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
                                    {...register('wanted_purpose')}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none"
                                >
                                    <option value="sale">Satılık</option>
                                    <option value="rent">Kiralık</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Aranan Şehir</label>
                                <input
                                    {...register('wanted_city')}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none"
                                />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
