# Hassas Bilgiler ve Ortam Değişkenleri Konfigürasyonu

## ⚠️ Güvenlik Notu

Bu proje GitHub'ta **PUBLIC** olarak paylaşıldığından, **hiçbir şekilde** aşağıdakiler depoya commit edilmemelidir:

- ✅ API anahtarları (Google Maps, Uber, Bolt vb.)
- ✅ Veritabanı şifreleri
- ✅ JWT Secret
- ✅ SMTP şifreleri
- ✅ Özel SSH anahtarları
- ✅ Credentials dosyaları
- ✅ Local IP adresleri

Tüm bu bilgiler **`.env`** dosyalarında saklanmalı ve `.gitignore`'a eklenmelidir.

---

## 🔧 Kurulum Adımları

### 1. Backend Ortam Değişkenlerini Ayarla

```bash
cd backend

# .env.example dosyasını .env olarak kopyala
cp .env.example .env

# Düzenleyici ile aç ve gerçek değerleri gir
nano .env  # veya vim .env
```

**`.env` dosyasında şunları güncelle:**

```env
# Gerçek veritabanı şifreleri
POSTGRES_PASSWORD=your_strong_password_here
MONGODB_URI=mongodb://username:password@host:27017/dbname?authSource=admin

# Güvenlik - JWT Secret (uzun ve rastgele)
JWT_SECRET=your_jwt_secret_here_at_least_32_chars_long_and_random

# Google Maps API Key
GOOGLE_MAPS_API_KEY=AIzaSyD...your_actual_api_key...

# Üçüncü parti servisleri
UBER_API_KEY=your_uber_key
BOLT_API_KEY=your_bolt_key
```

### 2. Frontend Ortam Değişkenlerini Ayarla

```bash
cd frontend

# .env.example dosyasını .env.local olarak kopyala
cp .env.example .env.local

# Düzenleyici ile aç ve gerçek değerleri gir
nano .env.local  # veya vim .env.local
```

**`.env.local` dosyasında şunları güncelle:**

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD...your_actual_api_key...
```

### 3. Docker Compose için Ortam Dosyasını Oluştur

```bash
cd ..

# Kök dizinde .env dosyası oluştur
cat > .env << EOF
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_strong_password_here
POSTGRES_DB=gercek_zamanli_ulasim_db

# MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your_strong_password_here
MONGO_INITDB_DATABASE=gercek_zamanli_ulasim_realtime

# Backend
NODE_ENV=development
PORT=5001
JWT_SECRET=your_jwt_secret_here
GOOGLE_MAPS_API_KEY=AIzaSyD...your_actual_api_key...

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD...your_actual_api_key...
EOF
```

---

## 📋 Gerekli API Anahtarları Nasıl Alınır?

### Google Maps API

1. https://console.cloud.google.com/google/maps-apis adresine git
2. Yeni bir proje oluştur
3. Aşağıdaki API'leri enable et:
   - Directions API
   - Geocoding API
   - Places API
   - Maps JavaScript API
4. "APIs & Services" → "Credentials" → "Create API Key"
5. API Key'i kopyala ve `.env` dosyasına yapıştır

**Güvenlik:** API Key'i kısıtla (HTTP referrers seçeneğini kullan)

### Uber API

- https://developer.uber.com adresine git
- Geliştirici hesabı oluştur
- Uygulamayı kaydet
- API keys'i kopyala

### Bolt API

- https://developer.bolt.eu adresine git
- Geliştirici hesabı oluştur
- Uygulamayı kaydet
- API keys'i kopyala

---

## 🚀 Başlat

Ortam değişkenleri ayarlandıktan sonra:

```bash
# Docker ile başlat
docker-compose up --build

# veya lokal geliştirme için
# Backend
cd backend
npm install
npm run dev

# Frontend (başka terminal)
cd frontend
npm install
npm run dev
```

---

## ✅ Kontrol Listesi

Projeyi GitHub'a push etmeden önce kontrol et:

- [ ] `.env` dosyaları `.gitignore`'a ekli mi?
- [ ] Hiç bir `.env` dosyası repo'ya commit edilmedi mi?
- [ ] Kaynak kodda hard-coded şifreler var mı? (Ara: `password`, `secret`, `api_key`)
- [ ] `.env.example` dosyaları mevcut mi?
- [ ] Google API SETUP.md dosyası kuruluş talimatları içeriyor mu?
- [ ] Docker-compose.yml ortam değişkenlerini kullanıyor mu?

---

## 🔒 Best Practices

1. **Asla API anahtarlarını kodda hard-code etme**
   ```typescript
   // ❌ YAPMAYINIZ
   const apiKey = "AIzaSy...";
   
   // ✅ YAPINIZ
   const apiKey = process.env.GOOGLE_MAPS_API_KEY;
   ```

2. **Production ortamında güçlü şifreler kullan**
   - En az 16 karakter
   - Özel karakterler, sayılar ve harfler içer
   - Rastgele oluştur (PasswordGenerator kullan)

3. **API anahtarlarını kısıtla**
   - HTTP referrers seçeneğini etkinleştir
   - IP whitelisting yapılandır
   - Kullanılan API'leri sınırla

4. **Ortam değişkenlerini şifrele** (Production için)
   - AWS Secrets Manager
   - Azure Key Vault
   - HashiCorp Vault

5. **Regular security audits yapıl**
   - GitHub'ta exposed secrets taraması
   - Dependency vulnerability taraması

---

## 📞 Yardım

Sorular için: developer@example.com
