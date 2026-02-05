'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    FileText, Download, Copy, Share2, Trash2, QrCode, Eye,
    ExternalLink, Clock, MousePointer, MoreVertical, Plus,
    MessageCircle, Check, Calendar, Search
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PDF {
    id: string;
    listing_id: string;
    listing_title: string;
    storage_path: string;
    share_token: string;
    download_count: number;
    view_count: number;
    expires_at: string | null;
    created_at: string;
}

export default function PDFsClient({ pdfs: initialPdfs }: { pdfs: PDF[] }) {
    const [pdfs, setPdfs] = useState(initialPdfs);
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showQR, setShowQR] = useState<string | null>(null);

    const filteredPdfs = pdfs.filter(pdf =>
        pdf.listing_title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPdfUrl = (pdf: PDF) => {
        return `/api/listings/${pdf.listing_id}/pdf`;
    };

    const getShareUrl = (pdf: PDF) => {
        return `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${pdf.share_token}`;
    };

    const copyLink = async (pdf: PDF) => {
        const url = getShareUrl(pdf);
        await navigator.clipboard.writeText(url);
        setCopiedId(pdf.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const shareWhatsApp = (pdf: PDF) => {
        const url = getShareUrl(pdf);
        const text = encodeURIComponent(`${pdf.listing_title} - Portföy Detayları: ${url}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const deletePdf = async (id: string) => {
        if (!confirm('Bu PDF\'i silmek istediğinize emin misiniz?')) return;

        try {
            await fetch(`/api/pdfs/${id}`, { method: 'DELETE' });
            setPdfs(prev => prev.filter(pdf => pdf.id !== id));
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isExpired = (expiresAt: string | null) => {
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
    };

    const getTimeRemaining = (expiresAt: string | null) => {
        if (!expiresAt) return 'Süresiz';
        const exp = new Date(expiresAt);
        const now = new Date();
        if (exp < now) return 'Süresi doldu';

        const diff = exp.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days} gün kaldı`;
        return `${hours} saat kaldı`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">📄 PDF Yönetimi</h1>
                    <p className="text-gray-500 mt-1">
                        {filteredPdfs.length} PDF dosyası
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="PDF ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* PDF List */}
            {filteredPdfs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
                    <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">PDF bulunamadı</h3>
                    <p className="text-gray-500 mb-6">Henüz oluşturulmuş PDF yok.</p>
                    <Link
                        href="/listings"
                        className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Portföylere Git
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredPdfs.map((pdf, index) => (
                        <motion.div
                            key={pdf.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg transition-all"
                        >
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                {/* PDF Icon */}
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                                        <FileText className="h-6 w-6 text-white" />
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-900 truncate">
                                            {pdf.listing_title}
                                        </h3>
                                        {isExpired(pdf.expires_at) && (
                                            <Badge className="bg-red-100 text-red-700">Süresi Doldu</Badge>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {formatDate(pdf.created_at)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Eye className="h-3.5 w-3.5" />
                                            {pdf.view_count || 0} görüntüleme
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Download className="h-3.5 w-3.5" />
                                            {pdf.download_count || 0} indirme
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            {getTimeRemaining(pdf.expires_at)}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <a
                                        href={getPdfUrl(pdf)}
                                        target="_blank"
                                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                        title="Görüntüle"
                                    >
                                        <ExternalLink className="h-4 w-4 text-gray-600" />
                                    </a>

                                    <button
                                        onClick={() => copyLink(pdf)}
                                        className={`p-2 rounded-lg transition-colors ${copiedId === pdf.id
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                            }`}
                                        title="Link Kopyala"
                                    >
                                        {copiedId === pdf.id ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setShowQR(showQR === pdf.id ? null : pdf.id)}
                                        className={`p-2 rounded-lg transition-colors ${showQR === pdf.id
                                            ? 'bg-purple-100 text-purple-600'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                            }`}
                                        title="QR Kod"
                                    >
                                        <QrCode className="h-4 w-4" />
                                    </button>

                                    <button
                                        onClick={() => shareWhatsApp(pdf)}
                                        className="p-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-600 transition-colors"
                                        title="WhatsApp'ta Paylaş"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                    </button>

                                    <button
                                        onClick={() => deletePdf(pdf.id)}
                                        className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                                        title="Sil"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* QR Code Section */}
                            {showQR === pdf.id && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-4 pt-4 border-t border-gray-100"
                                >
                                    <div className="flex items-center justify-center gap-8">
                                        <div className="text-center">
                                            <div className="bg-white p-4 rounded-xl border-2 border-gray-200 inline-block">
                                                {/* Simple QR placeholder - in production use qrcode.react */}
                                                <div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center">
                                                    <QrCode className="h-16 w-16 text-gray-400" />
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">QR kodu</p>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Paylaşım Linki:</p>
                                            <div className="flex items-center gap-2">
                                                <code className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-600 max-w-xs truncate">
                                                    {getShareUrl(pdf)}
                                                </code>
                                                <button
                                                    onClick={() => copyLink(pdf)}
                                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                                                >
                                                    Kopyala
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1 text-gray-400">
                        <FileText className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase">Toplam PDF</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{pdfs.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1 text-gray-400">
                        <Eye className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase">Toplam Görüntüleme</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">
                        {pdfs.reduce((sum, pdf) => sum + (pdf.view_count || 0), 0)}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1 text-gray-400">
                        <Download className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase">Toplam İndirme</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">
                        {pdfs.reduce((sum, pdf) => sum + (pdf.download_count || 0), 0)}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1 text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase">Aktif Linkler</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">
                        {pdfs.filter(pdf => !isExpired(pdf.expires_at)).length}
                    </p>
                </div>
            </div>
        </div>
    );
}
