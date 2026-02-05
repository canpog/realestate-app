import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ClientsClient from '@/components/clients/clients-client';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Müşterilerim',
    description: 'Müşteri takibi ve CRM yönetimi.',
};

export default async function ClientsPage() {
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

    // Get all clients
    const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false });

    return <ClientsClient clients={clients || []} />;
}
