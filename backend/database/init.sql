-- ============================================
-- Ankara Ulaşım Platformu - PostgreSQL Veritabanı Şeması
-- Çok Şehirli Mimari Desteği
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- Şehirler Tablosu (Multi-City Support)
-- ============================================

CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Türkiye',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Europe/Istanbul',
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cities_is_active ON cities(is_active);

-- ============================================
-- Kullanıcılar ve Kimlik Doğrulama
-- ============================================

CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar TEXT,
    role user_role DEFAULT 'USER',
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Kullanıcı Tercihleri
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    default_transport_modes TEXT[] DEFAULT '{}',
    max_walking_distance INTEGER DEFAULT 1000, -- metre
    accessibility_required BOOLEAN DEFAULT false,
    language VARCHAR(10) DEFAULT 'tr',
    notification_settings JSONB DEFAULT '{"serviceAlerts": true, "routeUpdates": true, "promotions": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- ============================================
-- Taksi Ücret Tarifeleri (Admin Tarafından Girilecek)
-- ============================================

CREATE TABLE taxi_ucret_tarifeleri (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    opening_fee DECIMAL(10, 2) NOT NULL, -- Açılış ücreti (TRY)
    per_km_rate DECIMAL(10, 2) NOT NULL, -- Kilometre başı ücret (TRY)
    min_fare DECIMAL(10, 2) NOT NULL, -- İndi bindi ücreti / Minimum tarife (TRY)
    waiting_fee_per_hour DECIMAL(10, 2) NOT NULL, -- Bekleme ücreti/saat (TRY)
    night_surcharge_rate DECIMAL(5, 2), -- Gece tarifesi ek yüzdesi (örn: 50 = %50)
    airport_surcharge DECIMAL(10, 2), -- Havaalanı ek ücreti (TRY)
    valid_from DATE NOT NULL,
    valid_until DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT, -- Ek açıklamalar için
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE INDEX idx_taxi_fares_city_id ON taxi_ucret_tarifeleri(city_id);
CREATE INDEX idx_taxi_fares_active ON taxi_ucret_tarifeleri(is_active);
CREATE INDEX idx_taxi_fares_valid_dates ON taxi_ucret_tarifeleri(valid_from, valid_until);

-- ============================================
-- Toplu Taşıma - Rotalar
-- ============================================

CREATE TYPE transport_mode AS ENUM (
    'BUS', 'METRO', 'TRAM', 'ANKARAY',
    'TAXI', 'UBER', 'BOLT', 'WALKING', 'BICYCLE'
);

CREATE TABLE public_transport_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    route_id VARCHAR(50) NOT NULL, -- Harici sistem route ID
    route_name VARCHAR(255) NOT NULL,
    transport_mode transport_mode NOT NULL,
    operating_hours JSONB DEFAULT '{"start": "06:00", "end": "23:00"}',
    frequency INTEGER, -- dakika cinsinden
    color VARCHAR(7), -- Hex renk kodu
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(city_id, route_id)
);

CREATE INDEX idx_routes_city_id ON public_transport_routes(city_id);
CREATE INDEX idx_routes_mode ON public_transport_routes(transport_mode);

-- ============================================
-- Toplu Taşıma - Duraklar
-- ============================================

CREATE TABLE public_transport_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    stop_id VARCHAR(50) NOT NULL,
    stop_name VARCHAR(255) NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    stop_type transport_mode NOT NULL,
    wheelchair_accessible BOOLEAN DEFAULT false,
    facilities TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(city_id, stop_id)
);

CREATE INDEX idx_stops_city_id ON public_transport_stops(city_id);
CREATE INDEX idx_stops_location ON public_transport_stops USING GIST(location);
CREATE INDEX idx_stops_type ON public_transport_stops(stop_type);

-- ============================================
-- Rota-Durak İlişkileri
-- ============================================

CREATE TABLE route_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES public_transport_routes(id) ON DELETE CASCADE,
    stop_id UUID REFERENCES public_transport_stops(id) ON DELETE CASCADE,
    stop_sequence INTEGER NOT NULL,
    travel_time_to_next INTEGER, -- dakika
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(route_id, stop_sequence)
);

CREATE INDEX idx_route_stops_route_id ON route_stops(route_id);
CREATE INDEX idx_route_stops_stop_id ON route_stops(stop_id);

-- ============================================
-- Tarifeler (Schedules)
-- ============================================

CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES public_transport_routes(id) ON DELETE CASCADE,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    days_of_week INTEGER[] NOT NULL, -- 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schedules_route_id ON schedules(route_id);
CREATE INDEX idx_schedules_departure_time ON schedules(departure_time);

-- ============================================
-- Yerler (Places & POI)
-- ============================================

CREATE TYPE place_category AS ENUM (
    'RESTAURANT', 'CAFE', 'SHOPPING', 'TOURISM',
    'CULTURE', 'NATURE', 'HEALTH', 'EDUCATION',
    'ACCOMMODATION', 'ENTERTAINMENT'
);

