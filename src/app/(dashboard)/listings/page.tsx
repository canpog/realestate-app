import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ListingsClient from '@/components/listings/listings-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
    title: 'Portföylerim',
    description: 'Tüm gayrimenkul portföylerinizi yönetin.',
};

export default async function ListingsPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get agent id first
    const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    if (!agent) {
        redirect('/login');
    }

    // Get all listings with media
    const { data: listings } = await supabase
        .from('listings')
        .select('*, listing_media(*)')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false });

    return <ListingsClient listings={listings || []} />;
}
