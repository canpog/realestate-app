# Implementation Plan v3 - Gelişmiş Özellikler & AI Entegrasyonları

**Proje:** TR Danışman CRM + Portföy Uygulaması  
**Versiyon:** 3.0  
**Tarih:** 05 Şubat 2026  
**Odak:** Takip Sistemi, Haberler Feed, Portfolio Kategorileri, AI Geliştirmeler, Fiyat Analizi, CRM Import, Komisyon & İstatistikler

---

## Tasarım Kısıtlamaları

- **Font Ailesi:** SF Pro Display, SF Pro Text, SF Mono (San Francisco Pro ailesinden)
- **İkonlar:** Lucide React veya Heroicons (emojiler kaldırıldı, yalnızca ikonlar kullanılacak)
- **Dil:** Türkçe
- **Platform:** Web (Next.js 14+)

---

## Mevcut Durum Özeti

V2'de tamamlanan özellikler:
- ✓ Auth & Profile
- ✓ Portföy CRUD + Harita
- ✓ CRM + Notlar
- ✓ PDF Oluşturma + Paylaşım
- ✓ AI Eşleştirme
- ✓ Dashboard & Navigasyon
- ✓ Dark Mode
- ✓ Command Palette
- ✓ Performans Optimizasyonu

---

## V3 Hedefleri

1. **Takip & Reminder Sistemi** - Müşteri takip planlama ve hatırlatmalar
2. **Haberler Feed Sistemi** - Gayrimenkul ve finans haberlerinin takibi
3. **Portfolio Kategorileri** - Portföyleri kategorize etme (Yatırım, Yaşam, vb.)
4. **AI Geliştirmeler** - Not özetleme, smart tavsiyeler, sentiment analizi
5. **Fiyat Analizi Modülü** - Bölge market analizi ve fiyat tahmini
6. **CRM Excel Import** - Toplu müşteri yükleme
7. **Komisyon Sistemi** - Danışman komisyon takibi
8. **Portfolio İstatistikleri** - Görüntülenme, mesaj, paylaşım metrikleri

---

## Sprint Planı

| Sprint | Ad | Süre | Başlangıç | Bitiş |
|--------|-----|------|-----------|-------|
| Sprint 11 | Takip & Reminder + Haberler Feed | 4-5 gün | Gün 1 | Gün 5 |
| Sprint 12 | Portfolio Kategorileri + AI Geliştirmeler | 4-5 gün | Gün 6 | Gün 10 |
| Sprint 13 | Fiyat Analizi Modülü | 4-5 gün | Gün 11 | Gün 15 |
| Sprint 14 | CRM Excel Import + Komisyon Sistemi | 3-4 gün | Gün 16 | Gün 19 |
| Sprint 15 | Portfolio İstatistikleri + Son Rötuşlar | 3-4 gün | Gün 20 | Gün 23 |

**Toplam Süre:** ~23 iş günü (4.5 hafta)

---

# Sprint 11: Takip & Reminder Sistemi + Haberler Feed

## 11.1 Takip Planlama Sistemi

### Veritabanı Değişiklikleri

```sql
-- Follow-up takip tablosu
CREATE TABLE follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Takip Detayları
    scheduled_at TIMESTAMPTZ NOT NULL,
    follow_up_type TEXT NOT NULL, -- 'call', 'message', 'meeting', 'email'
    notes TEXT,
    
    -- Durum
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'missed', 'rescheduled'
    completed_at TIMESTAMPTZ,
    
    -- Hatırlatmalar
    remind_15_min BOOLEAN DEFAULT FALSE,
    remind_1_hour BOOLEAN DEFAULT FALSE,
    remind_1_day BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_follow_ups_agent_id ON follow_ups(agent_id);
CREATE INDEX idx_follow_ups_client_id ON follow_ups(client_id);
CREATE INDEX idx_follow_ups_scheduled_at ON follow_ups(scheduled_at);
CREATE INDEX idx_follow_ups_status ON follow_ups(status);

-- Reminder gönderme logu
CREATE TABLE reminder_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follow_up_id UUID NOT NULL REFERENCES follow_ups(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL, -- '15_min', '1_hour', '1_day'
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivery_status TEXT DEFAULT 'pending' -- 'sent', 'failed'
);
```

### API Endpoints

```
POST   /api/follow-ups               # Yeni takip oluştur
GET    /api/follow-ups              # Takipleri listele (filtreleme)
GET    /api/follow-ups/:id          # Takip detayı
PATCH  /api/follow-ups/:id          # Takip güncelle (durum değiştir)
DELETE /api/follow-ups/:id          # Takip sil
POST   /api/follow-ups/:id/complete # Takipi tamamla
POST   /api/follow-ups/:id/reschedule # Takipi yeniden planla
```

### UI Bileşenleri

#### Follow-up Planlama Modal

```
Takip Planlaması
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Müşteri: [Ahmet Yılmaz ▼]

Takip Tarihi & Saati
[05.02.2026] [14:30]

Takip Türü
◉ Telefon Araması    ○ Mesaj    ○ Toplantı    ○ E-posta

Notlar
[Benzer portföy göstermek, bütçe sorusu sorma]

Hatırlatmalar
☑ 15 dakika öncesi
☑ 1 saat öncesi
☑ 1 gün öncesi

[İptal] [Planla]
```

#### Takip Takvimi Görünümü

```
Haftanın Takipleri
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pzt 03 Şub  │ Sal 04 Şub  │ Çar 05 Şub  │ Per 06 Şub  │ Cum 07 Şub
┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐
│ 14:00   │ │ │ 10:30   │ │ │ 09:00   │ │ │ 15:30   │ │ │ 11:00   │
│ Ahmet   │ │ │ Zeynep  │ │ │ Can     │ │ │ Fatma   │ │ │ Ali     │
│ Arama   │ │ │ Mesaj   │ │ │ Toplantı│ │ │ E-posta │ │ │ Arama   │
│ [1/3]   │ │ │ [2/2]   │ │ │ [0/0]   │ │ │ [1/1]   │ │ │ [0/3]   │
└─────────┘ │ └─────────┘ │ └─────────┘ │ └─────────┘ │ └─────────┘
```

#### Takip Listesi

```
Takip Bekleyenler (23)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Hepsi] [Bugün] [Hafta] [Kaçıldı]

┌─────────────────────────────────────────────────────┐
│ [Urgente - Kırmızı] 09:30 | Ahmet Yılmaz           │
│ Telefon Araması - 15 dakika sonra hatırlat          │
│ "Benzer portföy göstermek"                          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 14:00 | Zeynep Hanım                                │
│ Mesaj Gönderme - Tamamlama düğmesi                  │
│ "KDV durumuyla ilgili sorular"                      │
│ [Tamamla] [Ertele] [Sil]                            │
└─────────────────────────────────────────────────────┘
```

