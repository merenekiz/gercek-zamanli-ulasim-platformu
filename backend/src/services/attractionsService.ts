import { Client } from '@googlemaps/google-maps-services-js';

interface Attraction {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  photos?: string[];
  vicinity?: string;
  category: string;
}

export class AttractionsService {
  private client: Client;
  private apiKey: string;

  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  }

  /**
   * Bitiş noktası yakın\u0131ndaki gezilecek yerleri getir
   */
  async getNearbyAttractions(
    location: { lat: number; lng: number },
    radius: number = 500  // 500 metre - sadece varış noktasının çok yakınındaki yerler
  ): Promise<Attraction[]> {
    try {
      console.log('[AttractionsService] 🎯 Fetching nearby attractions:', {
        location,
        radius,
      });

      // İlgi çekici yer kategorileri
      const types = [
        'tourist_attraction',
        'museum',
        'park',
        'restaurant',
        'cafe',
        'shopping_mall',
      ];

      const allAttractions: Attraction[] = [];
      const seenPlaceIds = new Set<string>();

      // Her kategori için arama yap
      for (const type of types) {
        try {
          const response = await this.client.placesNearby({
            params: {
              location: location,
              radius: radius,
              type: type,
              key: this.apiKey,
            },
          });

          if (response.data.status === 'OK' && response.data.results) {
            for (const place of response.data.results) {
              if (
                place.place_id &&
                !seenPlaceIds.has(place.place_id) &&
                place.geometry &&
                place.geometry.location
              ) {
                seenPlaceIds.add(place.place_id);

                // Get photo references if available
                const photos: string[] = [];
                if (place.photos && place.photos.length > 0) {
                  // Get first photo reference
                  const photoRef = place.photos[0].photo_reference;
                  if (photoRef) {
                    photos.push(photoRef);
                  }
                }

                allAttractions.push({
                  id: place.place_id,
                  name: place.name || 'Unknown',
                  location: {
                    lat: place.geometry.location.lat,
                    lng: place.geometry.location.lng,
                  },
                  types: place.types || [],
                  rating: place.rating,
                  userRatingsTotal: place.user_ratings_total,
                  photos: photos,
                  vicinity: place.vicinity,
                  category: this.mapTypeToCategory(type),
                });
              }
            }
          }
        } catch (error) {
          console.error(`[AttractionsService] Error fetching ${type}:`, error);
        }
      }

      // Değerlendirme sayısına göre sırala (en çok değerlendirme alan en üstte)
      allAttractions.sort((a, b) => {
        const ratingsCountA = a.userRatingsTotal || 0;
        const ratingsCountB = b.userRatingsTotal || 0;
        return ratingsCountB - ratingsCountA;
      });

      // İlk 20 sonucu al
      const topAttractions = allAttractions.slice(0, 20);

      console.log(
        `[AttractionsService] ✅ Found ${topAttractions.length} attractions`
      );
      return topAttractions;
    } catch (error: any) {
      console.error('[AttractionsService] ❌ Error fetching attractions:', {
        message: error.message,
      });
      return [];
    }
  }

  private mapTypeToCategory(type: string): string {
    const categoryMap: Record<string, string> = {
      tourist_attraction: 'Turistik Yer',
      museum: 'Müze',
      park: 'Park',
      restaurant: 'Restoran',
      cafe: 'Kafe',
      shopping_mall: 'Alışveriş Merkezi',
    };
    return categoryMap[type] || 'Diğer';
  }
}

export default new AttractionsService();
