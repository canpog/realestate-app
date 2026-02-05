import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileClient from '@/components/profile/profile-client';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get agent profile
    const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

    if (!agent) {
        redirect('/login');
    }

    // Get statistics
    const { count: listingsCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id);

    const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id);

    const { count: pdfsCount } = await supabase
        .from('pdf_exports')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id);

    const stats = {
        listings: listingsCount || 0,
        clients: clientsCount || 0,
        pdfs: pdfsCount || 0
    };

    return <ProfileClient agent={agent} stats={stats} />;
}
