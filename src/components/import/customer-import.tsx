'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';

interface ValidationError {
    row: number;
    field: string;
    message: string;
}

interface PreviewCustomer {
    full_name: string;
    phone: string;
    email?: string;
    status: string;
}

interface ImportResult {
    success: boolean;
    preview?: boolean;
    totalRows?: number;
    validCount?: number;
    errorCount?: number;
    errors?: ValidationError[];
    customers?: PreviewCustomer[];
    imported?: number;
    message?: string;
}

interface CustomerImportProps {
    onSuccess?: () => void;
    onClose?: () => void;
}

export function CustomerImport({ onSuccess, onClose }: CustomerImportProps) {
    const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<ImportResult | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.match(/\.(xlsx|xls)$/)) {
                setError('Sadece Excel dosyaları (.xlsx, .xls) desteklenir');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('Dosya boyutu 5MB\'dan küçük olmalı');
                return;
            }
            setSelectedFile(file);
            setError('');
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            if (!file.name.match(/\.(xlsx|xls)$/)) {
                setError('Sadece Excel dosyaları (.xlsx, .xls) desteklenir');
                return;
            }
            setSelectedFile(file);
            setError('');
        }
    }, []);

    const handlePreview = async () => {
        if (!selectedFile) return;

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await fetch('/api/import/customers', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            setResult(data);

            if (data.preview) {
                setStep('preview');
            } else if (data.success) {
                setStep('done');
                onSuccess?.();
            } else {
                setError(data.error || 'Import failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) return;

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('force', 'true'); // Skip preview, force import

            const response = await fetch('/api/import/customers', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setResult(data);
                setStep('done');
                onSuccess?.();
            } else {
                setError(data.error || 'Import failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        window.location.href = '/api/import/customers';
    };

    const resetForm = () => {
        setStep('upload');
        setSelectedFile(null);
        setResult(null);
        setError('');
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-xl">
                        <FileSpreadsheet className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Müşteri İçe Aktarma</h2>
                        <p className="text-sm text-gray-500">Excel dosyasından toplu müşteri yükleyin</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Step 1: Upload */}
            {step === 'upload' && (
                <div className="space-y-6">
                    <div
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 transition-colors cursor-pointer"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept=".xlsx,.xls"
                            className="hidden"
                        />
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="font-medium text-gray-700 mb-1">
                            {selectedFile ? selectedFile.name : 'Dosyanızı buraya sürükleyin'}
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            veya tıklayarak seçin
                        </p>
                        <p className="text-xs text-gray-400">
                            Desteklenen: .xlsx, .xls | Maks: 5MB
                        </p>
                    </div>

                    {selectedFile && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                            <FileSpreadsheet className="w-5 h-5 text-green-600" />
                            <div className="flex-1">
                                <p className="font-medium text-green-800">{selectedFile.name}</p>
                                <p className="text-xs text-green-600">
                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                className="p-1 hover:bg-green-200 rounded"
                            >
                                <X className="w-4 h-4 text-green-600" />
                            </button>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={downloadTemplate}
                            className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Şablon İndir
                        </button>
                        <button
                            onClick={handlePreview}
                            disabled={!selectedFile || loading}
                            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {loading ? 'Yükleniyor...' : 'Devam Et'}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Preview */}
            {step === 'preview' && result && (
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl text-center">
                            <p className="text-2xl font-bold text-gray-900">{result.totalRows}</p>
                            <p className="text-sm text-gray-500">Toplam Kayıt</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-xl text-center">
                            <p className="text-2xl font-bold text-green-600">{result.validCount}</p>
                            <p className="text-sm text-green-600">Geçerli</p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-xl text-center">
                            <p className="text-2xl font-bold text-red-600">{result.errorCount}</p>
                            <p className="text-sm text-red-600">Hata</p>
                        </div>
                    </div>

                    {(result.errors?.length || 0) > 0 && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <h4 className="font-semibold text-red-800 mb-2">Hatalar:</h4>
                            <ul className="text-sm text-red-700 space-y-1">
                                {result.errors?.slice(0, 5).map((err, i) => (
                                    <li key={i}>Satır {err.row}: {err.field} - {err.message}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {(result.customers?.length || 0) > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Ön İzleme (İlk 5):</h4>
                            <div className="border rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Ad Soyad</th>
                                            <th className="px-4 py-2 text-left">Telefon</th>
                                            <th className="px-4 py-2 text-left">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.customers?.map((c, i) => (
                                            <tr key={i} className="border-t">
                                                <td className="px-4 py-2">{c.full_name}</td>
                                                <td className="px-4 py-2">{c.phone}</td>
                                                <td className="px-4 py-2">{c.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={resetForm}
                            className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Geri
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={loading || (result.validCount || 0) === 0}
                            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            {loading ? 'Aktarılıyor...' : `${result.validCount} Müşteri Aktar`}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Done */}
            {step === 'done' && result && (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        İçe Aktarma Tamamlandı!
                    </h3>
                    <p className="text-gray-600 mb-6">
                        {result.imported || result.validCount} müşteri başarıyla aktarıldı
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={resetForm}
                            className="px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Başa Dön
                        </button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
                            >
                                Kapat
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
