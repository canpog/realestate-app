import { createClient } from '@/lib/supabase/server';
import ValuationClient from '@/components/valuation/valuation-client';
import { redirect } from 'next/navigation';

export default async function TopLevelValuationPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Pass no listing prop -> Standalone Mode
    return <ValuationClient />;
}
