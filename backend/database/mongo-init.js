// ============================================
// Ankara Ulaşım Platformu - MongoDB Collections
// Gerçek Zamanlı Veriler için NoSQL Veritabanı
// ============================================

db = db.getSiblingDB('ankara_ulasim_realtime');

// ============================================
// Araç Konumları (Real-time Vehicle Tracking)
// ============================================

db.createCollection('vehicle_locations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['vehicleId', 'routeId', 'location', 'timestamp'],
      properties: {
        vehicleId: {
          bsonType: 'string',
          description: 'Araç ID - zorunlu'
        },
        routeId: {
          bsonType: 'string',
          description: 'Rota ID - zorunlu'
        },
        location: {
          bsonType: 'object',
          required: ['type', 'coordinates'],
          properties: {
            type: {
              enum: ['Point'],
              description: 'GeoJSON tipi'
            },
            coordinates: {
              bsonType: 'array',
              minItems: 2,
              maxItems: 2,
              description: '[longitude, latitude]'
            }
          }
        },
        speed: {
          bsonType: 'number',
          minimum: 0,
          description: 'Hız (km/h)'
        },
        heading: {
          bsonType: 'number',
          minimum: 0,
          maximum: 360,
          description: 'Yön (derece)'
        },
        occupancy: {
          enum: ['LOW', 'MEDIUM', 'HIGH'],
          description: 'Doluluk oranı'
        },
        status: {
          enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DELAYED'],
          description: 'Araç durumu'
        },
        nextStopId: {
          bsonType: 'string',
          description: 'Sonraki durak ID'
        },
        estimatedArrival: {
          bsonType: 'date',
          description: 'Tahmini varış zamanı'
        },
        timestamp: {
          bsonType: 'date',
          description: 'Güncelleme zamanı'
        }
      }
    }
  }
});

// Geospatial index
db.vehicle_locations.createIndex({ location: '2dsphere' });
db.vehicle_locations.createIndex({ vehicleId: 1 });
db.vehicle_locations.createIndex({ routeId: 1 });
db.vehicle_locations.createIndex({ timestamp: -1 });
db.vehicle_locations.createIndex({ timestamp: 1 }, { expireAfterSeconds: 3600 }); // 1 saat sonra otomatik sil

// ============================================
// Canlı Güncellemeler (Live Updates)
// ============================================

db.createCollection('live_updates', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['updateType', 'data', 'timestamp'],
      properties: {
        updateType: {
          enum: ['VEHICLE_LOCATION', 'DELAY', 'DISRUPTION', 'TRAFFIC'],
          description: 'Güncelleme tipi'
        },
        routeId: {
          bsonType: 'string',
          description: 'İlgili rota ID'
        },
        vehicleId: {
          bsonType: 'string',
          description: 'İlgili araç ID'
        },
        data: {
          bsonType: 'object',
          description: 'Güncelleme verisi'
        },
        severity: {
          enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
          description: 'Önem derecesi'
        },
        timestamp: {
          bsonType: 'date',
          description: 'Güncelleme zamanı'
        },
        expiresAt: {
          bsonType: 'date',
          description: 'Geçerlilik süresi'
        }
      }
    }
  }
});

db.live_updates.createIndex({ updateType: 1 });
db.live_updates.createIndex({ routeId: 1 });
db.live_updates.createIndex({ timestamp: -1 });
db.live_updates.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// ============================================
// Önbelleğe Alınmış API Yanıtları
// ============================================

db.createCollection('cached_responses', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['cacheKey', 'data', 'createdAt'],
      properties: {
        cacheKey: {
          bsonType: 'string',
          description: 'Önbellek anahtarı'
        },
        data: {
          bsonType: 'object',
          description: 'Önbelleğe alınan veri'
        },
        ttl: {
          bsonType: 'int',
          description: 'Yaşam süresi (saniye)'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Oluşturulma zamanı'
        },
        expiresAt: {
          bsonType: 'date',
          description: 'Son kullanma zamanı'
        }
      }
    }
  }
});

db.cached_responses.createIndex({ cacheKey: 1 }, { unique: true });
db.cached_responses.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ============================================
// Kullanıcı Oturumları (User Sessions)
// ============================================

db.createCollection('user_sessions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'sessionId', 'createdAt'],
      properties: {
        userId: {
          bsonType: 'string',
          description: 'Kullanıcı ID'
        },
        sessionId: {
          bsonType: 'string',
          description: 'Oturum ID'
        },
        deviceInfo: {
          bsonType: 'object',
          properties: {
            userAgent: { bsonType: 'string' },
            platform: { bsonType: 'string' },
            browser: { bsonType: 'string' }
          }
        },
        ipAddress: {
          bsonType: 'string',
          description: 'IP adresi'
        },
        lastActivity: {
          bsonType: 'date',
          description: 'Son aktivite zamanı'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Oluşturulma zamanı'
        },
        expiresAt: {
          bsonType: 'date',
          description: 'Son kullanma zamanı'
        }
      }
    }
  }
});