---

## 11.2 Missed Follow-up Bildirimleri

### Bildirim Sistemi

```sql
-- Bildirim tablosu
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    follow_up_id UUID REFERENCES follow_ups(id) ON DELETE SET NULL,
    
    -- Bildirim Detayları
    type TEXT NOT NULL, -- 'reminder', 'missed', 'completed', 'message'
    title TEXT NOT NULL,
    message TEXT,
    
    -- Durumu
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_agent_id ON notifications(agent_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

### Missed Follow-up Algılama

```typescript
// lib/ai/missed-followup-detection.ts
import Anthropic from '@anthropic-ai/sdk';

export async function detectMissedFollowups(
  agentId: string,
  supabase: SupabaseClient
): Promise<void> {
  // 1. Geçmiş tarihli pending takıpları bul
  const { data: missedFollowups } = await supabase
    .from('follow_ups')
    .select('*')
    .eq('agent_id', agentId)
    .eq('status', 'pending')
    .lt('scheduled_at', new Date().toISOString());

  if (!missedFollowups || missedFollowups.length === 0) return;

  // 2. Her missed follow-up için bildirim oluştur
  for (const followUp of missedFollowups) {
    const { data: client } = await supabase
      .from('clients')
      .select('full_name')
      .eq('id', followUp.client_id)
      .single();

    await supabase
      .from('notifications')
      .insert({
        agent_id: agentId,
        follow_up_id: followUp.id,
        type: 'missed',
        title: `Kaçırılan Takip: ${client?.full_name}`,
        message: `${followUp.follow_up_type} takibi saati geçti. Derhal yapmanız önerilir.`,
        is_read: false,
      });
  }
}
```

### Push Bildirimleri (Web Push API)

```typescript
// lib/notifications/push.ts
export async function sendPushNotification(
  subscription: PushSubscription,
  title: string,
  options: NotificationOptions
): Promise<void> {
  const payload = JSON.stringify({
    title,
    ...options,
  });

  // Server tarafında Supabase Function kullanılacak
  await fetch('/api/notifications/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription, payload }),
  });
}
```

---

## 11.3 Haberler Feed Sistemi

### Veritabanı Tasarımı

```sql
-- Haber kaynakları
CREATE TABLE news_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    source_type TEXT NOT NULL, -- 'rss', 'api', 'webhook'
    feed_url TEXT,
    api_key TEXT,
    category TEXT, -- 'real_estate', 'finance', 'market'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Çekilen Haberler
CREATE TABLE news_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES news_sources(id),
    
    -- Haber Detayları
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    image_url TEXT,
    article_url TEXT UNIQUE,
    
    -- Kategorize Etme
    category TEXT NOT NULL, -- 'gayrimenkul', 'borsa', 'ekonomi', 'merkez_bankası'
    tags TEXT[],
    
    -- Önemlilik
    importance_score FLOAT DEFAULT 0.5, -- 0-1
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Meta
    published_at TIMESTAMPTZ,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kullanıcı haber tercihler
CREATE TABLE user_news_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Tercihler
    categories TEXT[] DEFAULT '{"gayrimenkul", "borsa"}',
    keywords TEXT[],
    
    -- Bildirim Ayarları
    daily_digest BOOLEAN DEFAULT TRUE,
    important_only BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Haber Kaynakları (API İntegrasyonları)

```typescript
// lib/news/sources.ts

// 1. RSS Feed'ler (Gayrimenkul Siteleri)
const rssFeeds = [
  {
    name: 'Emlak.com Haberler',
    url: 'https://www.emlak.com/rss/haber',
    category: 'real_estate',
  },
  {
    name: 'Hürriyet Gayrimenkul',
    url: 'https://www.hurriyet.com.tr/rss/gayrimenkul/',
    category: 'real_estate',
  },
  {
    name: 'Sabah Ekonomi',
    url: 'https://www.sabah.com.tr/rss/ekonomi.xml',
    category: 'economy',
  },
];

// 2. API'ler
const newsApis = [
  {
    name: 'NewsAPI - Turkey',
    baseUrl: 'https://newsapi.org/v2/everything',
    queryParams: {
      country: 'tr',
      category: 'business',
    },
    apiKey: process.env.NEWSAPI_KEY,
  },
  {
    name: 'Financial Times API',
    baseUrl: 'https://api.ft.com/content/search/v1',
    queryParams: {
      queryString: 'real estate OR property',
    },
    apiKey: process.env.FT_API_KEY,
  },
];

// 3. Borsa İstanbul Haber Özeti
const stoneWebHook = {
  name: 'Borsa İstanbul - Endeksler',
  endpoint: 'https://www.borsaistanbul.com/api/indices',
  updateFrequency: 'hourly',
};
```

### Haber Çekme Job'ı (Server-side Cron)

```typescript
// app/api/cron/fetch-news/route.ts
import { createClient } from '@/lib/supabase/server';
import Parser from 'rss-parser';
import axios from 'axios';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();

  try {
    // 1. RSS Feed'lerden haber çek
    const parser = new Parser();
    const feeds = await supabase.from('news_sources').select('*');

    for (const feed of feeds.data || []) {
      if (feed.source_type === 'rss') {
        const parsed = await parser.parseURL(feed.feed_url);

        for (const item of parsed.items) {
          // Duplicate kontrolü
          const { data: existing } = await supabase
            .from('news_articles')
            .select('id')
            .eq('article_url', item.link)
            .single();

          if (existing) continue;

          // Haber ekle
          await supabase.from('news_articles').insert({
            source_id: feed.id,
            title: item.title,
            description: item.contentSnippet,
            content: item.content,
            article_url: item.link,
            image_url: item.enclosure?.url || null,
            category: feed.category,
            published_at: new Date(item.pubDate),
            importance_score: calculateImportance(item.title),
          });
        }
      }
    }

    // 2. NewsAPI'den haber çek
    const newsApiResponse = await axios.get(
      'https://newsapi.org/v2/everything',
      {
        params: {
          q: 'turkey real estate OR gayrimenkul',
          sortBy: 'publishedAt',
          language: 'tr',
          apiKey: process.env.NEWSAPI_KEY,
        },
      }
    );

    // Haberler ekle (duplicate kontrolü ile)
    for (const article of newsApiResponse.data.articles) {
      const { data: existing } = await supabase
        .from('news_articles')
        .select('id')
        .eq('article_url', article.url)
        .single();

      if (existing) continue;

      await supabase.from('news_articles').insert({
        source_id: (await supabase
          .from('news_sources')
          .select('id')
          .eq('name', 'NewsAPI - Turkey')
          .single()).data?.id,
        title: article.title,
        description: article.description,
        content: article.content,
        article_url: article.url,
        image_url: article.urlToImage,
        category: 'real_estate',
        published_at: new Date(article.publishedAt),
        importance_score: calculateImportance(article.title),
      });
    }

    return Response.json({ success: true, message: 'News fetched successfully' });
  } catch (error) {
    console.error('News fetch error:', error);
    return Response.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

function calculateImportance(title: string): number {
  // Başlıkta önemli kelimeleri ara
  const importantKeywords = [
    'çöküş',
    'kriz',
    'fiyat artışı',
    'merkez bankası',
    'faiz',
    'kur',
  ];

  let score = 0.5;
  for (const keyword of importantKeywords) {
    if (title.toLowerCase().includes(keyword)) {
      score += 0.2;
    }
  }

  return Math.min(score, 1.0);
}
```