CREATE TABLE places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    place_id VARCHAR(255) NOT NULL, -- Google Places ID
    name VARCHAR(255) NOT NULL,
    category place_category NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    address TEXT,
    rating DECIMAL(2, 1),
    review_count INTEGER DEFAULT 0,
    price_level INTEGER CHECK (price_level BETWEEN 1 AND 5),
    phone VARCHAR(20),
    website TEXT,
    opening_hours JSONB,
    photos TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(place_id)
);

CREATE INDEX idx_places_city_id ON places(city_id);
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_places_location ON places USING GIST(location);
CREATE INDEX idx_places_rating ON places(rating);

-- ============================================
-- Favori Rotalar
-- ============================================

CREATE TABLE favorite_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    origin_location GEOGRAPHY(POINT, 4326) NOT NULL,
    origin_name VARCHAR(255) NOT NULL,
    destination_location GEOGRAPHY(POINT, 4326) NOT NULL,
    destination_name VARCHAR(255) NOT NULL,
    preferred_modes transport_mode[],
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_favorite_routes_user_id ON favorite_routes(user_id);
CREATE INDEX idx_favorite_routes_usage_count ON favorite_routes(usage_count DESC);

-- ============================================
-- Seyahat Geçmişi
-- ============================================

CREATE TABLE trip_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    origin_location GEOGRAPHY(POINT, 4326) NOT NULL,
    origin_name VARCHAR(255) NOT NULL,
    destination_location GEOGRAPHY(POINT, 4326) NOT NULL,
    destination_name VARCHAR(255) NOT NULL,
    route_data JSONB NOT NULL, -- Kullanılan rotanın detayları
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    cost DECIMAL(10, 2),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trip_history_user_id ON trip_history(user_id);
CREATE INDEX idx_trip_history_start_time ON trip_history(start_time DESC);

-- ============================================
-- Servis Uyarıları
-- ============================================

CREATE TYPE alert_type AS ENUM (
    'SERVICE_DISRUPTION', 'DELAY', 'ROUTE_CHANGE',
    'WEATHER', 'TRAFFIC', 'MAINTENANCE'
);

CREATE TYPE alert_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE service_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    type alert_type NOT NULL,
    severity alert_severity NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    affected_routes UUID[],
    affected_modes transport_mode[],
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_city_id ON service_alerts(city_id);
CREATE INDEX idx_alerts_is_active ON service_alerts(is_active);
CREATE INDEX idx_alerts_start_time ON service_alerts(start_time DESC);

-- ============================================
-- Oturumlar (Sessions - JWT alternative)
-- ============================================

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    user_agent TEXT,
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);

-- ============================================
-- Audit Log (Denetim Kaydı)
-- ============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- Fonksiyonlar
-- ============================================

-- Updated_at otomatik güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggerlar
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_taxi_fares_updated_at BEFORE UPDATE ON taxi_ucret_tarifeleri
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON public_transport_routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stops_updated_at BEFORE UPDATE ON public_transport_stops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON places
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_favorite_routes_updated_at BEFORE UPDATE ON favorite_routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON service_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- İlk Veri Girişi (Ankara)
-- ============================================

INSERT INTO cities (name, country, latitude, longitude, is_active)
VALUES ('Ankara', 'Türkiye', 39.9334, 32.8597, true);

-- Ankara için örnek taksi tarifeleri (2024 - Gerçek tarifeler yönetici tarafından güncellenmelidir)
INSERT INTO taxi_ucret_tarifeleri (
    city_id,
    opening_fee,
    per_km_rate,
    min_fare,
    waiting_fee_per_hour,
    night_surcharge_rate,
    airport_surcharge,
    valid_from,
    is_active,
    notes
) VALUES (
    (SELECT id FROM cities WHERE name = 'Ankara'),
    15.00,  -- Açılış ücreti
    12.50,  -- Kilometre başı
    50.00,  -- Minimum tarife
    150.00, -- Bekleme ücreti/saat
    50.00,  -- %50 gece tarifesi
    25.00,  -- Havaalanı ek ücreti
    '2024-01-01',
    true,
    'Örnek tarifeler - Yönetici tarafından güncellenmelidir'
);

-- ============================================
-- Yorum
-- ============================================

COMMENT ON TABLE taxi_ucret_tarifeleri IS 'Taksi ücret tarifeleri - Sadece yönetici tarafından girilir ve güncellenir';
COMMENT ON COLUMN taxi_ucret_tarifeleri.opening_fee IS 'Açılış ücreti (TRY)';
COMMENT ON COLUMN taxi_ucret_tarifeleri.per_km_rate IS 'Kilometre başı ücret (TRY)';
COMMENT ON COLUMN taxi_ucret_tarifeleri.min_fare IS 'İndi bindi ücreti / Minimum tarife (TRY)';
COMMENT ON COLUMN taxi_ucret_tarifeleri.waiting_fee_per_hour IS 'Bekleme ücreti saat başına (TRY)';
COMMENT ON COLUMN taxi_ucret_tarifeleri.night_surcharge_rate IS 'Gece tarifesi ek yüzdesi (örn: 50 = %50)';
COMMENT ON COLUMN taxi_ucret_tarifeleri.airport_surcharge IS 'Havaalanı ek ücreti (TRY)';
