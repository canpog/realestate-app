import Link from 'next/link';
import ListingWizard from '@/components/listings/listing-form';

export default async function EditListingPage({ params }: { params: { id: string } }) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Native fetch to bypass SDK issues
    const url = `${supabaseUrl}/rest/v1/listings?id=eq.${params.id}&select=*`;

    let listing = null;
    let fetchError = null;

    try {
        console.log('[EDIT PAGE] Fetching listing:', params.id);
        const res = await fetch(url, {
            headers: {
                'apikey': supabaseKey!,
                'Authorization': `Bearer ${supabaseKey!}`,
                'Content-Type': 'application/json'
            },
            next: { revalidate: 0 }
        });

        console.log('[EDIT PAGE] Response status:', res.status);

        if (res.ok) {
            const data = await res.json();
            listing = data?.[0];
            console.log('[EDIT PAGE] Listing found:', !!listing);
        } else {
            fetchError = `Fetch failed with status: ${res.status}`;
        }
    } catch (e: any) {
        console.error('[EDIT PAGE] Fetch error:', e);
        fetchError = e.message;
    }

    if (fetchError) {
        return (
            <div className="p-12 text-center bg-red-50 rounded-3xl border border-red-100 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-red-900 mb-4">Veri Yükleme Hatası</h1>
                <p className="text-red-700 font-mono text-sm">{fetchError}</p>
                <Link href="/listings" className="text-blue-600 font-bold mt-4 inline-block">Listeye Dön</Link>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">İlan bulunamadı.</h1>
                <p className="text-gray-500">Düzenlemek istediğiniz ilan mevcut değil veya erişim izniniz yok.</p>
                <Link href="/listings" className="text-blue-600 font-bold mt-4 inline-block">Listeye Dön</Link>
            </div>
        );
    }

    // RENDER THE FORM
    try {
        console.log('[EDIT PAGE] About to render ListingWizard');
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">İlanı Düzenle</h1>
                    <p className="text-gray-500">İlan bilgilerini güncelleyin.</p>
                </div>
                <ListingWizard initialData={listing} />
            </div>
        );
    } catch (renderError: any) {
        console.error('[EDIT PAGE] Render error:', renderError);
        return (
            <div className="p-12 text-center bg-red-50 rounded-3xl border border-red-100 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-red-900 mb-4">Bileşen Render Hatası</h1>
                <p className="text-red-700 font-mono text-sm">{renderError.message}</p>
                <Link href="/listings" className="text-blue-600 font-bold mt-4 inline-block">Listeye Dön</Link>
            </div>
        );
    }
}
