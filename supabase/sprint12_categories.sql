-- Add category column to listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Add notes_summary column to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes_summary TEXT;

-- Create listing_tags table
CREATE TABLE IF NOT EXISTS listing_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    tag_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(listing_id, tag_name)
);

-- Create listing_flags table
CREATE TABLE IF NOT EXISTS listing_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    flag_type TEXT NOT NULL, -- 'priority', 'review', 'sold', 'under_offer'
    color TEXT DEFAULT 'blue', -- 'red', 'yellow', 'green', 'blue'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE listing_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for listing_tags
CREATE POLICY "Public tags are viewable by everyone" ON listing_tags
    FOR SELECT USING (true);

CREATE POLICY "Agents can insert tags" ON listing_tags
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Agents can delete tags" ON listing_tags
    FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for listing_flags
CREATE POLICY "Agents can view their own flags" ON listing_flags
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM agents WHERE id = agent_id));

CREATE POLICY "Agents can insert their own flags" ON listing_flags
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM agents WHERE id = agent_id));

CREATE POLICY "Agents can update their own flags" ON listing_flags
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM agents WHERE id = agent_id));

CREATE POLICY "Agents can delete their own flags" ON listing_flags
    FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM agents WHERE id = agent_id));
