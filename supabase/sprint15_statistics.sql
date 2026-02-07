-- Sprint 15: Portfolio İstatistikleri
-- Görüntülenme, Sorgu ve Paylaşım takibi

-- =====================================================
-- LISTING VIEWS - Portföy Görüntülenme Takibi
-- =====================================================
CREATE TABLE IF NOT EXISTS listing_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Ziyaretçi Bilgisi
    viewer_ip TEXT,
    viewer_user_agent TEXT,
    viewer_device TEXT, -- 'desktop', 'mobile', 'tablet'
    viewer_country TEXT,
    viewer_city TEXT,
    
    -- Referer Bilgisi
    referer_url TEXT,
    referer_type TEXT, -- 'direct', 'social', 'search', 'email', 'whatsapp'
    
    -- Zaman
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    duration_seconds INTEGER, -- Sayfada kalma süresi
    
    -- Session
    session_id TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_listing_views_listing ON listing_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_date ON listing_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_listing_views_session ON listing_views(session_id);


-- =====================================================
-- LISTING INQUIRIES - Portföy Sorguları (Mesajlar)
-- =====================================================
CREATE TABLE IF NOT EXISTS listing_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    -- Sorgu Detayları
    inquiry_type TEXT NOT NULL, -- 'whatsapp', 'phone', 'email', 'form', 'sms'
    sender_name TEXT,
    sender_phone TEXT,
    sender_email TEXT,
    message TEXT,
    
    -- Durum
    status TEXT DEFAULT 'pending', -- 'pending', 'replied', 'converted', 'ignored'
    replied_at TIMESTAMPTZ,
    
    -- Meta
    source TEXT, -- 'website', 'share_link', 'pdf', 'social'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_inquiries_listing ON listing_inquiries(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_inquiries_status ON listing_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_listing_inquiries_type ON listing_inquiries(inquiry_type);


-- =====================================================
-- LISTING SHARES - Portföy Paylaşımları
-- =====================================================
CREATE TABLE IF NOT EXISTS listing_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    
    -- Paylaşım Bilgisi
    share_type TEXT NOT NULL, -- 'whatsapp', 'email', 'facebook', 'twitter', 'link', 'pdf'
    recipient_identifier TEXT, -- E-posta, telefon numarası vb.
    
    -- QR/Link takibi
    share_link_id TEXT UNIQUE, -- Benzersiz takip kodu
    share_clicked BOOLEAN DEFAULT FALSE,
    click_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_shares_listing ON listing_shares(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_shares_type ON listing_shares(share_type);
CREATE INDEX IF NOT EXISTS idx_listing_shares_link ON listing_shares(share_link_id);


-- =====================================================
-- DAILY STATS AGGREGATE - Günlük İstatistik Özeti
-- =====================================================
CREATE TABLE IF NOT EXISTS listing_daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    
    -- Görüntülenme
    views_count INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    avg_duration_seconds INTEGER DEFAULT 0,
    
    -- Sorgular
    inquiries_count INTEGER DEFAULT 0,
    whatsapp_count INTEGER DEFAULT 0,
    phone_count INTEGER DEFAULT 0,
    email_count INTEGER DEFAULT 0,
    
    -- Paylaşımlar
    shares_count INTEGER DEFAULT 0,
    
    -- Cihaz Dağılımı
    desktop_views INTEGER DEFAULT 0,
    mobile_views INTEGER DEFAULT 0,
    tablet_views INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(listing_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_listing_daily_stats_listing ON listing_daily_stats(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_daily_stats_date ON listing_daily_stats(stat_date);


-- =====================================================
-- RLS POLICIES
-- =====================================================

-- listing_views: Agent kendi listinglerinin viewlarını görebilir
ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view stats of own listings" ON listing_views
    FOR SELECT USING (
        listing_id IN (
            SELECT id FROM listings WHERE agent_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can insert views" ON listing_views
    FOR INSERT WITH CHECK (true);


-- listing_inquiries: Agent kendi listinglerinin sorgularını görebilir
ALTER TABLE listing_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view inquiries of own listings" ON listing_inquiries
    FOR SELECT USING (
        listing_id IN (
            SELECT id FROM listings WHERE agent_id = auth.uid()
        )
    );

CREATE POLICY "Agents can manage inquiries of own listings" ON listing_inquiries
    FOR ALL USING (
        listing_id IN (
            SELECT id FROM listings WHERE agent_id = auth.uid()
        )
    );


-- listing_shares: Agent kendi paylaşımlarını görebilir
ALTER TABLE listing_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own shares" ON listing_shares
    FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Agents can create shares" ON listing_shares
    FOR INSERT WITH CHECK (agent_id = auth.uid());


-- listing_daily_stats: Agent kendi listinglerinin istatistiklerini görebilir
ALTER TABLE listing_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view stats of own listings" ON listing_daily_stats
    FOR SELECT USING (
        listing_id IN (
            SELECT id FROM listings WHERE agent_id = auth.uid()
        )
    );


-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Günlük istatistikleri güncelle
CREATE OR REPLACE FUNCTION update_daily_stats(p_listing_id UUID, p_date DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO listing_daily_stats (listing_id, stat_date, views_count, unique_visitors, inquiries_count, shares_count)
    SELECT 
        p_listing_id,
        p_date,
        COUNT(*)::INTEGER,
        COUNT(DISTINCT session_id)::INTEGER,
        0,
        0
    FROM listing_views
    WHERE listing_id = p_listing_id 
      AND viewed_at::DATE = p_date
    ON CONFLICT (listing_id, stat_date) 
    DO UPDATE SET 
        views_count = EXCLUDED.views_count,
        unique_visitors = EXCLUDED.unique_visitors;
END;
$$ LANGUAGE plpgsql;
