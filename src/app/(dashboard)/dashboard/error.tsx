'use client';

import { useEffect } from 'react';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Dashboard Error:', error);
    }, [error]);

    return (
        <div className="p-8 h-full flex flex-col items-center justify-center text-center">
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 max-w-lg">
                <h2 className="text-xl font-bold text-red-900 mb-2">Kontrol Paneli Yüklenemedi</h2>
                <p className="text-red-700 mb-4 text-sm font-mono text-left bg-white p-3 rounded border border-red-100 overflow-auto max-h-48">
                    {error.message || 'Bilinmeyen bir hata oluştu.'}
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                    >
                        Tekrar Dene
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                        Sayfayı Yenile
                    </button>
                </div>
            </div>
        </div>
    );
}
