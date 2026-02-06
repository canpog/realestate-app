import Anthropic from '@anthropic-ai/sdk';
import { type SupabaseClient } from '@supabase/supabase-js';
import { type Listing } from '@/types/listing';

export interface SmartSuggestion {
    listing_id: string;
    score: number;
    reason: string;
    pros: string[];
    cons: string[];
    action: string;
}

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateSmartSuggestions(
    clientId: string,
    supabase: SupabaseClient
): Promise<SmartSuggestion[]> {
    // 1. Get Client Info
    const { data: client } = await supabase
        .from('clients')
        .select('*, client_notes(*)')
        .eq('id', clientId)
        .single();

    if (!client) return [];

    // 2. Find Candidate Listings (Available)
    // Simple filter based on budget if available, otherwise just recent 50
    let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'available')
        .limit(50);

    if (client.budget_max) {
        // Get listings up to 120% of budget
        query = query.lte('price', client.budget_max * 1.2);
    }

    const { data: candidateListings } = await query;

    if (!candidateListings || candidateListings.length === 0) return [];

    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 2000,
            system: `Sen bir emlak danışmanı asistanısın.
Müşteri tercihlerine ve geçmiş notlarına göre en uygun portföyleri seç ve detaylı analiz et.
Her eşleşme için 0-100 arası bir uyum skoru ver.
JSON formatında yanıt ver.`,
            messages: [
                {
                    role: 'user',
                    content: `Müşteri: ${client.first_name} ${client.last_name}
Bütçe: ${client.budget_min || 0} - ${client.budget_max || 'Belirsiz'} ₺
Tercihler: ${client.wanted_types?.join(', ') || 'Belirtilmemiş'}
Lokasyon: ${client.wanted_city || ''} ${client.wanted_districts ? ',' + client.wanted_districts.join(', ') : ''}
Notlar Özeti: ${client.notes_summary || 'Yok'}
Son Notlar: ${client.client_notes?.slice(0, 3).map((n: any) => n.note).join(' | ')}

Aday Portföyler (İlk 50 arasından):
${candidateListings
                            .map(
                                (l: any) =>
                                    `ID: ${l.id}, Başlık: ${l.title}, Tip: ${l.type}, Fiyat: ${l.price} ${l.currency}, Lokasyon: ${l.district}/${l.city}, Özellikler: ${l.rooms}, ${l.sqm}m2`
                            )
                            .join('\n')}

Bu müşteri için EN İYİ 3 akıllı tavsiye ver.
Her tavsiye şu bilgileri içermeli:
- Portföy ID'si (listing_id)
- Uyum Skoru (score) - 0-100
- Neden uygun? (reason) - Müşteri notlarına atıfta bulun
- Artılar (pros) - Dizi olarak
- Eksiler/Riskler (cons) - Dizi olarak
- Aksiyon önerisi (action)

Yanıt formatı (JSON):
{
  "suggestions": [
    {
      "listing_id": "...",
      "score": 95,
      "reason": "...",
      "pros": ["...", "..."],
      "cons": ["..."],
      "action": "..."
    }
  ]
}`,
                },
            ],
        });

        const content =
            response.content[0].type === 'text' ? response.content[0].text : '{}';

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : '{}';
        const parsed = JSON.parse(jsonStr);

        return parsed.suggestions || [];
    } catch (error) {
        console.error('Smart suggestions error:', error);
        return [];
    }
}
