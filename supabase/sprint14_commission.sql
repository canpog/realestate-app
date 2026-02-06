-- Sprint 14: CRM Excel Import + Komisyon Sistemi
-- Run this in Supabase SQL Editor

-- ================================
-- 1. Komisyon Yapılandırması
-- ================================
CREATE TABLE IF NOT EXISTS commission_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Komisyon Oranları
    default_commission_rate FLOAT DEFAULT 0.05, -- %5
    tiered_rates JSONB, -- { "0_1M": 0.05, "1M_3M": 0.04, "3M+": 0.03 }
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(agent_id)
);

-- ================================
-- 2. Satış/Kira İşlemleri
-- ================================
CREATE TABLE IF NOT EXISTS sales_transactions (
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

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_sales_agent_id ON sales_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales_transactions(status);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_transactions(transaction_date);

-- ================================
-- 3. Import Logları
-- ================================
CREATE TABLE IF NOT EXISTS import_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Import Bilgisi
    import_type TEXT NOT NULL, -- 'customers', 'listings'
    file_name TEXT,
    total_rows INTEGER,
    imported_count INTEGER,
    error_count INTEGER,
    errors JSONB, -- [{ row: 5, error: "..." }]
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_logs_agent ON import_logs(agent_id);

-- ================================
-- 4. RLS Politikaları
-- ================================
ALTER TABLE commission_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- Commission Config
CREATE POLICY "Agents can manage their commission config"
ON commission_config FOR ALL
USING (agent_id IN (
    SELECT id FROM agents WHERE auth_user_id = auth.uid()
));

-- Sales Transactions
CREATE POLICY "Agents can manage their sales"
ON sales_transactions FOR ALL
USING (agent_id IN (
    SELECT id FROM agents WHERE auth_user_id = auth.uid()
));

-- Import Logs
CREATE POLICY "Agents can view their import logs"
ON import_logs FOR ALL
USING (agent_id IN (
    SELECT id FROM agents WHERE auth_user_id = auth.uid()
));

-- Done!
SELECT 'Sprint 14 SQL completed!' as status;
