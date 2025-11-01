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
          <Card key={i} className="p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-gray-500">
          <Navigation className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-medium mb-2">Rota bulunamadı</p>
          <p className="text-sm">
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
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onRouteSelect(route)}
        >
          {/* Route Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {/* Route Type Badge */}
              <div className="flex items-center gap-2 mb-2">
                {route.modes.map((mode, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${
                      transportModeColors[mode as TransportMode]
                    }`}
                  >
                    <span>{transportModeIcons[mode as TransportMode]}</span>
                    <span>{transportModeLabels[mode as TransportMode]}</span>
                  </span>
                ))}
              </div>

              {/* Duration & Distance */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium text-gray-900">
                    {formatDuration(route.duration)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Navigation className="w-4 h-4" />
                  <span>{formatDistance(route.distance)}</span>
                </div>
                {route.price !== undefined && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium text-gray-900">
                      {formatPrice(route.price)}
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
                leftIcon={<Heart className="w-4 h-4" />}
              >
                Kaydet
              </Button>
            )}
          </div>

          {/* Route Steps */}
          {route.steps && route.steps.length > 0 && (
            <div className="space-y-2 mb-4">
              {route.steps.slice(0, 3).map((step, stepIndex) => (
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
                    <p className="font-medium text-gray-900">
                      {transportModeLabels[step.mode as TransportMode]}
                      {step.routeName && ` - ${step.routeName}`}
                    </p>
                    {step.instructions && (
                      <p className="text-gray-600 text-xs mt-0.5">
                        {step.instructions}
                      </p>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs whitespace-nowrap">
                    {formatDuration(step.duration)}
                  </span>
                </div>
              ))}

              {route.steps.length > 3 && (
                <p className="text-xs text-gray-500 pl-9">
                  +{route.steps.length - 3} adım daha
                </p>
              )}
            </div>
          )}

          {/* View Details Button */}
          <div className="flex justify-end pt-3 border-t border-gray-100">
            <button className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-600 transition-colors">
              Detayları Görüntüle
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
