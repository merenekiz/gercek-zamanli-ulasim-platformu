import { useEffect, useState, useCallback } from 'react';
import wsClient, { VehicleLocation, ServiceAlert } from '@/lib/websocket/client';
import { useAppSelector } from '@/lib/store/hooks';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  routes?: string[];
  location?: {
    lat: number;
    lng: number;
    radius?: number;
  };
}

/**
 * useWebSocket Hook
 *
 * React hook for managing WebSocket connections and subscriptions
 *
 * @example
 * const { isConnected, vehicleLocations, serviceAlerts } = useWebSocket({
 *   autoConnect: true,
 *   routes: ['310', '311'],
 * });
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true, routes = [], location } = options;

  const { user } = useAppSelector((state) => state.auth);
  const [isConnected, setIsConnected] = useState(false);
  const [vehicleLocations, setVehicleLocations] = useState<VehicleLocation[]>([]);
  const [serviceAlerts, setServiceAlerts] = useState<ServiceAlert[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await wsClient.connect(token || undefined);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err as Error);
      setIsConnected(false);
    }
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    wsClient.disconnect();
    setIsConnected(false);
  }, []);

  // Subscribe to routes
  const subscribeToRoutes = useCallback((routeIds: string[]) => {
    if (isConnected) {
      wsClient.subscribeToRoutes(routeIds);
    }
  }, [isConnected]);

  // Unsubscribe from routes
  const unsubscribeFromRoutes = useCallback((routeIds: string[]) => {
    if (isConnected) {
      wsClient.unsubscribeFromRoutes(routeIds);
    }
  }, [isConnected]);

  // Subscribe to location
  const subscribeToLocation = useCallback(
    (lat: number, lng: number, radius?: number) => {
      if (isConnected) {
        wsClient.subscribeToLocation(lat, lng, radius);
      }
    },
    [isConnected]
  );

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, user, connect, disconnect]);

  // Subscribe to routes on mount or when routes change
  useEffect(() => {
    if (isConnected && routes.length > 0) {
      subscribeToRoutes(routes);

      return () => {
        unsubscribeFromRoutes(routes);
      };
    }
  }, [isConnected, routes, subscribeToRoutes, unsubscribeFromRoutes]);

  // Subscribe to location on mount or when location changes
  useEffect(() => {
    if (isConnected && location) {
      subscribeToLocation(location.lat, location.lng, location.radius);
    }
  }, [isConnected, location, subscribeToLocation]);

  // Listen for vehicle location updates
  useEffect(() => {
    const unsubscribe = wsClient.onVehicleLocation((vehicleLocation) => {
      setVehicleLocations((prev) => {
        // Update or add vehicle location
        const index = prev.findIndex(
          (v) => v.vehicleId === vehicleLocation.vehicleId
        );

        if (index >= 0) {
          const updated = [...prev];
          updated[index] = vehicleLocation;
          return updated;
        }

        return [...prev, vehicleLocation];
      });
    });

    return unsubscribe;
  }, []);

  // Listen for service alerts
  useEffect(() => {
    const unsubscribe = wsClient.onServiceAlert((alert) => {
      setServiceAlerts((prev) => {
        // Add alert if not already present
        const exists = prev.some((a) => a.id === alert.id);
        if (!exists) {
          return [...prev, alert];
        }
        return prev;
      });
    });

    return unsubscribe;
  }, []);

  // Listen for errors
  useEffect(() => {
    const unsubscribe = wsClient.onError((err) => {
      setError(err);
    });

    return unsubscribe;
  }, []);

  // Clear vehicle locations older than 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      setVehicleLocations((prev) =>
        prev.filter((v) => new Date(v.timestamp).getTime() > fiveMinutesAgo)
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    vehicleLocations,
    serviceAlerts,
    error,
    connect,
    disconnect,
    subscribeToRoutes,
    unsubscribeFromRoutes,
    subscribeToLocation,
  };
}
