-- Follow-up System
CREATE TABLE follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    follow_up_type TEXT NOT NULL, -- 'call', 'message', 'meeting', 'email'
    notes TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'missed', 'rescheduled'
    completed_at TIMESTAMPTZ,
    remind_15_min BOOLEAN DEFAULT FALSE,
    remind_1_hour BOOLEAN DEFAULT FALSE,
    remind_1_day BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_follow_ups_agent_id ON follow_ups(agent_id);
CREATE INDEX idx_follow_ups_client_id ON follow_ups(client_id);
CREATE INDEX idx_follow_ups_scheduled_at ON follow_ups(scheduled_at);
CREATE INDEX idx_follow_ups_status ON follow_ups(status);

CREATE TABLE reminder_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follow_up_id UUID NOT NULL REFERENCES follow_ups(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL, -- '15_min', '1_hour', '1_day'
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivery_status TEXT DEFAULT 'pending'
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    follow_up_id UUID REFERENCES follow_ups(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'reminder', 'missed', 'completed', 'message'
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_agent_id ON notifications(agent_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- News Feed System
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

CREATE TABLE news_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES news_sources(id),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    image_url TEXT,
    article_url TEXT UNIQUE,
    category TEXT NOT NULL,
    tags TEXT[],
    importance_score FLOAT DEFAULT 0.5,
    is_featured BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_news_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    categories TEXT[] DEFAULT '{"gayrimenkul", "borsa"}',
    keywords TEXT[],
    daily_digest BOOLEAN DEFAULT TRUE,
    important_only BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial news sources
INSERT INTO news_sources (name, source_type, feed_url, category) VALUES
('Emlak Kulisi', 'rss', 'https://emlakkulisi.com/rss', 'real_estate'),
('Hürriyet Emlak', 'rss', 'https://www.hurriyet.com.tr/rss/ekonomi', 'economy'),
('Bloomberg HT', 'rss', 'https://www.bloomberght.com/rss', 'finance');
