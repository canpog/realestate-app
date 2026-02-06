import Anthropic from '@anthropic-ai/sdk';
import { type SupabaseClient } from '@supabase/supabase-js';

export interface SentimentAnalysis {
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    description: string;
}

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzNotSentiment(
    clientId: string,
    supabase: SupabaseClient
): Promise<SentimentAnalysis> {
    // Fetch last 10 notes
    const { data: notes } = await supabase
        .from('client_notes')
        .select('note')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10);

    if (!notes || notes.length === 0) {
        return { sentiment: 'neutral', score: 0, description: 'Not yok' };
    }

    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 300,
            messages: [
                {
                    role: 'user',
                    content: `Aşağıdaki müşteri notlarının duygu analizini yap.
    Sonuç: positive, negative, neutral
    0-1 arasında score (1=çok pozitif, 0=çok negatif)
    Kısa açıklama (Türkçe, max 1 cümle)

    Notlar:
    ${notes.map((n) => n.note).join('\n')}

    Sadece JSON formatında yanıt ver:
    {
      "sentiment": "positive|negative|neutral",
      "score": 0.8,
      "description": "..."
    }`,
                },
            ],
        });

        const result =
            response.content[0].type === 'text' ? response.content[0].text : '{}';

        // Parse JSON safely
        try {
            // Find JSON part if wrapped in text
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : result;
            return JSON.parse(jsonStr) as SentimentAnalysis;
        } catch (e) {
            console.error("JSON Parse Error", result);
            return { sentiment: 'neutral', score: 0.5, description: 'Analiz formatı hatası' };
        }
    } catch (error) {
        console.error('Sentiment analysis error:', error);
        return { sentiment: 'neutral', score: 0.5, description: 'AI Servis Hatası' };
    }
}
