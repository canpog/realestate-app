import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PDFsClient from '@/components/pdf/pdfs-client';

export const dynamic = 'force-dynamic';

export default async function PDFsPage() {
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

    // Get all PDF exports with listing info
    const { data: pdfExports } = await supabase
        .from('pdf_exports')
        .select(`
            id,
            listing_id,
            storage_path,
            created_at,
            listings:listing_id (
                id,
                title
            )
        `)
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false });

    // Get share links
    const { data: shareLinks } = await supabase
        .from('share_links')
        .select('*')
        .eq('created_by', agent.id);

    // Transform data for client
    const pdfs = (pdfExports || []).map((pdf: any) => {
        const shareLink = shareLinks?.find((sl: any) => sl.listing_id === pdf.listing_id);
        const listing = pdf.listings as any;
        return {
            id: pdf.id,
            listing_id: pdf.listing_id || '',
            listing_title: listing?.title || 'Başlıksız Portföy',
            storage_path: pdf.storage_path,
            share_token: shareLink?.token || '',
            download_count: 0,
            view_count: shareLink?.view_count || 0,
            expires_at: shareLink?.expires_at || null,
            created_at: pdf.created_at
        };
    });

    return <PDFsClient pdfs={pdfs} />;
}
