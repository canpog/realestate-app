import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Home, MapPin, Square, Phone, Mail, Download, Calendar, Share2 } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SharePage({ params }: { params: { token: string } }) {
    const supabase = createClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // Get share link
    const { data: shareLink } = await supabase
        .from('pdf_exports')
        .select('*, listings(*, agents(*), listing_media(*))')
        .eq('share_token', params.token)
        .single();

    if (!shareLink) {
        notFound();
    }

    // Check if expired
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-12 text-center max-w-md shadow-xl">
                    <div className="text-6xl mb-4">⏰</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Süresi Doldu</h1>
                    <p className="text-gray-500">Bu paylaşım linki artık geçerli değil.</p>
                </div>
            </div>
        );
    }

    // Increment view count (using download_count as proxy)
    await supabase
        .from('pdf_exports')
        .update({ download_count: (shareLink.download_count || 0) + 1 })
        .eq('id', shareLink.id);

    const listing = shareLink.listings;
    const agent = listing?.agents;
    const coverImage = listing?.listing_media?.find((m: any) => m.is_cover) || listing?.listing_media?.[0];
    const pdfUrl = shareLink.storage_path
        ? `${supabaseUrl}/storage/v1/object/public/listing-media/${shareLink.storage_path}`
        : null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="font-black text-xl text-blue-600">TR Danışman</div>
                    {pdfUrl && (
                        <a
                            href={pdfUrl}
                            target="_blank"
                            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            PDF İndir
                        </a>
                    )}
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Cover Image */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 aspect-video relative">
                            {coverImage ? (
                                <img
                                    src={`${supabaseUrl}/storage/v1/object/public/listing-media/${coverImage.storage_path}`}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                                    <Home className="h-20 w-20" />
                                </div>
                            )}
                            <div className="absolute top-4 left-4 flex gap-2">
                                <span className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold uppercase">
                                    {getTypeLabel(listing.type)}
                                </span>
                                <span className="px-3 py-1 rounded-lg bg-white text-gray-900 text-xs font-bold uppercase shadow">
                                    {listing.purpose === 'sale' ? 'Satılık' : 'Kiralık'}
                                </span>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">{listing.title}</h1>
                            <p className="text-3xl font-black text-blue-600 mb-6">
                                {listing.price?.toLocaleString('tr-TR')} {listing.currency === 'TRY' ? '₺' : listing.currency}
                            </p>

                            {/* Features Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-gray-100 mb-6">
                                <Feature icon={<Home className="h-5 w-5" />} label="Oda" value={listing.rooms || '-'} />
                                <Feature icon={<Square className="h-5 w-5" />} label="Alan" value={listing.sqm ? `${listing.sqm} m²` : '-'} />
                                <Feature icon={<MapPin className="h-5 w-5" />} label="Konum" value={listing.district || '-'} />
                                <Feature icon={<Calendar className="h-5 w-5" />} label="İlan" value={new Date(listing.created_at).toLocaleDateString('tr-TR')} />
                            </div>

                            {/* Property Features */}
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-3">Özellikler</h2>
                                <div className="flex flex-wrap gap-2">
                                    {listing.has_elevator && <Badge>Asansör</Badge>}
                                    {listing.has_parking && <Badge>Otopark</Badge>}
                                    {listing.has_balcony && <Badge>Balkon</Badge>}
                                    {listing.has_garden && <Badge>Bahçe</Badge>}
                                    {listing.is_furnished && <Badge>Eşyalı</Badge>}
                                    {!listing.has_elevator && !listing.has_parking && !listing.has_balcony && !listing.has_garden && !listing.is_furnished && (
                                        <span className="text-gray-400 text-sm">Özellik belirtilmemiş</span>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            {listing.description && (
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 mb-3">Açıklama</h2>
                                    <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                                        {listing.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Gallery */}
                        {listing.listing_media?.length > 1 && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Fotoğraflar</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {listing.listing_media.map((media: any) => (
                                        <img
                                            key={media.id}
                                            src={`${supabaseUrl}/storage/v1/object/public/listing-media/${media.storage_path}`}
                                            alt=""
                                            className="aspect-video object-cover rounded-xl"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Agent */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">İletişim</h2>
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-black text-xl">
                                    {agent?.full_name?.charAt(0) || 'D'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{agent?.full_name || 'Danışman'}</p>
                                    <p className="text-sm text-gray-500">{agent?.company || 'Emlak Danışmanı'}</p>
                                </div>
                            </div>

                            {agent?.phone && (
                                <a
                                    href={`tel:${agent.phone}`}
                                    className="flex items-center justify-center w-full bg-green-600 text-white py-3 rounded-xl font-bold mb-3 hover:bg-green-700 transition-colors"
                                >
                                    <Phone className="h-5 w-5 mr-2" />
                                    {agent.phone}
                                </a>
                            )}

                            {agent?.email && (
                                <a
                                    href={`mailto:${agent.email}`}
                                    className="flex items-center justify-center w-full border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                                >
                                    <Mail className="h-5 w-5 mr-2" />
                                    E-posta Gönder
                                </a>
                            )}
                        </div>

                        {/* Location */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                                Konum
                            </h2>
                            <p className="font-bold text-gray-900">{listing.district}, {listing.city}</p>
                            {listing.neighborhood && <p className="text-sm text-gray-500 mt-1">{listing.neighborhood}</p>}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-100 mt-12 py-6 text-center text-sm text-gray-400">
                <p>Bu sayfa <strong className="text-blue-600">TR Danışman</strong> ile oluşturulmuştur.</p>
            </footer>
        </div>
    );
}

function Feature({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="text-center">
            <div className="text-blue-600 mb-2 flex justify-center">{icon}</div>
            <p className="text-xs text-gray-400 uppercase font-bold">{label}</p>
            <p className="font-bold text-gray-900">{value}</p>
        </div>
    );
}

function Badge({ children }: { children: React.ReactNode }) {
    return (
        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
            {children}
        </span>
    );
}

function getTypeLabel(type: string) {
    const types: Record<string, string> = {
        apartment: 'Daire',
        villa: 'Villa',
        land: 'Arsa',
        commercial: 'Ticari',
        office: 'Ofis',
        shop: 'Dükkan'
    };
    return types[type] || type;
}
