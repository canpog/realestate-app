'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, Download, Eye, Trash2, Calendar, Home, ExternalLink, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PDFExport {
    id: string;
    created_at: string;
    file_path: string;
    listings: {
        id: string;
        title: string;
        price: number;
        currency: string;
        city: string;
        district: string;
        listing_media: { storage_path: string; is_cover: boolean }[];
    };
}

export default function PDFListClient({ pdfExports }: { pdfExports: PDFExport[] }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPDFs = pdfExports.filter(pdf =>
        pdf.listings?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pdf.listings?.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        PDF Arşivi
                    </h1>
                    <p className="text-gray-500 mt-1">Oluşturduğunuz tüm PDF dosyaları</p>
                </div>
                <Badge variant="secondary" className="w-fit">
                    Toplam: {pdfExports.length} PDF
                </Badge>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="PDF ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* PDF List */}
            {filteredPDFs.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200"
                >
                    <FileText className="h-16 w-16 mb-4" />
                    <p className="text-lg font-medium">Henüz PDF oluşturulmamış</p>
                    <p className="text-sm mt-2">Portföy detay sayfasından PDF oluşturabilirsiniz</p>
                    <Link
                        href="/listings"
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Portföylere Git
                    </Link>
                </motion.div>
            ) : (
                <div className="grid gap-4">
                    {filteredPDFs.map((pdf, index) => (
                        <motion.div
                            key={pdf.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-lg transition-all"
                        >
                            <div className="flex items-center gap-4">
                                {/* Thumbnail */}
                                <div className="h-20 w-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                                    {pdf.listings?.listing_media?.[0] ? (
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-media/${pdf.listings.listing_media.find(m => m.is_cover)?.storage_path || pdf.listings.listing_media[0].storage_path}`}
                                            alt={pdf.listings.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <Home className="h-8 w-8" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate">
                                        {pdf.listings?.title || 'Silinmiş İlan'}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {pdf.listings?.city}, {pdf.listings?.district}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                        <span className="flex items-center">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {formatDate(pdf.created_at)}
                                        </span>
                                        {pdf.listings?.price && (
                                            <Badge variant="secondary">
                                                {pdf.listings.price.toLocaleString('tr-TR')} {pdf.listings.currency}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {pdf.listings?.id && (
                                        <Link
                                            href={`/listings/${pdf.listings.id}`}
                                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                            title="İlanı Görüntüle"
                                        >
                                            <Eye className="h-5 w-5" />
                                        </Link>
                                    )}
                                    <a
                                        href={`/api/listings/${pdf.listings?.id}/pdf`}
                                        target="_blank"
                                        className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                                        title="PDF'i İndir"
                                    >
                                        <Download className="h-5 w-5" />
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
