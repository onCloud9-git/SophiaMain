/**
 * Sophia AI State Management
 * Export all Zustand stores for easy importing
 */

export { useAuthStore, type User } from './authStore';
export { 
  useBusinessStore, 
  type Business, 
  type BusinessMetrics 
} from './businessStore';