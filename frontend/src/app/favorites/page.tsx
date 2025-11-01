'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MapPin, Trash2, Navigation, Plus, X } from 'lucide-react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { useAppDispatch } from '@/lib/store/hooks';
import { showToast } from '@/lib/store/slices/uiSlice';

interface FavoriteRoute {
  id: string;
  name: string;
  origin: {
    address: string;
    lat: number;
    lng: number;
  };
  destination: {
    address: string;
    lat: number;
    lng: number;
  };
  modes: string[];
  createdAt: string;
}

function FavoritesContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Mock data - will be replaced with Redux state
  const [favorites, setFavorites] = useState<FavoriteRoute[]>([
    // Empty for now
  ]);

  const handleDelete = (id: string) => {
    // TODO: Implement delete functionality with API
    setFavorites(favorites.filter((fav) => fav.id !== id));
    dispatch(
      showToast({
        message: 'Favori rota silindi',
        type: 'success',
      })
    );
  };

  const handleUseRoute = (favorite: FavoriteRoute) => {
    // Navigate to route search with pre-filled data
    router.push(
      `/routes/search?origin=${encodeURIComponent(
        favorite.origin.address
      )}&destination=${encodeURIComponent(favorite.destination.address)}`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Favori Rotalar
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Sık kullandığınız rotalarınızı burada bulabilirsiniz
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => router.push('/routes/search')}
              leftIcon={<Plus className="w-5 h-5" />}
            >
              Yeni Rota
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {favorites.length === 0 ? (
          // Empty State
          <Card className="p-12">
            <div className="text-center text-gray-500">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                <Heart className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Henüz favori rota yok
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Sık kullandığınız rotaları favorilere ekleyerek hızlı erişim
                sağlayabilirsiniz
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/routes/search')}
                leftIcon={<Search className="w-5 h-5" />}
              >
                Rota Aramaya Başla
              </Button>
            </div>
          </Card>
        ) : (
          // Favorites List
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <Card key={favorite.id} className="p-6">
                {/* Favorite Name */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                    <h3 className="font-semibold text-gray-900">
                      {favorite.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleDelete(favorite.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Route Details */}
                <div className="space-y-3 mb-4">
                  {/* Origin */}
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">Nereden</p>
                      <p className="text-sm text-gray-900 truncate">
                        {favorite.origin.address.split(',')[0]}
                      </p>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">Nereye</p>
                      <p className="text-sm text-gray-900 truncate">
                        {favorite.destination.address.split(',')[0]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Transport Modes */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {favorite.modes.map((mode, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {mode}
                    </span>
                  ))}
                </div>

                {/* Action Button */}
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => handleUseRoute(favorite)}
                  leftIcon={<Navigation className="w-4 h-4" />}
                >
                  Bu Rotayı Kullan
                </Button>

                {/* Created Date */}
                <p className="text-xs text-gray-500 mt-3 text-center">
                  {new Date(favorite.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <ProtectedRoute>
      <FavoritesContent />
    </ProtectedRoute>
  );
}