### Haberler Feed UI

#### Feed Sayfası (`/news`)

```
Haberler & Market
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Tümü] [Gayrimenkul] [Borsa] [Ekonomi] [Merkez Bankası]

Filtre:  [Son 24 saat ▼]  [Önemli Haberler ☑]  [Benim Alanlarım ☑]

┌────────────────────────────────────────────────────┐
│ FEATURED (Günün Önemli Haberi)                     │
├────────────────────────────────────────────────────┤
│ [Haber Görseli]                                    │
│                                                    │
│ Merkez Bankası Politika Faizini 100 baz puan      │
│ düşürdü - Gayrimenkul Piyasası Canlanabilir       │
│                                                    │
│ Sabah Gazetesi • 2 saat önce                       │
│ [Devamını Oku →]                                   │
└────────────────────────────────────────────────────┘

Haberleri Kategoriye Göre
━━━━━━━━━━━━━━━━━━━━━━━━━

GAYRIMENKUL (12 haber)

┌──────────────────────────────────────────────┐
│ Kadıköy'de Yeni Konut Projesi Açıldı          │
│ Emlak.com • 1 saat önce                      │
│ İstanbul Teknik Üniversitesi yakınında...    │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ 2026 Gayrimenkul Kredileri Resesyonda        │
│ Hürriyet • 3 saat önce                       │
└──────────────────────────────────────────────┘

BORSA (8 haber)

┌──────────────────────────────────────────────┐
│ BIST100 Endeksi %2.5 Yükseldi                │
│ Borsa İstanbul • 30 dakika önce              │
│ Gayrimenkul şirketleri günün kazananları...  │
└──────────────────────────────────────────────┘
```

#### Haberler Dashboard Widget

```
Son Haberler (Dashboard'da)
━━━━━━━━━━━━━━━━━━━━━━━━━

[Günün Önemli Haberleri] [5 haber]

• Merkez Bankası Faiz Kararını Açıkladı
  Son 4 saat • ÖNEMLI

• İstanbul'da Yeni Bina Projesi Başladı
  Son 6 saat

• Gayrimenkul Kredileri Durmuş Gibi Gitti
  Son 8 saat
```

---

# Sprint 12: Portfolio Kategorileri + AI Geliştirmeler

## 12.1 Portfolio Kategorileri/Türleri

### Veritabanı Değişiklikleri

```sql
-- Portfolio kategorileri enumı
ALTER TABLE listings ADD COLUMN category TEXT DEFAULT 'general';
-- Kategoriler: 'general', 'investment', 'residence', 'commercial', 'land', 'vacation'

-- Portfolio özel etiketleri
CREATE TABLE listing_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    tag_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio markları (danışmanın kişisel notları)
CREATE TABLE listing_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    flag_type TEXT NOT NULL, -- 'priority', 'review', 'sold', 'under_offer'
    color TEXT DEFAULT 'blue', -- 'red', 'yellow', 'green', 'blue'
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Portfolio Kategorileri Tanımları

```typescript
// types/portfolio.ts
export const PORTFOLIO_CATEGORIES = {
  investment: {
    label: 'Yatırım Amaçlı',
    icon: 'TrendingUp',
    description: 'Kiralık gelir veya fiyat takdiri beklenen portföyler',
    color: '#10b981',
  },
  residence: {
    label: 'Yaşam Amaçlı',
    icon: 'Home',
    description: 'Konut olarak yaşamak için uygun portföyler',
    color: '#3b82f6',
  },
  commercial: {
    label: 'Ticari',
    icon: 'Building2',
    description: 'İş, dükkan, ofis gibi ticari alanlar',
    color: '#f59e0b',
  },
  land: {
    label: 'Arsa',
    icon: 'Map',
    description: 'İnşaat yapılabilir veya hammadde araziler',
    color: '#8b5cf6',
  },
  vacation: {
    label: 'Tatil Evi',
    icon: 'Sun',
    description: 'Turizm ve tatil amacıyla kullanılan portföyler',
    color: '#ec4899',
  },
  general: {
    label: 'Genel',
    icon: 'Tag',
    description: 'Kategorize edilmemiş portföyler',
    color: '#6b7280',
  },
};
```

### Portfolio Listesi Kategorile Ayrılmış

```
Portföyler
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Tümü] [Yatırım] [Yaşam] [Ticari] [Arsa] [Tatil]

YATIRIMI AMAÇLI (8 portföy)
┌────────────────────────────────────────┐
│ [Kırmızı Bayrak] 3+1 Maltepe Daire    │
│ Fiyat: 2.8M ₺                         │
│ Kira Getirisi: %6.5/yıl              │
│ [Etiketler: Deniz Manzarası, Yeni]   │
└────────────────────────────────────────┘

YAŞAM AMAÇLI (12 portföy)
┌────────────────────────────────────────┐
│ [Mavi] 4+1 Kadıköy Villa              │
│ Fiyat: 5.2M ₺                         │
│ Özellikleri: Bahçe, Havuz, Asansör    │
└────────────────────────────────────────┘

TİCARİ (5 portföy)
TATİL EVİ (3 portföy)
ARSA (2 portföy)
```

### Portfolio Düzenleme Modal'ında Kategori Seçimi

```
Portfolio Düzenle
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Temel Bilgiler]

Kategori Seçin:
┌─────────────────────────────────────────┐
│ ◉ Genel                                 │
│ ○ Yatırım Amaçlı                        │
│ ○ Yaşam Amaçlı                          │
│ ○ Ticari                                │
│ ○ Arsa                                  │
│ ○ Tatil Evi                             │
└─────────────────────────────────────────┘

Etiketler (Isteğe Bağlı)
[Etiket ekle...] 
[Deniz Manzarası] [Yeni] [Bahçe] [Havuz]

Bayrak (Kişisel İşaret)
○ Yok  ◉ Mavi  ○ Sarı  ○ Kırmızı  ○ Yeşil

