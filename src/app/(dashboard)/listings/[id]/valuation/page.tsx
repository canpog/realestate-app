import { createClient } from '@/lib/supabase/server';
import ValuationClient from '@/components/valuation/valuation-client';
import { notFound, redirect } from 'next/navigation';

export default async function ValuationPage({ params }: { params: { id: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: listing } = await supabase
        .from('listings')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!listing) {
        notFound();
    }

    return <ValuationClient listing={listing} />;
}
