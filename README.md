# 🚀 Gerçek Zamanlı Ulaşım Platformu

**Ankara için gerçek zamanlı toplu taşıma, rota planlama ve seyahat asistanı platformu**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://www.docker.com/)

---

## 📋 İçindekiler

- [Genel Bakış](#-genel-bakış)
- [Özellikler](#-özellikler)
- [Ekran Görüntüleri](#-ekran-görüntüleri)
- [Teknoloji Yığını](#️-teknoloji-yığını)
- [Başlangıç](#-başlangıç)
- [Proje Yapısı](#-proje-yapısı)
- [API Dokümantasyonu](#-api-dokümantasyonu)
- [Geliştirme](#-geliştirme)
- [Deployment](#-deployment)
- [Katkıda Bulunma](#-katkıda-bulunma)
- [Lisans](#-lisans)
- [Proje İstatistikleri](#-proje-i̇statistikleri)

---

## 🌟 Genel Bakış

**Gerçek Zamanlı Ulaşım Platformu**, Ankara şehri için tasarlanmış kapsamlı bir ulaşım planlama ve seyahat asistanı web uygulamasıdır. Kullanıcılar, otobüs, metro, ankaray ve yürüyüş dahil çoklu ulaşım modlarıyla en uygun rotaları bulabilir, sık kullandıkları rotaları favorilere ekleyebilir, varış noktalarının yakınındaki gezilecek yerleri keşfedebilir ve daha fazlasını yapabilirler.

### 🎯 Hedefler

- 🚌 **Çok Modlu Rota Planlama:** Otobüs, metro, ankaray, yürüyüş ve taksi seçenekleriyle akıllı rota önerileri
- 🗺️ **Gerçek Zamanlı Durak Bilgileri:** Google Places API entegrasyonu ile gerçek transit durakları haritada gösterme
- 📍 **Gezilecek Yerler Önerileri:** Varış noktanızın yakınındaki müzeler, parklar, restoranlar ve ilgi çekici yerler
- ❤️ **Favori Rotalar:** Sık kullanılan rotaları kaydetme ve hızlı erişim
- 🏠 **Kayıtlı Yerler:** Ev, iş, okul gibi yerleri kaydederek hızlı rota arama
- 🚀 **Hızlı Tur:** İlk kullanıcılar için interaktif ürün tanıtımı
- 💡 **Kullanıcı Dostu Arayüz:** Karanlık mod desteği, responsive tasarım, Türkçe dil desteği

### 🆕 Yeni Özellikler (v0.6.0)

- ✅ **Transit Durakları Gösterimi:** Rota üzerindeki gerçek otobüs, metro ve ankaray durakları özel PNG ikonlarıyla gösterilir
- ✅ **Gezilecek Yerler Paneli:** Varış noktası yakınındaki turistik yerler, müzeler, parklar, restoranlar otomatik önerilir
- ✅ **Harita Temizleme:** Her yeni rota aramasında önceki rotalar ve duraklar otomatik temizlenir
- ✅ **Swap Locations:** Başlangıç ve varış noktalarını tek tıkla değiştirme
- ✅ **Tekrarlama Sistemi:** Seyahat geçmişinden rotaları tekrarlama ve otomatik arama
- ✅ **Hızlı Tur Sistemi:** Spotlight efekti ve blur backdrop ile interaktif 7 adımlık ürün turu
- ✅ **Şifre Güvenlik Göstergesi:** 4 seviyeli şifre güçlendirme göstergesi (Weak/Fair/Good/Strong)
- ✅ **FAQ Sayfası:** 10 detaylı S&C çifti içeren yardım sayfası
- ✅ **Kayıtlı Yerlerde Autocomplete:** Nominatim API ile debounced adres arama
- ✅ **Favorilerde Durak Desteği:** Favori rotalarda da durakları görüntüleme
- ✅ **Seyahat Geçmişi Filtreleme:** Bugün, Bu Hafta, Bu Ay filtreleri
- ✅ **Yakındaki Duraklar:** Google Places API + CSV verisi ile kapsamlı durak listesi
- ✅ **Empty States:** Tüm sayfalarda kullanıcı dostu boş durum mesajları

---

## ✨ Özellikler

### Kullanıcı Özellikleri

#### 🔐 Kimlik Doğrulama
- Kayıt ve giriş (JWT tabanlı)
- Access token ve refresh token sistemi
- Korumalı rotalar (Protected Routes)
- Token otomatik yenileme

#### 🗺️ Rota Planlama
- **Çok Modlu Arama:** Otobüs, metro, ankaray, yürüyüş, taksi
- **Akıllı Rota Hesaplama:** Google Directions API ile yüksek performanslı rota algoritmaları
- **Alternatif Rotalar:** En hızlı, en kısa ve en az aktarmalı seçenekler
- **Harita Görünümü:** Google Maps tabanlı interaktif harita
- **Polyline Gösterimi:** Rotalar renkli çizgilerle haritada görselleştirilir (her mod farklı renk)
- **Otomatik Harita Temizleme:** Her yeni arama öncesi harita ve duraklar sıfırlanır
- **Swap Locations:** Başlangıç-varış noktalarını değiştirme butonu
- **Transit Durakları:**
  - Otobüs, metro ve ankaray durakları özel PNG ikonlarla gösterilir
  - Google Places API ile gerçek durak konumları ve isimleri
  - Durak isimlerini görmek için marker'lara tıklayabilirsiniz
  - Rota adı (örn: 442, M1) ile eşleştirme

#### 🎯 Gezilecek Yerler
- **Otomatik Öneriler:** Varış noktanız yakınındaki ilgi çekici yerler
- **Kategori Filtreleme:** Turistik yerler, müzeler, parklar, restoranlar, kafeler, alışveriş merkezleri
- **Detaylı Bilgi:** Puan, değerlendirme sayısı, adres bilgileri
- **Kolay Erişim:** Gezilecek yere tıklayarak Google Maps'te açma

#### ❤️ Favori Rotalar
- Sık kullanılan rotaları kaydetme
- Favori rotalarda da durakları görüntüleme
- Hızlı erişim için rota kartları

#### 🏠 Kayıtlı Yerler
- Ev, iş, okul, favori yerler kaydetme
- **Autocomplete Arama:** Adres yazmaya başladığınızda Nominatim API önerileri
- Otomatik enlem/boylam hesaplama
- Rota aramasında hızlı seçim

#### 📜 Seyahat Geçmişi
- Geçmiş rotaları görüntüleme (son 50 trip)
- **Filtreleme:** Bugün, Bu Hafta, Bu Ay, Tümü
- **Tekrarlama:** Herhangi bir rotayı tek tıkla tekrarlayın
- **Detaylar:** Tarih, saat, süre, mesafe, maliyet
- **Silme:** Tekil trip veya tüm geçmişi temizleme

#### 🎓 Hızlı Tur
- İlk giriş yapan kullanıcılar için otomatik başlatılan 7 adımlık tur
- **Spotlight Efekti:** Tanıtılan özellik vurgulanır, etrafı blurlanır
- **Akıllı Konumlandırma:** Tooltip elementin alt kısmında belirir
- **Smooth Scroll:** Element ekranın ortasına kaydırılır
- localStorage ile tek seferlik gösterim
- "Geç" ve "Geri" butonları ile navigasyon
- Dashboard'dan "Hızlı Tur" butonu ile yeniden başlatma

#### ❓ SSS (Sıkça Sorulan Sorular)
- 10 adet detaylı S&C çifti
- Accordion tarzı genişleyen cevaplar
- İletişim bilgileri

#### 🌙 Karanlık Mod
- Tüm sayfalarda tam karanlık mod desteği
- Otomatik geçiş animasyonları
- Göz dostu renkler

### Teknik Özellikler

#### Backend
- RESTful API (Express.js + TypeScript)
- PostgreSQL (kullanıcı verileri) + PostGIS (coğrafi sorgular)
- Redis (rota aramaları için 30 dakikalık cache)
- Winston loglama sistemi
- İstek sınırlama ve güvenlik middleware'leri
- Google Places API entegrasyonu (duraklar ve gezilecek yerler)
- Google Directions API entegrasyonu (transit ve taksi rotaları)
- Google Geocoding API (adres ↔ koordinat dönüşümü)

#### Frontend
- Next.js 14 (App Router)
- Redux Toolkit (state yönetimi)
- Google Maps API (harita)
- Nominatim API (geocoding ve autocomplete)
- Tailwind CSS (styling)
- Framer Motion (animasyonlar)
- TypeScript (tip güvenliği)

---

## 📸 Ekran Görüntüleri

### Ana Sayfa (Dashboard)
- Hoş geldin ekranı
- Hızlı işlem butonları (Rota Ara, Favoriler, Kayıtlı Yerler, Geçmiş)
- Hızlı Tur ve SSS bağlantıları
- İstatistikler (toplam rota, favori, kayıtlı yer)

### Rota Arama
- Başlangıç ve varış noktası arama (autocomplete)
- Ulaşım modu seçimi (checkboxlar)
- Rota sonuçları (süre, mesafe, aktarma sayısı)
- Harita üzerinde rota çizgileri
- Transit durakları (özel ikonlarla)
- Gezilecek yerler paneli (collapsible)

### Favori Rotalar
- Kaydedilmiş rotaları listeleme
- Rota seçimi ile haritada gösterme
- Durakları favori rotalarda görüntüleme

### Kayıtlı Yerler
- Yer ekleme modalı (autocomplete ile)
- Kategori seçimi (ev, iş, okul, favori, diğer)
- Adres otomatik tamamlama (Nominatim)
- Kayıtlı yerleri düzenleme ve silme

### Seyahat Geçmişi
- Geçmiş rotalar listeleme (tarih, saat, başlangıç-varış)
- Filtreleme seçenekleri (Bugün, Bu Hafta, Bu Ay, Tümü)
- Tekrarlama butonu ile aynı rotayı otomatik arama
- Tekil trip silme ve tüm geçmişi temizleme

### Yakınımdaki Duraklar
- Google Places API + CSV verisi ile otobüs, metro, ankaray durakları
- Haritada renkli marker'larla gösterim
- Mesafe hesaplama ve sıralama
- Durak detay bilgileri (isim, adres, koordinatlar)

---

## 🛠️ Teknoloji Yığını

### Frontend

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **Next.js** | 14.2 | React framework, App Router |
| **TypeScript** | 5.3 | Tip güvenliği |
| **Tailwind CSS** | 3.4 | Styling ve responsive tasarım |
| **Redux Toolkit** | 2.0 | State yönetimi |
| **Google Maps API** | - | Harita entegrasyonu |
| **Axios** | 1.6 | HTTP client |
| **Framer Motion** | 10.0 | Animasyonlar |
| **React Hook Form** | 7.49 | Form yönetimi |
| **Zod** | 3.22 | Schema validation |
| **Lucide React** | 0.312 | İkonlar |

### Backend

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **Node.js** | 18+ | Runtime |
| **Express.js** | 4.18 | Web framework |
| **TypeScript** | 5.3 | Tip güvenliği |
| **PostgreSQL** | 15 | İlişkisel veritabanı (kullanıcı verileri) |
| **PostGIS** | 3.3 | Coğrafi sorgular |
| **Redis** | 7.0 | Önbellekleme (rota aramaları, 30 dk TTL) |
| **Sequelize** | 6.35 | PostgreSQL ORM |
| **JWT** | 9.0 | Kimlik doğrulama (access + refresh tokens) |
| **Winston** | 3.11 | Loglama |
| **Bcrypt** | 5.1 | Şifre hashleme |
| **Express Rate Limit** | - | API rate limiting |

### Harici API'ler

| API | Kullanım | Maliyet |
|-----|----------|---------|
| **Google Maps JavaScript API** | Harita gösterimi | $200/ay ücretsiz kredi |
| **Google Places API** | Transit durakları, gezilecek yerler | $200/ay ücretsiz kredi |
| **Google Directions API** | Rota hesaplama | $200/ay ücretsiz kredi |
| **Nominatim** | Geocoding, autocomplete | Ücretsiz |

### DevOps

- **Docker & Docker Compose:** Konteynerizasyon
- **Git & GitHub:** Versiyon kontrolü
- **ESLint & Prettier:** Kod kalitesi
- **Vercel (planlı):** Frontend hosting
- **Railway (planlı):** Backend hosting

---

## 🚀 Başlangıç

### Ön Gereksinimler

Sisteminizde aşağıdaki yazılımların kurulu olması gerekmektedir:

- **Node.js** 18+ ve **npm** 9+
- **Docker** ve **Docker Compose**
- **Git**
- **Google Maps API Key** (gerekli - harita, rota planlama, duraklar ve gezilecek yerler için)

### Kurulum

#### 1. Depoyu Klonlayın

```bash
git clone https://github.com/yourusername/gercek-zamanli-ulasim-platformu.git
cd gercek-zamanli-ulasim-platformu
```

#### 2. Environment Dosyalarını Oluşturun

**Frontend (.env.local):**

```bash
cd frontend
cp .env.example .env.local
```

`.env.local` dosyasını düzenleyin:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Backend (.env):**

```bash
cd ../backend
cp .env.example .env
```

`.env` dosyasını düzenleyin:

```env
# Server
NODE_ENV=development
PORT=5001

# Database - PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ankara_ulasim_db
DB_USER=ankara_admin
DB_PASSWORD=ankara_password_2024

# MongoDB
MONGODB_URI=mongodb://ankara_admin:ankara_password_2024@mongodb:27017/ankara_ulasim_realtime?authSource=admin

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Email (opsiyonel - şu anda kullanılmıyor, gelecek özellikler için)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### 3. Docker ile Başlatın

Ana dizinde:

```bash
docker-compose up -d
```

Bu komut aşağıdaki servisleri başlatır:

- **PostgreSQL** (port 5432) - İlişkisel veritabanı (kullanıcı verileri, rotalar, favoriler)
- **MongoDB** (port 27017) - NoSQL veritabanı (şu anda kullanılmıyor, gelecek özellikler için hazır)
- **Redis** (port 6379) - Önbellek (rota aramaları, 30 dk TTL)
- **Backend API** (port 5001) - Express.js API
- **Frontend** (port 3000) - Next.js web uygulaması

#### 4. Veritabanını Başlatın

PostgreSQL tablolarını oluşturun:

```bash
docker-compose exec postgres psql -U ankara_admin -d ankara_ulasim_db -f /docker-entrypoint-initdb.d/init.sql
```

**Not:** MongoDB şu anda aktif olarak kullanılmamaktadır. Gelecek özellikler (gerçek zamanlı araç takibi, vb.) için hazır durumdadır.

#### 5. Uygulamayı Açın

Tarayıcınızda aşağıdaki adresleri açın:

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5001](http://localhost:5001)
- **API Health Check:** [http://localhost:5001/api/v1/health](http://localhost:5001/api/v1/health)

### Mobil Cihazınızdan Erişim

Projeyi telefonunuzdan veya tabletten kullanmak için:

#### 1. Bilgisayarınızın Local IP Adresini Bulun

**macOS/Linux:**
```bash
ipconfig getifaddr en0  # Wi-Fi
# veya
ipconfig getifaddr en1  # Ethernet
```

**Windows:**
```bash
ipconfig
# Wireless LAN adapter Wi-Fi altındaki IPv4 Address'e bakın
```

Örnek çıktı: `10.14.8.222` (Bu adres sizin yerel ağınızdaki IP adresinizdir)

#### 2. Frontend ve Backend URL'lerini Güncelleyin

**Frontend** [(.env.local)](frontend/.env.local):
```env
# Localhost yerine local IP kullanın
NEXT_PUBLIC_API_URL=http://10.14.8.222:5001/api
NEXT_PUBLIC_WS_URL=ws://10.14.8.222:5001
```

**Backend** [(.env)](backend/.env):
```env
# CORS ayarlarını mobil erişim için güncelleyin
CORS_ORIGIN=http://10.14.8.222:3000
```

#### 3. Docker Servislerini Yeniden Başlatın

```bash
cd /Users/merenekiz/vscode/gercek-zamanli-ulasim-platformu
docker-compose down
docker-compose up -d --build
```

#### 4. Mobil Cihazınızdan Bağlanın

**Önemli:** Bilgisayarınız ve mobil cihazınız **aynı Wi-Fi ağında** olmalıdır.

Mobil tarayıcınızda şu adresi açın:
```
http://10.14.8.222:3000
```

**Not:** `10.14.8.222` yerine kendi local IP adresinizi kullanın.

#### Sorun Giderme

- **Bağlantı kurulamıyor?**
  - Bilgisayar ve telefon aynı Wi-Fi ağında mı kontrol edin
  - Bilgisayarınızın firewall ayarlarını kontrol edin (port 3000 ve 5001'e izin verin)
  - Local IP adresinin doğru olduğundan emin olun

- **API istekleri başarısız oluyor?**
  - Backend `.env` dosyasında `CORS_ORIGIN` ayarını kontrol edin
  - Frontend `.env.local` dosyasında `NEXT_PUBLIC_API_URL` doğru mu kontrol edin

### Manuel Kurulum (Docker Olmadan)

Docker kullanmak istemiyorsanız:

#### Backend

```bash
# PostgreSQL ve Redis'i manuel olarak kurun ve başlatın
# MongoDB opsiyonel (şu anda kullanılmıyor)

cd backend
npm install
npm run dev  # Development server (port 5001)
```

#### Frontend

```bash
cd frontend
npm install
npm run dev  # Development server (port 3000)
```

**Not:** Manuel kurulumda veritabanı bağlantı ayarlarını `.env` dosyasında düzenlemeniz gerekir.

---

## 📁 Proje Yapısı

```
gercek-zamanli-ulasim-platformu/
├── frontend/                      # Next.js frontend uygulaması
│   ├── public/
│   │   ├── icons/                 # Transit stop ikonları
│   │   │   ├── bus_stop.png       # Otobüs durağı ikonu
│   │   │   ├── metro_stop.png     # Metro durağı ikonu
│   │   │   └── ankaray_stop.png   # Ankaray durağı ikonu
│   │   └── ...
│   ├── src/
│   │   ├── app/                   # Next.js App Router pages
│   │   │   ├── (auth)/            # Auth route group
│   │   │   │   ├── login/         # Giriş sayfası
│   │   │   │   └── register/      # Kayıt sayfası
│   │   │   ├── dashboard/         # Ana sayfa
│   │   │   ├── routes/
│   │   │   │   └── search/        # Rota arama sayfası
│   │   │   ├── favorites/         # Favori rotalar
│   │   │   ├── places/            # Kayıtlı yerler
│   │   │   ├── history/           # Seyahat geçmişi
│   │   │   ├── faq/               # SSS sayfası
│   │   │   ├── layout.tsx         # Root layout
│   │   │   └── page.tsx           # Landing page
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   ├── QuickTour.tsx  # Hızlı tur bileşeni
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── map/
│   │   │   │   ├── Map.tsx        # Ana harita bileşeni
│   │   │   │   └── LocationSearchInput.tsx  # Autocomplete arama
│   │   │   ├── route/
│   │   │   │   ├── RouteCard.tsx
│   │   │   │   ├── RouteList.tsx
│   │   │   │   └── NearbyAttractions.tsx  # Gezilecek yerler
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── api/               # API client
│   │   │   │   ├── client.ts      # Axios instance
│   │   │   │   ├── auth.ts
│   │   │   │   ├── routes.ts
│   │   │   │   └── ...
│   │   │   ├── hooks/             # Custom React hooks
│   │   │   │   ├── useWebSocket.ts
│   │   │   │   └── ...
│   │   │   ├── store/             # Redux store
│   │   │   │   ├── index.ts
│   │   │   │   ├── hooks.ts
│   │   │   │   └── slices/
│   │   │   │       ├── authSlice.ts
│   │   │   │       ├── routeSlice.ts
│   │   │   │       └── uiSlice.ts
│   │   │   ├── types/             # TypeScript types
│   │   │   └── utils/             # Utility functions
│   │   └── styles/
│   │       └── globals.css
│   ├── tailwind.config.js
│   ├── next.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                       # Express.js backend API
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts        # Database bağlantıları
│   │   │   └── redis.ts
│   │   ├── models/                # Database modelleri
│   │   │   ├── User.ts
│   │   │   ├── Route.ts
│   │   │   └── ...
│   │   ├── routes/
│   │   │   ├── index.ts           # Ana router
│   │   │   ├── auth.ts
│   │   │   ├── routes.ts
│   │   │   ├── stopsRoutes.ts     # Transit stops
│   │   │   └── attractionsRoutes.ts  # Gezilecek yerler
│   │   ├── services/
│   │   │   ├── routeService.ts    # Rota planlama
│   │   │   ├── transitStopsService.ts  # Durak servisi
│   │   │   ├── attractionsService.ts   # Gezilecek yerler
│   │   │   └── taxiFareService.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimiter.ts
│   │   ├── utils/
│   │   │   ├── logger.ts          # Winston logger
│   │   │   └── ...
│   │   └── server.ts              # Ana server dosyası
│   ├── database/
│   │   ├── init.sql               # PostgreSQL schema
│   │   ├── mongo-init.js          # MongoDB collections
│   │   └── seeds/                 # Seed data
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                          # Dokümantasyon
│   ├── API_ENDPOINTS.md
│   ├── TECHNICAL_ANALYSIS.md
│   └── API_COSTS_AND_FREE_STRATEGY.md
│
├── docker-compose.yml             # Docker Compose config
├── .gitignore
├── LICENSE
└── README.md                      # Bu dosya
```

---

## 📚 API Dokümantasyonu

Detaylı API dokümantasyonu: [API_ENDPOINTS.md](docs/API_ENDPOINTS.md)

### Base URL

```
http://localhost:5001/api/v1
```

### Kimlik Doğrulama Endpoints

#### Kayıt

```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "Ahmet Yılmaz"
}
```

#### Giriş

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Rota Endpoints

#### Rota Arama

```bash
POST /routes/search
Authorization: Bearer {token}
Content-Type: application/json

{
  "origin": {
    "lat": 39.9334,
    "lng": 32.8597,
    "address": "Kızılay, Ankara"
  },
  "destination": {
    "lat": 39.9208,
    "lng": 32.8541,
    "address": "Ulus, Ankara"
  },
  "modes": ["BUS", "METRO", "WALKING"],
  "departureTime": "2024-01-15T10:30:00Z"
}
```

**Yanıt:**

```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "id": "route-123",
        "segments": [
          {
            "mode": "WALKING",
            "duration": 180,
            "distance": 250,
            "polyline": "encoded_polyline_string"
          },
          {
            "mode": "BUS",
            "duration": 900,
            "distance": 5000,
            "routeInfo": {
              "routeName": "442",
              "routeLongName": "Kızılay - Ulus"
            },
            "polyline": "encoded_polyline_string"
          }
        ],
        "totalDuration": 1080,
        "totalDistance": 5250,
        "price": 15.5
      }
    ]
  }
}
```

### Transit Stops Endpoints

#### Rota Üzerindeki Durakları Getir

```bash
POST /stops/along-route
Content-Type: application/json

{
  "polyline": "encoded_polyline_string",
  "transitMode": "BUS",
  "routeName": "442"
}
```

**Yanıt:**

```json
{
  "success": true,
  "data": [
    {
      "id": "ChIJXXXXXX",
      "name": "Kızılay Durağı",
      "location": {
        "lat": 39.9334,
        "lng": 32.8597
      },
      "types": ["bus_station", "transit_station"]
    }
  ]
}
```

#### Yakındaki Durakları Getir

```bash
GET /stops/nearby?lat=39.9334&lng=32.8597&radius=1000
```

**Yanıt:**

```json
{
  "success": true,
  "data": [
    {
      "id": "stop-123",
      "name": "Kızılay Metro",
      "type": "METRO",
      "location": {
        "lat": 39.9334,
        "lng": 32.8597
      },
      "distance": 150,
      "address": "Kızılay, Çankaya"
    }
  ]
}
```

### Attractions Endpoints

#### Yakındaki Gezilecek Yerleri Getir

```bash
GET /attractions/nearby?lat=39.9208&lng=32.8541&radius=1500
```

**Yanıt:**

```json
{
  "success": true,
  "data": [
    {
      "id": "ChIJXXXXXX",
      "name": "Anıtkabir",
      "location": {
        "lat": 39.9254,
        "lng": 32.8368
      },
      "category": "Turistik Yer",
      "rating": 4.8,
      "userRatingsTotal": 12543,
      "vicinity": "Anıttepe, Tandoğan"
    }
  ]
}
```

### Favorites Endpoints

#### Favorileri Getir

```bash
GET /favorites
Authorization: Bearer {token}
```

#### Favoriye Ekle

```bash
POST /favorites
Authorization: Bearer {token}
Content-Type: application/json

{
  "routeId": "route-123",
  "origin": { "lat": 39.9334, "lng": 32.8597, "address": "Kızılay" },
  "destination": { "lat": 39.9208, "lng": 32.8541, "address": "Ulus" }
}
```

#### Favoriyi Sil

```bash
DELETE /favorites/:id
Authorization: Bearer {token}
```

### Saved Places Endpoints

#### Kayıtlı Yerleri Getir

```bash
GET /places
Authorization: Bearer {token}
```

#### Yeni Yer Kaydet

```bash
POST /places
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Evim",
  "address": "Çankaya, Ankara",
  "category": "HOME",
  "coordinates": { "lat": 39.9208, "lng": 32.8541 }
}
```

#### Kayıtlı Yeri Sil

```bash
DELETE /places/:id
Authorization: Bearer {token}
```

### History Endpoints

#### Seyahat Geçmişini Getir

```bash
GET /history?filter=all
Authorization: Bearer {token}
```

Query parametreleri:
- `filter`: all | today | week | month

#### Geçmişten Sil

```bash
DELETE /history/:id
Authorization: Bearer {token}
```

#### Tüm Geçmişi Temizle

```bash
DELETE /history
Authorization: Bearer {token}
```

---

## 💻 Geliştirme

### Kod Standardı

- **ESLint:** Kod kalitesi için
- **Prettier:** Kod formatlama için
- **TypeScript:** Tip güvenliği için
- **Conventional Commits:** Commit mesajları için

### Çalıştırma Komutları

#### Frontend

```bash
cd frontend

npm run dev          # Development server (http://localhost:3000)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint kontrolü
npm run type-check   # TypeScript tip kontrolü
npm run format       # Prettier formatlama
```

#### Backend

```bash
cd backend

npm run dev          # Development server (nodemon, http://localhost:5001)
npm run build        # TypeScript build
npm run start        # Production server
npm run lint         # ESLint kontrolü
npm run test         # Unit tests (planlı)
```

### Docker Komutları

```bash
# Tüm servisleri başlat
docker-compose up -d

# Logları izle
docker-compose logs -f

# Belirli bir servisin logunu izle
docker-compose logs -f backend
docker-compose logs -f frontend

# Servisleri durdur
docker-compose down

# Servisleri yeniden başlat
docker-compose restart

# Veritabanını temizle ve yeniden başlat
docker-compose down -v
docker-compose up -d
```

### Veritabanı Yönetimi

```bash
# PostgreSQL'e bağlan
docker-compose exec postgres psql -U ankara_admin -d ankara_ulasim_db

# MongoDB'ye bağlan
docker-compose exec mongodb mongosh -u ankara_admin -p ankara_password_2024 ankara_ulasim_realtime

# Redis CLI
docker-compose exec redis redis-cli

# PostgreSQL tabloları listele
docker-compose exec postgres psql -U ankara_admin -d ankara_ulasim_db -c "\dt"

# MongoDB koleksiyonlarını listele
docker-compose exec mongodb mongosh -u ankara_admin -p ankara_password_2024 ankara_ulasim_realtime --eval "db.getCollectionNames()"
```

### Yeni Özellik Ekleme

1. **Backend API Endpoint Eklemek:**

```bash
# 1. Service oluştur
cd backend/src/services
touch myNewService.ts

# 2. Route ekle
cd ../routes
touch myNewRoute.ts

# 3. Ana router'a ekle (routes/index.ts)
# router.use('/my-endpoint', myNewRoute);
```

2. **Frontend Component Eklemek:**

```bash
cd frontend/src/components

# Genel component
touch common/MyComponent.tsx

# Sayfa component'i
cd ../app
mkdir my-page
touch my-page/page.tsx
```

3. **Redux Slice Eklemek:**

```bash
cd frontend/src/lib/store/slices
touch mySlice.ts

# store/index.ts'ye ekle
```

---

## 🌐 Deployment

### Environment Variables

#### Production Frontend (.env.production)

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api/v1
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=production_google_api_key
```

#### Production Backend (.env.production)

```env
NODE_ENV=production
PORT=5001
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=production_db
DB_USER=production_user
DB_PASSWORD=secure_password
MONGODB_URI=mongodb://user:pass@mongo-host:27017/db?authSource=admin
REDIS_HOST=your-redis-host
REDIS_PORT=6379
JWT_SECRET=very_secure_secret_key
GOOGLE_MAPS_API_KEY=production_google_api_key
```

### Vercel (Frontend)

```bash
cd frontend

# Vercel CLI kur
npm i -g vercel

# Deploy
vercel --prod
```

### Railway / Render (Backend)

```bash
cd backend

# Docker image build
docker build -t gercek-zamanli-ulasim-backend .

# Railway'e push
railway up
```

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Aşağıdaki adımları izleyin:

1. Bu depoyu fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

### Katkı Kuralları

- ✅ TypeScript kullanın
- ✅ ESLint ve Prettier kurallarına uyun
- ✅ Meaningful commit mesajları yazın (Conventional Commits)
- ✅ Dokümantasyonu güncelleyin
- ✅ Test coverage'ı koruyun/artırın (planlı)

### Commit Mesaj Formatı

```
feat: Yeni özellik ekle
fix: Hata düzeltmesi
docs: Dokümantasyon güncellemesi
style: Kod formatı değişikliği
refactor: Kod refaktörü
test: Test ekleme/güncelleme
chore: Yapılandırma değişikliği
```

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 📊 Proje İstatistikleri

**Versiyon:** 0.6.0 (Development)
**Son Güncelleme:** Aralık 2024
**Durum:** 🚧 Aktif Geliştirme

### Sayısal Veriler
- **Frontend Sayfalar:** 10 (Landing, Login, Register, Dashboard, Route Search, Favorites, Places, History, FAQ, Stops)
- **React Bileşenleri:** 25+ (Button, Card, Input, Toast, Map, RouteCard, QuickTour, vb.)
- **Backend API Endpoints:** 20+ (Auth, Routes, Stops, Attractions, Favorites, Places, History)
- **Backend Servisleri:** 8 (Auth, Route, Transit Stops, Attractions, Taxi Fare, Geocoding, vb.)
- **Desteklenen Ulaşım Modları:** 5 (Otobüs, Metro, Ankaray, Yürüyüş, Taksi)
- **Harici API Entegrasyonları:** 4 (Google Maps, Google Places, Google Directions, Nominatim)

### localStorage Kullanımı
Aşağıdaki veriler tarayıcıda yerel olarak saklanır:
- `tripHistory` - Son 50 seyahat rotası (filtreleme: bugün, bu hafta, bu ay, tümü)
- `favoriteRoutes` - Kullanıcının favori rotaları
- `savedPlaces` - Kayıtlı yerler (ev, iş, okul, favori, diğer)
- `quickTourSeen` - Hızlı turun gösterilip gösterilmediği

### Teknik Metrikler
- **TypeScript Coverage:** %95+
- **Docker Container Sayısı:** 5 (Frontend, Backend, PostgreSQL, MongoDB, Redis)
- **Responsive Breakpoints:** 4 (Mobile, Tablet, Desktop, Wide)
- **Karanlık Mod:** ✅ Tam destek

---

**⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!**

---

Made with ❤️ in Ankara, Turkey
