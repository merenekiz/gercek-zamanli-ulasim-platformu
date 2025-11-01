# Geliştirici Kılavuzu - Ankara Ulaşım Platformu

Bu kılavuz, Ankara Ulaşım Platformu'na katkıda bulunmak isteyen geliştiriciler için teknik detaylar ve best practice'leri içerir.

---

## İçindekiler

1. [Geliştirme Ortamı Kurulumu](#1-geliştirme-ortamı-kurulumu)
2. [Mimari Genel Bakış](#2-mimari-genel-bakış)
3. [Backend Geliştirme](#3-backend-geliştirme)
4. [Frontend Geliştirme](#4-frontend-geliştirme)
5. [Veritabanı İşlemleri](#5-veritabanı-i̇şlemleri)
6. [API Geliştirme](#6-api-geliştirme)
7. [Testing](#7-testing)
8. [Deployment](#8-deployment)
9. [Sorun Giderme](#9-sorun-giderme)

---

## 1. Geliştirme Ortamı Kurulumu

### 1.1 Gerekli Araçlar

```bash
# Node.js ve npm versiyonlarını kontrol et
node --version  # v18.0.0+
npm --version   # v9.0.0+

# Docker versiyonunu kontrol et
docker --version         # 20.10+
docker-compose --version # 2.0+

# Git versiyonunu kontrol et
git --version # 2.0+
```

### 1.2 IDE Ayarları (VS Code)

**Önerilen Eklentiler:**

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "mongodb.mongodb-vscode"
  ]
}
```

**VS Code Settings:**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### 1.3 Git Workflow

```bash
# Ana dalı güncel tut
git checkout main
git pull origin main

# Yeni feature branch oluştur
git checkout -b feature/your-feature-name

# Değişikliklerini commit et
git add .
git commit -m "feat: add amazing feature"

# Push et ve PR aç
git push origin feature/your-feature-name
```

**Commit Mesaj Formatı:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: Yeni özellik
- `fix`: Bug düzeltme
- `docs`: Dokümantasyon
- `style`: Code style değişiklikleri
- `refactor`: Refactoring
- `test`: Test ekleme/düzeltme
- `chore`: Build, dependencies vb.

**Örnek:**
```
feat(taxi): implement fare calculation service

- Add TaxiFareService with calculation logic
- Support night surcharge and airport fee
- Add unit tests for edge cases

Closes #123
```

---

## 2. Mimari Genel Bakış

### 2.1 Sistem Mimarisi

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────────────────────┐
│       Frontend (Next.js)             │
│  ┌─────────────────────────────┐   │
│  │  App Router (Pages)         │   │
│  │  Components (React)         │   │
│  │  State (Redux)              │   │
│  │  API Client (Axios)         │   │
│  └─────────────────────────────┘   │
└──────────┬──────────────────────────┘
           │ REST API
           ▼
┌─────────────────────────────────────┐
│      Backend (Express.js)            │
│  ┌─────────────────────────────┐   │
│  │  Routes                      │   │
│  │  Controllers                 │   │
│  │  Services (Business Logic)   │   │
│  │  Middleware                  │   │
│  └─────────────────────────────┘   │
└──┬────────┬────────┬────────────────┘
   │        │        │
   ▼        ▼        ▼
┌────────┐ ┌──────┐ ┌──────┐
│Postgres│ │ Mongo│ │Redis │
│  (SQL) │ │(NoSQL│ │(Cache│
└────────┘ └──────┘ └──────┘
```

### 2.2 Veri Akışı

**Örnek: Rota Arama**

```
1. User → Frontend: Rota arama formu doldurur
2. Frontend → Backend: POST /api/v1/routes/search
3. Backend → Redis: Cache kontrolü
4. Backend → PostgreSQL: Durak ve rota sorguları
5. Backend → Google API: Directions API çağrısı
6. Backend → MongoDB: Sonuçları cache'e yaz
7. Backend → Frontend: Rota seçeneklerini döndür
8. Frontend → User: Sonuçları görüntüle
```

---

## 3. Backend Geliştirme

### 3.1 Proje Yapısı

```
backend/src/
├── config/           # Konfigürasyon
│   ├── database.ts   # DB bağlantıları
│   ├── redis.ts      # Redis client
│   └── env.ts        # Env validation
│
├── controllers/      # Request handlers
│   ├── authController.ts
│   ├── routeController.ts
│   └── taxiController.ts
│
├── models/          # Database modelleri
│   ├── User.ts      # Sequelize model
│   └── Vehicle.ts   # Mongoose schema
│
├── routes/          # API routes
│   ├── index.ts
│   ├── auth.ts
│   └── routes.ts
│
├── services/        # Business logic
│   ├── authService.ts
│   ├── routeService.ts
│   └── taxiFareService.ts
│
├── middleware/      # Express middleware
│   ├── auth.ts
│   ├── errorHandler.ts
│   └── validation.ts
│
├── utils/           # Helper functions
│   ├── logger.ts
│   └── validators.ts
│
└── server.ts        # Entry point
```

### 3.2 Yeni API Endpoint Ekleme

**1. Route Tanımla:**

```typescript
// src/routes/places.ts
import { Router } from 'express';
import * as placeController from '../controllers/placeController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/nearby', placeController.getNearbyPlaces);
router.get('/:placeId', placeController.getPlaceDetails);

export default router;
```

**2. Controller Oluştur:**

```typescript
// src/controllers/placeController.ts
import { Request, Response, NextFunction } from 'express';
import PlaceService from '../services/placeService';
import { ApiResponse } from '../types';

export const getNearbyPlaces = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { lat, lng, radius, category } = req.query;

    const places = await PlaceService.findNearby({
      lat: Number(lat),
      lng: Number(lng),
      radius: Number(radius) || 1000,
      category: category as string,
    });

    const response: ApiResponse = {
      success: true,
      data: { places },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
```

**3. Service Logic:**

```typescript
// src/services/placeService.ts
import { Place } from '../models';
import { PlaceCategory } from '../types';

class PlaceService {
  async findNearby(params: {
    lat: number;
    lng: number;
    radius: number;
    category?: PlaceCategory;
  }) {
    // PostGIS query ile yakındaki yerleri bul
    const places = await Place.findAll({
      where: {
        // ST_DWithin kullanarak mesafe sorgusu
      },
      order: [['distance', 'ASC']],
      limit: 20,
    });

    return places;
  }
}

export default new PlaceService();
```

**4. Ana Router'a Ekle:**

```typescript
// src/routes/index.ts
import placeRoutes from './places';

app.use('/api/v1/places', placeRoutes);
```

### 3.3 Database Models

**Sequelize (PostgreSQL):**

```typescript
// src/models/User.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class User extends Model {
  public id!: string;
  public email!: string;
  public password!: string;
  public name!: string;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
  }
);

export default User;
```

**Mongoose (MongoDB):**

```typescript
// src/models/VehicleLocation.ts
import mongoose, { Schema, Document } from 'mongoose';

interface IVehicleLocation extends Document {
  vehicleId: string;
  routeId: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  speed?: number;
  timestamp: Date;
}

const VehicleLocationSchema = new Schema({
  vehicleId: { type: String, required: true },
  routeId: { type: String, required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  speed: Number,
  timestamp: { type: Date, default: Date.now },
});

VehicleLocationSchema.index({ location: '2dsphere' });
VehicleLocationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 3600 });

export default mongoose.model<IVehicleLocation>(
  'VehicleLocation',
  VehicleLocationSchema
);
```

### 3.4 Error Handling

```typescript
// src/middleware/errorHandler.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

// Controller'da kullanım
if (!user) {
  throw new AppError('Kullanıcı bulunamadı', 404);
}
```

---

## 4. Frontend Geliştirme

### 4.1 Component Yapısı

```typescript
// src/components/route/RouteSearchForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RouteSearchFormProps {
  onSearch?: (data: SearchData) => void;
}

export default function RouteSearchForm({ onSearch }: RouteSearchFormProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const searchData = {
      origin,
      destination,
      modes: ['BUS', 'METRO'],
    };

    if (onSearch) {
      onSearch(searchData);
    } else {
      // API çağrısı
      router.push(`/routes?from=${origin}&to=${destination}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={origin}
        onChange={(e) => setOrigin(e.target.value)}
        placeholder="Nereden?"
        className="input"
      />
      <input
        type="text"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        placeholder="Nereye?"
        className="input"
      />
      <button type="submit" className="btn btn-primary w-full">
        Rota Ara
      </button>
    </form>
  );
}
```

### 4.2 API Client

```typescript
// src/lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (token ekleme)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (error handling)
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

**API Service:**

```typescript
// src/lib/api/routes.ts
import apiClient from './client';
import { RouteRequest, RouteOption } from '../types';

export const routeAPI = {
  search: async (request: RouteRequest): Promise<RouteOption[]> => {
    const response = await apiClient.post('/v1/routes/search', request);
    return response.data.routes;
  },

  getById: async (routeId: string): Promise<RouteOption> => {
    const response = await apiClient.get(`/v1/routes/${routeId}`);
    return response.data.route;
  },
};
```

### 4.3 State Management (Redux)

```typescript
// src/lib/store/slices/routeSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { routeAPI } from '@/lib/api/routes';

export const searchRoutes = createAsyncThunk(
  'routes/search',
  async (request: RouteRequest) => {
    const routes = await routeAPI.search(request);
    return routes;
  }
);

const routeSlice = createSlice({
  name: 'routes',
  initialState: {
    routes: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(searchRoutes.pending, (state) => {
        state.loading = true;
      })
      .addCase(searchRoutes.fulfilled, (state, action) => {
        state.loading = false;
        state.routes = action.payload;
      })
      .addCase(searchRoutes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default routeSlice.reducer;
```

---

## 5. Veritabanı İşlemleri

### 5.1 Migration Oluşturma

```bash
# Yeni migration oluştur
npm run migrate:create add_user_avatar_column
```

```sql
-- migrations/20240115_add_user_avatar.sql
ALTER TABLE users ADD COLUMN avatar TEXT;
```

### 5.2 Seed Data

```typescript
// database/seeds/cities.ts
import { City } from '../models';

export const seedCities = async () => {
  await City.bulkCreate([
    {
      name: 'Ankara',
      country: 'Türkiye',
      latitude: 39.9334,
      longitude: 32.8597,
      isActive: true,
    },
    {
      name: 'İstanbul',
      country: 'Türkiye',
      latitude: 41.0082,
      longitude: 28.9784,
      isActive: false, // Henüz aktif değil
    },
  ]);
};
```

---

## 6. API Geliştirme

### 6.1 Validation

```typescript
// src/middleware/validation.ts
import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const validateRouteSearch = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = Joi.object({
    origin: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
    }).required(),
    destination: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
    }).required(),
    modes: Joi.array()
      .items(Joi.string().valid('BUS', 'METRO', 'TRAM', 'WALKING'))
      .min(1),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.details[0].message,
      },
    });
  }

  next();
};

// Router'da kullanım
router.post('/search', validateRouteSearch, routeController.search);
```

### 6.2 Rate Limiting

```typescript
// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // 100 istek
  message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 giriş denemesi
  skipSuccessfulRequests: true,
});
```

---

## 7. Testing

### 7.1 Unit Tests (Backend)

```typescript
// src/services/__tests__/taxiFareService.test.ts
import TaxiFareService from '../taxiFareService';

describe('TaxiFareService', () => {
  const mockFareConfig = {
    openingFee: 15.0,
    perKmRate: 12.5,
    minFare: 50.0,
    waitingFeePerHour: 150.0,
  };

  test('should calculate basic fare correctly', () => {
    const result = TaxiFareService.calculateFare(mockFareConfig, {
      distance: 5000, // 5 km
      duration: 10,
    });

    expect(result.baseFare).toBe(15.0);
    expect(result.distanceFare).toBe(62.5); // 5 * 12.5
    expect(result.totalFare).toBe(77.5);
  });

  test('should apply minimum fare', () => {
    const result = TaxiFareService.calculateFare(mockFareConfig, {
      distance: 500, // 0.5 km
      duration: 2,
    });

    expect(result.totalFare).toBe(50.0); // min fare
  });
});
```

### 7.2 Integration Tests

```typescript
// src/routes/__tests__/taxi.test.ts
import request from 'supertest';
import { app } from '../../server';

describe('POST /api/v1/taxi/estimate', () => {
  it('should return fare estimate', async () => {
    const response = await request(app)
      .post('/api/v1/taxi/estimate')
      .send({
        origin: { lat: 39.9334, lng: 32.8597 },
        destination: { lat: 39.9208, lng: 32.8541 },
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.estimate).toHaveProperty('totalFare');
  });
});
```

---

## 8. Deployment

### 8.1 Docker Build

```bash
# Backend
cd backend
docker build -t ankara-ulasim-backend:latest .

# Frontend
cd frontend
docker build -t ankara-ulasim-frontend:latest .
```

### 8.2 Environment Variables (Production)

**.env.production (Backend):**
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=your-super-secret-key
```

---

## 9. Sorun Giderme

### 9.1 Yaygın Hatalar

**"Cannot connect to PostgreSQL"**
```bash
# PostgreSQL container'ının çalıştığını kontrol et
docker-compose ps

# Logları incele
docker-compose logs postgres
```

**"CORS error"**
```typescript
// backend/src/server.ts
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
```

### 9.2 Debug Teknikleri

```typescript
// Winston logger kullanımı
import logger from './utils/logger';

logger.debug('Debug message', { data: someData });
logger.info('Info message');
logger.error('Error occurred', { error });
```

---

## 10. Best Practices

### 10.1 Security

- ✅ Never commit `.env` files
- ✅ Use prepared statements for SQL
- ✅ Validate all user input
- ✅ Use HTTPS in production
- ✅ Implement rate limiting
- ✅ Hash passwords with bcrypt
- ✅ Use JWT with expiration

### 10.2 Performance

- ✅ Use Redis caching
- ✅ Implement database indexing
- ✅ Optimize images (next/image)
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Connection pooling

### 10.3 Code Quality

- ✅ Follow TypeScript strict mode
- ✅ Write meaningful variable names
- ✅ Keep functions small and focused
- ✅ Write tests for critical logic
- ✅ Document complex algorithms
- ✅ Use async/await over callbacks

---

**Son Güncelleme:** Ocak 2025
**Versiyon:** 1.0
