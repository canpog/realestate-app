'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Phone, Mail, Building2, Save, Loader2, Home, Users, FileText, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Agent {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    company?: string;
    avatar_url?: string;
    created_at: string;
}

interface Stats {
    listings: number;
    clients: number;
    pdfs: number;
}

export default function ProfileClient({ agent: initialAgent, stats }: { agent: Agent; stats: Stats }) {
    const router = useRouter();
    const supabase = createClient();
    const [agent, setAgent] = useState<Agent>(initialAgent);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        full_name: agent.full_name,
        phone: agent.phone || '',
        company: agent.company || ''
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('agents')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    company: formData.company
                })
                .eq('id', agent.id);

            if (error) throw error;

            setAgent({ ...agent, ...formData });
            setEditing(false);
            router.refresh();
        } catch (err: any) {
            alert('Hata: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Profilim</h1>
                {!editing && (
                    <button
                        onClick={() => setEditing(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
                    >
                        Düzenle
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    icon={<Home className="h-6 w-6" />}
                    label="Toplam Portföy"
                    value={stats.listings}
                    color="blue"
                />
                <StatCard
                    icon={<Users className="h-6 w-6" />}
                    label="Toplam Müşteri"
                    value={stats.clients}
                    color="green"
                />
                <StatCard
                    icon={<FileText className="h-6 w-6" />}
                    label="Oluşturulan PDF"
                    value={stats.pdfs}
                    color="purple"
                />
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-32 relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="h-24 w-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-blue-600 font-black text-3xl">
                            {agent.full_name.charAt(0)}
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-8 px-8">
                    {editing ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Ad Soyad</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Telefon</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="0532 xxx xx xx"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Şirket / Ofis</label>
                                <input
                                    type="text"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    placeholder="Emlak Ofisi Adı"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Kaydediliyor...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Kaydet
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditing(false);
                                        setFormData({
                                            full_name: agent.full_name,
                                            phone: agent.phone || '',
                                            company: agent.company || ''
                                        });
                                    }}
                                    className="px-6 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all"
                                >
                                    İptal
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{agent.full_name}</h2>
                                <p className="text-gray-500">{agent.company || 'Emlak Danışmanı'}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoItem
                                    icon={<Mail className="h-5 w-5" />}
                                    label="E-posta"
                                    value={agent.email || 'Belirtilmemiş'}
                                />
                                <InfoItem
                                    icon={<Phone className="h-5 w-5" />}
                                    label="Telefon"
                                    value={agent.phone || 'Belirtilmemiş'}
                                />
                                <InfoItem
                                    icon={<Building2 className="h-5 w-5" />}
                                    label="Şirket"
                                    value={agent.company || 'Belirtilmemiş'}
                                />
                                <InfoItem
                                    icon={<User className="h-5 w-5" />}
                                    label="Üyelik Tarihi"
                                    value={new Date(agent.created_at).toLocaleDateString('tr-TR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: 'blue' | 'green' | 'purple' }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600'
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className={`${colors[color]} p-3 rounded-xl w-fit mb-4`}>
                {icon}
            </div>
            <p className="text-3xl font-black text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 font-medium">{label}</p>
        </div>
    );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
            <div className="text-blue-600 mt-0.5">{icon}</div>
            <div>
                <p className="text-xs text-gray-400 font-bold uppercase">{label}</p>
                <p className="text-gray-900 font-medium">{value}</p>
            </div>
        </div>
    );
}