Bayrak Notu:
[Buna özellikle dikkat et]

[İptal] [Kaydet]
```

---

## 12.2 AI Geliştirmeler

### 12.2.1 Otomatik Not Özetleme

```typescript
// lib/ai/note-summarization.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function summarizeClientNotes(
  clientId: string,
  notes: Array<{ text: string; date: string }>,
  supabase: SupabaseClient
): Promise<string> {
  const notesText = notes
    .map((n) => `[${n.date}] ${n.text}`)
    .join('\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
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
  const { data: client } = await supabase
    .from('clients')
    .select('notes_summary')
    .eq('id', clientId)
    .single();

  await supabase
    .from('clients')
    .update({
      notes_summary: summary,
    })
    .eq('id', clientId);

  return summary;
}
```

### 12.2.2 Smart Tavsiyeler

```typescript
// lib/ai/smart-suggestions.ts
import Anthropic from '@anthropic-ai/sdk';

export async function generateSmartSuggestions(
  clientId: string,
  supabase: SupabaseClient
): Promise<SmartSuggestion[]> {
  // Müşteri bilgilerini al
  const { data: client } = await supabase
    .from('clients')
    .select('*, client_notes(*)')
    .eq('id', clientId)
    .single();

  // Müşteriye uyabilecek portföyleri bul
  const { data: candidateListings } = await supabase
    .from('listings')
    .select('*')
    .eq('agent_id', client.agent_id)
    .in('status', ['available', 'reserved'])
    .limit(50);

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: `Sen bir emlak danışmanı asistanısın.
Müşteri tercihlerine göre en uygun portföyleri seç ve neden uygun olduğunu aç.
JSON formatında yan ıt ver.`,
    messages: [
      {
        role: 'user',
        content: `Müşteri: ${client.full_name}
Bütçe: ${client.budget_min} - ${client.budget_max} ₺
Tercihler: ${client.wanted_types?.join(', ')}
Lokasyon: ${client.wanted_city}, ${client.wanted_districts?.join(', ')}
Notlar: ${client.notes_summary}

Aday Portföyler:
${candidateListings
  ?.slice(0, 30)
  .map(
    (l) =>
      `ID: ${l.id}, Başlık: ${l.title}, Tip: ${l.type}, Fiyat: ${l.price}, Lokasyon: ${l.district}, ${l.city}`
  )
  .join('\n')}

Bu müşteri için 3 akıllı tavsiye ver. Her tavsiye şu bilgileri içermeli:
- Portföy ID'si
- Tavsiye başlığı
- Neden uygun? (2-3 cümle)
- Aksiyon önerisi

Yanıt formatı:
{
  "suggestions": [
    {
      "listing_id": "uuid",
      "title": "...",
      "reason": "...",
      "action": "..."
    }
  ]
}`,
      },
    ],
  });

  const content =
    response.content[0].type === 'text' ? response.content[0].text : '{}';
  const parsed = JSON.parse(content);

  return parsed.suggestions || [];
}
```

#### Smart Suggestions UI (Müşteri Detayında)

```
Müşteri: Ahmet Yılmaz
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Açılır Menü: Diğer Sekmeler]
[Notlar] [Kriterler] [Ön Verilen] ▼

Akıllı Tavsiyeler (AI tarafından oluşturuldu)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Yenile] [Tümü Gönder] [PDF Yap]

┌────────────────────────────────────────────────┐
│ Tavsiye 1: Maltepe'de Yeni 3+1 Daire           │
├────────────────────────────────────────────────┤
│ Skor: 94/100                                   │
│                                                │
│ Neden Uygun?                                   │
│ Müşteri Maltepe'yi tercih ediyor, bütçesinin │
│ içinde ve yeni bina. Kira getirisi %6.5.      │
│                                                │
│ Fiyat: 2.8M ₺ | Kira: 18.500 ₺/ay             │
│ Özellikleri: 3+1, 120m², 5. kat, Asansör      │
│                                                │
│ [Detay] [Müşteriye Gönder] [PDF Yap]           │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ Tavsiye 2: Kadıköy'de Villa (Yatırım)          │
├────────────────────────────────────────────────┤
│ Skor: 87/100                                   │
│                                                │
│ Neden Uygun?                                   │
│ Müşterinin notlarında denize yakın istiyor.  │
│ Bu villa Deniz Manzarasına sahip ve...        │
└────────────────────────────────────────────────┘
```

### 12.2.3 Sentiment Analysis (Not Duygu Analizi)

```typescript
// lib/ai/sentiment-analysis.ts
export async function analyzNotSentiment(
  clientId: string,
  supabase: SupabaseClient
): Promise<SentimentAnalysis> {
  const { data: notes } = await supabase
    .from('client_notes')
    .select('note')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!notes || notes.length === 0) {
    return { sentiment: 'neutral', score: 0, description: 'Not yok' };
  }

  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Aşağıdaki müşteri notlarının duygu analizini yap.
Sonuç: positive, negative, neutral
0-1 arasında score (1=çok pozitif, 0=çok negatif)
Kısa açıklama

Notlar:
${notes.map((n) => n.note).join('\n')}

JSON formatında:
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
  return JSON.parse(result);
}
```

#### Sentiment Göstergesi (Müşteri Kartında)

```
Müşteri Kartı
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ahmet Yılmaz

Durum: Sıcak
Duygu Analizi: Pozitif 📊

Son Not (5 gün önce):
"Portföyler çok beğendim, yakında
karar verecek. Pazartesi görüşelim."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

İletişim: 0532 xxx xx xx
BütçE: 2M - 3.5M ₺
```

---

# Sprint 13: Fiyat Analizi Modülü

## 13.1 Fiyat Analizi Sistemi

### Veritabanı Tasarımı

```sql
-- Market Analizi Verileri
CREATE TABLE market_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Konum Bilgileri
    city TEXT NOT NULL,
    district TEXT,
    neighborhood TEXT,
    
    -- Portfolio Özelliği Grubu
    listing_type TEXT NOT NULL, -- 'apartment', 'villa' vs.
    rooms TEXT, -- '2+1', '3+1' vs.
    age_range TEXT, -- 'new', '0-5_years', '5-10_years', '10+_years'
    
    -- Pazar Verisi
    average_price NUMERIC,
    min_price NUMERIC,
    max_price NUMERIC,
    median_price NUMERIC,
    price_per_sqm NUMERIC,
    
    -- İstatistikler
    sample_size INTEGER, -- Kaç portfolio'ya dayalı?
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio Fiyat Analiz Raporu
CREATE TABLE price_analysis_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Analiz Parametreleri (Danışman girişi)
    analysis_params JSONB, -- { rooms, age, condition, location_attractiveness }
    
    -- Sonuçlar (AI tarafından hesaplanmıştır)
    estimated_price NUMERIC,
    price_range_min NUMERIC,
    price_range_max NUMERIC,
    price_score FLOAT, -- 0-1, 1=harika fiyat, 0=pahalı
    market_comparison TEXT, -- "Bu portfolio bölge ortalamasından %15 ucuz"
    recommendations TEXT, -- Fiyatlandırma önerileri
    
    -- Meta
    analysis_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_market_analysis_location ON market_analysis(city, district);
