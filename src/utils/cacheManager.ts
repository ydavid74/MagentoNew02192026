import { QueryClient } from '@tanstack/react-query';

// Cache management utilities
export class CacheManager {
  private static queryClient: QueryClient | null = null;

  static setQueryClient(client: QueryClient) {
    this.queryClient = client;
  }

  // Clear all React Query cache
  static clearAllCache() {
    if (this.queryClient) {
      this.queryClient.clear();
    }
  }

  // Clear specific query cache
  static clearQueryCache(queryKey: string[]) {
    if (this.queryClient) {
      this.queryClient.removeQueries({ queryKey });
    }
  }

  // Clear orders cache
  static clearOrdersCache() {
    this.clearQueryCache(['orders']);
  }

  // Clear authentication cache
  static clearAuthCache() {
    this.clearQueryCache(['auth']);
    this.clearQueryCache(['user']);
    this.clearQueryCache(['profile']);
  }

  // Clear all application cache
  static clearAppCache() {
    this.clearAllCache();
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
  }

  // Reset application state
  static resetAppState() {
    this.clearAppCache();
    window.location.href = '/auth/login';
  }

  // Handle authentication errors
  static handleAuthError(error: any) {
    console.error('Authentication error:', error);
    
    // Clear auth-related cache
    this.clearAuthCache();
    
    // Remove auth token
    localStorage.removeItem('supabase.auth.token');
    
    // Don't force redirect - let the auth context handle it
    // window.location.href = '/auth/login';
  }

  // Handle network errors
  static handleNetworkError(error: any) {
    console.error('Network error:', error);
    
    // Don't clear all cache on network errors - just log them
    // this.clearAllCache();
    
    // Show user-friendly message
    return {
      title: 'Network Error',
      description: 'Please check your internet connection and try again.',
    };
  }

  // Handle general errors
  static handleGeneralError(error: any) {
    console.error('General error:', error);
    
    // Don't clear all cache on general errors - just log them
    // this.clearAllCache();
    
    return {
      title: 'Unexpected Error',
      description: 'Something went wrong. Please try refreshing the page.',
    };
  }

  // Check if cache is stale
  static isCacheStale(queryKey: string[], staleTime: number = 5 * 60 * 1000) {
    if (!this.queryClient) return true;
    
    const query = this.queryClient.getQueryCache().get(queryKey as any);
    if (!query) return true;
    
    const now = Date.now();
    const lastUpdated = query.state.dataUpdatedAt;
    
    return (now - lastUpdated) > staleTime;
  }

  // Force refetch queries
  static async refetchQueries(queryKey: string[]) {
    if (this.queryClient) {
      await this.queryClient.refetchQueries({ queryKey });
    }
  }

  // Invalidate and refetch queries
  static async invalidateAndRefetch(queryKey: string[]) {
    if (this.queryClient) {
      await this.queryClient.invalidateQueries({ queryKey });
      await this.queryClient.refetchQueries({ queryKey });
    }
  }
}

// Global error handler
export const globalErrorHandler = {
  // Handle different types of errors
  handle: (error: any) => {
    if (error?.message?.includes('Not authenticated') || 
        error?.status === 401 || 
        error?.code === 'PGRST301') {
      // Just log auth errors, don't force redirect
      CacheManager.handleAuthError(error);
      return;
    }

    if (error?.name === 'NetworkError' || 
        error?.message?.includes('network') ||
        error?.code === 'NETWORK_ERROR') {
      return CacheManager.handleNetworkError(error);
    }

    return CacheManager.handleGeneralError(error);
  },

  // Log error for debugging
  log: (error: any, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);
    
    // In development, show more detailed error info
    if (process.env.NODE_ENV === 'development') {
      console.group('Error Details');
      console.error('Error:', error);
      console.error('Stack:', error?.stack);
      console.error('Context:', context);
      console.groupEnd();
    }
  }
};

// Retry configuration
export const retryConfig = {
  // Retry function for queries
  retry: (failureCount: number, error: any) => {
    // Don't retry on auth errors
    if (error?.message?.includes('Not authenticated') || 
        error?.status === 401 || 
        error?.code === 'PGRST301') {
      return false;
    }

    // Don't retry on network errors after 2 attempts
    if (error?.name === 'NetworkError' && failureCount >= 2) {
      return false;
    }

    // Retry up to 3 times for other errors
    return failureCount < 3;
  },

  // Exponential backoff delay
  retryDelay: (attemptIndex: number) => {
    return Math.min(1000 * 2 ** attemptIndex, 30000);
  }
};

// Query configuration defaults (optimized for performance)
export const queryDefaults = {
  staleTime: 1000 * 60 * 15, // 15 minutes (optimized - was 5)
  gcTime: 1000 * 60 * 30, // 30 minutes (optimized - was 10)
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: retryConfig.retry,
  retryDelay: retryConfig.retryDelay,
};
