-- =====================================================
-- TR Danışman CRM - Eksiksiz Supabase Kurulum SQL'i
-- =====================================================

-- 0. Uzantıları Etkinleştir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Helper Fonksiyonlar
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 2. TABLOLAR VE TÜRLER
-- =====================================================

-- AGENTS
CREATE TABLE IF NOT EXISTS agents (
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

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- LISTINGS
DO $$ BEGIN
    CREATE TYPE listing_type AS ENUM ('apartment', 'villa', 'land', 'commercial', 'office', 'shop');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE listing_status AS ENUM ('available', 'sold', 'reserved', 'rented');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE listing_purpose AS ENUM ('sale', 'rent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type listing_type NOT NULL,
    purpose listing_purpose DEFAULT 'sale',
    status listing_status DEFAULT 'available',
    price NUMERIC NOT NULL,
    currency TEXT DEFAULT 'TRY',
    sqm NUMERIC,
    rooms TEXT,
    floor_number INTEGER,
    total_floors INTEGER,
    building_age INTEGER,
    heating_type TEXT,
    has_elevator BOOLEAN DEFAULT FALSE,
    has_parking BOOLEAN DEFAULT FALSE,
    has_balcony BOOLEAN DEFAULT FALSE,
    has_garden BOOLEAN DEFAULT FALSE,
    is_furnished BOOLEAN DEFAULT FALSE,
    address_text TEXT,
    city TEXT NOT NULL,
    district TEXT,
    neighborhood TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_agent_id ON listings(agent_id);
CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(lat, lng);

CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- LISTING_MEDIA
CREATE TABLE IF NOT EXISTS listing_media (
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

-- CLIENTS
DO $$ BEGIN
    CREATE TYPE client_status AS ENUM ('new', 'following', 'hot', 'cold', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    status client_status DEFAULT 'new',
    budget_min NUMERIC,
    budget_max NUMERIC,
    currency TEXT DEFAULT 'TRY',
    wanted_types listing_type[],
    wanted_purpose listing_purpose DEFAULT 'sale',
    wanted_rooms TEXT[],
    wanted_sqm_min NUMERIC,
    wanted_sqm_max NUMERIC,
    wanted_city TEXT,
    wanted_districts TEXT[],
    wanted_neighborhoods TEXT[],
    notes_summary TEXT,
    last_contact_at TIMESTAMPTZ,
    next_followup_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- CLIENT_NOTES
CREATE TABLE IF NOT EXISTS client_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PDF_EXPORTS
CREATE TABLE IF NOT EXISTS pdf_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    share_token TEXT UNIQUE NOT NULL,
    file_name TEXT,
    download_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MATCHES
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    score NUMERIC NOT NULL,
    reasons JSONB,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. RLS (Row Level Security)
-- =====================================================

-- Etkinleştir
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Helper Function
CREATE OR REPLACE FUNCTION get_agent_id()
RETURNS UUID AS $$
    SELECT id FROM agents WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- AGENTS Policies
CREATE POLICY "Agents can view own profile" ON agents FOR SELECT USING (auth_user_id = auth.uid());
CREATE POLICY "Agents can update own profile" ON agents FOR UPDATE USING (auth_user_id = auth.uid());
CREATE POLICY "Agents can insert own profile" ON agents FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- LISTINGS Policies
CREATE POLICY "Agents can view own listings" ON listings FOR SELECT USING (agent_id = get_agent_id());
CREATE POLICY "Agents can insert own listings" ON listings FOR INSERT WITH CHECK (agent_id = get_agent_id());
CREATE POLICY "Agents can update own listings" ON listings FOR UPDATE USING (agent_id = get_agent_id());
CREATE POLICY "Agents can delete own listings" ON listings FOR DELETE USING (agent_id = get_agent_id());

-- LISTING_MEDIA Policies
CREATE POLICY "Agents can view own media" ON listing_media FOR SELECT USING (agent_id = get_agent_id());
CREATE POLICY "Agents can insert own media" ON listing_media FOR INSERT WITH CHECK (agent_id = get_agent_id());
CREATE POLICY "Agents can delete own media" ON listing_media FOR DELETE USING (agent_id = get_agent_id());

-- CLIENTS Policies
CREATE POLICY "Agents can view own clients" ON clients FOR SELECT USING (agent_id = get_agent_id());
CREATE POLICY "Agents can insert own clients" ON clients FOR INSERT WITH CHECK (agent_id = get_agent_id());
CREATE POLICY "Agents can update own clients" ON clients FOR UPDATE USING (agent_id = get_agent_id());
CREATE POLICY "Agents can delete own clients" ON clients FOR DELETE USING (agent_id = get_agent_id());

-- CLIENT_NOTES Policies
CREATE POLICY "Agents can view own notes" ON client_notes FOR SELECT USING (agent_id = get_agent_id());
CREATE POLICY "Agents can insert own notes" ON client_notes FOR INSERT WITH CHECK (agent_id = get_agent_id());
CREATE POLICY "Agents can delete own notes" ON client_notes FOR DELETE USING (agent_id = get_agent_id());

-- PDF_EXPORTS Policies
CREATE POLICY "Agents can view own pdfs" ON pdf_exports FOR SELECT USING (agent_id = get_agent_id());
CREATE POLICY "Agents can insert own pdfs" ON pdf_exports FOR INSERT WITH CHECK (agent_id = get_agent_id());

-- MATCHES Policies
CREATE POLICY "Agents can view own matches" ON matches FOR SELECT USING (agent_id = get_agent_id());
CREATE POLICY "Agents can insert own matches" ON matches FOR INSERT WITH CHECK (agent_id = get_agent_id());
CREATE POLICY "Agents can delete own matches" ON matches FOR DELETE USING (agent_id = get_agent_id());

-- =====================================================
-- 4. STORAGE (Buckets and Policies)
-- =====================================================

-- Buckets (Insert ignore if exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('listing-media', 'listing-media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdf-exports', 'pdf-exports', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
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

CREATE POLICY "Public can view pdfs"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'pdf-exports');

CREATE POLICY "Agents can upload pdfs"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'pdf-exports');
