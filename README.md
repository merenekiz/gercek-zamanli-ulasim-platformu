# 🚀 Gerçek Zamanlı Ulaşım Platformu

**Gerçek zamanlı toplu taşıma, araç paylaşımı ve çok modlu seyahat planlama platformu**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)

---

## 📋 İçindekiler

- [Genel Bakış](#-genel-bakış)
- [Özellikler](#-özellikler)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Başlangıç](#-başlangıç)
- [Proje Yapısı](#-proje-yapısı)
- [API Dokümantasyonu](#-api-dokümantasyonu)
- [Geliştirme](#-geliştirme)
- [Deployment](#-deployment)
- [Katkıda Bulunma](#-katkıda-bulunma)
- [Lisans](#-lisans)

---

## 🌟 Genel Bakış

Gerçek Zamanlı Ulaşım Platformu, Ankara şehri için tasarlanmış kapsamlı bir ulaşım ve seyahat planlama uygulamasıdır. Platformun ilk aşaması Ankara için bir pilot uygulama olarak geliştirilmekte olup, ardından diğer büyük Türk şehirlerine genişleyecek şekilde ölçeklenebilir bir mimariye sahiptir.

### Hedefler

- 🚌 **Toplu Taşıma Entegrasyonu:** Ankara EGO, Metro, Ankaray rotaları ve gerçek zamanlı araç takibi
- 🚕 **Araç Paylaşımı:** Taksi ücret hesaplama, Uber ve Bolt entegrasyonu
- 🗺️ **Akıllı Rota Planlama:** Çok modlu seyahat seçenekleri ve alternatif rotalar
- 📍 **Yer Tavsiyeleri:** Google Places API ile yakındaki turistik yerler, restoranlar ve hizmetler
- 🌐 **Çok Şehirli Mimari:** Ankara'dan sonra kolayca diğer şehirlere genişleyebilir yapı

---

## ✨ Özellikler

### MVP Özellikleri (v0.1.0)

- ✅ **Kullanıcı Kimlik Doğrulama (JWT)**
  - Kayıt, Giriş, Çıkış endpoints
  - Şifre sıfırlama ve değiştirme işlevselliği
  - E-posta doğrulama desteği
  - Rol tabanlı erişim kontrolü (KULLANICI, YÖNETİCİ, SÜPER_YÖNETİCİ)
  - Token yenileme mekanizması
- ✅ **Rota Planlama Motoru**
  - Çok modlu rota arama (yürüme, taksi, toplu taşıma)
  - OSRM (Open Source Routing Machine) entegrasyonu
  - Redis caching ile performans optimizasyonu
  - Alternatif rota önerileri
- ✅ **Taksi Ücret Tahmini**
  - Veritabanı tabanlı tarife yönetimi
  - Açılış ücreti, km başı ücret, minimum tarife
  - Gece tarifesi desteği (%50 ek ücret)
  - Havaalanı ek ücreti hesaplama
- ✅ **Backend API Altyapısı**
  - RESTful API (Express.js + TypeScript)
  - PostgreSQL + MongoDB + Redis entegrasyonu
  - Socket.io WebSocket desteği
  - Winston loglama sistemi
  - İstek sınırlama ve hata yönetimi
- ✅ **Veritabanı Şemaları**
  - Çok şehirli mimari (cities tablosu)
  - 16 PostgreSQL tablosu (users, routes, stops, fares, vb.)
  - 8 MongoDB koleksiyonu (vehicle_locations, live_updates, vb.)
  - PostGIS extension ile coğrafi sorgular
- ✅ **Frontend UI Bileşenleri**
  - Giriş/Kayıt sayfaları (form doğrulama)
  - Ana sayfa (dashboard)
  - Rota arama sayfası (konum arama, filtreler)
  - Favori rotalar sayfası
  - Durak arama sayfası (konum servisleri)
  - Seyahat geçmişi sayfası
  - Yeniden kullanılabilir bileşenler (Button, Input, Card, Toast, Map)
  - Korumalı rota sarmalayıcı
  - Redux state yönetimi
- ✅ **Harita ve Konum Servisleri**
  - React Leaflet + OpenStreetMap entegrasyonu
  - Otomatik tamamlamalı konum arama (Nominatim)
  - İşaretleyici ve çizgi desteği
  - Coğrafi konum API entegrasyonu
- ✅ **WebSocket Altyapısı**
  - WebSocket istemcisi (Socket.io)
  - Gerçek zamanlı araç takibi desteği
  - useWebSocket özel hook
- ✅ Türkçe arayüz hazırlığı (i18n altyapısı)
- ✅ Mobil-responsive tasarım altyapısı (Tailwind CSS)

### Gelecek Özellikler (v1.x)

- 🔜 Gerçek zamanlı araç takibi
- 🔜 Uber & Bolt entegrasyonu
- 🔜 Yer tavsiyeleri (Google Places)
- 🔜 Favori rotalar
- 🔜 Seyahat geçmişi
- 🔜 Çevrimdışı mod
- 🔜 Push bildirimleri

---

## 🛠️ Teknoloji Yığını

### Frontend

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Redux Toolkit
- **Maps:** React Leaflet + OpenStreetMap
- **HTTP Client:** Axios
- **Animations:** Framer Motion

### Backend

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Databases:**
  - PostgreSQL (yapısal veriler) + PostGIS
  - MongoDB (gerçek zamanlı veriler)
  - Redis (önbellekleme)
- **Real-time:** Socket.io
- **Authentication:** JWT
- **Logging:** Winston

### DevOps

- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions (planlı)
- **Hosting:** Vercel (frontend) + Railway (backend) (planlı)
- **Monitoring:** Winston Logger

### 🆓 Ücretsiz Servisler (Maliyet: $0/ay)

- **Harita:** OpenStreetMap (API key gerektirmiyor)
- **Routing:** OSRM - Open Source Routing Machine (Ücretsiz public API)
- **Geocoding:** Nominatim (Ücretsiz)
- **POI:** Overpass API (Ücretsiz)

> ⚠️ **ÖNEMLİ: API Anahtarları Hakkında**
>
> **Şu anda:** Proje tamamen ücretsiz servislerle çalışmaktadır. **API key gerektirmez!**
>
> **Test aşamasında eklenecek** (opsiyonel):
> - Google Maps API ($200/ay ücretsiz kredi)
> - Uber Sandbox API (Test mode ücretsiz)
> - Bolt Sandbox API (Test mode ücretsiz)
>
> 📖 Detaylı bilgi: [docs/API_COSTS_AND_FREE_STRATEGY.md](docs/API_COSTS_AND_FREE_STRATEGY.md)
>
> İlk 1000 kullanıcı için tahmini maliyet: **$0/ay** 🎉

---

## 🚀 Başlangıç

### Ön Gereksinimler

- Node.js 18+ ve npm 9+
- Docker ve Docker Compose
- Git

### Kurulum

1. **Depoyu klonlayın:**

```bash
git clone https://github.com/yourusername/gercek-zamanli-ulasim-platformu.git
cd gercek-zamanli-ulasim-platformu
```

2. **Environment dosyalarını oluşturun:**

**Frontend:**
```bash
cd frontend
cp .env.example .env.local
```

`.env.local` dosyasını düzenleyin:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Backend:**
```bash
cd ../backend
cp .env.example .env
```

`.env` dosyasını düzenleyin (veritabanı şifreleri, API anahtarları vb.)

3. **Docker ile başlatın:**

```bash
cd ..
docker-compose up -d
```

Bu komut aşağıdaki servisleri başlatır:
- PostgreSQL (port 5432)
- MongoDB (port 27017)
- Redis (port 6379)
- Backend API (port 5000)
- Frontend (port 3000)

4. **Veritabanını başlatın:**

```bash
# PostgreSQL tablolarını oluştur
docker-compose exec postgres psql -U ankara_admin -d ankara_ulasim_db -f /docker-entrypoint-initdb.d/init.sql

# MongoDB koleksiyonlarını oluştur (otomatik)
```

5. **Uygulamayı açın:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

---

### Manuel Kurulum (Docker olmadan)

#### Backend

```bash
cd backend
npm install
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

**Not:** Manuel kurulum için PostgreSQL, MongoDB ve Redis'in yerel olarak kurulu olması gerekir.

---

## 📁 Proje Yapısı

```
gercek-zamanli-ulasim-platformu/
├── frontend/                 # Next.js frontend uygulaması
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   ├── components/      # React bileşenleri
│   │   │   ├── common/      # Genel bileşenler
│   │   │   ├── map/         # Harita bileşenleri
│   │   │   ├── route/       # Rota planlama bileşenleri
│   │   │   ├── transportation/ # Ulaşım bileşenleri
│   │   │   ├── places/      # Yer bileşenleri
│   │   │   └── user/        # Kullanıcı bileşenleri
│   │   ├── lib/
│   │   │   ├── api/         # API client fonksiyonları
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── store/       # Redux store
│   │   │   ├── types/       # TypeScript type tanımları
│   │   │   └── utils/       # Yardımcı fonksiyonlar
│   │   └── styles/          # Global stiller
│   ├── public/              # Statik dosyalar
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── next.config.js
│
├── backend/                  # Express.js backend API
│   ├── src/
│   │   ├── config/          # Konfigürasyon dosyaları
│   │   ├── controllers/     # Route controller'lar
│   │   ├── models/          # Database modelleri
│   │   ├── routes/          # API route tanımları
│   │   ├── services/        # Business logic servisleri
│   │   │   └── taxiFareService.ts  # Taksi ücret hesaplama
│   │   ├── middleware/      # Express middleware'ler
│   │   ├── utils/           # Yardımcı fonksiyonlar
│   │   ├── types/           # TypeScript type tanımları
│   │   └── server.ts        # Ana server dosyası
│   ├── database/
│   │   ├── init.sql         # PostgreSQL şeması
│   │   ├── mongo-init.js    # MongoDB koleksiyonları
│   │   ├── migrations/      # Database migration'lar
│   │   └── seeds/           # Seed data
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── docs/                     # Dokümantasyon
│   ├── API_ENDPOINTS.md     # API endpoint dokümantasyonu
│   ├── TECHNICAL_ANALYSIS.md # Teknik analiz raporu
│   └── DATABASE_SCHEMA.md   # Veritabanı şeması (planlı)
│
├── docker-compose.yml        # Docker Compose konfigürasyonu
├── .gitignore
└── README.md                 # Bu dosya
```

---

## 📚 API Dokümantasyonu

Detaylı API dokümantasyonu için: [API_ENDPOINTS.md](docs/API_ENDPOINTS.md)

### Temel Endpoint'ler

**Base URL:** `http://localhost:5000/api/v1`

#### Kimlik Doğrulama

```bash
# Kayıt
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "Ahmet Yılmaz"
}

# Giriş
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Rota Planlama

```bash
POST /routes/search
Authorization: Bearer {token}
Content-Type: application/json

{
  "origin": { "lat": 39.9334, "lng": 32.8597 },
  "destination": { "lat": 39.9208, "lng": 32.8541 },
  "modes": ["BUS", "METRO", "WALKING"]
}
```

#### Taksi Ücret Tahmini

```bash
POST /taxi/estimate
Content-Type: application/json

{
  "origin": { "lat": 39.9334, "lng": 32.8597 },
  "destination": { "lat": 39.9208, "lng": 32.8541 },
  "departureTime": "2024-01-15T10:30:00Z"
}
```

---

## 💻 Geliştirme

### Kod Standardı

- **ESLint:** Kod kalitesi için
- **Prettier:** Kod formatlama için
- **TypeScript:** Tip güvenliği için

### Çalıştırma Komutları

#### Frontend

```bash
cd frontend

npm run dev        # Development server
npm run build      # Production build
npm run start      # Production server
npm run lint       # Linting
npm run type-check # TypeScript kontrolü
```

#### Backend

```bash
cd backend

npm run dev        # Development server (nodemon)
npm run build      # TypeScript build
npm run start      # Production server
npm run lint       # Linting
npm run test       # Unit tests (planlı)
```

### Veritabanı Yönetimi

```bash
# PostgreSQL'e bağlan
docker-compose exec postgres psql -U ankara_admin -d ankara_ulasim_db

# MongoDB'ye bağlan
docker-compose exec mongodb mongosh -u ankara_admin -p ankara_password_2024 ankara_ulasim_realtime

# Redis CLI
docker-compose exec redis redis-cli
```

### Test Etme

```bash
# Backend unit tests
cd backend
npm run test

# Frontend component tests (planlı)
cd frontend
npm run test
```

---

## 🌐 Deployment

### Production Build

#### Frontend (Vercel)

```bash
cd frontend
npm run build

# Vercel CLI ile deploy
vercel --prod
```

#### Backend (Railway / Render)

```bash
cd backend
npm run build

# Docker image build
docker build -t gercek-zamanli-ulasim-backend .
```

### Environment Variables

**Production için gerekli environment variables:**

**Frontend:**
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API key

**Backend:**
- `DATABASE_URL`: PostgreSQL connection string
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT secret key
- `GOOGLE_MAPS_API_KEY`: Google Maps API key

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen aşağıdaki adımları izleyin:

1. Bu depoyu fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

### Kod Katkı Kuralları

- TypeScript kullanın
- ESLint kurallarına uyun
- Meaningful commit mesajları yazın
- Test coverage'ı koruyun/artırın
- Dokümantasyonu güncelleyin

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 👥 Ekip

- **Proje Yöneticisi:** [İsim]
- **Lead Developer:** [İsim]
- **UI/UX Designer:** [İsim]

---

## 📞 İletişim

- **Email:** info@gercek-zamanli-ulasim.com (örnek)
- **Website:** https://gercek-zamanli-ulasim.app (planlı)
- **GitHub:** https://github.com/yourusername/gercek-zamanli-ulasim-platformu

---

## 🙏 Teşekkürler

- [Next.js](https://nextjs.org/) - React framework
- [Express.js](https://expressjs.com/) - Backend framework
- [PostgreSQL](https://www.postgresql.org/) - Veritabanı
- [MongoDB](https://www.mongodb.com/) - NoSQL veritabanı
- [OpenStreetMap](https://www.openstreetmap.org/) - Harita verileri
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

---

## 📊 Proje Durumu

**Versiyon:** 0.1.0 (Development)
**Son Güncelleme:** Ocak 2025
**Durum:** 🚧 Aktif Geliştirme

### Roadmap

**✅ Tamamlanan (Phase 1 - Backend Altyapısı)**
- [x] Proje kurulumu ve mimari tasarım
- [x] Veritabanı şeması tasarımı (PostgreSQL + MongoDB)
- [x] Backend API temel yapısı (Express + TypeScript)
- [x] Frontend temel yapısı (Next.js 14 + TypeScript)
- [x] Taksi ücret hesaplama servisi
- [x] Kullanıcı kimlik doğrulama implementasyonu (JWT, kayıt, giriş, şifre sıfırlama)
- [x] Rota planlama motoru (OSRM entegrasyonu, çok modlu yönlendirme)
- [x] Veritabanı bağlantısı ve başlatma
- [x] Hata yönetimi ve loglama sistemi
- [x] İstek sınırlama ve güvenlik ara katmanları
- [x] API dokümantasyonu (40+ endpoint)
- [x] Teknik analiz raporu ve PRD değerlendirmesi

**✅ Tamamlanan (Phase 2 - Redux ve API İstemcisi)**
- [x] Redux Toolkit durum yönetimi (auth, route, ui slices)
- [x] API istemci altyapısı (Axios interceptors, token yenileme)
- [x] Temel UI bileşenleri (Button, Input, Card, Toast)
- [x] Redux Provider entegrasyonu
- [x] API maliyet optimizasyonu dokümantasyonu
- [x] Tip güvenli API metodları (authAPI, routeAPI)
- [x] Toast bildirim sistemi (Framer Motion)

**✅ Tamamlanan (Phase 3 - Kimlik Doğrulama Arayüzü)**
- [x] Giriş sayfası (React Hook Form + Zod doğrulama)
- [x] Kayıt sayfası (şifre gücü göstergesi, kullanım koşulları onay kutusu)
- [x] Form doğrulama şemaları (giriş, kayıt, şifre sıfırlama, şifre değiştirme)
- [x] Korumalı rota sarmalayıcı bileşeni (rol tabanlı erişim kontrolü)
- [x] Ana sayfa (hoş geldin ekranı, hızlı işlemler, istatistikler)
- [x] Çıkış işlevi
- [x] Kimlik doğrulama akışı entegrasyonu

**✅ Tamamlanan (Phase 4 - Rota Arama ve Harita)**
- [x] Rota arama sayfası (form, konum arama, ulaşım türü seçimi)
- [x] Harita entegrasyonu (React Leaflet + OpenStreetMap)
- [x] Otomatik tamamlamalı konum arama (Nominatim API)
- [x] Rota sonuçları görüntüleme bileşeni
- [x] Favori rotalar sayfası (boş durum, gelecekte CRUD)
- [x] Durak arama sayfası (yakındaki duraklar, konum servisleri)
- [x] Seyahat geçmişi sayfası (geçmiş rotalar, filtreler)
- [x] WebSocket istemcisi (gerçek zamanlı araç takibi)
- [x] useWebSocket özel hook
- [x] Rota doğrulama şemaları (Zod)
- [x] Harita işaretleyicileri ve çizgi desteği
- [x] Gelişmiş arama seçenekleri (tekerlekli sandalye, maksimum yürüme mesafesi)

**📋 Planlanan (Phase 5 - Backend Entegrasyonu ve İyileştirmeler)**
- [ ] Backend API entegrasyonu (rotalar, favoriler, geçmiş)
- [ ] Toplu taşıma veri entegrasyonu (CSV ayrıştırıcı, veri ekleyici)
- [ ] Gerçek rota hesaplama (OSRM API entegrasyonu)
- [ ] Favori rotalar CRUD API implementasyonu
- [ ] Seyahat geçmişi API implementasyonu
- [ ] WebSocket sunucusu gerçek zamanlı güncellemeler
- [ ] Yer tavsiyeleri (Google Places API - opsiyonel)
- [ ] Profil ayarları sayfası
- [ ] UI/UX iyileştirmeleri ve son rötuşlar
- [ ] Birim ve entegrasyon testleri
- [ ] Performans optimizasyonları
- [ ] MVP lansmanı

---

**⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!**