db.user_sessions.createIndex({ userId: 1 });
db.user_sessions.createIndex({ sessionId: 1 }, { unique: true });
db.user_sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ============================================
// Arama Geçmişi (Search History)
// ============================================

db.createCollection('search_history', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'searchType', 'searchQuery', 'timestamp'],
      properties: {
        userId: {
          bsonType: 'string',
          description: 'Kullanıcı ID'
        },
        searchType: {
          enum: ['ROUTE', 'PLACE', 'ADDRESS', 'STOP'],
          description: 'Arama tipi'
        },
        searchQuery: {
          bsonType: 'string',
          description: 'Arama sorgusu'
        },
        results: {
          bsonType: 'array',
          description: 'Arama sonuçları'
        },
        selected: {
          bsonType: 'object',
          description: 'Seçilen sonuç'
        },
        timestamp: {
          bsonType: 'date',
          description: 'Arama zamanı'
        }
      }
    }
  }
});

db.search_history.createIndex({ userId: 1 });
db.search_history.createIndex({ timestamp: -1 });
db.search_history.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 gün

// ============================================
// Analitik Veriler
// ============================================

db.createCollection('analytics', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['eventType', 'timestamp'],
      properties: {
        userId: {
          bsonType: 'string',
          description: 'Kullanıcı ID (opsiyonel - anonim kullanıcılar için)'
        },
        sessionId: {
          bsonType: 'string',
          description: 'Oturum ID'
        },
        eventType: {
          enum: [
            'PAGE_VIEW', 'ROUTE_SEARCH', 'PLACE_SEARCH',
            'ROUTE_SELECTED', 'TRIP_STARTED', 'TRIP_COMPLETED',
            'FAVORITE_ADDED', 'RATING_SUBMITTED'
          ],
          description: 'Olay tipi'
        },
        eventData: {
          bsonType: 'object',
          description: 'Olay verisi'
        },
        deviceInfo: {
          bsonType: 'object',
          description: 'Cihaz bilgisi'
        },
        location: {
          bsonType: 'object',
          description: 'Konum bilgisi'
        },
        timestamp: {
          bsonType: 'date',
          description: 'Olay zamanı'
        }
      }
    }
  }
});

db.analytics.createIndex({ userId: 1 });
db.analytics.createIndex({ eventType: 1 });
db.analytics.createIndex({ timestamp: -1 });
db.analytics.createIndex({ timestamp: 1 }, { expireAfterSeconds: 15552000 }); // 180 gün

// ============================================
// Bildirim Kuyruğu (Notification Queue)
// ============================================

db.createCollection('notification_queue', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'notificationType', 'message', 'status', 'createdAt'],
      properties: {
        userId: {
          bsonType: 'string',
          description: 'Kullanıcı ID'
        },
        notificationType: {
          enum: ['SERVICE_ALERT', 'ROUTE_UPDATE', 'PROMOTION', 'TRIP_REMINDER'],
          description: 'Bildirim tipi'
        },
        message: {
          bsonType: 'object',
          required: ['title', 'body'],
          properties: {
            title: { bsonType: 'string' },
            body: { bsonType: 'string' },
            data: { bsonType: 'object' }
          }
        },
        status: {
          enum: ['PENDING', 'SENT', 'FAILED', 'READ'],
          description: 'Bildirim durumu'
        },
        sentAt: {
          bsonType: 'date',
          description: 'Gönderilme zamanı'
        },
        readAt: {
          bsonType: 'date',
          description: 'Okunma zamanı'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Oluşturulma zamanı'
        }
      }
    }
  }
});

db.notification_queue.createIndex({ userId: 1 });
db.notification_queue.createIndex({ status: 1 });
db.notification_queue.createIndex({ createdAt: -1 });

// ============================================
// Trafik Verileri (Traffic Data)
// ============================================

db.createCollection('traffic_data', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['location', 'congestionLevel', 'timestamp'],
      properties: {
        location: {
          bsonType: 'object',
          required: ['type', 'coordinates'],
          properties: {
            type: {
              enum: ['Point', 'LineString'],
              description: 'GeoJSON tipi'
            },
            coordinates: {
              bsonType: 'array',
              description: 'Koordinatlar'
            }
          }
        },
        congestionLevel: {
          enum: ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'SEVERE'],
          description: 'Trafik yoğunluğu'
        },
        averageSpeed: {
          bsonType: 'number',
          description: 'Ortalama hız (km/h)'
        },
        roadName: {
          bsonType: 'string',
          description: 'Yol adı'
        },
        timestamp: {
          bsonType: 'date',
          description: 'Güncelleme zamanı'
        }
      }
    }
  }
});

db.traffic_data.createIndex({ location: '2dsphere' });
db.traffic_data.createIndex({ timestamp: -1 });
db.traffic_data.createIndex({ timestamp: 1 }, { expireAfterSeconds: 1800 }); // 30 dakika

// ============================================
// Başlangıç Verileri
// ============================================

print('MongoDB koleksiyonları başarıyla oluşturuldu!');
print('Toplam koleksiyon sayısı: ' + db.getCollectionNames().length);
