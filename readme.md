# TR Danışman CRM + Portföy Uygulaması - Antigravity Build Specification

Bu doküman, Türkiye merkezli emlak danışmanları için geliştirilecek CRM ve Portföy Yönetim uygulamasının **Antigravity + Cloud Code** ile build edilmesi için hazırlanmış detaylı teknik spesifikasyondur.

**Doküman Versiyonu:** v2.0  
**Hedef Platform:** Web MVP (Next.js) → Sonra Mobil  
**Build Tool:** Antigravity + Cloud Code

---

## 📋 İçindekiler

1. [Proje Özeti](#1-proje-özeti)
2. [API Anahtarları ve Ortam Değişkenleri](#2-api-anahtarları-ve-ortam-değişkenleri)
3. [Teknoloji Yığını](#3-teknoloji-yığını)
4. [Proje Yapısı](#4-proje-yapısı)
5. [Veritabanı Şeması](#5-veritabanı-şeması)
6. [RLS Politikaları](#6-rls-politikaları)
7. [API Endpoints](#7-api-endpoints)
8. [Sayfa ve Bileşen Yapısı](#8-sayfa-ve-bileşen-yapısı)
9. [UI/UX Detayları](#9-uiux-detayları)
10. [Eşleştirme Motoru](#10-eşleştirme-motoru)
11. [PDF Generator](#11-pdf-generator)
12. [Güvenlik ve Performans](#12-güvenlik-ve-performans)
13. [Kabul Kriterleri](#13-kabul-kriterleri)
14. [Build Talimatları](#14-build-talimatları)

---

## 1. Proje Özeti

### 1.1 Amaç
Türkiye'deki emlak danışmanlarının (agent) portföy ve müşteri yönetimini tek bir platformda yapabilmelerini sağlamak.

### 1.2 Temel Özellikler
- **Portföy Yönetimi**: Emlak ilanları ekleme, düzenleme, görsel yükleme
- **Harita Görünümü**: Portföyleri harita üzerinde pin olarak görüntüleme
- **CRM Sistemi**: Müşteri yönetimi, not tutma, takip
- **PDF Oluşturma**: Portföy detaylarından profesyonel PDF üretme
- **AI Eşleştirme**: Müşteri ihtiyaçlarına göre uygun portföy önerisi

### 1.3 Kullanıcı Profili
- **Tek Rol**: Danışman (Agent)
- Danışman kendi verilerini görür ve yönetir
- Her veri `agent_id` ile izole edilir

---

## 2. API Anahtarları ve Ortam Değişkenleri

### 2.1 Anthropic API Key (AI Eşleştirme için)
```
ANTHROPIC_API_KEY=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
```

### 2.2 21st.dev API Key (UI Bileşenleri için)
```
TWENTYFIRST_DEV_API_KEY=048ebc0f07df0f7c4e5cf9abb7ebd3009c32c14fb182488b8b2b66bdce227c56
```

**21st.dev CLI Kurulum Komutu:**
```bash
npx -y @21st-dev/cli@latest install cline --api-key "048ebc0f07df0f7c4e5cf9abb7ebd3009c32c14fb182488b8b2b66bdce227c56"
```

### 2.3 Supabase Ortam Değişkenleri

> **ÖNEMLİ:** Supabase bilgileri Antigravity tarafından proje klasörüne `.env.local` dosyası olarak eklenecektir.

`.env.local` dosya yapısı:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=<SUPABASE_PROJECT_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>

# Anthropic API
ANTHROPIC_API_KEY=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

# 21st.dev
TWENTYFIRST_DEV_API_KEY=048ebc0f07df0f7c4e5cf9abb7ebd3009c32c14fb182488b8b2b66bdce227c56

# Mapbox (Harita için)
NEXT_PUBLIC_MAPBOX_TOKEN=<MAPBOX_PUBLIC_TOKEN>
```

---

## 3. Teknoloji Yığını

### 3.1 Frontend
| Teknoloji | Kullanım Alanı |
|-----------|----------------|
| Next.js 14+ (App Router) | Ana framework |
| TypeScript | Tip güvenliği |
| Tailwind CSS | Stil yönetimi |
| 21st.dev Components | UI bileşenleri |
| Mapbox GL JS | Harita entegrasyonu |
| React Hook Form | Form yönetimi |
| Zod | Validasyon |

### 3.2 Backend
| Teknoloji | Kullanım Alanı |
|-----------|----------------|
| Supabase | BaaS (Backend as a Service) |
| PostgreSQL | Veritabanı |
| Supabase Auth | Kimlik doğrulama |
| Supabase Storage | Dosya depolama |
| Supabase RLS | Satır seviyesi güvenlik |

### 3.3 Server-side Logic (Cloud Code)
| Teknoloji | Kullanım Alanı |
|-----------|----------------|
| Next.js API Routes | API katmanı |
| Anthropic Claude API | AI eşleştirme |
| @react-pdf/renderer | PDF üretimi |

---

## 4. Proje Yapısı

```
tr-danisman-crm/
├── .env.local                    # Ortam değişkenleri (Antigravity ekleyecek)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Ana sayfa (redirect to dashboard)
│   │   │
│   │   ├── (auth)/               # Auth grubu
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/          # Dashboard grubu (protected)
│   │   │   ├── layout.tsx        # Sidebar layout
│   │   │   ├── dashboard/page.tsx
│   │   │   │
│   │   │   ├── listings/         # Portföy modülü
│   │   │   │   ├── page.tsx      # Liste görünümü
│   │   │   │   ├── map/page.tsx  # Harita görünümü
│   │   │   │   ├── new/page.tsx  # Yeni portföy
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx  # Detay
│   │   │   │       └── edit/page.tsx
│   │   │   │
│   │   │   ├── clients/          # CRM modülü
│   │   │   │   ├── page.tsx      # Müşteri listesi
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx  # Müşteri detay + notlar + eşleştirme
│   │   │   │       └── edit/page.tsx
│   │   │   │
│   │   │   └── profile/page.tsx  # Danışman profili
│   │   │
│   │   └── api/                  # API Routes
│   │       ├── listings/
│   │       │   ├── route.ts      # GET (list), POST (create)
│   │       │   └── [id]/
│   │       │       ├── route.ts  # GET, PATCH, DELETE
│   │       │       ├── media/route.ts
│   │       │       └── pdf/route.ts
│   │       │
│   │       ├── clients/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── notes/route.ts
│   │       │       └── match/route.ts
│   │       │
│   │       ├── pdf/
│   │       │   └── [shareToken]/route.ts  # Public PDF görüntüleme
│   │       │
│   │       └── profile/route.ts
│   │
│   ├── components/
│   │   ├── ui/                   # 21st.dev bileşenleri
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── data-table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── drawer.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── page-header.tsx
│   │   │
│   │   ├── listings/
│   │   │   ├── listing-card.tsx
│   │   │   ├── listing-form.tsx
│   │   │   ├── listing-filters.tsx
│   │   │   ├── listing-table.tsx
│   │   │   ├── listing-map.tsx
│   │   │   ├── listing-detail-drawer.tsx
│   │   │   ├── media-upload.tsx
│   │   │   └── pdf-generator-modal.tsx
│   │   │
│   │   ├── clients/
│   │   │   ├── client-card.tsx
│   │   │   ├── client-form.tsx
│   │   │   ├── client-table.tsx
│   │   │   ├── client-notes.tsx
│   │   │   ├── client-criteria-form.tsx
│   │   │   └── match-results.tsx
│   │   │
│   │   └── shared/
│   │       ├── map-picker.tsx
│   │       ├── image-gallery.tsx
│   │       ├── status-badge.tsx
│   │       ├── price-display.tsx
│   │       ├── empty-state.tsx
│   │       └── loading-skeleton.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser client
│   │   │   ├── server.ts         # Server client
│   │   │   └── middleware.ts     # Auth middleware
│   │   │
│   │   ├── ai/
│   │   │   └── matching.ts       # Anthropic eşleştirme
│   │   │
│   │   ├── pdf/
│   │   │   └── generator.ts      # PDF üretim logic
│   │   │
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   └── validations.ts        # Zod schemas
│   │
│   ├── hooks/
│   │   ├── use-listings.ts
│   │   ├── use-clients.ts
│   │   ├── use-auth.ts
│   │   └── use-media-upload.ts
│   │
│   └── types/
│       ├── database.ts           # Supabase generated types
│       ├── listing.ts
│       ├── client.ts
│       └── index.ts
│
├── public/
│   ├── images/
│   └── icons/
│
└── supabase/
    ├── migrations/               # SQL migrations
    │   └── 001_initial_schema.sql
    └── seed.sql                  # Test data (opsiyonel)
```

---

## 5. Veritabanı Şeması

### 5.1 SQL Migration Script

```sql
-- =====================================================
-- TR Danışman CRM - Veritabanı Şeması
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. AGENTS (Danışmanlar)
-- =====================================================
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    company TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. LISTINGS (Portföyler)
-- =====================================================
CREATE TYPE listing_type AS ENUM ('apartment', 'villa', 'land', 'commercial', 'office', 'shop');
CREATE TYPE listing_status AS ENUM ('available', 'sold', 'reserved', 'rented');
CREATE TYPE listing_purpose AS ENUM ('sale', 'rent');

CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Temel Bilgiler
    title TEXT NOT NULL,
    description TEXT,
    type listing_type NOT NULL,
    purpose listing_purpose DEFAULT 'sale',
    status listing_status DEFAULT 'available',
    
    -- Fiyat
    price NUMERIC NOT NULL,
    currency TEXT DEFAULT 'TRY',
    
    -- Özellikler
    sqm NUMERIC,
    rooms TEXT, -- "3+1", "2+1", "Studio" vb.
    floor_number INTEGER,
    total_floors INTEGER,
    building_age INTEGER,
    heating_type TEXT,
    has_elevator BOOLEAN DEFAULT FALSE,
    has_parking BOOLEAN DEFAULT FALSE,
    has_balcony BOOLEAN DEFAULT FALSE,
    has_garden BOOLEAN DEFAULT FALSE,
    is_furnished BOOLEAN DEFAULT FALSE,
    
    -- Konum
    address_text TEXT,
    city TEXT NOT NULL,
    district TEXT,
    neighborhood TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listings_agent_id ON listings(agent_id);
CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_location ON listings(lat, lng);

CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. LISTING_MEDIA (Portföy Görselleri)
-- =====================================================
CREATE TABLE listing_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    sort_order INTEGER DEFAULT 0,
    is_cover BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listing_media_listing_id ON listing_media(listing_id);

-- =====================================================
-- 4. CLIENTS (CRM Müşterileri)
-- =====================================================
CREATE TYPE client_status AS ENUM ('new', 'following', 'hot', 'cold', 'closed');

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Kişisel Bilgiler
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    
    -- Durum
    status client_status DEFAULT 'new',
    
    -- Bütçe
    budget_min NUMERIC,
    budget_max NUMERIC,
    currency TEXT DEFAULT 'TRY',
    
    -- İstekler / Kriterler
    wanted_types listing_type[],
    wanted_purpose listing_purpose DEFAULT 'sale',
    wanted_rooms TEXT[], -- ["3+1", "4+1"]
    wanted_sqm_min NUMERIC,
    wanted_sqm_max NUMERIC,
    wanted_city TEXT,
    wanted_districts TEXT[],
    wanted_neighborhoods TEXT[],
    
    -- AI için özet alan
    notes_summary TEXT,
    
    -- Takip
    last_contact_at TIMESTAMPTZ,
    next_followup_at TIMESTAMPTZ,
    
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_agent_id ON clients(agent_id);
CREATE INDEX idx_clients_status ON clients(status);

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. CLIENT_NOTES (Müşteri Notları)
-- =====================================================
CREATE TABLE client_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_notes_client_id ON client_notes(client_id);

-- =====================================================
-- 6. PDF_EXPORTS (PDF Dışa Aktarımları)
-- =====================================================
CREATE TABLE pdf_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    share_token TEXT UNIQUE NOT NULL,
    file_name TEXT,
    download_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ, -- Opsiyonel: link süresi dolma
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pdf_exports_share_token ON pdf_exports(share_token);
CREATE INDEX idx_pdf_exports_listing_id ON pdf_exports(listing_id);

-- =====================================================
-- 7. MATCHES (Eşleştirme Sonuçları)
-- =====================================================
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Skorlama
    score NUMERIC NOT NULL,
    
    -- Eşleştirme nedenleri (JSON)
    reasons JSONB,
    -- Örnek: {
    --   "budget": {"match": true, "note": "Bütçe uyumlu"},
    --   "location": {"match": true, "note": "İstenen ilçede"},
    --   "type": {"match": true, "note": "Daire arıyor, daire bulundu"},
    --   "ai_notes": "Müşteri denize yakın istiyor, bu portföy sahil yakınında"
    -- }
    
    -- AI tarafından mı üretildi
    is_ai_generated BOOLEAN DEFAULT FALSE,
    
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matches_client_id ON matches(client_id);
CREATE INDEX idx_matches_listing_id ON matches(listing_id);
CREATE UNIQUE INDEX idx_matches_unique ON matches(client_id, listing_id);

-- =====================================================
-- 8. Türkiye Lokasyon Verileri (Opsiyonel - Seed Data)
-- =====================================================
CREATE TABLE tr_cities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    plate_code TEXT
);

CREATE TABLE tr_districts (
    id SERIAL PRIMARY KEY,
    city_id INTEGER REFERENCES tr_cities(id),
    name TEXT NOT NULL
);

-- Not: Bu tablolar için seed data ayrıca yüklenecek
```

### 5.2 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────────┐
│   agents    │       │  listings   │       │  listing_media  │
├─────────────┤       ├─────────────┤       ├─────────────────┤
│ id (PK)     │──┐    │ id (PK)     │──┐    │ id (PK)         │
│ auth_user_id│  │    │ agent_id(FK)│◄─┼────│ listing_id (FK) │
│ full_name   │  │    │ title       │  │    │ agent_id (FK)   │
│ phone       │  │    │ type        │  │    │ storage_path    │
│ email       │  │    │ price       │  │    │ sort_order      │
│ company     │  ├───►│ sqm         │  │    └─────────────────┘
└─────────────┘  │    │ city        │  │
                 │    │ lat/lng     │  │    ┌─────────────────┐
                 │    └─────────────┘  │    │   pdf_exports   │
                 │                     │    ├─────────────────┤
                 │    ┌─────────────┐  │    │ id (PK)         │
                 │    │   clients   │  ├───►│ listing_id (FK) │
                 │    ├─────────────┤  │    │ agent_id (FK)   │
                 │    │ id (PK)     │  │    │ share_token     │
                 ├───►│ agent_id(FK)│  │    │ storage_path    │
                 │    │ full_name   │  │    └─────────────────┘
                 │    │ status      │  │
                 │    │ budget_*    │  │    ┌─────────────────┐
                 │    │ wanted_*    │  │    │    matches      │
                 │    └─────────────┘  │    ├─────────────────┤
                 │          │          │    │ id (PK)         │
                 │          │          │    │ client_id (FK)  │
                 │          ▼          ├───►│ listing_id (FK) │
                 │    ┌─────────────┐  │    │ agent_id (FK)   │
                 │    │client_notes │  │    │ score           │
                 │    ├─────────────┤  │    │ reasons (JSON)  │
                 ├───►│ agent_id(FK)│  │    └─────────────────┘
                      │ client_id   │
                      │ note        │
                      └─────────────┘
```

---

## 6. RLS Politikaları

```sql
-- =====================================================
-- Row Level Security (RLS) Politikaları
-- =====================================================

-- Tüm tablolarda RLS'i etkinleştir
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- AGENTS Politikaları
-- =====================================================
CREATE POLICY "Agents can view own profile"
    ON agents FOR SELECT
    USING (auth_user_id = auth.uid());

CREATE POLICY "Agents can update own profile"
    ON agents FOR UPDATE
    USING (auth_user_id = auth.uid());

CREATE POLICY "Agents can insert own profile"
    ON agents FOR INSERT
    WITH CHECK (auth_user_id = auth.uid());

-- =====================================================
-- LISTINGS Politikaları
-- =====================================================
-- Önce agent_id'yi auth.uid() ile eşleştirmek için helper function
CREATE OR REPLACE FUNCTION get_agent_id()
RETURNS UUID AS $$
    SELECT id FROM agents WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE POLICY "Agents can view own listings"
    ON listings FOR SELECT
    USING (agent_id = get_agent_id());

CREATE POLICY "Agents can insert own listings"
    ON listings FOR INSERT
    WITH CHECK (agent_id = get_agent_id());

CREATE POLICY "Agents can update own listings"
    ON listings FOR UPDATE
    USING (agent_id = get_agent_id());

CREATE POLICY "Agents can delete own listings"
    ON listings FOR DELETE
    USING (agent_id = get_agent_id());

-- =====================================================
-- LISTING_MEDIA Politikaları
-- =====================================================
CREATE POLICY "Agents can view own listing media"
    ON listing_media FOR SELECT
    USING (agent_id = get_agent_id());

CREATE POLICY "Agents can insert own listing media"
    ON listing_media FOR INSERT
    WITH CHECK (agent_id = get_agent_id());

CREATE POLICY "Agents can delete own listing media"
    ON listing_media FOR DELETE
    USING (agent_id = get_agent_id());

-- =====================================================
-- CLIENTS Politikaları
-- =====================================================
CREATE POLICY "Agents can view own clients"
    ON clients FOR SELECT
    USING (agent_id = get_agent_id());

CREATE POLICY "Agents can insert own clients"
    ON clients FOR INSERT
    WITH CHECK (agent_id = get_agent_id());

CREATE POLICY "Agents can update own clients"
    ON clients FOR UPDATE
    USING (agent_id = get_agent_id());

CREATE POLICY "Agents can delete own clients"
    ON clients FOR DELETE
    USING (agent_id = get_agent_id());

-- =====================================================
-- CLIENT_NOTES Politikaları
-- =====================================================
CREATE POLICY "Agents can view own client notes"
    ON client_notes FOR SELECT
    USING (agent_id = get_agent_id());

CREATE POLICY "Agents can insert own client notes"
    ON client_notes FOR INSERT
    WITH CHECK (agent_id = get_agent_id());

CREATE POLICY "Agents can delete own client notes"
    ON client_notes FOR DELETE
    USING (agent_id = get_agent_id());

-- =====================================================
-- PDF_EXPORTS Politikaları
-- =====================================================
CREATE POLICY "Agents can view own pdf exports"
    ON pdf_exports FOR SELECT
    USING (agent_id = get_agent_id());

CREATE POLICY "Agents can insert own pdf exports"
    ON pdf_exports FOR INSERT
    WITH CHECK (agent_id = get_agent_id());

-- =====================================================
-- MATCHES Politikaları
-- =====================================================
CREATE POLICY "Agents can view own matches"
    ON matches FOR SELECT
    USING (agent_id = get_agent_id());

CREATE POLICY "Agents can insert own matches"
    ON matches FOR INSERT
    WITH CHECK (agent_id = get_agent_id());

CREATE POLICY "Agents can delete own matches"
    ON matches FOR DELETE
    USING (agent_id = get_agent_id());

-- =====================================================
-- Storage Bucket Politikaları
-- =====================================================
-- Bucket: listing-media
-- Bucket: pdf-exports

-- listing-media bucket için
CREATE POLICY "Agents can upload listing media"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'listing-media' AND
        (storage.foldername(name))[1] = (SELECT id::text FROM agents WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Agents can view own listing media"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'listing-media' AND
        (storage.foldername(name))[1] = (SELECT id::text FROM agents WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Agents can delete own listing media"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'listing-media' AND
        (storage.foldername(name))[1] = (SELECT id::text FROM agents WHERE auth_user_id = auth.uid())
    );

-- pdf-exports bucket için (public okuma için token bazlı)
CREATE POLICY "Public can view pdf with token"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'pdf-exports');
```

---

## 7. API Endpoints

### 7.1 Authentication

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/register` | Yeni danışman kaydı |
| POST | `/api/auth/login` | Giriş |
| POST | `/api/auth/logout` | Çıkış |
| GET | `/api/auth/me` | Mevcut kullanıcı bilgisi |

### 7.2 Profile

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/profile` | Danışman profili getir |
| PATCH | `/api/profile` | Profil güncelle |

### 7.3 Listings (Portföy)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/listings` | Liste (filtreleme, sayfalama) |
| POST | `/api/listings` | Yeni portföy oluştur |
| GET | `/api/listings/:id` | Portföy detayı |
| PATCH | `/api/listings/:id` | Portföy güncelle |
| DELETE | `/api/listings/:id` | Portföy sil |
| POST | `/api/listings/:id/media` | Görsel yükle (signed URL al) |
| DELETE | `/api/listings/:id/media/:mediaId` | Görsel sil |
| POST | `/api/listings/:id/pdf` | PDF oluştur |

**GET `/api/listings` Query Parameters:**
```typescript
{
  page?: number;          // Sayfa numarası (default: 1)
  limit?: number;         // Sayfa başına kayıt (default: 20)
  search?: string;        // Başlık/adres araması
  type?: ListingType;     // apartment, villa, land, commercial
  status?: ListingStatus; // available, sold, reserved
  purpose?: ListingPurpose; // sale, rent
  city?: string;
  district?: string;
  priceMin?: number;
  priceMax?: number;
  sqmMin?: number;
  sqmMax?: number;
  rooms?: string;         // "3+1"
  sortBy?: 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}
```

### 7.4 Clients (CRM)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/clients` | Müşteri listesi |
| POST | `/api/clients` | Yeni müşteri |
| GET | `/api/clients/:id` | Müşteri detayı |
| PATCH | `/api/clients/:id` | Müşteri güncelle |
| DELETE | `/api/clients/:id` | Müşteri sil |
| GET | `/api/clients/:id/notes` | Notları getir |
| POST | `/api/clients/:id/notes` | Not ekle |
| DELETE | `/api/clients/:id/notes/:noteId` | Not sil |
| POST | `/api/clients/:id/match` | Eşleştirme çalıştır |
| GET | `/api/clients/:id/matches` | Eşleştirme sonuçları |

### 7.5 PDF

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/pdf/:shareToken` | Public PDF görüntüleme/indirme |

### 7.6 Lokasyon (Yardımcı)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/locations/cities` | Şehir listesi |
| GET | `/api/locations/districts?cityId=:id` | İlçe listesi |

---

## 8. Sayfa ve Bileşen Yapısı

### 8.1 Sayfa Detayları

#### 8.1.1 Dashboard (`/dashboard`)
```
┌─────────────────────────────────────────────────────┐
│ Header: Hoş geldin, [Ad Soyad]                      │
├─────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐ │
│ │ Toplam  │ │ Toplam  │ │ Sıcak   │ │ Bu Hafta    │ │
│ │ Portföy │ │ Müşteri │ │ Müşteri │ │ PDF         │ │
│ │   24    │ │   18    │ │    5    │ │    12       │ │
│ └─────────┘ └─────────┘ └─────────┘ └─────────────┘ │
├─────────────────────────────────────────────────────┤
│ Hızlı Aksiyonlar                                    │
│ ┌──────────────────┐  ┌──────────────────┐          │
│ │ + Yeni Portföy   │  │ + Yeni Müşteri   │          │
│ └──────────────────┘  └──────────────────┘          │
├─────────────────────────────────────────────────────┤
│ Son Eklenen Portföyler                              │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Listing Card 1 | Listing Card 2 | Listing Card 3│ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Takip Bekleyen Müşteriler                           │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Client Row 1                                    │ │
│ │ Client Row 2                                    │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### 8.1.2 Portföy Listesi (`/listings`)
```
┌─────────────────────────────────────────────────────┐
│ Page Header: Portföyler              [+ Yeni Ekle]  │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ [🔍 Ara...]  [Tip ▼] [Durum ▼] [Fiyat ▼]        │ │
│ │                              [📋 Liste] [🗺 Harita]│ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ DataTable                                       │ │
│ │ ┌─────┬──────────┬────────┬────────┬─────────┐  │ │
│ │ │ 📷  │ Başlık   │ Fiyat  │ Tip    │ Durum   │  │ │
│ │ ├─────┼──────────┼────────┼────────┼─────────┤  │ │
│ │ │ img │ 3+1 Da...│ 2.5M ₺ │ Daire  │ 🟢 Aktif│  │ │
│ │ │ img │ Villa ...│ 8.2M ₺ │ Villa  │ 🟡 Rsrv │  │ │
│ │ └─────┴──────────┴────────┴────────┴─────────┘  │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Pagination: < 1 2 3 ... 10 >                        │
└─────────────────────────────────────────────────────┘
```

#### 8.1.3 Portföy Harita Görünümü (`/listings/map`)
```
┌─────────────────────────────────────────────────────┐
│ Filters Bar (same as list)                          │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┬───────────────────┐ │
│ │                             │ Detail Panel      │ │
│ │     MAPBOX MAP              │ (Drawer/Sheet)    │ │
│ │                             │                   │ │
│ │    📍 2.5M      📍 3.1M      │ ┌───────────────┐ │ │
│ │         📍 1.8M              │ │ [Image]       │ │ │
│ │                             │ │ Title         │ │ │
│ │    📍 4.2M                   │ │ Price: 2.5M ₺ │ │ │
│ │                             │ │ Type: Daire   │ │ │
│ │                             │ │ Rooms: 3+1    │ │ │
│ │                             │ │ [Detay] [PDF] │ │ │
│ │                             │ └───────────────┘ │ │
│ └─────────────────────────────┴───────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### 8.1.4 Portföy Ekleme (`/listings/new`)
```
┌─────────────────────────────────────────────────────┐
│ Page Header: Yeni Portföy Ekle                      │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Wizard Steps:                                   │ │
│ │ [1. Temel ●] [2. Konum ○] [3. Özellik ○]        │ │
│ │ [4. Görseller ○] [5. Önizleme ○]                │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Step 1: Temel Bilgiler                              │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Başlık: [________________________]              │ │
│ │ Tip:    [Daire ▼]  Amaç: [Satılık ▼]            │ │
│ │ Fiyat:  [__________] [TRY ▼]                    │ │
│ │ Açıklama: [________________________]            │ │
│ │           [________________________]            │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│                              [Geri] [Sonraki Adım]  │
└─────────────────────────────────────────────────────┘
```

#### 8.1.5 CRM Müşteri Detay (`/clients/:id`)
```
┌─────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────┐   │
│ │ 👤 Ahmet Yılmaz          [🟢 Sıcak]  [Düzenle] │   │
│ │ 📞 0532 xxx xx xx  ✉️ ahmet@email.com          │   │
│ │ 💰 Bütçe: 2.000.000 - 3.500.000 ₺             │   │
│ └───────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│ Tabs: [📝 Notlar] [🎯 Kriterler] [🏠 Öneriler]       │
├─────────────────────────────────────────────────────┤
│ Tab: Notlar                                         │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Not yaz...                              ] [+]  │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ 📅 02.02.2026                                   │ │
│ │ "Denize yakın arıyor, bahçe olursa tercih..."   │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ 📅 28.01.2026                                   │ │
│ │ "Kadıköy veya Maltepe ilçelerini tercih ediyor" │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Tab: Öneriler (Eşleştirme)                          │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [🔄 Eşleştirmeyi Çalıştır]                      │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ Match Card 1: Skor 92/100                       │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ 📷 | 3+1 Daire - Kadıköy | 2.8M ₺           │ │ │
│ │ │     ✅ Bütçe uygun ✅ Lokasyon uygun          │ │ │
│ │ │     ✅ "Denize yakın, 500m mesafede"          │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 8.2 Bileşen Listesi (21st.dev)

| Bileşen | Kullanım Yeri |
|---------|---------------|
| `Sidebar` | Ana navigasyon (desktop) |
| `BottomNav` | Mobil navigasyon |
| `DataTable` | Portföy ve müşteri listeleri |
| `Card` | Dashboard metrikler, liste kartları |
| `Sheet/Drawer` | Detay panelleri, yan menüler |
| `Dialog/Modal` | PDF oluşturma, onay dialogları |
| `Form` | Tüm formlar |
| `Input`, `Select`, `Textarea` | Form elemanları |
| `Button` | Aksiyonlar |
| `Badge` | Durum etiketleri |
| `Toast` | Bildirimler |
| `Tabs` | Müşteri detay sekmeler |
| `Command` | Hızlı arama (Cmd+K) |
| `Skeleton` | Yükleme durumları |
| `EmptyState` | Boş liste durumları |

---

## 9. UI/UX Detayları

### 9.1 Renk Paleti

```css
/* Primary Colors */
--primary: #2563eb;        /* Blue 600 */
--primary-hover: #1d4ed8;  /* Blue 700 */

/* Status Colors */
--status-available: #22c55e;  /* Green 500 */
--status-reserved: #eab308;   /* Yellow 500 */
--status-sold: #ef4444;       /* Red 500 */
--status-rented: #8b5cf6;     /* Violet 500 */

/* Client Status */
--client-new: #3b82f6;      /* Blue 500 */
--client-following: #f59e0b; /* Amber 500 */
--client-hot: #ef4444;       /* Red 500 */
--client-cold: #6b7280;      /* Gray 500 */
--client-closed: #10b981;    /* Emerald 500 */

/* Background */
--bg-primary: #ffffff;
--bg-secondary: #f9fafb;
--bg-sidebar: #1f2937;
```

### 9.2 Responsive Breakpoints

```css
/* Tailwind defaults */
sm: 640px   /* Mobil landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### 9.3 Navigasyon Yapısı

**Desktop Sidebar:**
```
┌─────────────────┐
│ 🏠 TR Danışman  │
├─────────────────┤
│ 📊 Dashboard    │
│ 🏠 Portföyler   │
│   └─ Liste      │
│   └─ Harita     │
│ 👥 Müşteriler   │
├─────────────────┤
│ ⚙️ Ayarlar      │
│ 👤 Profil       │
└─────────────────┘
```

**Mobile Bottom Nav:**
```
┌──────┬──────┬──────┬──────┬──────┐
│  📊  │  🏠  │  ➕  │  👥  │  👤  │
│ Ana  │ Port │ Ekle │ CRM  │ Prof │
└──────┴──────┴──────┴──────┴──────┘
```

### 9.4 Form Validasyon Mesajları (Türkçe)

```typescript
const messages = {
  required: 'Bu alan zorunludur',
  email: 'Geçerli bir e-posta adresi giriniz',
  phone: 'Geçerli bir telefon numarası giriniz',
  minLength: (min: number) => `En az ${min} karakter giriniz`,
  maxLength: (max: number) => `En fazla ${max} karakter giriniz`,
  minValue: (min: number) => `Değer en az ${min} olmalıdır`,
  maxValue: (max: number) => `Değer en fazla ${max} olmalıdır`,
  invalidFormat: 'Geçersiz format',
}
```

---

## 10. Eşleştirme Motoru

### 10.1 Akış Diyagramı

```
┌─────────────────┐
│ Müşteri Seçildi │
│ + "Eşleştir"    │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 1. Kural Bazlı  │
│    Ön Eleme     │
│ (DB Query)      │
└────────┬────────┘
         ▼
┌─────────────────┐
│ ~500 → ~30      │
│ portföy         │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 2. Heuristic    │
│    Skorlama     │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 3. AI Analizi   │
│ (Anthropic)     │
│ - Notları oku   │
│ - Soft pref çık │
│ - Portföy eşle  │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Top 5 Sonuç     │
│ + Nedenler      │
└────────┬────────┘
         ▼
┌─────────────────┐
│ matches tablosu │
│ kaydet          │
└─────────────────┘
```

### 10.2 Kural Bazlı Eleme (SQL)

```sql
-- Müşteri kriterlerine göre portföy filtresi
SELECT l.*
FROM listings l
WHERE l.agent_id = :agentId
  AND l.status = 'available'
  -- Tip uyumu
  AND (
    :wantedTypes IS NULL 
    OR l.type = ANY(:wantedTypes)
  )
  -- Bütçe uyumu (%10 tolerans)
  AND (
    l.price BETWEEN :budgetMin * 0.9 AND :budgetMax * 1.1
  )
  -- Şehir uyumu
  AND (
    :wantedCity IS NULL 
    OR l.city = :wantedCity
  )
  -- İlçe uyumu
  AND (
    :wantedDistricts IS NULL 
    OR l.district = ANY(:wantedDistricts)
  )
  -- m² uyumu
  AND (
    (:sqmMin IS NULL OR l.sqm >= :sqmMin)
    AND (:sqmMax IS NULL OR l.sqm <= :sqmMax)
  )
ORDER BY l.created_at DESC
LIMIT 50;
```

### 10.3 Heuristic Skorlama

```typescript
interface ScoreWeights {
  budget: 40;      // Bütçe uyumu ağırlığı
  type: 25;        // Tip uyumu
  location: 25;    // Lokasyon uyumu
  features: 10;    // Özellikler (oda, m²)
}

function calculateScore(client: Client, listing: Listing): number {
  let score = 0;
  
  // Bütçe skoru (0-40)
  const budgetMatch = calculateBudgetMatch(client, listing);
  score += budgetMatch * 40;
  
  // Tip skoru (0-25)
  if (client.wanted_types?.includes(listing.type)) {
    score += 25;
  }
  
  // Lokasyon skoru (0-25)
  const locationScore = calculateLocationScore(client, listing);
  score += locationScore * 25;
  
  // Özellik skoru (0-10)
  const featureScore = calculateFeatureScore(client, listing);
  score += featureScore * 10;
  
  return Math.round(score);
}
```

### 10.4 AI Prompt Template

```typescript
const MATCHING_SYSTEM_PROMPT = `Sen bir emlak danışmanı asistanısın. Türkiye emlak pazarında çalışıyorsun.

Görevin: Müşteri notlarını ve kriterlerini analiz edip, aday portföylerden en uygun olanları seçmek.

Analiz yaparken dikkat et:
- Müşteri notlarındaki "soft" tercihleri yakala (denize yakın, sessiz mahalle, yatırım amaçlı vb.)
- Portföy açıklamalarını bu tercihlerle eşleştir
- Bütçe ve lokasyon uyumunu değerlendir
- Uyumsuzlukları ve riskleri de belirt

Yanıtını JSON formatında ver.`;

const MATCHING_USER_PROMPT = (client: Client, notes: Note[], listings: ListingSummary[]) => `
## Müşteri Bilgileri
- İsim: ${client.full_name}
- Bütçe: ${client.budget_min} - ${client.budget_max} ${client.currency}
- Aranan Tip: ${client.wanted_types?.join(', ')}
- Tercih Edilen Lokasyonlar: ${client.wanted_city}, ${client.wanted_districts?.join(', ')}

## Son Notlar
${notes.map(n => `- ${n.note}`).join('\n')}

## Aday Portföyler
${listings.map((l, i) => `
${i + 1}. ID: ${l.id}
   Başlık: ${l.title}
   Tip: ${l.type}
   Fiyat: ${l.price} ${l.currency}
   Lokasyon: ${l.district}, ${l.city}
   Özellikler: ${l.rooms}, ${l.sqm}m²
   Açıklama: ${l.description?.substring(0, 200)}
`).join('\n')}

## Görev
En uygun 5 portföyü seç ve her biri için:
1. Neden uygun olduğunu açıkla
2. Olası uyumsuzlukları belirt
3. Skor ver (0-100)

JSON formatı:
{
  "matches": [
    {
      "listing_id": "uuid",
      "score": 92,
      "reasons": {
        "budget": "Bütçe dahilinde, orta-üst segment",
        "location": "Tercih edilen Kadıköy ilçesinde",
        "type": "Aranan daire tipinde",
        "soft_match": "Notlarda belirtilen denize yakınlık kriteri karşılanıyor (500m)"
      },
      "concerns": "Bina yaşı 15, müşteri yeni bina tercih edebilir"
    }
  ],
  "summary": "Müşteri için en uygun seçenekler deniz manzaralı ve ulaşımı kolay daireler."
}
`;
```

### 10.5 AI Entegrasyonu (Anthropic)

```typescript
// lib/ai/matching.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function runAIMatching(
  client: Client,
  notes: Note[],
  candidateListings: ListingSummary[]
): Promise<AIMatchResult> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: MATCHING_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: MATCHING_USER_PROMPT(client, notes, candidateListings),
      },
    ],
  });

  // Parse JSON response
  const content = response.content[0];
  if (content.type === 'text') {
    return JSON.parse(content.text);
  }
  
  throw new Error('Unexpected response format');
}
```

---

## 11. PDF Generator

### 11.1 Template Yapısı

```
┌─────────────────────────────────────────────────────┐
│                    LOGO (opsiyonel)                 │
│                    TR DANIŞMAN                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │                                             │    │
│  │           ANA GÖRSEL (Kapak)                │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  BAŞLIK: 3+1 Deniz Manzaralı Daire                  │
│  FİYAT: 2.500.000 ₺                                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│  KONUM                                              │
│  ─────                                              │
│  📍 Kadıköy, İstanbul                               │
│  Caferağa Mah. Moda Cad.                            │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ÖZELLİKLER                                         │
│  ──────────                                         │
│  ┌─────────┬─────────┬─────────┬─────────┐          │
│  │ 🏠 Daire │ 📐 120m² │ 🛏 3+1   │ 🏢 5/10  │          │
│  ├─────────┼─────────┼─────────┼─────────┤          │
│  │ 🚗 Otopark│ 🛗 Asansör│ 🌡 Doğalgaz│ 🪴 Balkon│          │
│  └─────────┴─────────┴─────────┴─────────┘          │
│                                                     │
├─────────────────────────────────────────────────────┤
│  AÇIKLAMA                                           │
│  ─────────                                          │
│  Lorem ipsum dolor sit amet, consectetur adipiscing │
│  elit. Sed do eiusmod tempor incididunt ut labore   │
│  et dolore magna aliqua...                          │
│                                                     │
├─────────────────────────────────────────────────────┤
│  GÖRSELLER                                          │
│  ─────────                                          │
│  ┌───────┐ ┌───────┐ ┌───────┐                      │
│  │ Img 1 │ │ Img 2 │ │ Img 3 │                      │
│  └───────┘ └───────┘ └───────┘                      │
│  ┌───────┐ ┌───────┐ ┌───────┐                      │
│  │ Img 4 │ │ Img 5 │ │ Img 6 │                      │
│  └───────┘ └───────┘ └───────┘                      │
│                                                     │
├─────────────────────────────────────────────────────┤
│  İLETİŞİM                                           │
│  ────────                                           │
│  👤 Mehmet Danışman                                 │
│  📞 0532 xxx xx xx                                  │
│  ✉️ mehmet@email.com                                │
│  🏢 ABC Emlak                                       │
│                                                     │
│  [QR Code - Opsiyonel]                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 11.2 React PDF Implementasyonu

```typescript
// lib/pdf/generator.ts
import { renderToBuffer } from '@react-pdf/renderer';
import { ListingPDFDocument } from './templates/listing-template';

export async function generateListingPDF(
  listing: Listing,
  media: ListingMedia[],
  agent: Agent
): Promise<Buffer> {
  const pdfBuffer = await renderToBuffer(
    <ListingPDFDocument 
      listing={listing} 
      media={media} 
      agent={agent} 
    />
  );
  
  return pdfBuffer;
}
```

### 11.3 PDF API Endpoint

```typescript
// app/api/listings/[id]/pdf/route.ts
import { createClient } from '@/lib/supabase/server';
import { generateListingPDF } from '@/lib/pdf/generator';
import { nanoid } from 'nanoid';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  
  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get listing with media
  const { data: listing } = await supabase
    .from('listings')
    .select('*, listing_media(*)')
    .eq('id', params.id)
    .single();
    
  if (!listing) {
    return Response.json({ error: 'Listing not found' }, { status: 404 });
  }
  
  // Get agent info
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();
  
  // Generate PDF
  const pdfBuffer = await generateListingPDF(
    listing,
    listing.listing_media,
    agent
  );
  
  // Upload to Storage
  const shareToken = nanoid(12);
  const fileName = `${listing.id}/${shareToken}.pdf`;
  
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('pdf-exports')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
    });
    
  if (uploadError) {
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
  
  // Create pdf_exports record
  const { data: pdfExport } = await supabase
    .from('pdf_exports')
    .insert({
      agent_id: agent.id,
      listing_id: params.id,
      storage_path: fileName,
      share_token: shareToken,
      file_name: `${listing.title}.pdf`,
    })
    .select()
    .single();
  
  return Response.json({
    shareToken,
    shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pdf/${shareToken}`,
    downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/pdf/${shareToken}?download=true`,
  });
}
```

---

## 12. Güvenlik ve Performans

### 12.1 Güvenlik Önlemleri

| Alan | Önlem |
|------|-------|
| Auth | Supabase Auth + JWT |
| Data | RLS ile satır seviyesi izolasyon |
| API | Rate limiting |
| Storage | Signed URLs (private), Public bucket + token (PDF) |
| Input | Zod validasyon |
| XSS | React default escaping |
| CSRF | SameSite cookies |

### 12.2 Performans Hedefleri

| Metrik | Hedef |
|--------|-------|
| Portföy listesi yüklenme | < 300ms |
| Harita render | < 500ms (100 pin) |
| Arama/Filtre | < 200ms |
| PDF üretimi | < 10s |
| AI Eşleştirme | < 5s |
| LCP (Largest Contentful Paint) | < 2.5s |
| TTI (Time to Interactive) | < 3.5s |

### 12.3 Optimizasyon Stratejileri

- **Listing List**: 
  - Pagination (20 per page)
  - Infinite scroll (opsiyonel)
  - Thumbnail lazy loading
  
- **Map**: 
  - Clustering (100+ pin için)
  - Viewport-based loading
  
- **Images**: 
  - Supabase Image Transformation
  - WebP format
  - Responsive sizes
  
- **Cache**: 
  - React Query / SWR
  - Stale-while-revalidate

---

## 13. Kabul Kriterleri

MVP "tamamlandı" sayılması için:

### Auth & Profile
- [ ] Danışman kayıt olabilir (email/password)
- [ ] Danışman giriş yapabilir
- [ ] Danışman profilini görebilir ve düzenleyebilir

### Portföy
- [ ] Portföy ekleyebilir (wizard veya tek form)
- [ ] Portföy listesini görebilir (DataTable)
- [ ] Portföyleri filtreleyebilir (tip, fiyat, lokasyon)
- [ ] Portföy detayını görüntüleyebilir
- [ ] Portföy düzenleyebilir
- [ ] Portföy silebilir
- [ ] Portföye görsel yükleyebilir (çoklu)
- [ ] Görselleri yönetebilir (sıralama, silme)

### Harita
- [ ] Portföyleri haritada pin olarak görebilir
- [ ] Pin'e tıklayınca detay kartı/drawer açılır
- [ ] Haritada filtreleme çalışır

### CRM
- [ ] Müşteri ekleyebilir
- [ ] Müşteri listesini görebilir
- [ ] Müşteri detayını görüntüleyebilir
- [ ] Müşteri düzenleyebilir
- [ ] Müşteri silebilir
- [ ] Müşteriye not ekleyebilir
- [ ] Notları tarih sırasıyla görebilir

### PDF
- [ ] Portföy detayından "PDF Oluştur" butonu var
- [ ] PDF görsel seçimi yapılabilir
- [ ] PDF oluşturulur ve Storage'a yüklenir
- [ ] Paylaşım linki üretilir
- [ ] Link ile PDF görüntülenebilir/indirilebilir

### Eşleştirme
- [ ] Müşteri detayında "Eşleştir" butonu var
- [ ] Kural bazlı eleme çalışır
- [ ] AI analizi çalışır
- [ ] Top 5 öneri listelenir
- [ ] Her öneri için nedenler gösterilir

---

## 14. Build Talimatları

### 14.1 Antigravity için Özet

1. **Proje Oluşturma**
   - Next.js 14+ App Router ile yeni proje
   - TypeScript aktif
   - Tailwind CSS kurulu

2. **Bağımlılıklar**
   ```bash
   # Core
   npm install @supabase/supabase-js @supabase/ssr
   npm install @anthropic-ai/sdk
   npm install @react-pdf/renderer
   npm install mapbox-gl react-map-gl
   
   # UI (21st.dev)
   npx -y @21st-dev/cli@latest install cline --api-key "048ebc0f07df0f7c4e5cf9abb7ebd3009c32c14fb182488b8b2b66bdce227c56"
   
   # Form & Validation
   npm install react-hook-form zod @hookform/resolvers
   
   # Utils
   npm install nanoid date-fns
   ```

3. **Supabase Setup**
   - Yeni Supabase projesi oluştur
   - SQL migration'ları çalıştır (Bölüm 5)
   - RLS politikalarını uygula (Bölüm 6)
   - Storage bucket'ları oluştur: `listing-media`, `pdf-exports`
   - `.env.local` dosyasını proje klasörüne ekle

4. **Geliştirme Sırası**
   - Sprint 1: Auth + Profile + Listing CRUD
   - Sprint 2: Map view + CRM CRUD
   - Sprint 3: PDF Generator + Share
   - Sprint 4: AI Matching + Polish

5. **Kod Kalitesi**
   - TypeScript strict mode
   - ESLint + Prettier
   - Error boundaries
   - Loading states (Skeleton)
   - Empty states

### 14.2 Ortam Değişkenleri Checklist

```env
# .env.local - Antigravity tarafından doldurulacak
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=

# Zaten tanımlı
ANTHROPIC_API_KEY=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
TWENTYFIRST_DEV_API_KEY=048ebc0f07df0f7c4e5cf9abb7ebd3009c32c14fb182488b8b2b66bdce227c56
```

---

## Sürüm Geçmişi

| Versiyon | Tarih | Değişiklikler |
|----------|-------|---------------|
| v1.0 | - | İlk taslak |
| v2.0 | 03.02.2026 | Antigravity için detaylandırılmış versiyon, API key'ler eklendi |

---

**Doküman Sonu**
