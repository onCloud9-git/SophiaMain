import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';

interface UseWebSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

interface UseWebSocketReturn {
  data: any;
  isConnected: boolean;
  error: string | null;
  send: (data: any) => void;
  disconnect: () => void;
}

export const useWebSocket = (
  channel: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn => {
  const [data, setData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  
  const { token } = useAuthStore();
  
  const {
    onConnect,
    onDisconnect,
    onError,
    reconnectAttempts: maxReconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const getWebSocketUrl = () => {
    const wsProtocol = __DEV__ ? 'ws' : 'wss';
    const wsHost = __DEV__ ? 'localhost:3001' : 'sophia-api.vercel.app';
    return `${wsProtocol}://${wsHost}/ws?channel=${encodeURIComponent(channel)}&token=${encodeURIComponent(token || '')}`;
  };

  const connect = () => {
    if (!token) {
      setError('Authentication token is required');
      return;
    }

    try {
      const wsUrl = getWebSocketUrl();
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          setData(parsedData);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        onDisconnect?.();
        
        // Attempt to reconnect if within retry limits
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          setError('Connection lost and max reconnection attempts reached');
        }
      };

      wsRef.current.onerror = (event) => {
        setError('WebSocket connection error');
        onError?.(event);
      };
    } catch (err) {
      setError('Failed to establish WebSocket connection');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setData(null);
  };

  const send = (dataToSend: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(dataToSend));
      } catch (err) {
        console.error('Failed to send WebSocket message:', err);
        setError('Failed to send message');
      }
    } else {
      setError('WebSocket is not connected');
    }
  };

  useEffect(() => {
    if (token && channel) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, channel]);

  return {
    data,
    isConnected,
    error,
    send,
    disconnect,
  };
};