import Anthropic from '@anthropic-ai/sdk';
import { type SupabaseClient } from '@supabase/supabase-js';
import { type ValuationParams } from '@/types/valuation';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateValuation(
    params: ValuationParams,
    marketData: any,
    currentPrice?: number
) {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('API Key eksik (ANTHROPIC_API_KEY). Sunucuyu yeniden başlatmayı deneyin.');
    }

    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 2000,
            system: `Sen bir emlak değerleme uzmanısın.
Verilen portföy detayları ve pazar verilerine göre kesin ve profesyonel bir değerleme yap.
JSON formatında yanıt ver.`,
            messages: [
                {
                    role: 'user',
                    content: `PORTFÖY BİLGİLERİ
━━━━━━━━━━━━━━━━━━━━━━━━
Mevcut Liste Fiyatı: ${currentPrice ? currentPrice.toLocaleString('tr-TR') + ' ₺' : 'Belirtilmemiş'}
Metrekare: ${params.sqm} m²
Oda: ${params.rooms}
Tip: ${params.type}
Yaş: ${params.age}
Lokasyon: ${params.district}, ${params.city}
Konum: ${params.floor}. kat
Özellikler: ${params.features.join(', ')}

PAZAR VERİLERİ (Bölge Ortalamaları)
━━━━━━━━━━━━━━━━━━━━━━━━
${marketData ? `
Ortalama Fiyat: ${marketData.average_price?.toLocaleString('tr-TR')} ₺
Medyan Fiyat: ${marketData.median_price?.toLocaleString('tr-TR')} ₺
Fiyat Aralığı: ${marketData.min_price?.toLocaleString('tr-TR')} - ${marketData.max_price?.toLocaleString('tr-TR')} ₺
Birim m² Fiyatı: ${marketData.price_per_sqm?.toLocaleString('tr-TR')} ₺
` : 'Bölge verisi tam olarak bulunamadı. Lütfen benzer emsallere ve genel piyasa bilgisine dayanarak tahmin yap.'}

TALEPLER:
1. Bu portföyün özelliklerine (kat, yaş, ekstra özellikler) göre tahmini piyasa değerini hesapla. 
   - Örneğin yeni bina, yüksek kat veya deniz manzarası varsa ortalamanın üzerine çık.
2. Fiyat skorunu ver (0-10 ölçeğinde, 10=çok uygun fiyat, 0=çok pahalı).
3. Pazar karşılaştırması yaz (kısa paragraf).
4. Fiyatlandırma önerileri sun (Hızlı satış fiyatı vs.).
5. Tahmini kira getirisi hesapla (Yıllık % yield).

Yanıt JSON Formatı:
{
  "estimated_market_price": 5500000,
  "price_range": { "min": 5200000, "max": 5800000 },
  "price_score": 7.5,
  "market_comparison": "...",
  "recommendations": "...",
  "rental_yield": 6.5
}`
                }
            ]
        });

        const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : '{}';

        return JSON.parse(jsonStr);

    } catch (error: any) {
        console.error('AI Valuation Error Details:', error);
        // Return clear error to UI
        if (error.status === 401) throw new Error('API Key geçersiz (401).');
        if (error.status === 429) throw new Error('AI Kota/Limit hatası (429).');
        throw new Error(error.message || 'Değerleme servisi çalışmadı.');
    }
}
