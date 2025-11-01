# API Maliyetleri ve Ücretsiz Strateji

**Tarih:** Ocak 2025
**Durum:** 🆓 Ücretsiz Tier Kullanımda

---

## 🎯 Strateji Özeti

Proje başlangıç aşamasında **TAM ÜCRETSIZ** servisler kullanılmaktadır. API anahtarı gerektiren servisler test aşamasında eklenecektir.

---

## ✅ Şu Anda Kullanılan Ücretsiz Servisler

### 1. **OpenStreetMap (OSM)**
- **Maliyet:** $0/ay (Tamamen ücretsiz)
- **Kullanım:** Harita gösterimi
- **Sınır:** Yok
- **Avantajlar:**
  - Açık kaynak
  - Sınırsız kullanım
  - API key gerektirmiyor
  - Community desteği
- **Kullanılan Kütüphane:** React Leaflet

### 2. **OSRM (Open Source Routing Machine)**
- **Maliyet:** $0/ay (Public API ücretsiz)
- **Kullanım:** Rota hesaplama (yürüme, araç)
- **API URL:** `https://router.project-osrm.org`
- **Sınırlar:**
  - Rate limit: Makul kullanım (fair use)
  - Günlük kullanım limiti yok
- **Avantajlar:**
  - API key gerektirmiyor
  - Hızlı yanıt süreleri
  - OpenStreetMap verilerine dayalı
- **Alternatif:** Self-hosted OSRM (kendi sunucunda)

### 3. **Nominatim (Geocoding)**
- **Maliyet:** $0/ay (Ücretsiz)
- **Kullanım:** Adres arama ve geocoding
- **API URL:** `https://nominatim.openstreetmap.org`
- **Sınırlar:**
  - 1 istek/saniye
  - User-Agent header zorunlu
- **Kullanım Kuralları:**
  ```javascript
  // User-Agent eklemek zorunlu
  headers: {
    'User-Agent': 'Ankara-Ulasim-Platform/0.1.0'
  }
  ```

### 4. **Overpass API (POI - Points of Interest)**
- **Maliyet:** $0/ay (Ücretsiz)
- **Kullanım:** Yakındaki yerler (restoran, kafe, ATM, vb.)
- **API URL:** `https://overpass-api.de/api/interpreter`
- **Sınırlar:**
  - Reasonable use
  - Kompleks sorgular için timeout var
- **Avantajlar:**
  - API key yok
  - Zengin POI verisi
  - OSM'den güncel veri

---

## ⚠️ TEST AŞAMASINDA EKLENECEK API'ler

### 1. **Google Maps API** (Opsiyonel - Premium Özellikler İçin)

**Ücretsiz Kota (Aylık $200 Kredi):**
| API | Ücretsiz Limit | Değer |
|-----|----------------|-------|
| Maps JavaScript API | 28,000 yükleme | $200 |
| Places API | 11,000 istek | $200 |
| Directions API | 40,000 istek | $200 |
| Geocoding API | 40,000 istek | $200 |

**Kurulum:**
```bash
# .env dosyasına ekle
GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Kullanım Senaryoları:**
- ❌ **Başlangıçta kullanma** - OSM yeterli
- ✅ **Kullanıcı sayısı > 1000 olunca ekle**
- ✅ **Premium özellikler gerekince** (Street View, Indoor Maps)

**Not:** API anahtarını almak için:
1. https://console.cloud.google.com adresine git
2. Yeni proje oluştur
3. APIs & Services → Enable APIs
4. Credentials → Create API Key
5. API Key'i kısıtla (HTTP referrers ile)

---

### 2. **Uber API** (Test Mode - Ücretsiz)

**Sandbox Environment:**
- Maliyet: $0 (Test mode)
- Gerçek sürüş yok, simülasyon
- Ücret tahminleri alınabilir

**Kurulum:**
```bash
# .env dosyasına ekle
UBER_CLIENT_ID=your_client_id
UBER_CLIENT_SECRET=your_client_secret
UBER_SERVER_TOKEN=your_server_token
```

**Başvuru:**
1. https://developer.uber.com adresine git
2. Developer hesabı oluştur
3. App oluştur
4. Sandbox credentials al

**Not:** Production için ayrı onay süreci gerekli (4-8 hafta)

---

### 3. **Bolt API** (Sandbox - Ücretsiz)

**Test Environment:**
- Maliyet: $0 (Sandbox)
- Simülasyon ortamı
- Fiyat tahminleri

**Kurulum:**
```bash
# .env dosyasına ekle
BOLT_API_KEY=your_api_key
BOLT_API_SECRET=your_api_secret
```

**Başvuru:**
1. https://bolt.eu/business adresine git
2. Business partnership başvurusu
3. API erişimi talep et

**Not:** Production için business partnership gerekli

---

## 📋 API Eklerken Yapılacaklar Listesi

### Google Maps API Ekleme

**1. API Key Al**
```bash
# Google Cloud Console'dan API key oluştur
# Kısıtlamalar ekle (domain, IP)
```

**2. Environment Ekle**
```bash
# backend/.env
GOOGLE_MAPS_API_KEY=your_key

# frontend/.env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
```

**3. Rate Limiting Ekle**
```javascript
// Cache ile API çağrılarını minimize et
const CACHE_TTL = 86400; // 24 saat (static data için)
const CACHE_TTL_DIRECTIONS = 300; // 5 dakika (dynamic data için)
```

**4. Fallback Stratejisi**
```javascript
// Google API başarısız olursa OSM'e dön
try {
  return await googleDirectionsAPI(origin, dest);
} catch (error) {
  logger.warn('Google API failed, falling back to OSRM');
  return await osrmAPI(origin, dest);
}
```

---

### Uber/Bolt API Ekleme

**1. Credentials Al**
- Sandbox environment credentials
- Test mode aktif

**2. Service Oluştur**
```typescript
// backend/src/services/rideShareService.ts
class RideShareService {
  async getUberEstimate(origin, dest) {
    // Uber API implementation
  }

