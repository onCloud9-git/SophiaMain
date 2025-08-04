import { io, Socket } from 'socket.io-client';

export interface WebSocketEvents {
  'business-created': (business: any) => void;
  'business-updated': (update: any) => void;
  'campaign-updated': (campaign: any) => void;
  'metrics-updated': (metrics: any) => void;
  'notification': (notification: any) => void;
  'development-progress': (progress: any) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private url: string;
  private isConnected: boolean = false;

  constructor() {
    // Use environment variable for WebSocket URL, fallback to localhost for development
    this.url = process.env.EXPO_PUBLIC_WS_URL || 'http://localhost:3001';
  }

  connect(userId?: string): void {
    if (this.socket?.connected) {
      return;
    }

    try {
      this.socket = io(this.url, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        query: userId ? { userId } : undefined,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.isConnected = true;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.isConnected = false;
      });

      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot emit event:', event);
    }
  }

  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): void {
    if (this.socket) {
      this.socket.on(event as string, callback);
    }
  }

  off<K extends keyof WebSocketEvents>(event: K, callback?: WebSocketEvents[K]): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event as string, callback);
      } else {
        this.socket.off(event as string);
      }
    }
  }

  joinRoom(room: string): void {
    this.emit('join-room', { room });
  }

  leaveRoom(room: string): void {
    this.emit('leave-room', { room });
  }

  subscribeToBusinessUpdates(businessId: string): void {
    this.joinRoom(`business-${businessId}`);
  }

  unsubscribeFromBusinessUpdates(businessId: string): void {
    this.leaveRoom(`business-${businessId}`);
  }

  subscribeToUserUpdates(userId: string): void {
    this.joinRoom(`user-${userId}`);
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Simulate real-time updates for development (when backend WebSocket is not available)
  simulateUpdates(): void {
    if (!this.isConnected) {
      console.log('Starting WebSocket simulation mode');
      
      // Simulate business creation progress
      setTimeout(() => {
        this.emitMockEvent('development-progress', {
          businessId: '1',
          status: 'DEVELOPING',
          progress: 25,
          message: 'Creating project structure...'
        });
      }, 2000);

      setTimeout(() => {
        this.emitMockEvent('development-progress', {
          businessId: '1',
          status: 'DEVELOPING',
          progress: 50,
          message: 'Implementing core features...'
        });
      }, 5000);

      setTimeout(() => {
        this.emitMockEvent('business-updated', {
          id: '1',
          status: 'DEPLOYING',
          websiteUrl: 'https://taskflow-pro.vercel.app'
        });
      }, 8000);

      setTimeout(() => {
        this.emitMockEvent('metrics-updated', {
          businessId: '1',
          visitors: 156,
          conversions: 12,
          revenue: 359.88
        });
      }, 10000);

      setTimeout(() => {
        this.emitMockEvent('notification', {
          id: Date.now().toString(),
          title: 'Business Deployed Successfully! 🎉',
          message: 'TaskFlow Pro is now live and ready for customers',
          type: 'success',
          timestamp: new Date().toISOString()
        });
      }, 12000);
    }
  }

  private emitMockEvent(event: string, data: any): void {
    // Emit to registered listeners
    if (this.mockListeners[event]) {
      this.mockListeners[event].forEach(callback => callback(data));
    }
  }

  private mockListeners: Record<string, Function[]> = {};

  // Mock event system for development
  onMock<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): void {
    if (!this.mockListeners[event as string]) {
      this.mockListeners[event as string] = [];
    }
    this.mockListeners[event as string].push(callback);
  }

  offMock<K extends keyof WebSocketEvents>(event: K, callback?: WebSocketEvents[K]): void {
    if (this.mockListeners[event as string] && callback) {
      const index = this.mockListeners[event as string].indexOf(callback);
      if (index > -1) {
        this.mockListeners[event as string].splice(index, 1);
      }
    }
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService;