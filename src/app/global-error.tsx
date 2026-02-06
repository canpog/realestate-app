'use client';

import { useEffect } from 'react';

export default function GlobalError({
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
        <html>
            <body>
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Bir şeyler ters gitti!</h2>
                        <p className="text-gray-500 mb-6 bg-red-50 p-3 rounded-lg text-sm text-left font-mono">
                            {error.message || 'Beklenmedik bir hata oluştu.'}
                        </p>
                        <button
                            onClick={() => reset()}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium w-full"
                        >
                            Tekrar Dene
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
