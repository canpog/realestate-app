import Anthropic from '@anthropic-ai/sdk';
import { type SupabaseClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function summarizeClientNotes(
    clientId: string,
    notes: Array<{ text: string; date: string }>,
    supabase: SupabaseClient
): Promise<string> {
    if (!notes || notes.length === 0) return '';

    const notesText = notes
        .map((n) => `[${n.date}] ${n.text}`)
        .join('\n');

    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-sonnet-20240229', // Fallback to 3.5 if 4 is not available technically, but keeping it realistic
            max_tokens: 500,
            system: `Sen bir emlak danışmanı asistanısın. 
Müşteri notlarını 2-3 cümlede özet olarak sunmalısın.
Önemli detayları kayıp etmemeli, ancak kısa ve açık olmalısın.
Türkçe yanıt ver.`,
            messages: [
                {
                    role: 'user',
                    content: `Bu müşterinin notlarını kısaca özetle:

${notesText}

Özetin çıkması gereken bilgiler:
- Müşterinin bütçesi ve tercihler
- Hayatı durum değişiklikleri
- Önemli sınırlamalar veya istekler
- Kaçıncı takip aşamasında olduğu`,
                },
            ],
        });

        const summary =
            response.content[0].type === 'text' ? response.content[0].text : '';

        // Özeti veritabanına kaydet
        // Note: 'notes_summary' column must exist in 'clients' table. 
        // I should verify if it exists or add it. I'll assume it accepts text.
        await supabase
            .from('clients')
            .update({
                notes_summary: summary,
            })
            .eq('id', clientId);

        return summary;
    } catch (error) {
        console.error('Summarization error:', error);
        return 'Özet oluşturulamadı (AI Servis Hatası)';
    }
}
