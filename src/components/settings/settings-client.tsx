'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Settings, Bell, Shield, Download, Trash2, LogOut, Moon, Sun, ChevronRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsClient({ userEmail }: { userEmail: string }) {
    const router = useRouter();
    const supabase = createClient();
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
                <p className="text-gray-500 mt-1">Hesap ve uygulama tercihlerinizi yönetin.</p>
            </div>

            {/* Account Section */}
            <SettingsSection title="Hesap" icon={<Shield className="h-5 w-5" />}>
                <SettingsItem
                    title="E-posta Adresi"
                    description={userEmail}
                    disabled
                />
                <SettingsItem
                    title="Şifre Değiştir"
                    description="Hesap güvenliğiniz için şifrenizi güncelleyin"
                    onClick={() => alert('Şifre değiştirme özelliği yakında eklenecek.')}
                />
            </SettingsSection>

            {/* Notifications Section */}
            <SettingsSection title="Bildirimler" icon={<Bell className="h-5 w-5" />}>
                <SettingsToggle
                    title="E-posta Bildirimleri"
                    description="Yeni eşleştirmeler ve güncellemeler için e-posta alın"
                    defaultEnabled={true}
                />
                <SettingsToggle
                    title="Hatırlatıcılar"
                    description="Müşteri takip hatırlatmaları"
                    defaultEnabled={true}
                />
            </SettingsSection>

            {/* Appearance Section */}
            <SettingsSection title="Görünüm" icon={<Sun className="h-5 w-5" />}>
                <SettingsItem
                    title="Tema"
                    description="Açık tema (Karanlık tema yakında)"
                    disabled
                    rightElement={
                        <div className="flex items-center space-x-2 text-gray-400">
                            <Sun className="h-4 w-4" />
                            <span className="text-sm">Açık</span>
                        </div>
                    }
                />
            </SettingsSection>

            {/* Data Section */}
            <SettingsSection title="Veri Yönetimi" icon={<Download className="h-5 w-5" />}>
                <SettingsItem
                    title="Verilerimi İndir"
                    description="Tüm portföy ve müşteri verilerinizi JSON formatında indirin"
                    onClick={() => alert('Veri indirme özelliği yakında eklenecek.')}
                />
            </SettingsSection>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center">
                    <Trash2 className="h-5 w-5 mr-2" />
                    Tehlikeli Bölge
                </h3>
                <p className="text-sm text-red-700 mb-4">
                    Bu işlemler geri alınamaz. Dikkatli olun.
                </p>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex items-center px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                        {loggingOut ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <LogOut className="h-4 w-4 mr-2" />
                        )}
                        Çıkış Yap
                    </button>
                    <button
                        onClick={() => alert('Hesap silme özelliği yakında eklenecek. Lütfen destek ile iletişime geçin.')}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hesabımı Sil
                    </button>
                </div>
            </div>

            {/* App Info */}
            <div className="text-center text-sm text-gray-400 py-4">
                <p>TR Danışman CRM v1.0.0</p>
                <p>© 2026 Tüm hakları saklıdır.</p>
            </div>
        </div>
    );
}

function SettingsSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center">
                <div className="text-blue-600 mr-3">{icon}</div>
                <h2 className="font-bold text-gray-900">{title}</h2>
            </div>
            <div className="divide-y divide-gray-50">
                {children}
            </div>
        </div>
    );
}

function SettingsItem({
    title,
    description,
    onClick,
    disabled,
    rightElement
}: {
    title: string;
    description: string;
    onClick?: () => void;
    disabled?: boolean;
    rightElement?: React.ReactNode;
}) {
    return (
        <div
            onClick={disabled ? undefined : onClick}
            className={`px-6 py-4 flex items-center justify-between ${!disabled && onClick ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
        >
            <div>
                <p className="font-medium text-gray-900">{title}</p>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
            {rightElement || (onClick && !disabled && (
                <ChevronRight className="h-5 w-5 text-gray-400" />
            ))}
        </div>
    );
}

function SettingsToggle({
    title,
    description,
    defaultEnabled
}: {
    title: string;
    description: string;
    defaultEnabled: boolean;
}) {
    const [enabled, setEnabled] = useState(defaultEnabled);

    return (
        <div className="px-6 py-4 flex items-center justify-between">
            <div>
                <p className="font-medium text-gray-900">{title}</p>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
            <button
                onClick={() => setEnabled(!enabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
                <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`}
                />
            </button>
        </div>
    );
}
