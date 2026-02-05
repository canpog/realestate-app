import { Home, MapPin, Square, Calendar, Hash, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

// Intentionally disabled all interactive components to restore page stability
import ListingActions from '@/components/listings/listing-actions';
import SingleListingMap from '@/components/listings/single-listing-map';

export const dynamic = 'force-dynamic';

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Using direct fetch to avoid potential SDK serialization issues in Next.js 15
    const url = `${supabaseUrl}/rest/v1/listings?id=eq.${params.id}&select=*,agents(*),listing_media(*)`;

    try {
        const res = await fetch(url, {
            headers: {
                'apikey': supabaseKey!,
                'Authorization': `Bearer ${supabaseKey!}`,
                'Content-Type': 'application/json'
            },
            next: { revalidate: 0 }
        });

        const data = await res.json();
        const listing = data?.[0];

        if (!listing) {
            return (
                <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">İlan bulunamadı.</h1>
                    <Link href="/listings" className="text-blue-600 font-bold inline-block border border-blue-200 px-6 py-3 rounded-xl hover:bg-blue-50">Listeye Dön</Link>
                </div>
            );
        }

        const coverImage = listing.listing_media?.find((m: any) => m.is_cover) || listing.listing_media?.[0];

        return (
            <div className="space-y-6 max-w-6xl mx-auto pb-12">
                <ListingActions id={listing.id} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative aspect-video group">
                            {coverImage ? (
                                <img
                                    src={`${supabaseUrl}/storage/v1/object/public/listing-media/${coverImage.storage_path}`}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gray-50 flex items-center justify-center text-gray-300">
                                    <ImageIcon className="h-20 w-20" />
                                </div>
                            )}
                            <div className="absolute top-4 left-4 flex space-x-2">
                                <span className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                                    {listing.type}
                                </span>
                                <span className="px-3 py-1 rounded-lg bg-white text-gray-900 text-xs font-bold uppercase tracking-wider shadow-lg">
                                    {listing.purpose === 'sale' ? 'Satılık' : 'Kiralık'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900">{listing.title}</h1>
                                <div className="mt-2 text-3xl font-black text-blue-600">
                                    {listing.price?.toLocaleString('tr-TR')} {listing.currency === 'TRY' ? '₺' : listing.currency}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-gray-50">
                                <Feature icon={<Home className="h-6 w-6" />} label="Oda Sayısı" value={listing.rooms || '-'} />
                                <Feature icon={<Square className="h-6 w-6" />} label="Alan" value={listing.sqm ? `${listing.sqm} m²` : '-'} />
                                <Feature icon={<Hash className="h-6 w-6" />} label="Durum" value={listing.status === 'available' ? 'Aktif' : 'Pasif'} />
                                <Feature icon={<Calendar className="h-6 w-6" />} label="Kayıt Tarihi" value={new Date(listing.created_at).toLocaleDateString('tr-TR')} />
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-gray-900">Özellikler</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <PropertyCheck label="Asansör" checked={listing.has_elevator} />
                                    <PropertyCheck label="Otopark" checked={listing.has_parking} />
                                    <PropertyCheck label="Balkon" checked={listing.has_balcony} />
                                    <PropertyCheck label="Bahçe" checked={listing.has_garden} />
                                    <PropertyCheck label="Eşyalı" checked={listing.is_furnished} />
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Açıklama</h2>
                                <div className="text-gray-600 whitespace-pre-wrap leading-relaxed text-sm">
                                    {listing.description || 'Açıklama girilmemiş.'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                                Konum
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="font-bold text-gray-900">{listing.district}, {listing.city}</p>
                                    <p className="text-sm text-gray-500 mt-1">{listing.neighborhood || ''}</p>
                                    {listing.address_text && <p className="text-xs text-gray-400 mt-2 bg-gray-50 p-2 rounded-lg">{listing.address_text}</p>}
                                </div>
                                <div className="aspect-square w-full rounded-xl overflow-hidden shadow-inner">
                                    <SingleListingMap
                                        lat={listing.lat}
                                        lng={listing.lng}
                                        title={listing.title}
                                        address={`${listing.district}, ${listing.city}`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Danışman</h2>
                            <div className="flex items-center space-x-4">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-100">
                                    {listing.agents?.full_name?.charAt(0) || 'A'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">{listing.agents?.full_name}</p>
                                    <p className="text-sm text-blue-600 font-semibold">{listing.agents?.phone || 'Telefon belirtilmemiş'}</p>
                                </div>
                            </div>
                            <button className="w-full mt-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all active:scale-95 shadow-lg">
                                İletişime Geç
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    } catch (e: any) {
        return (
            <div className="p-12 text-center bg-red-50 rounded-3xl text-red-900 border border-red-100">
                <h1 className="text-2xl font-bold">Bir hata oluştu.</h1>
                <p className="mt-2 text-sm">{e.message}</p>
                <Link href="/listings" className="text-blue-600 font-bold mt-4 inline-block">Listeye Dön</Link>
            </div>
        );
    }
}

function Feature({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex flex-col items-center text-center">
            <div className="text-blue-600 mb-2 p-3 bg-blue-50 rounded-2xl">{icon}</div>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{label}</span>
            <span className="font-bold text-gray-900 mt-1">{value}</span>
        </div>
    );
}

function PropertyCheck({ label, checked }: { label: string; checked: boolean }) {
    return (
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${checked ? 'bg-green-50 border-green-100 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-400 grayscale opacity-60'}`}>
            <div className={`h-2 w-2 rounded-full ${checked ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            <span>{label}</span>
        </div>
    );
}