CREATE INDEX idx_price_analysis_listing ON price_analysis_reports(listing_id);
```

### Fiyat Analizi Formu

```
Fiyat Analizi Yap
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Portfolio: [3+1 Maltepe Daire - 2.8M ₺]

Portföy Detayları
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Konum
Şehir: [İstanbul ▼]
İlçe: [Maltepe ▼]
Mahalle: [Fenerbahçe ▼]

Temel Özellikler
Tip: [Daire ▼]
Oda Sayısı: [3+1 ▼]
Metrekare: [120 m²]
Bulunduğu Kat: [5]
Toplam Kat: [10]

Bina Yaşı
Yapılış Yılı: [2020]
[○ Yeni (0-2 yıl)  ◉ Nispeten Yeni (2-5 yıl)  ○ Eski (5-10 yıl)  ○ Çok Eski (10+)]

Kondisyon & Özellikler
☑ Asansör         ☑ Otopark    ☑ Bahçe      ☑ Klima
☑ Doğalgaz        ☐ Havuz      ☐ Spor Alanı ☐ Güvenlik

Komşuluk Çekiciliği
Deniz Kıyısına Uzaklığı: [500m ▼]
Metroya Uzaklığı: [1.2km ▼]
Okula Uzaklığı: [800m ▼]
Alışveriş Merkezine: [1.5km ▼]
Parkı Yakınlığı: [300m ▼]

[Analiz Yap]
```

### Fiyat Analizi Sonucu

```
Fiyat Analizi Raporu
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Portfolio: 3+1 Maltepe Daire (120m²)
Analiz Tarihi: 05 Şubat 2026

ÖZET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Portfolio Fiyatı: 2.800.000 ₺
Tahmini Pazar Değeri: 2.750.000 - 3.050.000 ₺
Fiyat Skoru: 8/10 ✓ İYİ FİYAT

Fiyat/m²: 23.333 ₺ (Bölge Ortalaması: 22.500 ₺)
Oran: +3.7% (Bölge ortalamasından biraz üstü, ancak makul)

PAZAR ANALİZİ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bölge: Maltepe, İstanbul
Benzer Portföyler: 47 satılmış ilanlar (son 6 ay)

Ortalama Satış Fiyatı: 2.750.000 ₺
Medyan Fiyat: 2.850.000 ₺
Fiyat Aralığı: 2.200.000 - 3.500.000 ₺

Oda Sayısına Göre (3+1):
Ortalama: 2.690.000 ₺
Bu Portfolio: 2.800.000 ₺ (+4.1%)

Bina Yaşına Göre (2020, Nispeten Yeni):
Ortalama: 2.950.000 ₺
Bu Portfolio: 2.800.000 ₺ (-5.1%) ← Ucuz

DEĞERLENDIRME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Güçlü Yönleri:
✓ Denize yakınlık (500m) - Bölge ortalamasına göre %12 premium
✓ Yeni bina (2020) - İyi kondisyonda
✓ Tam Asansör, Otopark - Standart donanım

Zayıf Yönleri:
✗ Aslında zayıf yöne sahip değil

Fiyatlandırma Önerisi:
→ Mevcut fiyat (2.800.000 ₺) makul
→ Hızlı satış için: 2.750.000 ₺ (-1.8%)
→ Premium fiyat (deniz manzarası): 2.900.000 ₺ (+3.6%)

KIRACILIK GETİRİSİ (Yatırım Amaçlı)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bölgede Benzer Daire Kirası: 18.500 - 21.000 ₺/ay
Tahmini Aylık Kira: 19.500 ₺
Yıllık Kira Geliri: 234.000 ₺

Kira Getirisi (Rental Yield): %8.4/yıl ← YÜKSEK

Geri Dönüş Süresi: 12 yıl
Net Karlılık: %6-8 (harç, vergi sonrası)

[PDF İndir] [Müşteriye Gönder] [Devam Et]
```

### Fiyat Analizi API

```typescript
// app/api/price-analysis/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

interface PriceAnalysisRequest {
  listing_id: string;
  analysis_params: {
    rooms: string;
    age: string;
    condition: string;
    sqm: number;
    city: string;
    district: string;
    floor: number;
    features: string[];
  };
}

