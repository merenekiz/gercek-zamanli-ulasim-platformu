'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  MapPin,
  Calendar,
  Filter,
  Trash2,
  Navigation,
  X,
} from 'lucide-react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { useAppDispatch } from '@/lib/store/hooks';
import { showToast } from '@/lib/store/slices/uiSlice';
import {
  transportModeLabels,
  transportModeColors,
  type TransportMode,
} from '@/lib/validation/route';

interface TripHistory {
  id: string;
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
  modes: TransportMode[];
  duration: number;
  distance: number;
  price?: number;
  date: string;
}

const filterOptions = [
  { value: 'all', label: 'Tüm Seyahatler' },
  { value: 'today', label: 'Bugün' },
  { value: 'week', label: 'Bu Hafta' },
  { value: 'month', label: 'Bu Ay' },
];

function HistoryContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [filter, setFilter] = useState('all');

  // Mock data - will be replaced with Redux state/API
  const [history, setHistory] = useState<TripHistory[]>([
    // Empty for now
  ]);

  const handleDelete = (id: string) => {
    // TODO: Implement delete with API
    setHistory(history.filter((trip) => trip.id !== id));
    dispatch(
      showToast({
        message: 'Seyahat geçmişi silindi',
        type: 'success',
      })
    );
  };

  const handleClearAll = () => {
    if (
      window.confirm('Tüm seyahat geçmişinizi silmek istediğinizden emin misiniz?')
    ) {
      setHistory([]);
      dispatch(
        showToast({
          message: 'Tüm seyahat geçmişi temizlendi',
          type: 'success',
        })
      );
    }
  };

  const handleRepeatTrip = (trip: TripHistory) => {
    // Navigate to route search with pre-filled data
    router.push(
      `/routes/search?origin=${encodeURIComponent(
        trip.origin.address
      )}&destination=${encodeURIComponent(trip.destination.address)}`
    );
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} dk`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} sa ${mins} dk`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatPrice = (price?: number): string => {
    if (!price) return 'Ücretsiz';
    return `₺${price.toFixed(2)}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return 'Dün';
    if (diffDays < 7) return `${diffDays} gün önce`;

    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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
                  Seyahat Geçmişi
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Geçmiş seyahatlerinizi görüntüleyin ve tekrar kullanın
                </p>
              </div>
            </div>
            {history.length > 0 && (
              <Button
                variant="outline"
                onClick={handleClearAll}
                leftIcon={<Trash2 className="w-5 h-5" />}
              >
                Tümünü Temizle
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {history.length === 0 ? (
          // Empty State
          <Card className="p-12">
            <div className="text-center text-gray-500">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
                <Clock className="w-10 h-10 text-purple-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Henüz seyahat geçmişi yok
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Rota aramaya başladığınızda, seyahat geçmişiniz burada
                görünecektir
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/routes/search')}
                leftIcon={<Navigation className="w-5 h-5" />}
              >
                Rota Aramaya Başla
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Filter Bar */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <div className="flex gap-2">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilter(option.value)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium
                        transition-all
                        ${
                          filter === option.value
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* History List */}
            <div className="space-y-4">
              {history.map((trip) => (
                <Card key={trip.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(trip.date)}</span>
                      <span className="text-gray-400">•</span>
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(trip.date).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRepeatTrip(trip)}
                      >
                        Tekrarla
                      </Button>
                      <button
                        onClick={() => handleDelete(trip.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Route Details */}
                  <div className="space-y-3 mb-4">
                    {/* Origin */}
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-0.5">Nereden</p>
                        <p className="text-sm font-medium text-gray-900">
                          {trip.origin.address.split(',')[0]}
                        </p>
                      </div>
                    </div>

                    {/* Destination */}
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-0.5">Nereye</p>
                        <p className="text-sm font-medium text-gray-900">
                          {trip.destination.address.split(',')[0]}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Trip Stats */}
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                    {/* Transport Modes */}
                    <div className="flex gap-1">
                      {trip.modes.map((mode, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-1 rounded text-xs font-medium text-white ${
                            transportModeColors[mode]
                          }`}
                        >
                          {transportModeLabels[mode]}
                        </span>
                      ))}
                    </div>

                    <div className="flex-1"></div>

                    {/* Duration */}
                    <div className="text-sm text-gray-600">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {formatDuration(trip.duration)}
                    </div>

                    {/* Distance */}
                    <div className="text-sm text-gray-600">
                      <Navigation className="w-4 h-4 inline mr-1" />
                      {formatDistance(trip.distance)}
                    </div>

                    {/* Price */}
                    {trip.price !== undefined && (
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(trip.price)}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  );
}
