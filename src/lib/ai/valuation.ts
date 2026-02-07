import Anthropic from '@anthropic-ai/sdk';
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
        console.log('[AI Valuation] Generating with market data:', marketData ? 'Yes' : 'No');

        const prompt = `Sen Türkiye emlak piyasasında uzmanlaşmış kıdemli bir mülk değerleme uzmanısın.
Görev: Aşağıdaki mülk için doğru bir fiyat değerlemesi yapmak.

KRİTİK TALİMATLAR:
1. Sana aşağıda "PAZAR VERİLERİ (Gerçek Veriler)" başlığı altında sunduğum veriler, bu bölgedeki GÜNCEL ve GERÇEK piyasa verileridir. MUTLAKA bu istatistikleri (ortalama fiyat, m² fiyatı vb.) baz alarak hesaplama yap. Eğer genel bilginle çelişirse, VERİLEN PAZAR VERİLERİNE ÖNCELİK VER.
2. Yanıtındaki "recommendations" objesi içinde MUTLAKA "notes" alanı olmalı. Yoksa bile fiyat anahtarlarını (normal_price, quick_sale_price vb.) eksiksiz dön.

PORTFÖY BİLGİLERİ
═══════════════════════════════════════
Mevcut Liste Fiyatı: ${currentPrice ? currentPrice.toLocaleString('tr-TR') + ' ₺' : 'Belirtilmemiş'}
Metrekare: ${params.sqm} m²
Oda Sayısı: ${params.rooms}
Tip: ${params.type}
Bina Yaşı: ${params.age > 0 ? params.age + ' Yıllık' : 'Sıfır Bina (Yeni)'}
Lokasyon: ${params.district}, ${params.city}
Konum: ${params.floor}. kat
Özellikler: ${Array.isArray(params.features) ? params.features.join(', ') : ''}

PAZAR VERİLERİ ${marketData ? '(Gerçek Veriler - BUNLARI KULLAN)' : '(Veri Yok - Tahmin Yap)'}
═══════════════════════════════════════════
Bölge: ${params.district}, ${params.city}
${marketData ? `
DURUM: elimizde bu bölge ve özellikler için GÜNCEL veriler var. Analizini buna dayandır.
Kayıtlı Emsal Sayısı: ${marketData.sample_size} adet
Bölge Ortalaması: ${marketData.average_price?.toLocaleString('tr-TR')} ₺
Medyan Fiyat: ${marketData.median_price?.toLocaleString('tr-TR')} ₺
Bölge Fiyat Aralığı: ${marketData.min_price?.toLocaleString('tr-TR')} - ${marketData.max_price?.toLocaleString('tr-TR')} ₺
Bölge m² Birim Fiyatı: ${marketData.price_per_sqm?.toLocaleString('tr-TR')} ₺
Veri Tarihi: ${marketData.updated_at ? new Date(marketData.updated_at).toLocaleDateString('tr-TR') : 'Güncel'}
` : 'Bu bölge için güncel pazar verisi bulunamadı. Genel piyasa bilgine ve mülk özelliklerine dayanarak en iyi tahminini yap.'}

TALEPLER:
1. Bu portföyün özelliklerine (kat, yaş, ekstra özellikler) göre tahmini piyasa değerini hesapla. 
2. Fiyat skorunu ver (0-10 ölçeğinde, 10=harika fiyat).
3. Pazar karşılaştırması yaz.
4. Fiyatlandırma önerileri sun ("recommendations" objesi altında notes ve fiyatlar).
5. Tahmini kira getirisi hesapla.

Yanıt JSON Formatı:
{
  "estimated_market_price": 7500000,
  "price_range": { "min": 7100000, "max": 8000000 },
  "price_score": 8.5,
  "market_comparison": "Bölge ortalaması olan 7.5 milyon TL civarındadır...",
  "recommendations": {
    "normal_price": 7500000,
    "quick_sale_price": 7150000,
    "premium_price": 7950000,
    "notes": "Mülkün konumu ve yeni olması sebebiyle..."
  },
  "rental_yield": 7.2
}`;

        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 2000,
            messages: [{ role: 'user', content: prompt }]
        });

        const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : '{}';

        return JSON.parse(jsonStr);

    } catch (error: any) {
        console.error('AI Valuation Error Details:', error);
        if (error.status === 401) throw new Error('API Key geçersiz (401).');
        if (error.status === 429) throw new Error('AI Kota/Limit hatası (429).');
        throw new Error(error.message || 'Değerleme servisi çalışmadı.');
    }
}
