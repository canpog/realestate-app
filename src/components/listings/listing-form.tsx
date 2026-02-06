'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ChevronRight, ChevronLeft, Save, Loader2, Check, Upload, X, Image as ImageIcon, Trash2, Flag } from 'lucide-react';
import LocationPicker from './location-picker';
import { PORTFOLIO_CATEGORIES, FLAG_COLORS } from '@/types/portfolio';

export default function ListingWizard({ initialData }: { initialData?: any }) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isEdit = !!initialData?.id;

    // FORM STATE
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        type: initialData?.type || 'apartment',
        category: initialData?.category || 'residence',
        purpose: initialData?.purpose || 'sale',
        price: initialData?.price || 0,
        currency: initialData?.currency || 'TRY',
        sqm: initialData?.sqm || 0,
        rooms: initialData?.rooms || '',
        city: initialData?.city || '',
        district: initialData?.district || '',
        neighborhood: initialData?.neighborhood || '',
        address_text: initialData?.address_text || '',
        lat: initialData?.lat || null,
        lng: initialData?.lng || null,
        has_elevator: initialData?.has_elevator || false,
        has_parking: initialData?.has_parking || false,
        has_balcony: initialData?.has_balcony || false,
        has_garden: initialData?.has_garden || false,
        is_furnished: initialData?.is_furnished || false,
        tags: initialData?.listing_tags?.map((t: any) => t.tag_name).join(', ') || '',
        flag_color: initialData?.listing_flags?.[0]?.color || '',
        flag_note: initialData?.listing_flags?.[0]?.notes || '',
    });

    // PHOTO STATE
    const [photos, setPhotos] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);

    // Load existing photos on mount (for edit mode)
    useEffect(() => {
        if (isEdit && initialData?.id) {
            loadExistingPhotos();
        }
    }, [initialData?.id]);

    const loadExistingPhotos = async () => {
        const { data } = await supabase
            .from('listing_media')
            .select('*')
            .eq('listing_id', initialData.id)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });
        if (data) setPhotos(data);
    };

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // PHOTO UPLOAD
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);

        try {
            // Get agent ID first
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Oturum açmanız gerekiyor');

            const { data: agent } = await supabase
                .from('agents')
                .select('id')
                .eq('auth_user_id', user.id)
                .single();

            if (!agent) throw new Error('Danışman profili bulunamadı');

            let uploadedCount = 0;
            for (const file of Array.from(files)) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${initialData?.id || 'new'}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `listings/${fileName}`;

                // Upload to storage
                const { error: uploadError } = await supabase.storage
                    .from('listing-media')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // Determine if this should be the cover (only first photo ever)
                const shouldBeCover = photos.length === 0 && uploadedCount === 0;
                uploadedCount++;

                // If we have an existing listing, save to DB
                if (initialData?.id) {
                    const { data: mediaData, error: dbError } = await supabase
                        .from('listing_media')
                        .insert({
                            listing_id: initialData.id,
                            agent_id: agent.id, // Required for RLS
                            storage_path: filePath,
                            is_cover: shouldBeCover
                        })
                        .select()
                        .single();

                    if (dbError) throw dbError;
                    setPhotos(prev => [...prev, mediaData]);
                } else {
                    // For new listings, just keep track locally
                    setPhotos(prev => [...prev, {
                        id: Date.now(),
                        storage_path: filePath,
                        is_cover: shouldBeCover,
                        isNew: true
                    }]);
                }
            }
        } catch (error: any) {
            alert('Fotoğraf yüklenirken hata: ' + error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // DELETE PHOTO
    const deletePhoto = async (photo: any) => {
        if (!confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) return;

        try {
            // Delete from storage
            await supabase.storage.from('listing-media').remove([photo.storage_path]);

            // Delete from DB if it exists there
            if (photo.id && !photo.isNew) {
                await supabase.from('listing_media').delete().eq('id', photo.id);
            }

            setPhotos(prev => prev.filter(p => p.id !== photo.id));
        } catch (error: any) {
            alert('Silme hatası: ' + error.message);
        }
    };

    // SET COVER PHOTO
    const setCover = async (photo: any) => {
        if (photo.is_cover) return;

        try {
            // Remove cover from all
            if (initialData?.id) {
                await supabase
                    .from('listing_media')
                    .update({ is_cover: false })
                    .eq('listing_id', initialData.id);

                // Set new cover
                await supabase
                    .from('listing_media')
                    .update({ is_cover: true })
                    .eq('id', photo.id);
            }

            setPhotos(prev => prev.map(p => ({
                ...p,
                is_cover: p.id === photo.id
            })));
        } catch (error: any) {
            alert('Hata: ' + error.message);
        }
    };

    // DRAG & DROP STATE
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // DRAG HANDLERS
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        setDragOverIndex(null);

        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            return;
        }

        // Reorder array
        const newPhotos = [...photos];
        const [draggedPhoto] = newPhotos.splice(draggedIndex, 1);
        newPhotos.splice(dropIndex, 0, draggedPhoto);

        // Update is_cover - first photo is always cover
        const updatedPhotos = newPhotos.map((p, idx) => ({
            ...p,
            is_cover: idx === 0
        }));

        setPhotos(updatedPhotos);
        setDraggedIndex(null);

        // Update DB if editing
        if (initialData?.id) {
            try {
                // Update sort_order and is_cover for all photos
                for (let i = 0; i < updatedPhotos.length; i++) {
                    const photo = updatedPhotos[i];
                    if (!photo.isNew) {
                        await supabase
                            .from('listing_media')
                            .update({
                                sort_order: i,
                                is_cover: i === 0
                            })
                            .eq('id', photo.id);
                    }
                }
            } catch (error: any) {
                console.error('Sıralama güncelleme hatası:', error);
            }
        }
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // SAVE
    const doSave = async () => {
        if (loading) return;
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Oturum açmanız gerekiyor');

            const { data: agent } = await supabase
                .from('agents')
                .select('id')
                .eq('auth_user_id', user.id)
                .single();

            if (!agent) throw new Error('Danışman profili bulunamadı');

            const cleanData = {
                ...formData,
                price: Number(formData.price),
                sqm: formData.sqm ? Number(formData.sqm) : null,
            };

            if (isEdit) {
                const { error } = await supabase
                    .from('listings')
                    .update(cleanData)
                    .eq('id', initialData.id);
                if (error) throw error;
            } else {
                // Create new listing
                const { data: newListing, error } = await supabase
                    .from('listings')
                    .insert({
                        ...cleanData,
                        agent_id: agent.id,
                        status: 'available'
                    })
                    .select()
                    .single();

                if (error) throw error;

                if (photos.length > 0) {
                    const photoInserts = photos.map((p, idx) => ({
                        listing_id: newListing.id,
                        storage_path: p.storage_path,
                        media_type: 'image',
                        is_cover: idx === 0
                    }));

                    await supabase.from('listing_media').insert(photoInserts);
                }
            }

            // Handle Tags
            const targetId = isEdit ? initialData.id : (await supabase.from('listings').select('id').order('created_at', { ascending: false }).limit(1).single()).data?.id; // Hacky for new ID if scope variable unavailable
            // Actually newListing is available in else block scope but not here.
            // Better to capture ID.
            const finalId = isEdit ? initialData.id : (await supabase.from('listings').select('id').eq('agent_id', agent.id).order('created_at', { ascending: false }).limit(1).single()).data?.id;

            if (finalId) {
                // 1. Tags
                if (formData.tags) {
                    const tagsList = formData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
                    // Delete existing (simplest strategy)
                    await supabase.from('listing_tags').delete().eq('listing_id', finalId);
                    // Insert new
                    if (tagsList.length > 0) {
                        await supabase.from('listing_tags').insert(tagsList.map((t: string) => ({ listing_id: finalId, tag_name: t })));
                    }
                } else if (isEdit) {
                    await supabase.from('listing_tags').delete().eq('listing_id', finalId);
                }

                // 2. Flags
                if (formData.flag_color) {
                    // Delete existing
                    await supabase.from('listing_flags').delete().eq('listing_id', finalId).eq('agent_id', agent.id);
                    // Insert
                    await supabase.from('listing_flags').insert({
                        listing_id: finalId,
                        agent_id: agent.id,
                        flag_type: 'priority', // Default type
                        color: formData.flag_color,
                        notes: formData.flag_note
                    });
                } else if (isEdit) {
                    // If cleared, delete
                    await supabase.from('listing_flags').delete().eq('listing_id', finalId).eq('agent_id', agent.id);
                }
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/listings');
                router.refresh();
            }, 1500);

        } catch (error: any) {
            alert('Hata: ' + error.message);
            setLoading(false);
        }
    };

    const nextStep = () => { if (step < 4) setStep(s => s + 1); };
    const prevStep = () => { if (step > 1) setStep(s => s - 1); };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (success) {
        return (
            <div className="max-w-2xl mx-auto p-12 bg-green-50 rounded-2xl border border-green-200 text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-green-900">Başarıyla Kaydedildi!</h2>
                <p className="text-green-700 mt-2">Yönlendiriliyorsunuz...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-12">
            {/* Progress Steps - Now 4 steps */}
            <div className="flex items-center justify-center mb-8 gap-2">
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                            }`}>
                            {s}
                        </div>
                        {s < 4 && <div className={`w-8 h-1 mx-1 rounded ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="space-y-6">

                    {/* STEP 1: TEMEL BİLGİLER */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 border-b pb-4">Temel Bilgiler</h2>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Başlık *</label>
                                <input name="title" value={formData.title} onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Örn: Deniz Manzaralı 3+1 Daire" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori *</label>
                                    <select name="category" value={formData.category} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none">
                                        {Object.entries(PORTFOLIO_CATEGORIES).map(([key, cat]) => (
                                            <option key={key} value={key}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tip</label>
                                    <select name="type" value={formData.type} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none">
                                        <option value="apartment">Daire</option>
                                        <option value="villa">Villa</option>
                                        <option value="land">Arsa</option>
                                        <option value="commercial">Ticari</option>
                                        <option value="office">Ofis</option>
                                        <option value="shop">Dükkan</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Amaç</label>
                                    <select name="purpose" value={formData.purpose} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none">
                                        <option value="sale">Satılık</option>
                                        <option value="rent">Kiralık</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Para Birimi</label>
                                    <select name="currency" value={formData.currency} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none">
                                        <option value="TRY">TRY (₺)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Fiyat *</label>
                                <input name="price" type="number" value={formData.price} onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">m² (Alan)</label>
                                    <input name="sqm" type="number" value={formData.sqm} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Oda Sayısı</label>
                                    <input name="rooms" value={formData.rooms} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none" placeholder="Örn: 3+1" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Açıklama</label>
                                <textarea name="description" value={formData.description} onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 h-32 outline-none resize-none"
                                    placeholder="İlan hakkında detaylı bilgi..." />
                            </div>

                            {/* Tags & Flags */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Etiketler</label>
                                    <input name="tags" value={formData.tags} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none"
                                        placeholder="Örn: Deniz Manzaralı, Yeni, Fırsat (Virgülle ayırın)" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Bayrak (Kişisel İşaret)</label>
                                    <div className="flex gap-2 mb-2">
                                        {['', 'red', 'yellow', 'blue', 'green'].map(color => (
                                            <button
                                                key={color || 'none'}
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, flag_color: color }))}
                                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${formData.flag_color === color
                                                        ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                                                        : 'hover:scale-105'
                                                    } ${color === '' ? 'bg-white border-gray-300' : ''} ${color === 'red' ? 'bg-red-500 border-red-600' : ''} ${color === 'yellow' ? 'bg-yellow-500 border-yellow-600' : ''} ${color === 'blue' ? 'bg-blue-500 border-blue-600' : ''} ${color === 'green' ? 'bg-green-500 border-green-600' : ''}`}
                                            >
                                                {formData.flag_color === color && <Check className={`w-4 h-4 ${color === '' ? 'text-gray-400' : 'text-white'}`} />}
                                                {color === '' && formData.flag_color !== '' && <X className="w-4 h-4 text-gray-400" />}
                                            </button>
                                        ))}
                                    </div>
                                    {formData.flag_color && (
                                        <input name="flag_note" value={formData.flag_note} onChange={handleChange}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                                            placeholder="Bayrak notu ekle..." />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: KONUM */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 border-b pb-4">Konum Bilgileri</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Şehir *</label>
                                    <input name="city" value={formData.city} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none" placeholder="Örn: Muğla" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">İlçe *</label>
                                    <input name="district" value={formData.district} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none" placeholder="Örn: Marmaris" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Mahalle</label>
                                <input name="neighborhood" value={formData.neighborhood} onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none" placeholder="Örn: Armutalan" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Açık Adres</label>
                                <textarea name="address_text" value={formData.address_text} onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 h-24 outline-none resize-none"
                                    placeholder="Detaylı adres bilgisi..." />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Harita Konumu *</label>
                                <LocationPicker
                                    lat={formData.lat || undefined}
                                    lng={formData.lng || undefined}
                                    onChange={(coords) => setFormData(prev => ({ ...prev, lat: coords.lat, lng: coords.lng }))}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: ÖZELLİKLER */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 border-b pb-4">Özellikler</h2>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <Checkbox name="has_elevator" checked={formData.has_elevator} onChange={handleChange} label="Asansör" />
                                <Checkbox name="has_parking" checked={formData.has_parking} onChange={handleChange} label="Otopark" />
                                <Checkbox name="has_balcony" checked={formData.has_balcony} onChange={handleChange} label="Balkon" />
                                <Checkbox name="has_garden" checked={formData.has_garden} onChange={handleChange} label="Bahçe" />
                                <Checkbox name="is_furnished" checked={formData.is_furnished} onChange={handleChange} label="Eşyalı" />
                            </div>
                        </div>
                    )}

                    {/* STEP 4: FOTOĞRAFLAR */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 border-b pb-4">Fotoğraflar</h2>

                            {/* Upload Area */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                />
                                {uploading ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-2" />
                                        <p className="text-blue-600 font-semibold">Yükleniyor...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <Upload className="h-10 w-10 text-gray-400 mb-2" />
                                        <p className="text-gray-600 font-semibold">Fotoğraf Ekle</p>
                                        <p className="text-gray-400 text-sm mt-1">Birden fazla fotoğraf seçebilirsiniz</p>
                                    </div>
                                )}
                            </div>

                            {/* Photo Grid - Draggable */}
                            {photos.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-500 italic">💡 Fotoğrafları sürükleyerek sıralayın. İlk fotoğraf kapak olarak kullanılır.</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {photos.map((photo, index) => (
                                            <div
                                                key={photo.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, index)}
                                                onDragOver={(e) => handleDragOver(e, index)}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => handleDrop(e, index)}
                                                onDragEnd={handleDragEnd}
                                                className={`relative group aspect-square rounded-xl overflow-hidden border-2 shadow-sm cursor-grab active:cursor-grabbing transition-all ${draggedIndex === index
                                                    ? 'opacity-50 scale-95 border-blue-400'
                                                    : dragOverIndex === index
                                                        ? 'border-blue-500 ring-4 ring-blue-200'
                                                        : index === 0
                                                            ? 'border-blue-400 ring-2 ring-blue-100'
                                                            : 'border-gray-200'
                                                    }`}
                                            >
                                                <img
                                                    src={`${supabaseUrl}/storage/v1/object/public/listing-media/${photo.storage_path}`}
                                                    alt="Fotoğraf"
                                                    className="w-full h-full object-cover pointer-events-none"
                                                />

                                                {/* Cover Badge - Always on first photo */}
                                                {index === 0 && (
                                                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-lg font-bold shadow-lg">
                                                        ⭐ Kapak
                                                    </div>
                                                )}

                                                {/* Order Number */}
                                                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                                                    {index + 1}
                                                </div>

                                                {/* Delete Button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); deletePhoto(photo); }}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {photos.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>Henüz fotoğraf eklenmedi</p>
                                </div>
                            )}

                            {/* Summary */}
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mt-8">
                                <h3 className="font-bold text-blue-800 mb-2">Özet</h3>
                                <p className="text-blue-700 text-sm">
                                    <strong>{formData.title || 'Başlık yok'}</strong> - {formData.price?.toLocaleString('tr-TR')} {formData.currency}
                                </p>
                                <p className="text-blue-600 text-xs mt-1">
                                    {formData.district}, {formData.city} • {formData.rooms} • {formData.sqm} m² • {photos.length} fotoğraf
                                </p>
                            </div>
                        </div>
                    )}

                    {/* NAVIGATION */}
                    <div className="flex justify-between pt-6 border-t">
                        <button type="button" onClick={prevStep} disabled={step === 1}
                            className="px-6 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2">
                            <ChevronLeft className="h-4 w-4" /> Geri
                        </button>

                        {step < 4 ? (
                            <button type="button" onClick={nextStep}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
                                İleri <ChevronRight className="h-4 w-4" />
                            </button>
                        ) : (
                            <button type="button" onClick={doSave} disabled={loading}
                                className="px-8 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {loading ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Kaydet')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Checkbox({ name, checked, onChange, label }: { name: string; checked: boolean; onChange: any; label: string }) {
    return (
        <label className="flex items-center space-x-3 cursor-pointer group bg-gray-50 p-4 rounded-xl border border-transparent hover:border-blue-200 hover:bg-blue-50/50 transition-all">
            <input type="checkbox" name={name} checked={checked} onChange={onChange} className="hidden" />
            <div className={`h-6 w-6 border-2 rounded-lg flex items-center justify-center transition-all ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'
                }`}>
                {checked && <Check className="h-4 w-4 text-white" />}
            </div>
            <span className={`text-sm font-semibold transition-colors ${checked ? 'text-blue-700' : 'text-gray-600'}`}>{label}</span>
        </label>
    );
}