  async getBoltEstimate(origin, dest) {
    // Bolt API implementation
  }
}
```

**3. Karşılaştırma Endpoint'i Ekle**
```typescript
// POST /api/v1/rideshare/compare
{
  "origin": {...},
  "destination": {...}
}

// Response:
{
  "estimates": [
    { "provider": "TAXI", "fare": 85.50 },
    { "provider": "UBER", "fare": 92.00 },
    { "provider": "BOLT", "fare": 88.00 }
  ],
  "cheapest": "TAXI"
}
```

---

## 💰 Maliyet Optimizasyon Stratejileri

### 1. **Agresif Caching**

```javascript
// Redis cache stratejisi
const CACHE_STRATEGY = {
  // Static data - 24 saat
  places: 86400,
  stops: 86400,
  routes: 43200, // 12 saat

  // Semi-static - 1 saat
  geocoding: 3600,

  // Dynamic - 5 dakika
  directions: 300,
  fare_estimates: 300,

  // Real-time - 30 saniye
  vehicle_locations: 30,
};
```

### 2. **Request Batching**

```javascript
// Çoklu istek yerine batch request
const locations = ['loc1', 'loc2', 'loc3'];
const results = await geocodeBatch(locations); // 1 request
// yerine
// locations.map(loc => geocode(loc)); // 3 requests
```

### 3. **Lazy Loading**

```javascript
// Sadece gerektiğinde API çağır
// Örn: Kullanıcı harita zoom yaptığında POI getir
onMapZoom((zoom) => {
  if (zoom > 14) {
    loadNearbyPOIs(); // API çağrısı
  }
});
```

### 4. **User Behavior Analytics**

```javascript
// Sık kullanılan rotaları cache'le
// Örn: "Kızılay - Ulus" rotası günde 100 kez aranıyorsa
// Bu rota için cache TTL'i artır: 1 saat → 24 saat
```

---

## 📊 Tahmini Maliyet Tablosu

### Kullanıcı Sayısına Göre Maliyet

| Kullanıcı Sayısı | OSM/OSRM | Google Maps (Opsiyonel) | Uber/Bolt | Toplam |
|------------------|----------|------------------------|-----------|--------|
| 0 - 1,000 | $0 | $0 (ücretsiz kota yeter) | $0 (sandbox) | **$0/ay** |
| 1,000 - 5,000 | $0 | $0 - $50 | $0 (sandbox) | **$0-50/ay** |
| 5,000 - 10,000 | $0 | $50 - $200 | $0 - $100 | **$50-300/ay** |
| 10,000+ | $0 | $200+ | $100+ | **$300+/ay** |

**Not:** İlk 6 ay için tahmini maliyet: **$0-50/ay**

---

## 🚀 Başlangıç Kontrol Listesi

### Geliştirme Ortamı (Şimdi)
- [x] OpenStreetMap kullan
- [x] OSRM kullan
- [x] Nominatim kullan (geocoding)
- [x] Overpass API kullan (POI)
- [x] API key yok - hemen başla!

### Test Aşaması (API'ler eklenecek)
- [ ] Google Maps API key al
- [ ] Uber Sandbox credentials al
- [ ] Bolt Sandbox credentials al
- [ ] .env dosyalarını doldur
- [ ] Rate limiting test et
- [ ] Cache stratejisini test et

### Production (Canlıya almadan önce)
- [ ] Google Maps billing aktif et ($200 ücretsiz kredi)
- [ ] API key'leri production keys ile değiştir
- [ ] Domain restrictions ekle
- [ ] Monitoring kur (API usage tracking)
- [ ] Alert'ler kur (usage limits için)
- [ ] Uber/Bolt production onayı al

---

## 🔍 API Kullanım İzleme

### Google Cloud Console'da İzleme

```bash
# Dashboard → APIs & Services → Credentials
# Her API için kullanım grafiklerini incele

# Kritik metrikler:
- Günlük istek sayısı
- Başarı oranı
- Yanıt süreleri
- Maliyet tahminleri
```

### Backend Logging

```javascript
// API çağrılarını logla
logger.info('API Request', {
  service: 'google_directions',
  cached: false,
  duration: 234, // ms
  cost_estimate: 0.005 // $
});
```

---

## ⚡ Hızlı Başlangıç

**Şu anda yapman gereken:** HIÇBIR ŞEY! 🎉

Proje zaten ücretsiz servislerle çalışıyor:
- OpenStreetMap: ✅ Aktif
- OSRM: ✅ Aktif
- API keys: ❌ Gerekmiyor

**Test ederken:**
1. Google Maps eklemek istersen → Bu dokümana bak
2. Uber/Bolt test etmek istersen → Sandbox credentials al
3. Maliyet endişesi → İlk 1000 kullanıcı için $0

---

## 📞 Destek ve Kaynaklar

**Ücretsiz Servisler:**
- OpenStreetMap Wiki: https://wiki.openstreetmap.org
- OSRM Documentation: http://project-osrm.org
- Nominatim Usage: https://nominatim.org/release-docs/latest/api/Overview/

**Premium Servisler:**
- Google Maps Pricing: https://mapsplatform.google.com/pricing/
- Uber Developer: https://developer.uber.com
- Bolt Business: https://bolt.eu/business

---

**Son Güncelleme:** Ocak 2025
**Versiyon:** 1.0
**Durum:** ✅ Ücretsiz Stratejide Çalışıyor
