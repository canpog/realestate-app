'use server'

import { createClient } from '@/lib/supabase/server';
import { summarizeClientNotes } from '@/lib/ai/note-summarization';
import { analyzNotSentiment } from '@/lib/ai/sentiment-analysis';
import { generateSmartSuggestions } from '@/lib/ai/smart-suggestions';

export async function summarizeNotesAction(clientId: string) {
    const supabase = createClient();

    // Fetch notes first
    const { data: notes } = await supabase
        .from('client_notes')
        .select('note, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (!notes) return '';

    const formattedNotes = notes.map(n => ({
        text: n.note,
        date: new Date(n.created_at).toLocaleDateString('tr-TR')
    }));

    return await summarizeClientNotes(clientId, formattedNotes, supabase);
}

export async function analyzeSentimentAction(clientId: string) {
    const supabase = createClient();
    return await analyzNotSentiment(clientId, supabase);
}

export async function getSmartSuggestionsAction(clientId: string) {
    const supabase = createClient();
    return await generateSmartSuggestions(clientId, supabase);
}
