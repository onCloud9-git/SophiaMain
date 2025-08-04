import { useEffect, useRef } from 'react';
import { webSocketService, WebSocketEvents } from '../services/websocket';
import { useBusinessStore } from '../stores/businessStore';

export const useWebSocket = (userId?: string) => {
  const { updateBusiness, setMetrics, addBusiness } = useBusinessStore();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Connect to WebSocket
    webSocketService.connect(userId);

    // Subscribe to user-specific updates
    if (userId) {
      webSocketService.subscribeToUserUpdates(userId);
    }

    // Set up event listeners
    const handleBusinessCreated = (business: any) => {
      console.log('New business created:', business);
      addBusiness(business);
    };

    const handleBusinessUpdated = (update: any) => {
      console.log('Business updated:', update);
      updateBusiness(update.id, update);
    };

    const handleMetricsUpdated = (metrics: any) => {
      console.log('Metrics updated:', metrics);
      setMetrics(metrics.businessId, {
        visitors: metrics.visitors,
        conversions: metrics.conversions,
        revenue: metrics.revenue,
        bounceRate: metrics.bounceRate,
        sessionDuration: metrics.sessionDuration,
        pageViews: metrics.pageViews,
      });
    };

    const handleDevelopmentProgress = (progress: any) => {
      console.log('Development progress:', progress);
      updateBusiness(progress.businessId, {
        status: progress.status,
      });
      
      // You could also show a toast notification here
      // toast.info(progress.message);
    };

    const handleNotification = (notification: any) => {
      console.log('New notification:', notification);
      // Handle notifications (could show in-app notifications)
      // notificationService.show(notification);
    };

    // Register event listeners
    if (webSocketService.getConnectionStatus()) {
      webSocketService.on('business-created', handleBusinessCreated);
      webSocketService.on('business-updated', handleBusinessUpdated);
      webSocketService.on('metrics-updated', handleMetricsUpdated);
      webSocketService.on('development-progress', handleDevelopmentProgress);
      webSocketService.on('notification', handleNotification);
    } else {
      // Use mock events for development
      webSocketService.onMock('business-created', handleBusinessCreated);
      webSocketService.onMock('business-updated', handleBusinessUpdated);
      webSocketService.onMock('metrics-updated', handleMetricsUpdated);
      webSocketService.onMock('development-progress', handleDevelopmentProgress);
      webSocketService.onMock('notification', handleNotification);
      
      // Start simulation
      webSocketService.simulateUpdates();
    }

    // Cleanup function
    return () => {
      webSocketService.off('business-created', handleBusinessCreated);
      webSocketService.off('business-updated', handleBusinessUpdated);
      webSocketService.off('metrics-updated', handleMetricsUpdated);
      webSocketService.off('development-progress', handleDevelopmentProgress);
      webSocketService.off('notification', handleNotification);
      
      // Clean up mock listeners
      webSocketService.offMock('business-created', handleBusinessCreated);
      webSocketService.offMock('business-updated', handleBusinessUpdated);
      webSocketService.offMock('metrics-updated', handleMetricsUpdated);
      webSocketService.offMock('development-progress', handleDevelopmentProgress);
      webSocketService.offMock('notification', handleNotification);
    };
  }, [userId, addBusiness, updateBusiness, setMetrics]);

  const subscribeToBusinessUpdates = (businessId: string) => {
    webSocketService.subscribeToBusinessUpdates(businessId);
  };

  const unsubscribeFromBusinessUpdates = (businessId: string) => {
    webSocketService.unsubscribeFromBusinessUpdates(businessId);
  };

  const isConnected = webSocketService.getConnectionStatus();

  return {
    isConnected,
    subscribeToBusinessUpdates,
    unsubscribeFromBusinessUpdates,
    emit: webSocketService.emit.bind(webSocketService),
  };
};

export default useWebSocket;