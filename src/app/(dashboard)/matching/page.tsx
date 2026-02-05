import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MatchingClient from '@/components/matching/matching-client';

export const dynamic = 'force-dynamic';

export default async function MatchingPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get agent
    const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

    if (!agent) {
        redirect('/login');
    }

    // Get all clients
    const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false });

    // Get all listings
    const { data: listings } = await supabase
        .from('listings')
        .select('*, listing_media(storage_path, is_cover)')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false });

    return <MatchingClient clients={clients || []} listings={listings || []} />;
}
