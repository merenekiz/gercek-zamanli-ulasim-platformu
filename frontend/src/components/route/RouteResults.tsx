'use client';

import { Clock, Navigation, DollarSign, Heart, ChevronRight } from 'lucide-react';
import { RouteOption } from '@/lib/types';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import {
  transportModeLabels,
  transportModeIcons,
  transportModeColors,
  type TransportMode,
} from '@/lib/validation/route';

interface RouteResultsProps {
  routes: RouteOption[];
  onRouteSelect: (route: RouteOption) => void;
  onSaveToFavorites?: (route: RouteOption) => void;
  loading?: boolean;
}

/**
 * RouteResults Component
 *
 * Displays list of route options with details
 *
 * @example
 * <RouteResults
 *   routes={routeOptions}
 *   onRouteSelect={(route) => console.log(route)}
 * />
 */
export default function RouteResults({
  routes,
  onRouteSelect,
  onSaveToFavorites,
  loading = false,
}: RouteResultsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} variant="gradient" className="p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full w-1/4"></div>
                <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full w-3/4"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full w-1/2"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <Card variant="glass" className="p-12 animate-scale-in">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="inline-block p-4 bg-primary/10 dark:bg-primary/20 rounded-2xl mb-4">
            <Navigation className="w-12 h-12 mx-auto text-primary dark:text-primary-400 animate-pulse" />
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Rota bulunamadı</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Lütfen farklı bir başlangıç veya varış noktası deneyin
          </p>
        </div>
      </Card>
    );
  }

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

  return (
    <div className="space-y-4">
      {routes.map((route, index) => (
        <Card
          key={route.id || index}
          variant="gradient"
          hover
          animate
          className="p-6 cursor-pointer group relative overflow-visible"
          onClick={() => onRouteSelect(route)}
          style={{ animationDelay: `${index * 100}ms` } as any}
        >
          {/* Best Route Badge */}
          {index === 0 && (
            <div className="absolute -top-3 left-6 px-4 py-1.5 bg-gradient-success text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5 z-10 animate-float">
              <span>⭐</span>
              <span>Önerilen Rota</span>
            </div>
          )}

          {/* Route Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {/* Route Type Badge */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {Array.from(new Set(route.segments.map(s => s.mode))).map((mode, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm border border-white/20 group-hover:scale-105 transition-transform duration-300 ${
                      transportModeColors[mode as TransportMode]
                    }`}
                  >
                    <span>{transportModeIcons[mode as TransportMode]}</span>
                    <span>{transportModeLabels[mode as TransportMode]}</span>
                  </span>
                ))}
              </div>

              {/* Duration & Distance */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 dark:bg-primary/10 rounded-lg group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-colors duration-300">
                  <Clock className="w-4 h-4 text-primary dark:text-primary-400" />
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatDuration(route.totalDuration)}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-success/5 dark:bg-success/10 rounded-lg group-hover:bg-success/10 dark:group-hover:bg-success/20 transition-colors duration-300">
                  <Navigation className="w-4 h-4 text-success dark:text-success-400" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{formatDistance(route.totalDistance)}</span>
                </div>
                {route.totalCost !== undefined && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-warning/5 dark:bg-warning/10 rounded-lg group-hover:bg-warning/10 dark:group-hover:bg-warning/20 transition-colors duration-300">
                    <DollarSign className="w-4 h-4 text-warning dark:text-warning-400" />
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatPrice(route.totalCost)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Favorite Button */}
            {onSaveToFavorites && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveToFavorites(route);
                }}
                className="flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                Kaydet
              </Button>
            )}
          </div>

          {/* Route Steps */}
          {route.segments && route.segments.length > 0 && (
            <div className="space-y-2 mb-4">
              {route.segments.slice(0, 3).map((step, stepIndex) => (
                <div
                  key={stepIndex}
                  className="flex items-start gap-3 text-sm"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                      transportModeColors[step.mode as TransportMode]
                    }`}
                  >
                    {stepIndex + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {transportModeLabels[step.mode as TransportMode]}
                      {step.routeInfo?.routeName && ` - ${step.routeInfo.routeName}`}
                    </p>
                    {step.instructions && (
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
                        {step.instructions}
                      </p>
                    )}
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                    {formatDuration(step.duration)}
                  </span>
                </div>
              ))}

              {route.segments.length > 3 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 pl-9">
                  +{route.segments.length - 3} adım daha
                </p>
              )}
            </div>
          )}

          {/* View Details Button */}
          <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-700">
            <button className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
              Detayları Görüntüle
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
