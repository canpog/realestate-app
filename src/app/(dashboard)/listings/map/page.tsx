import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { List } from 'lucide-react';
import nextDynamic from 'next/dynamic';

const ListingMap = nextDynamic(() => import('@/components/listings/listing-map'), {
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Harita Yükleniyor...</div>,
    ssr: false
});

export const dynamic = 'force-dynamic';

export default async function ListingMapPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div className="p-8">Oturum açılmamış.</div>;
    }

    // Get agent
    const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    // Get listings with media
    const { data: listings } = await supabase
        .from('listings')
        .select('*, listing_media(*)')
        .eq('agent_id', agent?.id)
        .order('created_at', { ascending: false });

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Harita Görünümü</h1>
                    <p className="text-gray-500">Portföylerinizi harita üzerinde inceleyin.</p>
                </div>
                <Link
                    href="/listings"
                    className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                    <List className="h-4 w-4 mr-2" />
                    Liste Görünümü
                </Link>
            </div>

            <div className="flex-1">
                <ListingMap listings={listings || []} />
            </div>
        </div>
    );
}
