import Anthropic from '@anthropic-ai/sdk';
import { Client, ClientNote } from '@/types/client';

// Initialize Anthropic client
const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

const SUMMARIZER_SYSTEM_PROMPT = `Sen uzman bir gayrimenkul danışmanı asistanısın. Görevin, bir müşteriye ait alınan notları analiz ederek kısa, öz ve aksiyon odaklı bir özet çıkarmaktır.

Analiz Ederken Dikkat Etmen Gerekenler:
1. Müşterinin Temel İhtiyacı: Ne arıyor? (Daire, Villa, Arsa vb.)
2. Bütçe ve Finansal Durum: Bütçe aralığı, kredi durumu, nakit durumu.
3. Lokasyon Tercihleri: Hangi bölgeler, hangi mahalleler?
4. Motivasyon ve Aciliyet: Ne kadar ciddi? Hemen mi almak istiyor yoksa araştırma mı yapıyor?
5. Kişisel Detaylar: Aile durumu, yaşam tarzı (sessizlik sever, kalabalık sever vb.)

Çıktı Formatı:
Başlıklar halinde Markdown formatında bir özet sun. Örnek:

**Genel Profil:**
Yatırım amaçlı 2+1 daire arayan ciddi alıcı.

**Tercihler:**
- **Lokasyon:** Kadıköy, Suadiye
- **Bütçe:** 10M - 12M TL
- **Özellikler:** Yeni bina, otoparklı

**Dikkat:**
Kredi faizlerinden çekiniyor, pazarlık yapmak istiyor.

Not: Yorum katma, sadece notlardaki bilgileri derle. Eğer bilgi yetersizse "Belirtilmemiş" yazma, o maddeyi geç.`;

export async function summarizeClientNotes(
    client: Client,
    notes: ClientNote[]
): Promise<string> {
    if (!anthropic) {
        throw new Error('Anthropic API key is missing');
    }

    if (notes.length === 0) {
        return "Henüz özetlenecek bir not bulunmuyor.";
    }

    const userPrompt = `
MÜŞTERİ: ${client.full_name} (${client.status})

ALINAN NOTLAR (Tarih Sırasına Göre):
${notes.map(n => `- ${new Date(n.created_at).toLocaleDateString()}: ${n.note}`).join('\n')}

Lütfen bu müşterinin profilini ve arayışını özetle.
`;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            temperature: 0.3,
            system: SUMMARIZER_SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: userPrompt,
                },
            ],
        });

        const content = response.content[0];
        if (content.type === 'text') {
            return content.text;
        }

        throw new Error('Unexpected response format from AI');
    } catch (error) {
        console.error('AI Summarization Error:', error);
        throw error;
    }
}
