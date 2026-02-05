'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, FileText, Image, Star, Check, Download, Loader2,
    Phone, Mail, Building2, Share2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ListingMedia {
    id: string;
    storage_path: string;
    is_cover: boolean;
}

interface PDFModalProps {
    isOpen: boolean;
    onClose: () => void;
    listingId: string;
    listingTitle: string;
    media: ListingMedia[];
}

export default function PDFModal({ isOpen, onClose, listingId, listingTitle, media }: PDFModalProps) {
    const [selectedImages, setSelectedImages] = useState<string[]>(
        media.filter(m => m.is_cover).map(m => m.id) || (media[0] ? [media[0].id] : [])
    );
    const [coverImageId, setCoverImageId] = useState<string | null>(
        media.find(m => m.is_cover)?.id || media[0]?.id || null
    );
    const [template, setTemplate] = useState<'standard' | 'premium' | 'minimal'>('standard');
    const [showPhone, setShowPhone] = useState(true);
    const [showEmail, setShowEmail] = useState(true);
    const [showLogo, setShowLogo] = useState(true);
    const [loading, setLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [shareUrl, setShareUrl] = useState<string | null>(null);

    const MAX_IMAGES = 12;

    const toggleImage = (id: string) => {
        setSelectedImages(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            }
            if (prev.length >= MAX_IMAGES) return prev;
            return [...prev, id];
        });
    };

    const setCover = (id: string) => {
        setCoverImageId(id);
        if (!selectedImages.includes(id)) {
            setSelectedImages(prev => [...prev, id]);
        }
    };

    const getImageUrl = (storagePath: string) => {
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-media/${storagePath}`;
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/listings/${listingId}/pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedImages,
                    coverImageId,
                    template,
                    showPhone,
                    showEmail,
                    showLogo
                })
            });

            const data = await response.json();

            if (data.pdfUrl) {
                setPdfUrl(data.pdfUrl);
                setShareUrl(data.shareUrl);
            }
        } catch (error) {
            console.error('PDF generation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (pdfUrl) {
            window.open(pdfUrl, '_blank');
        }
    };

    const handleShare = () => {
        if (shareUrl) {
            const fullUrl = `${window.location.origin}${shareUrl}`;
            navigator.clipboard.writeText(fullUrl);
            alert('Link kopyalandı!');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-xl">
                                <FileText className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">PDF Oluştur</h2>
                                <p className="text-sm text-gray-500">{listingTitle}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                        {!pdfUrl ? (
                            <>
                                {/* Image Selection */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="font-bold text-gray-700 flex items-center gap-2">
                                            <Image className="h-4 w-4" />
                                            Görselleri Seçin
                                        </label>
                                        <Badge variant="secondary">
                                            Seçili: {selectedImages.length}/{MAX_IMAGES}
                                        </Badge>
                                    </div>

                                    {media.length === 0 ? (
                                        <div className="text-center py-8 bg-gray-50 rounded-xl text-gray-400">
                                            <Image className="h-12 w-12 mx-auto mb-2" />
                                            <p>Bu portföyde görsel yok</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                            {media.map((m) => (
                                                <div
                                                    key={m.id}
                                                    onClick={() => toggleImage(m.id)}
                                                    onDoubleClick={() => setCover(m.id)}
                                                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedImages.includes(m.id)
                                                        ? 'border-blue-500 ring-2 ring-blue-500/20'
                                                        : 'border-transparent hover:border-gray-200'
                                                        }`}
                                                >
                                                    <img
                                                        src={getImageUrl(m.storage_path)}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />

                                                    {/* Selection indicator */}
                                                    {selectedImages.includes(m.id) && (
                                                        <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5">
                                                            <Check className="h-3 w-3 text-white" />
                                                        </div>
                                                    )}

                                                    {/* Cover indicator */}
                                                    {coverImageId === m.id && (
                                                        <div className="absolute top-1 left-1 bg-yellow-500 rounded-full p-0.5">
                                                            <Star className="h-3 w-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-400 mt-2">
                                        ⭐ Kapak olarak ayarlamak için görsele çift tıklayın
                                    </p>
                                </div>

                                {/* Template Selection */}
                                <div className="mb-6">
                                    <label className="font-bold text-gray-700 mb-3 block">Şablon</label>
                                    <div className="flex gap-3">
                                        {[
                                            { id: 'standard', label: 'Standart', desc: 'Klasik tasarım' },
                                            { id: 'premium', label: 'Premium', desc: 'Lüks görünüm' },
                                            { id: 'minimal', label: 'Minimal', desc: 'Sade ve temiz' },
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setTemplate(t.id as any)}
                                                className={`flex-1 p-3 rounded-xl border-2 transition-all ${template === t.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <p className="font-bold text-gray-900">{t.label}</p>
                                                <p className="text-xs text-gray-500">{t.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Agent Info Options */}
                                <div className="mb-6">
                                    <label className="font-bold text-gray-700 mb-3 block">Danışman Bilgileri</label>
                                    <div className="flex flex-wrap gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={showPhone}
                                                onChange={(e) => setShowPhone(e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <Phone className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm text-gray-700">Telefon göster</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={showEmail}
                                                onChange={(e) => setShowEmail(e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <Mail className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm text-gray-700">E-posta göster</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={showLogo}
                                                onChange={(e) => setShowLogo(e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <Building2 className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm text-gray-700">Şirket logosu</span>
                                        </label>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Success State */
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check className="h-8 w-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">PDF Oluşturuldu!</h3>
                                <p className="text-gray-500 mb-6">PDF'iniz hazır, indirip paylaşabilirsiniz.</p>

                                <div className="flex justify-center gap-3">
                                    <button
                                        onClick={handleDownload}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                                    >
                                        <Download className="h-4 w-4" />
                                        İndir
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
                                    >
                                        <Share2 className="h-4 w-4" />
                                        Link Kopyala
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {!pdfUrl && (
                        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={loading || selectedImages.length === 0}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Oluşturuluyor...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-4 w-4" />
                                        PDF Oluştur
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
