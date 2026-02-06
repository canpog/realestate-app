'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center h-[80vh] p-4 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Bir hata oluştu!</h2>
            <p className="text-gray-500 mb-6 max-w-md">
                {error.message || 'Sayfa yüklenirken bir sorunla karşılaştık.'}
            </p>
            <button
                onClick={() => reset()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                Tekrar Dene
            </button>
        </div>
    );
}