export async function POST(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body: PriceAnalysisRequest = await request.json();

  try {
    // 1. Pazar verilerini bul
    const { data: marketData } = await supabase
      .from('market_analysis')
      .select('*')
      .eq('city', body.analysis_params.city)
      .eq('district', body.analysis_params.district)
      .eq('listing_type', body.analysis_params.rooms)
      .single();

    if (!marketData) {
      return Response.json(
        { error: 'Market data not available for this area' },
        { status: 404 }
      );
    }

    // 2. Portfolio verilerini al
    const { data: listing } = await supabase
      .from('listings')
      .select('*')
      .eq('id', body.listing_id)
      .single();

    // 3. AI analizi yap
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `Sen bir emlak değerleme uzmanısın.
Verilen portföy detayları ve pazar verilerine göre:
1. Portföyün pazar değerini tahmin et
2. Fiyat skorunu hesapla (0-10, 10=mükemmel fiyat)
3. Pazar karşılaştırması yap
4. Fiyatlandırma önerileri sun
5. Yatırım getirisi hesapla

JSON formatında yanıt ver.`,
      messages: [
        {
          role: 'user',
          content: `PORTFÖY BİLGİLERİ
━━━━━━━━━━━━━━━━━━━━━━━━
Başlık: ${listing.title}
Mevcut Fiyat: ${listing.price.toLocaleString('tr-TR')} ₺
Metrekare: ${body.analysis_params.sqm} m²
Oda: ${body.analysis_params.rooms}
Yaş: ${body.analysis_params.age}
Lokasyon: ${body.analysis_params.district}, ${body.analysis_params.city}
Konum: ${body.analysis_params.floor}. kat
Özellikler: ${body.analysis_params.features.join(', ')}

PAZAR VERİLERİ
━━━━━━━━━━━━━━━━━━━━━━━━
Bölge Ortalama Fiyatı: ${marketData.average_price.toLocaleString('tr-TR')} ₺
Medyan Fiyat: ${marketData.median_price.toLocaleString('tr-TR')} ₺
Fiyat Aralığı: ${marketData.min_price.toLocaleString('tr-TR')} - ${marketData.max_price.toLocaleString('tr-TR')} ₺
Fiyat/m²: ${marketData.price_per_sqm.toLocaleString('tr-TR')} ₺
Örnek Sayısı: ${marketData.sample_size} satılmış portföy

TALEPLƏR:
1. Bu portföyün tahmini pazar değerini hesapla
2. Fiyat skorunu ver (0-10 ölçeğinde)
3. Pazar karşılaştırması yap
4. Fiyatlandırma önerileri sun
5. Kiralık getirisi hesapla

Yanıt JSON:
{
  "estimated_market_price": 2850000,
  "price_range": { "min": 2700000, "max": 3000000 },
  "price_score": 8.5,
  "price_per_sqm": 23750,
  "comparison": "...",
  "recommendations": "...",
  "rental_yield": 7.8,
  "valuation_notes": "..."
}`,
        },
      ],
    });

    const aiAnalysis = JSON.parse(
      response.content[0].type === 'text' ? response.content[0].text : '{}'
    );

    // 3. Raporu veritabanına kaydet
    const { data: report } = await supabase
      .from('price_analysis_reports')
      .insert({
        agent_id: (
          await supabase
            .from('agents')
            .select('id')
            .eq('auth_user_id', user.id)
            .single()
        ).data?.id,
        listing_id: body.listing_id,
        analysis_params: body.analysis_params,
        estimated_price: aiAnalysis.estimated_market_price,
        price_range_min: aiAnalysis.price_range.min,
        price_range_max: aiAnalysis.price_range.max,
        price_score: aiAnalysis.price_score,
        market_comparison: aiAnalysis.comparison,
        recommendations: aiAnalysis.recommendations,
      })
      .select()
      .single();

    return Response.json({
      success: true,
      analysis: {
        ...aiAnalysis,
        report_id: report?.id,
      },
    });
  } catch (error) {
    console.error('Price analysis error:', error);
    return Response.json(
      { error: 'Price analysis failed' },
      { status: 500 }
    );
  }
}
```

---

# Sprint 14: CRM Excel Import + Komisyon Sistemi

## 14.1 CRM Excel Import Sistemi

### Excel Formatı Şablonu

```
Dosya Adı: customer_import_template.xlsx
Sayfalar: 1. Müşteriler, 2. Talimatlar

SAYFASI 1: MÜŞTERİLER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ad Soyad*       | Telefon*        | E-posta        | Durum        | Bütçe Min  | Bütçe Max  | İstenen Tip | İstenen Şehir | Not
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Ahmet Yılmaz    | 0532 111 1111   | ahmet@email.com| new         | 2000000    | 3500000    | Daire,Villa | İstanbul      | Denize yakın arayor
Zeynep Hanım    | 0533 222 2222   | zeynep@mail.com| hot         | 1500000    | 2500000    | Daire       | Ankara        |
Can Demir       | 0534 333 3333   | can@email.com  | following   | 3000000    | 5000000    | Villa       | İzmir         | Tatil evi
...

* = Zorunlu alan
Durum: new, following, hot, cold, closed
İstenen Tip: Daire, Villa, Arsa, Ticari, Ofis, Dükkan (virgülle ayrılmış)

SAYFASI 2: TALIMATLАР
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Ad Soyad: Tam adı yazınız (Zorunlu)
2. Telefon: 0532 123 4567 formatında (Zorunlu)
3. E-posta: valid@email.com formatında (Opsiyonel)
4. Durum: new, following, hot, cold, closed (Varsayılan: new)
5. Bütçe Min/Max: Sayı olarak, ₺ işareti olmadan (Opsiyonel)
6. İstenen Tip: Virgülle ayrılmış (Daire, Villa, vb.)
7. İstenen Şehir: Türkiye il adı (Opsiyonel)
8. Not: Herhangi bir not veya bilgi (Opsiyonel)
```

### Excel Import Yapısı

```typescript
// lib/import/excel-parser.ts
import XLSX from 'xlsx';
import * as z from 'zod';

// Validasyon şeması
const CustomerRowSchema = z.object({
  'Ad Soyad': z.string().min(1),
  'Telefon': z.string().regex(/^\d{10,11}$/),
  'E-posta': z.string().email().optional(),
  'Durum': z.enum(['new', 'following', 'hot', 'cold', 'closed']).default('new'),
  'Bütçe Min': z.number().optional(),
  'Bütçe Max': z.number().optional(),
  'İstenen Tip': z.string().optional(),
  'İstenen Şehir': z.string().optional(),
  'Not': z.string().optional(),
});

export async function parseExcelFile(
  file: File,
  agentId: string
): Promise<ParsedCustomerData[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  // İlk sheet'i oku
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  const parsedCustomers: ParsedCustomerData[] = [];
  const errors: ValidationError[] = [];

  jsonData.forEach((row, index) => {
    try {
      const validated = CustomerRowSchema.parse(row);

      parsedCustomers.push({
        full_name: validated['Ad Soyad'],
        phone: validated['Telefon'],
        email: validated['E-posta'],
        status: validated['Durum'],
        budget_min: validated['Bütçe Min'],
        budget_max: validated['Bütçe Max'],
        wanted_types: validated['İstenen Tip']
          ?.split(',')
          .map((t) => t.trim()),
        wanted_city: validated['İstenen Şehir'],
        notes: validated['Not'],
        agent_id: agentId,
      });
    } catch (error) {
      errors.push({
        row: index + 2, // +2 çünkü header satırı var ve 0'dan başlıyor
        error: error instanceof z.ZodError 
          ? error.errors[0].message 
          : 'Unknown error',
      });
    }
  });

  if (errors.length > 0) {
    throw new ValidationError('Excel validation failed', errors);
  }

  return parsedCustomers;
}
```

### Import UI

```
Müşteri İçe Aktarma
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Dosya Seç
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────┐
│ Dosyanızı buraya sürükleyin veya tıklayın   │
│ [Excel Dosyası Seç...]                      │
│                                             │
│ Desteklenen: .xlsx, .xls                    │
│ Maks boyut: 5MB                             │
│                                             │
│ [Şablon İndir]                              │
└─────────────────────────────────────────────┘

Dosya Seçildi: customers.xlsx (2.3MB)

Step 2: Ön İzleme & Doğrulama
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Toplam Kayıt: 45
✓ Geçerli: 43
✗ Hata: 2

Hatalar:
- Satır 5: Telefon formatı yanlış (0532 111)
- Satır 12: Ad Soyad eksik

