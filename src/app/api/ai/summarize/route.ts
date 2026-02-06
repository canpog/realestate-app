import { createClient } from '@/lib/supabase/server';
import { summarizeClientNotes } from '@/lib/ai/summarizer';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { clientId } = await request.json();

        if (!clientId) {
            return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
        }

        // 1. Get Client Details
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();

        if (clientError || !client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // 2. Get Client Notes
        const { data: notes, error: notesError } = await supabase
            .from('client_notes')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: true });

        if (notesError) {
            return NextResponse.json({ error: 'Error fields notes' }, { status: 500 });
        }

        // 3. Generate Summary
        const summary = await summarizeClientNotes(client, notes || []);

        // 4. (Optional) Save summary to client metadata or notes
        // For now, let's just return it. 
        // If we wanted to save, we could add a new column 'ai_summary' to clients table or insert a special note.

        return NextResponse.json({ summary });

    } catch (error) {
        console.error('Summarize API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}
