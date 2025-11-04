# 🗺️ Google API Kurulum Rehberi

Bu döküman, Google Maps Platform API'lerinin projeye entegrasyonunu açıklar.

## 📋 İçindekiler

- [Kullanılan API'ler](#kullanılan-apiler)
- [API Key Alma](#api-key-alma)
- [Limitler ve Fiyatlandırma](#limitler-ve-fiyatlandırma)
- [Kurulum](#kurulum)
- [Kullanım](#kullanım)
- [Önemli Notlar](#önemli-notlar)

---

## 🎯 Kullanılan API'ler

### Backend API'leri

| API | Kategori | Kullanım Amacı | Limit |
|-----|----------|----------------|-------|
| **Directions API (Transit)** | Essentials | Toplu taşıma rota planlama | 10,000/ay |
| **Places API (Autocomplete)** | Essentials | Konum arama ve öneriler | 10,000/ay |
| **Geocoding API** | Essentials | Adres ↔ Koordinat dönüşümü | 10,000/ay |

### Frontend API'leri

| API | Kategori | Kullanım Amacı | Limit |
|-----|----------|----------------|-------|
| **Maps JavaScript API** | Essentials | Harita görselleştirme | 10,000/ay |

**Toplam Ücretsiz Limit:** 40,000 requests/month

---

## 🔑 API Key Alma

### 1. Google Cloud Console'a Gidin

https://console.cloud.google.com/

### 2. Yeni Proje Oluşturun

```
1. "Select a project" dropdown → "New Project"
2. Proje adı: "Gercek-Zamanli-Ulasim"
3. Create
```

### 3. Google Maps Platform'u Etkinleştirin

```
1. Navigation Menu → "APIs & Services" → "Library"
2. Aşağıdaki API'leri arayın ve ENABLE'a tıklayın:
   ✅ Directions API
   ✅ Places API (New)
   ✅ Geocoding API
   ✅ Maps JavaScript API
```

### 4. API Key Oluşturun

```
1. Navigation Menu → "APIs & Services" → "Credentials"
2. "+ CREATE CREDENTIALS" → "API key"
3. API key oluşturuldu! Kopyalayın.
```

### 5. API Key'i Güvenli Hale Getirin

**ÖNEMLİ:** API key'i herkese açık bırakmayın!

```
1. API key'in yanındaki "Edit" (kalem) ikonuna tıklayın

2. Application restrictions:
   - HTTP referrers (websites) seçin
   - Website restrictions ekleyin:
     * http://localhost:3000/*
     * https://yourdomain.com/*

3. API restrictions:
   - Restrict key seçin
   - Sadece şu API'leri seçin:
     ✅ Directions API
     ✅ Places API
     ✅ Geocoding API
     ✅ Maps JavaScript API

4. Save
```

---

## 💰 Limitler ve Fiyatlandırma

### Ücretsiz Katman (Free Tier)

Google, **$200 aylık kredi** verir. Bu kredi ile:

| API | Ücretsiz Miktar | Request Başı Maliyet |
|-----|-----------------|---------------------|
| Directions API | 10,000 | $0.005 |
| Places Autocomplete | 10,000 | $0.0032 |
| Geocoding API | 10,000 | $0.005 |
| Maps JavaScript | 10,000 loads | $0.007 |

**Toplam:** ~40,000 requests/month **TAM ÜCRETSİZ**

### Rate Limiting (Proje İçi)

Ücretsiz limitlere ulaşmamak için projeye dahili rate limiting ekledik:

```typescript
// Saatlik limitler (güvenli değerler)
Directions API: 14 request/saat (~330/gün)
Places API: 14 request/saat (~330/gün)
Geocoding API: 14 request/saat (~330/gün)
```

Bu limitler ile aylık **~10,000 request**'i aşmazsınız.

---

## 🛠️ Kurulum

### 1. Environment Variables

#### Backend (`/backend/.env`)

```bash
# Google Maps Platform API Key
GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

#### Frontend (`/frontend/.env.local`)

```bash
# Google Maps JavaScript API Key (Aynı key kullanılır)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

### 2. Dependencies Yüklü

Backend dependencies zaten yüklü:

```bash
npm install @googlemaps/google-maps-services-js
```

### 3. Config Kontrolü

Backend'de API key validation:

```bash
cd backend
npm start

# Console çıktısı:
✅ Google Maps API key is configured
```

---

## 📖 Kullanım

### Backend - Toplu Taşıma Rotası

```typescript
// Route Service
import routeService from './services/routeService';

const routes = await routeService.searchRoutes({
  origin: { lat: 39.9334, lng: 32.8597 }, // Ankara Kızılay
  destination: { lat: 39.9208, lng: 32.8541 }, // Ankara Ulus
  modes: [TransportMode.BUS, TransportMode.METRO],
  departureTime: new Date(),
  userId: 'user123', // Rate limiting için
});

// Sonuç:
// - Otobüs, metro, tramvay rotaları
// - Hat bilgileri (500T, M1, M2 vb.)
// - Durak isimleri
// - Varış süreleri
// - Polyline (haritada çizmek için)
```

### Backend - Konum Arama

```typescript
// Places Service
import GooglePlacesService from './services/googlePlacesService';

const places = await GooglePlacesService.searchPlaces({
  input: 'Kızılay Ankara',
  location: { lat: 39.9334, lng: 32.8597 },
  radius: 5000,
});

// Sonuç:
// [
//   {
//     placeId: 'ChIJ...',
//     description: 'Kızılay, Ankara',
//     mainText: 'Kızılay',
//     secondaryText: 'Çankaya, Ankara'
//   }
// ]
```

### Frontend - Harita (Gelecekte)

```tsx
// Map Component (Şu an React Leaflet, gelecekte Google Maps olacak)
<GoogleMap
  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
  center={{ lat: 39.9334, lng: 32.8597 }}
  zoom={13}
/>
```

---

## ⚠️ Önemli Notlar

### 1. Toplu Taşıma Verisi Sınırlı

Google Transit API, **tüm şehirlerde** veri içermez:

| Şehir | Destek Durumu |
|-------|---------------|
| İstanbul | 🟡 Orta (İETT, Metro) |
| Ankara | 🟠 Sınırlı (EGO, Metro) |
| İzmir | 🔴 Çok Az |
| Diğer | 🔴 Yok/Çok Az |

**Çözüm:** Eksik şehirler için mock data veya yerel API entegrasyonu gerekebilir.

### 2. Gerçek Zamanlı Veri YOK

Google Directions API:
- ✅ Rota planlama
- ✅ Hat bilgileri
- ✅ Durak isimleri
- ❌ Araç konumları (gerçek zamanlı)
- ❌ "5 dakika sonra gelecek" bilgisi

**Çözüm:** Gerçek zamanlı özellikler için:
- İBB Açık Veri API (İstanbul)
- EGO API (Ankara - erişim gerekli)
- WebSocket simülasyon (demo için)

### 3. Rate Limiting

Proje rate limiting kullanır:
- ✅ Redis cache (30 dakika)
- ✅ Kullanıcı başına limitler
- ✅ API başına limitler

**Ücretsiz limiti aşmayacak şekilde ayarlandı.**

### 4. Cache Kullanımı

Tüm API çağrıları cache'lenir:

| API | Cache Süresi |
|-----|--------------|
| Directions | 30 dakika |
| Places | 1 gün |
| Geocoding | 7 gün |

Cache sayesinde:
- 🚀 Daha hızlı yanıt
- 💰 Daha az API kullanımı
- ✅ Rate limit koruması

### 5. Güvenlik

**API Key'i GİZLİ tutun:**

```bash
# ❌ YANLIŞ - Expose edilmiş key
const API_KEY = 'AIzaSyB-dKC9BILxcbJSi-Q2gIX_OIy7Qw2Lr-c';

# ✅ DOĞRU - .env dosyasında
GOOGLE_MAPS_API_KEY=AIzaSyB-dKC9BILxcbJSi-Q2gIX_OIy7Qw2Lr-c
```

**HTTP restrictions ekleyin:**
- Sadece kendi domain'inizden kullanılabilsin
- API restrictions ekleyin (sadece gerekli API'ler)

---

## 🎓 Daha Fazla Bilgi

- [Google Maps Platform Docs](https://developers.google.com/maps/documentation)
- [Directions API Docs](https://developers.google.com/maps/documentation/directions)
- [Places API Docs](https://developers.google.com/maps/documentation/places)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)
- [Free Tier Details](https://cloud.google.com/maps-platform/pricing/)

---

## 📞 Destek

Google API sorunları için:
- [Stack Overflow - google-maps](https://stackoverflow.com/questions/tagged/google-maps)
- [Google Maps Platform Support](https://developers.google.com/maps/support)

---

**Son Güncelleme:** 2025-11-03
**Yazar:** Gerçek Zamanlı Ulaşım Platformu Ekibi