Ön İzleme (İlk 5):
┌──────────────────────────────────────────────┐
│ 1. Ahmet Yılmaz | 0532 111 1111 | new        │
│ 2. Zeynep Hanım | 0533 222 2222 | hot        │
│ 3. Can Demir    | 0534 333 3333 | following  │
└──────────────────────────────────────────────┘

[Geri] [İçe Aktar]

Step 3: İçe Aktarma Tamamlandı
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ 43 müşteri başarıyla içe aktarıldı!
✗ 2 müşteri hata nedeniyle atlandı

Ayrıntılar:
- Yeni müşteri: 35
- Mevcut müşteri (güncellendi): 8

[Müşteri Listesine Git] [Başa Dön]
```

### Import API Endpoint

```typescript
// app/api/import/customers/route.ts
export async function POST(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }

  try {
    // Dosyayı parse et
    const parsedCustomers = await parseExcelFile(
      file,
      (await supabase
        .from('agents')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()).data?.id || ''
    );

    // Veritabanına toplu insert
    const { data, error } = await supabase
      .from('clients')
      .insert(parsedCustomers)
      .select();

    if (error) throw error;

    return Response.json({
      success: true,
      imported: data?.length || 0,
      message: `${data?.length || 0} müşteri başarıyla içe aktarıldı`,
    });
  } catch (error) {
    console.error('Import error:', error);
    return Response.json({ error: 'Import failed' }, { status: 500 });
  }
}
```

---

## 14.2 Komisyon Sistemi

### Veritabanı Tasarımı

```sql
-- Komisyon yapılandırması
CREATE TABLE commission_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Komisyon Oranları
    default_commission_rate FLOAT DEFAULT 0.05, -- %5
    tiered_rates JSONB, -- { "0_1M": 0.05, "1M_3M": 0.04, "3M+": 0.03 }
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Satış/Kira Takibi
CREATE TABLE sales_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    listing_id UUID NOT NULL REFERENCES listings(id),
    
    -- İşlem Detayları
    transaction_type TEXT NOT NULL, -- 'sale', 'rental'
    transaction_date DATE NOT NULL,
    selling_price NUMERIC NOT NULL,
    
    -- Komisyon Hesaplama
    commission_rate FLOAT NOT NULL,
    commission_amount NUMERIC NOT NULL,
    
    -- Durum
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'paid', 'cancelled'
    paid_date DATE,
    
    -- Notlar
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_agent_id ON sales_transactions(agent_id);
CREATE INDEX idx_sales_status ON sales_transactions(status);
CREATE INDEX idx_sales_date ON sales_transactions(transaction_date);
```

### Komisyon Hesaplama

```typescript
// lib/commission/calculator.ts
export function calculateCommission(
  salePrice: number,
  commissionRate: float,
  tierSystem?: {
    ranges: Array<{ min: number; max: number; rate: number }>;
  }
): CommissionResult {
  let commission = 0;

  if (tierSystem) {
    // Kademeli komisyon hesaplama
    for (const tier of tierSystem.ranges) {
      if (salePrice >= tier.min) {
        const tierMax = tier.max || salePrice;
        const tierAmount = Math.min(salePrice, tierMax) - tier.min;
        commission += tierAmount * tier.rate;
      }
    }
  } else {
    // Sabit oran
    commission = salePrice * commissionRate;
  }

  return {
    gross_amount: commission,
    tax: commission * 0.18, // %18 KDV
    net_amount: commission * 0.82,
  };
}
```

### Satış Takibi UI

```
Satış & Kiralama Takibi
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Yeni Satış Kaydı] [Yeni Kira Kaydı]

ÖZET (Bu Ay)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Toplam Satış: 3         Satış Tutarı: 8.500.000 ₺
Toplam Kira: 2          Kira Tutarı: 450.000 ₺

Toplam Komisyon: 425.000 ₺
Vergi (KDV %18): 76.500 ₺
Net Gelir: 348.500 ₺

SATIŞLAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌──────────────────────────────────────────────────────┐
│ [Tümü] [Beklemede] [Tamamlandı] [Ödendi] [İptal]    │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ 03 Şub | 3+1 Maltepe Daire | 2.800.000 ₺           │
│ Müşteri: Ahmet Yılmaz      | Durum: Tamamlandı      │
│ Komisyon: %5 = 140.000 ₺   | [Detay] [Ödeme Yap]    │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ 02 Şub | 4+1 Kadıköy Villa | 5.200.000 ₺           │
│ Müşteri: Can Demir         | Durum: Beklemede       │
│ Komisyon: %5 = 260.000 ₺   | [Detay] [Tamamla]      │
└──────────────────────────────────────────────────────┘

KİRALA KAYDÊ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Aylık Kira Geliri: 47.500 ₺
Yıllık: 570.000 ₺
Komisyon (yıllık): 28.500 ₺ (%5)
```

---

# Sprint 15: Portfolio İstatistikleri + Son Rötuşlar

## 15.1 Portfolio İstatistikleri Sistemi

### Veritabanı Tasarımı

```sql
-- Portfolio Görüntülenme Takibi
CREATE TABLE listing_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Görüntüleyen Bilgisi
    viewer_id UUID REFERENCES clients(id), -- Müşteri ise
    anonymous BOOLEAN DEFAULT FALSE,
    ip_address INET,
    user_agent TEXT,
    
    -- Meta
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio Mesaj Takibi
CREATE TABLE listing_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    
    -- Mesaj Detayları
    inquiry_type TEXT NOT NULL, -- 'message', 'phone_call', 'whatsapp', 'email'
    message TEXT,
    
    -- Durum
    status TEXT DEFAULT 'new', -- 'new', 'replied', 'archived'
    replied_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio Paylaşım Takibi
CREATE TABLE listing_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Paylaşım Bilgisi
    share_type TEXT NOT NULL, -- 'whatsapp', 'email', 'facebook', 'link', 'pdf'
    recipient_identifier TEXT, -- E-posta, telefon, vb.
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listing_views_listing ON listing_views(listing_id);
CREATE INDEX idx_listing_views_date ON listing_views(viewed_at);
CREATE INDEX idx_listing_inquiries_listing ON listing_inquiries(listing_id);
CREATE INDEX idx_listing_shares_listing ON listing_shares(listing_id);
```

### Portfolio İstatistikleri Sayfası

```
Portfolio Detayı: 3+1 Maltepe Daire
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Geri]

[Temel Bilgiler] [Görseller] [Müşteriler] [İstatistikler] [Ayarlar]

İSTATİSTİKLER SEKMESI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Yayında: 28 gündür | Son Güncellenme: 3 gün önce

GENEL İSTATİSTİKLER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  Toplam          │  Son 7 Gün      │  Son 30 Gün     │  Toplam         │
│  Görüntülenme    │  Görüntülenme   │  Görüntülenme   │  Sorgu          │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│  1,245           │  340            │  950            │  87             │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘

