import Anthropic from '@anthropic-ai/sdk';
import { Client, ClientNote } from '@/types/client';

// Initialize Anthropic client - checks for API key
const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

// Types for the AI response
export interface MatchResult {
    listing_id: string;
    score: number;
    reason: string;
    pros: string[];
    cons: string[];
}

export interface MatchingResponse {
    matches: MatchResult[];
    summary: string;
}

const MATCHING_SYSTEM_PROMPT = `Sen uzman bir emlak danışmanı asistanısın. Görevin, müşteri profili ve portföyleri analiz edip en iyi eşleşmeleri bulmaktır.

Analiz Kriterleri:
1. Bütçe Uyumu: Müşterinin bütçesi ile portföy fiyatı uyumu (pazarlık payı olabileceğini unutma).
2. Lokasyon: İstenen şehir, ilçe ve mahalle uyumu.
3. Özellikler: Oda sayısı, m², kat, asansör vb. istekler.
4. "Soft" Kriterler: Müşteri notlarında geçen (örn: "sessiz olsun", "yatırım amaçlı", "deniz görsün") ifadeler.

Çıktı Formatı (JSON):
Yanıtın SADECE geçerli bir JSON objesi olmalı ve şu şemaya uymalıdır:
{
  "matches": [
    {
      "listing_id": "string (portföy ID)",
      "score": number (0-100 arası uyum puanı),
      "reason": "string (neden bu portföyü öneriyorsun, kısa özet)",
      "pros": ["string", "string"] (artı yönler),
      "cons": ["string", "string"] (eksi yönler veya riskler)
    }
  ],
  "summary": "string (genel değerlendirme özeti)"
}

En iyi 5 eşleşmeyi sırala. Eğer hiç uygun eşleşme yoksa boş liste dön ve summary'de nedenini açıkla.`;

export async function runAIMatching(
    client: Client,
    notes: ClientNote[],
    listings: any[]
): Promise<MatchingResponse> {
    if (!anthropic) {
        throw new Error('Anthropic API key is missing');
    }

    const userPrompt = `
MÜŞTERİ PROFİLİ:
- İsim: ${client.full_name}
- Bütçe: ${client.budget_min || 0} - ${client.budget_max || 'Limitsiz'} ${client.currency}
- Aranan Tip: ${client.wanted_types?.join(', ') || 'Farketmez'}
- Amaç: ${client.wanted_purpose === 'sale' ? 'Satılık' : 'Kiralık'}
- Lokasyon: ${client.wanted_city || 'Farketmez'} / ${client.wanted_districts?.join(', ') || 'Tümü'}

MÜŞTERİ NOTLARI (Kronolojik):
${notes.map(n => `- ${n.note}`).join('\n')}

MEVCUT PORTFÖYLER:
${listings.map(l => `
ID: ${l.id}
Başlık: ${l.title}
Tip: ${l.type}
Fiyat: ${l.price} ${l.currency}
Lokasyon: ${l.district}, ${l.city} (${l.neighborhood || ''})
Özellikler: ${l.rooms}, ${l.sqm}m², Asansör:${l.has_elevator ? 'Var' : 'Yok'}, Otopark:${l.has_parking ? 'Var' : 'Yok'}
Açıklama: ${l.description?.substring(0, 300) || 'Yok'}
---`).join('\n')}
`;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 4000,
            temperature: 0,
            system: MATCHING_SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: userPrompt,
                },
            ],
        });

        const content = response.content[0];
        if (content.type === 'text') {
            // Find JSON block if wrapped in markdown code blocks
            let jsonString = content.text;
            const match = jsonString.match(/```json\n([\s\S]*?)\n```/);
            if (match) {
                jsonString = match[1];
            }

            return JSON.parse(jsonString) as MatchingResponse;
        }

        throw new Error('Unexpected response format from AI');
    } catch (error) {
        console.error('AI Matching Error:', error);
        throw error;
    }
}
