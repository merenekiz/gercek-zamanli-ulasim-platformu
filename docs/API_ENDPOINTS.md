# Ankara Ulaşım Platformu - API Endpoint Dokümantasyonu

**API Versiyon:** v1
**Base URL:** `http://localhost:5000/api/v1`
**Protokol:** REST
**Response Format:** JSON

---

## İçindekiler

1. [Kimlik Doğrulama (Authentication)](#kimlik-doğrulama)
2. [Kullanıcı Yönetimi (Users)](#kullanıcı-yönetimi)
3. [Rota Planlama (Routes)](#rota-planlama)
4. [Toplu Taşıma (Public Transit)](#toplu-taşıma)
5. [Taksi ve Araç Paylaşımı (Taxi & Rideshare)](#taksi-ve-araç-paylaşımı)
6. [Yerler ve POI (Places)](#yerler-ve-poi)
7. [Favori Rotalar (Favorites)](#favori-rotalar)
8. [Seyahat Geçmişi (Trip History)](#seyahat-geçmişi)
9. [Servis Uyarıları (Service Alerts)](#servis-uyarıları)
10. [Şehirler (Cities)](#şehirler)

---

## Genel Response Formatı

Tüm API yanıtları aşağıdaki standart formatı kullanır:

### Başarılı Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Hata Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Hata mesajı",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Sayfalandırılmış Response

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasMore": true
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

## 1. Kimlik Doğrulama

### POST `/auth/register`

Yeni kullanıcı kaydı oluşturur.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "Ahmet Yılmaz",
  "phone": "+905551234567"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Ahmet Yılmaz"
    },
    "token": "jwt_token_here"
  }
}
```

---

### POST `/auth/login`

Kullanıcı girişi yapar.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

---

### POST `/auth/refresh`

Access token'ı yeniler.

**Headers:** `Authorization: Bearer {refresh_token}`

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "refreshToken": "new_refresh_token"
  }
}
```

---

## 2. Kullanıcı Yönetimi

### GET `/users/me`

Oturum açmış kullanıcının bilgilerini getirir.

**Headers:** `Authorization: Bearer {token}`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Ahmet Yılmaz",
    "phone": "+905551234567",
    "preferences": {
      "defaultTransportModes": ["BUS", "METRO"],
      "maxWalkingDistance": 1000,
      "language": "tr"
    }
  }
}
```

---

### PUT `/users/me`

Kullanıcı bilgilerini günceller.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
  "name": "Ahmet Yeni İsim",
  "phone": "+905559876543"
}
```

---

### PUT `/users/me/preferences`

Kullanıcı tercihlerini günceller.

**Request Body:**

```json
{
  "defaultTransportModes": ["METRO", "WALKING"],
  "maxWalkingDistance": 1500,
  "accessibilityRequired": false,
  "notificationSettings": {
    "serviceAlerts": true,
    "routeUpdates": true,
    "promotions": false
  }
}
```

---

## 3. Rota Planlama

### POST `/routes/search`

Verilen başlangıç ve bitiş noktaları için rota seçenekleri arar.

**Request Body:**

```json
{
  "origin": {
    "lat": 39.9334,
    "lng": 32.8597
  },
  "destination": {
    "lat": 39.9208,
    "lng": 32.8541
  },
  "modes": ["BUS", "METRO", "WALKING"],
  "departureTime": "2024-01-15T10:30:00Z",
  "preferences": {
    "maxWalkingDistance": 1000,
    "maxTransfers": 2,
    "preferFastest": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "id": "route-1",
        "segments": [
          {
            "mode": "WALKING",
            "from": { "lat": 39.9334, "lng": 32.8597, "name": "Başlangıç" },
            "to": { "lat": 39.9330, "lng": 32.8600, "name": "Kızılay Metro" },
            "distance": 500,
            "duration": 6,
            "instructions": "Kızılay Metro istasyonuna yürüyün"
          },
          {
            "mode": "METRO",
            "from": { "lat": 39.9330, "lng": 32.8600, "name": "Kızılay" },
            "to": { "lat": 39.9208, "lng": 32.8541, "name": "Ulus" },
            "distance": 3500,
            "duration": 8,
            "routeInfo": {
              "routeId": "M1",
              "routeName": "Kızılay - Ulus",
              "departureTime": "2024-01-15T10:35:00Z",
              "arrivalTime": "2024-01-15T10:43:00Z",
              "stops": 4
            }
          }
        ],
        "totalDistance": 4000,
        "totalDuration": 14,
        "totalCost": 17.5,
        "departureTime": "2024-01-15T10:30:00Z",
        "arrivalTime": "2024-01-15T10:44:00Z",
        "isFastest": true,
        "carbonFootprint": 0.5
      }
    ]
  }
}
```

---

### GET `/routes/{routeId}`

Belirli bir rotanın detaylarını getirir.

**Response:**

```json
{
  "success": true,
  "data": {
    "route": { ... }
  }
}
```

---

## 4. Toplu Taşıma

### GET `/transit/routes`

Şehirdeki tüm toplu taşıma rotalarını listeler.

**Query Parameters:**

- `cityId` (optional): Şehir ID
- `mode` (optional): Ulaşım modu (BUS, METRO, TRAM, ANKARAY)
- `page` (optional): Sayfa numarası (default: 1)
- `limit` (optional): Sayfa başı kayıt (default: 20)

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "routeId": "M1",
        "routeName": "Kızılay - Batıkent",
        "transportMode": "METRO",
        "operatingHours": {
          "start": "06:00",
          "end": "00:00"
        },
        "frequency": 5,
        "color": "#FF0000"
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20
  }
}
```

---

### GET `/transit/routes/{routeId}/stops`

Belirli bir rotanın duraklarını getirir.

**Response:**

```json
{
  "success": true,
  "data": {
    "stops": [
      {
        "id": "uuid",
        "stopId": "STOP001",
        "stopName": "Kızılay",
        "location": {
          "lat": 39.9330,
          "lng": 32.8600
        },
        "stopType": "METRO",
        "wheelchairAccessible": true,
        "sequence": 1
      }
    ]
  }
}
```

---

### GET `/transit/stops/nearby`

Verilen konuma yakın durakları getirir.

**Query Parameters:**

- `lat` (required): Enlem
- `lng` (required): Boylam
- `radius` (optional): Yarıçap (metre, default: 500)
- `mode` (optional): Ulaşım modu filtresi

**Response:**

```json
{
  "success": true,
  "data": {
    "stops": [
      {
        "id": "uuid",
        "stopName": "Kızılay",
        "location": { "lat": 39.9330, "lng": 32.8600 },
        "distance": 150,
        "routes": ["M1", "M2"]
      }
    ]
  }
}
```

---

### GET `/transit/vehicles/live`

Gerçek zamanlı araç konumlarını getirir.

**Query Parameters:**

- `routeId` (optional): Rota ID filtresi
- `mode` (optional): Ulaşım modu filtresi

**Response:**

```json
{
  "success": true,
  "data": {
    "vehicles": [
      {
        "vehicleId": "VEH001",
        "routeId": "M1",
        "location": {
          "lat": 39.9330,
          "lng": 32.8600
        },
        "speed": 45,
        "heading": 180,
        "occupancy": "MEDIUM",
        "nextStopId": "STOP002",
        "estimatedArrival": "2024-01-15T10:35:00Z",
        "lastUpdated": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

## 5. Taksi ve Araç Paylaşımı

### POST `/taxi/estimate`

Taksi ücreti tahmini hesaplar.

**Request Body:**

```json
{
  "origin": {
    "lat": 39.9334,
    "lng": 32.8597
  },
  "destination": {
    "lat": 39.9208,
    "lng": 32.8541
  },
  "departureTime": "2024-01-15T10:30:00Z",
  "waitingTime": 0
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "estimate": {
      "provider": "TAXI",
      "estimatedFare": 85.50,
      "currency": "TRY",
      "distance": 4500,
      "duration": 12,
      "fareBreakdown": {
        "baseFare": 15.00,
        "distanceFare": 56.25,
        "waitingFare": 0,
        "surcharges": 14.25
      }
    }
  }
}
```

---

### POST `/taxi/compare`

Taksi, Uber ve Bolt ücretlerini karşılaştırır.

**Request Body:** (Yukarıdaki ile aynı)

**Response:**

```json
{
  "success": true,
  "data": {
    "estimates": [
      {
        "provider": "TAXI",
        "estimatedFare": 85.50,
        "currency": "TRY"
      },
      {
        "provider": "UBER",
        "estimatedFare": 92.00,
        "currency": "TRY"
      },
      {
        "provider": "BOLT",
        "estimatedFare": 88.00,
        "currency": "TRY"
      }
    ],
    "cheapest": "TAXI"
  }
}
```

---

## 6. Yerler ve POI

### GET `/places/nearby`

Yakındaki ilgi çekici yerleri getirir.

**Query Parameters:**

- `lat` (required): Enlem
- `lng` (required): Boylam
- `radius` (optional): Yarıçap (metre, default: 1000)
- `category` (optional): Kategori filtresi
- `page` (optional): Sayfa numarası
- `limit` (optional): Sayfa başı kayıt

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Anıtkabir",
        "category": "TOURISM",
        "location": {
          "lat": 39.9250,
          "lng": 32.8369
        },
        "address": "Mebusevleri, Ankara",
        "rating": 4.8,
        "reviewCount": 15420,
        "distance": 850,
        "priceLevel": 1
      }
    ]
  }
}
```

---

### GET `/places/search`

Yer araması yapar.

**Query Parameters:**

- `query` (required): Arama terimi
- `lat` (optional): Enlem
- `lng` (optional): Boylam
- `category` (optional): Kategori filtresi

**Response:**

```json
{
  "success": true,
  "data": {
    "places": [...]
  }
}
```

---

### GET `/places/{placeId}`

Belirli bir yerin detaylarını getirir.

**Response:**

```json
{
  "success": true,
  "data": {
    "place": {
      "id": "uuid",
      "name": "Anıtkabir",
      "category": "TOURISM",
      "location": { "lat": 39.9250, "lng": 32.8369 },
      "address": "Mebusevleri, Ankara",
      "rating": 4.8,
      "reviewCount": 15420,
      "photos": ["url1", "url2"],
      "openingHours": [
        { "weekday": "Pazartesi", "hours": "09:00 - 17:00" }
      ],
      "phone": "+90 312 123 4567",
      "website": "https://example.com"
    }
  }
}
```

---

## 7. Favori Rotalar

### GET `/favorites/routes`

Kullanıcının favori rotalarını listeler.

**Headers:** `Authorization: Bearer {token}`

**Response:**

```json
{
  "success": true,
  "data": {
    "favorites": [
      {
        "id": "uuid",
        "name": "Ev - İş",
        "origin": {
          "lat": 39.9334,
          "lng": 32.8597,
          "name": "Ev"
        },
        "destination": {
          "lat": 39.9208,
          "lng": 32.8541,
          "name": "İş"
        },
        "preferredModes": ["METRO", "BUS"],
        "usageCount": 45,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### POST `/favorites/routes`

Yeni favori rota ekler.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
  "name": "Ev - İş",
  "origin": {
    "lat": 39.9334,
    "lng": 32.8597,
    "name": "Ev"
  },
  "destination": {
    "lat": 39.9208,
    "lng": 32.8541,
    "name": "İş"
  },
  "preferredModes": ["METRO", "BUS"]
}
```

---

### DELETE `/favorites/routes/{favoriteId}`

Favori rotayı siler.

**Headers:** `Authorization: Bearer {token}`

---

## 8. Seyahat Geçmişi

### GET `/trips/history`

Kullanıcının seyahat geçmişini getirir.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**

- `page` (optional): Sayfa numarası
- `limit` (optional): Sayfa başı kayıt
- `startDate` (optional): Başlangıç tarihi
- `endDate` (optional): Bitiş tarihi

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "origin": {
          "lat": 39.9334,
          "lng": 32.8597,
          "name": "Kızılay"
        },
        "destination": {
          "lat": 39.9208,
          "lng": 32.8541,
          "name": "Ulus"
        },
        "startTime": "2024-01-15T08:30:00Z",
        "endTime": "2024-01-15T08:50:00Z",
        "cost": 17.5,
        "rating": 5
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

---

### POST `/trips`

Yeni seyahat kaydı oluşturur.

**Headers:** `Authorization: Bearer {token}`

---

### PUT `/trips/{tripId}/rating`

Seyahate puan verir.

**Request Body:**

```json
{
  "rating": 5,
  "feedback": "Çok iyi bir deneyimdi"
}
```

---

## 9. Servis Uyarıları

### GET `/alerts`

Aktif servis uyarılarını getirir.

**Query Parameters:**

- `cityId` (optional): Şehir ID
- `severity` (optional): Önem derecesi (LOW, MEDIUM, HIGH, CRITICAL)
- `type` (optional): Uyarı tipi

**Response:**

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "uuid",
        "type": "SERVICE_DISRUPTION",
        "severity": "HIGH",
        "title": "M1 Metro Hattı Kesintisi",
        "description": "Bakım çalışması nedeniyle M1 hattı 14:00-16:00 arası hizmet vermeyecektir.",
        "affectedRoutes": ["M1"],
        "affectedModes": ["METRO"],
        "startTime": "2024-01-15T14:00:00Z",
        "endTime": "2024-01-15T16:00:00Z",
        "isActive": true
      }
    ]
  }
}
```

---

## 10. Şehirler

### GET `/cities`

Platformda desteklenen şehirleri listeler.

**Response:**

```json
{
  "success": true,
  "data": {
    "cities": [
      {
        "id": "uuid",
        "name": "Ankara",
        "country": "Türkiye",
        "latitude": 39.9334,
        "longitude": 32.8597,
        "isActive": true
      }
    ]
  }
}
```

---

## Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 400 | Bad Request - Geçersiz istek |
| 401 | Unauthorized - Kimlik doğrulama gerekli |
| 403 | Forbidden - Erişim izni yok |
| 404 | Not Found - Kaynak bulunamadı |
| 409 | Conflict - Çakışma (örn: email zaten kayıtlı) |
| 422 | Unprocessable Entity - Validasyon hatası |
| 429 | Too Many Requests - Hız limiti aşıldı |
| 500 | Internal Server Error - Sunucu hatası |
| 503 | Service Unavailable - Servis kullanılamıyor |

---

## Rate Limiting

API istekleri için şu limitler uygulanır:

- **Genel:** 100 istek / 15 dakika
- **Auth endpoints:** 5 istek / 15 dakika
- **Search endpoints:** 30 istek / dakika

---

## WebSocket Events

Gerçek zamanlı güncellemeler için WebSocket bağlantısı:

**URL:** `ws://localhost:5000`

### Events

- `subscribe:vehicle-updates` - Araç konumu güncellemeleri
- `subscribe:route-updates` - Rota güncellemeleri
- `vehicle:location` - Araç konum verisi
- `alert:new` - Yeni servis uyarısı

---

**Son Güncelleme:** Ocak 2025
**API Versiyonu:** v1.0.0
