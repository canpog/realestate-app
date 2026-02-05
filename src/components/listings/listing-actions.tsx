'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Share2, Loader2, Check, Copy, X } from 'lucide-react';

export default function ListingActions({ id }: { id: string }) {
    const [generating, setGenerating] = useState(false);
    const [shareData, setShareData] = useState<{
        shareUrl: string;
        pdfUrl: string;
    } | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [copied, setCopied] = useState(false);

    const generatePDF = async () => {
        setGenerating(true);
        try {
            const response = await fetch(`/api/listings/${id}/pdf`, {
                method: 'POST'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'PDF oluşturulamadı');
            }

            const data = await response.json();
            setShareData({
                shareUrl: window.location.origin + data.shareUrl,
                pdfUrl: data.pdfUrl
            });
            setShowModal(true);
        } catch (error: any) {
            alert('Hata: ' + error.message);
        } finally {
            setGenerating(false);
        }
    };

    const copyLink = () => {
        if (shareData) {
            navigator.clipboard.writeText(shareData.shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between no-print mb-4">
                <Link
                    href="/listings"
                    className="flex items-center text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Listeye Dön
                </Link>
                <div className="flex space-x-3">
                    <button
                        onClick={generatePDF}
                        disabled={generating}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Oluşturuluyor...
                            </>
                        ) : (
                            <>
                                <Share2 className="h-4 w-4 mr-2" />
                                PDF & Paylaş
                            </>
                        )}
                    </button>
                    <Link
                        href={`/listings/${id}/edit`}
                        className="px-6 py-2 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
                    >
                        Düzenle
                    </Link>
                </div>
            </div>

            {/* Share Modal */}
            {showModal && shareData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Paylaşım Linki Hazır!</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                            <div className="flex items-center text-green-700 mb-2">
                                <Check className="h-5 w-5 mr-2" />
                                <span className="font-bold">PDF oluşturuldu!</span>
                            </div>
                            <p className="text-sm text-green-600">
                                Link 30 gün boyunca geçerli olacak.
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Paylaşım Linki</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={shareData.shareUrl}
                                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50"
                                />
                                <button
                                    onClick={copyLink}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${copied
                                            ? 'bg-green-600 text-white'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <a
                                href={shareData.pdfUrl}
                                target="_blank"
                                className="flex-1 flex items-center justify-center bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                PDF İndir
                            </a>
                            <a
                                href={shareData.shareUrl}
                                target="_blank"
                                className="flex-1 flex items-center justify-center bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
                            >
                                <Share2 className="h-4 w-4 mr-2" />
                                Sayfayı Aç
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