SORGU VERİLERİ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Toplam Mesaj: 87
├─ WhatsApp: 45 (51.7%)
├─ Telefon Araması: 23 (26.4%)
├─ E-posta: 12 (13.8%)
└─ Diğer: 7 (8.0%)

Yanıtsız Mesajlar: 12 (13.8%)
Ortalama Yanıt Süresi: 2.3 saat

TEKLİFLER & KONVERSİYON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sıcak Leads (İlgilenen): 12
Somut Teklifler: 3
Başarılı Satış: 1 ✓

Konversiyon Oranı: 0.08% (87 görüntülenme → 1 satış)

ZAMAN DÜSTRİBÜSYONU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Saatlik Görüntülenme Grafiği:
│
│     ┃
│  ┃  ┃
│  ┃  ┃  ┃  ┃
│  ┃  ┃  ┃  ┃  ┃
│  ┃  ┃  ┃  ┃  ┃  ┃     ┃
┗━┻━┻━┻━┻━┻━┻━┻━┻━┻━→ Saat
  00 04 08 12 16 20

En Yüksek Zaman: 18:00 - 20:00 (234 görüntülenme)

PAYLAŞıM KAYNAĞA GÖRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Doğrudan Link: 450 (36.1%)
PDF İndirme: 234 (18.8%)
WhatsApp Paylaşımı: 189 (15.2%)
E-posta Paylaşımı: 145 (11.6%)
Facebook: 67 (5.4%)
Diğer: 160 (12.8%)

ÜLKE/ŞEHİR DÜSTRİBÜSYONU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Türkiye: 1,100 (88%)
├─ İstanbul: 890 (80.8%)
├─ Ankara: 120 (10.9%)
├─ İzmir: 90 (8.2%)

Yurtdışı: 145 (12%)
├─ Almanya: 45 (31%)
├─ Birleşik Krallık: 32 (22%)
├─ Kanada: 28 (19%)

CİHAZ DÜSTRİBÜSYONU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bilgisayar: 750 (60.2%)
Mobil: 389 (31.2%)
Tablet: 106 (8.5%)

[Export PDF] [Paylaş] [Gelişmiş Raporlar]
```

### İstatistikler API

```typescript
// app/api/listings/[id]/stats/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const stats = await Promise.all([
    // Toplam görüntülenme
    supabase
      .from('listing_views')
      .select('*', { count: 'exact' })
      .eq('listing_id', params.id),

    // Son 7 günün görüntülenmesi
    supabase
      .from('listing_views')
      .select('*', { count: 'exact' })
      .eq('listing_id', params.id)
      .gte(
        'viewed_at',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      ),

    // Mesajlar
    supabase
      .from('listing_inquiries')
      .select('inquiry_type, status')
      .eq('listing_id', params.id),

    // Paylaşımlar
    supabase
      .from('listing_shares')
      .select('share_type')
      .eq('listing_id', params.id),
  ]);

  return Response.json({
    total_views: stats[0].count || 0,
    views_7days: stats[1].count || 0,
    inquiries: stats[2].data || [],
    shares: stats[3].data || [],
  });
}
```

---

## 15.2 Son Rötuşlar & Optimizasyonlar

### Performans İyileştirmeleri
- Portfolio liste sayfası infinite scroll optimize
- İstatistik grafikleri lazy-load
- Harita cluster'ları cache
- AI yanıtları progressive streaming

### UI/UX Finalleştirmesi
- Hata sayfalarında empty state görseller
- Toast notifikasyonlar detaylı
- Loading skeletons tüm sayfalarda
- Keyboard shortcut'lar dokumentasyonu

### Accessibility (A11y)
- ARIA labels tüm interaktif elementi
- Color contrast kontrol
- Tab order düzeltme
- Screen reader testi

### SEO Optimizasyonu
- Meta tag'leri dinamik
- Open Graph (sosyal paylaşım)
- Structured data (Schema.org)
- Sitemap ve robots.txt

---

## Ek: Araçlar & Paketler

```json
{
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.2.0",
    "typescript": "^5.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "@anthropic-ai/sdk": "^0.9.0",
    "@react-pdf/renderer": "^3.0.0",
    "mapbox-gl": "^2.15.0",
    "react-map-gl": "^7.1.0",
    "framer-motion": "^10.0.0",
    "lucide-react": "^0.263.0",
    "xlsx": "^0.18.5",
    "react-hook-form": "^7.45.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.1.0",
    "date-fns": "^2.30.0",
    "nanoid": "^4.0.0",
    "axios": "^1.5.0"
  }
}
```

---

## Kabul Kriterleri V3

### Sprint 11 (Takip & Haberler)
- [ ] Takip planlama sistemi çalışıyor
- [ ] Missed follow-up bildirimleri gönderiliyor
- [ ] Haberler feed sayfası live
- [ ] RSS ve API haber kaynakları entegre
- [ ] Haberler kategorize gösteriliyor

### Sprint 12 (Portfolio & AI)
- [ ] Portfolio kategorileri seçilebiliyor
- [ ] Etiketler ve bayraklar çalışıyor
- [ ] Not özetleme AI işlev görüyor
- [ ] Smart suggestions gösteriliyor
- [ ] Sentiment analizi yapılıyor

### Sprint 13 (Fiyat Analizi)
- [ ] Fiyat analizi formu doldurulabiliyor
- [ ] AI fiyat analizi rapor üretiyor
- [ ] Market comparison gösterilyor
- [ ] Kira getirisi hesaplandı
- [ ] Fiyat skoru verilyor

### Sprint 14 (Import & Komisyon)
- [ ] Excel şablonu indirilir
- [ ] Excel import işliyor
- [ ] Validation hataları gösterilir
- [ ] Komisyon oranları konfigüre edilebiliyor
- [ ] Satış takibi çalışıyor

### Sprint 15 (İstatistikler)
- [ ] İstatistikler sayfası live
- [ ] Grafikleri gösterilyor
- [ ] Dağılım verileri hesaplanıyor
- [ ] Konversiyon oranı gösterilyor
- [ ] PDF export işliyor

---

## Zaman Çizelgesi

| Sprint | Ad | Süre | Toplam |
|--------|-----|------|--------|
| S11 | Takip & Haberler | 4-5 gün | 4-5 |
| S12 | Portfolio & AI | 4-5 gün | 8-10 |
| S13 | Fiyat Analizi | 4-5 gün | 12-15 |
| S14 | Import & Komisyon | 3-4 gün | 15-19 |
| S15 | İstatistikler & Final | 3-4 gün | 18-23 |

**Toplam: ~23 iş günü (4.5 hafta)**

---

**Doküman Sonu**

Implementation_Plan_v3.0 - Antigravity Build Specification
