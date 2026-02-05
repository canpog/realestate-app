import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ClientDetailClient from '@/components/clients/client-detail';

export const dynamic = 'force-dynamic';

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
    const supabase = createClient();

    const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!client) {
        notFound();
    }

    return <ClientDetailClient client={client} clientId={params.id} />;
}
