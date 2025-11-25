'use client';

import { useState, useEffect } from 'react';
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
  const [history, setHistory] = useState<any[]>([]);

  // Load trip history from localStorage
  useEffect(() => {
    const tripHistory = localStorage.getItem('tripHistory');
    if (tripHistory) {
      try {
        const trips = JSON.parse(tripHistory);
        setHistory(trips);
      } catch (error) {
        console.error('Error loading trip history:', error);
      }
    }
  }, []);

  const handleDelete = (id: string) => {
    const updatedHistory = history.filter((trip) => trip.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('tripHistory', JSON.stringify(updatedHistory));

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
      localStorage.setItem('tripHistory', JSON.stringify([]));

      dispatch(
        showToast({
          message: 'Tüm seyahat geçmişi temizlendi',
          type: 'success',
        })
      );
    }
  };

  const handleRepeatTrip = (trip: any) => {
    // Navigate to route search with pre-filled data
    if (trip.origin?.address && trip.destination?.address) {
      router.push(
        `/routes/search?origin=${encodeURIComponent(
          trip.origin.address
        )}&destination=${encodeURIComponent(trip.destination.address)}`
      );
    } else {
      dispatch(
        showToast({
          message: 'Rota bilgileri eksik',
          type: 'error',
        })
      );
    }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-500 via-purple-600 to-violet-600 shadow-xl border-b border-white/10 sticky top-0 z-40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 hover:scale-110 backdrop-blur-sm shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-7 h-7" />
                  Seyahat Geçmişi
                </h1>
                <p className="text-purple-100 text-sm mt-0.5">
                  Geçmiş seyahatlerinizi görüntüleyin ve tekrar kullanın
                </p>
              </div>
            </div>
            {history.length > 0 && (
              <Button
                variant="secondary"
                onClick={handleClearAll}
                className="flex items-center gap-2 bg-white hover:bg-gray-100 text-purple-600"
              >
                <Trash2 className="w-5 h-5" />
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
          <Card variant="glass" className="p-12 animate-scale-in">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="inline-block p-4 bg-purple-100 dark:bg-purple-900/20 rounded-2xl mb-4">
                <Clock className="w-12 h-12 mx-auto text-purple-500 animate-pulse" />
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Henüz seyahat geçmişi yok
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Rota aramaya başladığınızda, seyahat geçmişiniz burada görünecektir
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/routes/search')}
                className="flex items-center gap-2 mx-auto"
              >
                <Navigation className="w-5 h-5" />
                Rota Aramaya Başla
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Filter Bar */}
            <Card variant="glass" className="p-4 mb-6 animate-scale-in">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Filter className="w-5 h-5" />
                  <span className="font-medium text-sm">Filtrele:</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilter(option.value)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium
                        transition-all duration-300
                        ${
                          filter === option.value
                            ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg scale-105'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* History List */}
            <div className="space-y-4">
              {history.map((trip, index) => (
                <Card
                  key={trip.id}
                  variant="gradient"
                  hover
                  animate
                  className="p-6"
                  style={{ animationDelay: `${index * 50}ms` } as any}
                >
                  <div className="flex items-start justify-between mb-4">
                    {/* Date */}
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{formatDate(trip.timestamp)}</span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{trip.time}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRepeatTrip(trip)}
                        className="hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300"
                      >
                        <Navigation className="w-4 h-4 mr-1" />
                        Tekrarla
                      </Button>
                      <button
                        onClick={() => handleDelete(trip.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Route Details */}
                  <div className="space-y-3 mb-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/30 rounded-xl p-4">
                    {/* Origin */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Nereden</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {trip.origin?.address?.split(',')[0] || 'Bilinmeyen'}
                        </p>
                      </div>
                    </div>

                    {/* Arrow Divider */}
                    <div className="flex items-center justify-center">
                      <div className="w-full border-t border-dashed border-gray-300 dark:border-gray-600"></div>
                      <div className="px-3">
                        <Navigation className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                      </div>
                      <div className="w-full border-t border-dashed border-gray-300 dark:border-gray-600"></div>
                    </div>

                    {/* Destination */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <MapPin className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Nereye</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {trip.destination?.address?.split(',')[0] || 'Bilinmeyen'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Trip Stats */}
                  <div className="flex items-center flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* Transport Modes */}
                    {trip.route?.segments && (
                      <div className="flex gap-1.5 flex-wrap">
                        {Array.from(new Set(trip.route.segments.filter((s: any) => s?.mode).map((s: any) => s.mode))).map((mode: any, idx: number) => (
                          <span
                            key={idx}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-md ${
                              transportModeColors[mode as TransportMode]
                            }`}
                          >
                            {transportModeLabels[mode as TransportMode]}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex-1"></div>

                    {/* Duration */}
                    {trip.route?.totalDuration && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {formatDuration(trip.route.totalDuration)}
                        </span>
                      </div>
                    )}

                    {/* Distance */}
                    {trip.route?.totalDistance && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <Navigation className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                          {formatDistance(trip.route.totalDistance)}
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    {trip.route?.totalCost !== undefined && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <span className="text-lg">💰</span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {formatPrice(trip.route.totalCost)}
                        </span>
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
