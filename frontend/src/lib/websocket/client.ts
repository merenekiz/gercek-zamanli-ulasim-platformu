import { io, Socket } from 'socket.io-client';

interface VehicleLocation {
  vehicleId: string;
  route: string;
  location: {
    lat: number;
    lng: number;
  };
  speed: number;
  heading: number;
  occupancy: 'EMPTY' | 'MANY_SEATS_AVAILABLE' | 'FEW_SEATS_AVAILABLE' | 'STANDING_ROOM_ONLY' | 'FULL';
  timestamp: string;
}

interface ServiceAlert {
  id: string;
  route: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  startTime: string;
  endTime?: string;
}

type VehicleLocationCallback = (location: VehicleLocation) => void;
type ServiceAlertCallback = (alert: ServiceAlert) => void;
type ErrorCallback = (error: Error) => void;

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event listeners storage
  private vehicleLocationListeners: VehicleLocationCallback[] = [];
  private serviceAlertListeners: ServiceAlertCallback[] = [];
  private errorListeners: ErrorCallback[] = [];

  /**
   * Connect to WebSocket server
   */
  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const wsUrl = apiUrl.replace(/^http/, 'ws');

      this.socket = io(wsUrl, {
        auth: {
          token: token || localStorage.getItem('accessToken'),
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      // Connection events
      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.notifyError(new Error('Max reconnection attempts reached'));
          reject(error);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('⚠️ WebSocket disconnected:', reason);
      });

      // Vehicle location updates
      this.socket.on('vehicle:location', (data: VehicleLocation) => {
        this.vehicleLocationListeners.forEach((callback) => callback(data));
      });

      // Service alerts
      this.socket.on('service:alert', (data: ServiceAlert) => {
        this.serviceAlertListeners.forEach((callback) => callback(data));
      });

      // Error handling
      this.socket.on('error', (error: any) => {
        console.error('WebSocket error:', error);
        this.notifyError(new Error(error.message || 'WebSocket error'));
      });
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('WebSocket disconnected');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Subscribe to vehicle location updates for specific routes
   */
  subscribeToRoutes(routeIds: string[]): void {
    if (!this.socket || !this.isConnected()) {
      console.warn('WebSocket not connected. Cannot subscribe to routes.');
      return;
    }

    this.socket.emit('subscribe:routes', { routeIds });
    console.log(`Subscribed to routes: ${routeIds.join(', ')}`);
  }

  /**
   * Unsubscribe from vehicle location updates for specific routes
   */
  unsubscribeFromRoutes(routeIds: string[]): void {
    if (!this.socket || !this.isConnected()) {
      console.warn('WebSocket not connected. Cannot unsubscribe from routes.');
      return;
    }

    this.socket.emit('unsubscribe:routes', { routeIds });
    console.log(`Unsubscribed from routes: ${routeIds.join(', ')}`);
  }

  /**
   * Subscribe to vehicle location updates near a specific location
   */
  subscribeToLocation(lat: number, lng: number, radius: number = 1000): void {
    if (!this.socket || !this.isConnected()) {
      console.warn('WebSocket not connected. Cannot subscribe to location.');
      return;
    }

    this.socket.emit('subscribe:location', { lat, lng, radius });
    console.log(`Subscribed to location: ${lat}, ${lng} (radius: ${radius}m)`);
  }

  /**
   * Add listener for vehicle location updates
   */
  onVehicleLocation(callback: VehicleLocationCallback): () => void {
    this.vehicleLocationListeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.vehicleLocationListeners = this.vehicleLocationListeners.filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Add listener for service alerts
   */
  onServiceAlert(callback: ServiceAlertCallback): () => void {
    this.serviceAlertListeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.serviceAlertListeners = this.serviceAlertListeners.filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Add listener for errors
   */
  onError(callback: ErrorCallback): () => void {
    this.errorListeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.errorListeners = this.errorListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify all error listeners
   */
  private notifyError(error: Error): void {
    this.errorListeners.forEach((callback) => callback(error));
  }
}

// Singleton instance
const wsClient = new WebSocketClient();

export default wsClient;
export type { VehicleLocation, ServiceAlert };
