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
    
    -- AI tarafından mı üretildi
    is_ai_generated BOOLEAN DEFAULT FALSE,
    
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matches_client_id ON matches(client_id);
CREATE INDEX idx_matches_listing_id ON matches(listing_id);
CREATE UNIQUE INDEX idx_matches_unique ON matches(client_id, listing_id);

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
