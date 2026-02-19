import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { CacheManager } from "@/utils/cacheManager";

interface LoadingStateProps {
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  title?: string;
  description?: string;
  className?: string;
}

export function LoadingState({ 
  isLoading, 
  error, 
  onRetry, 
  title = "Loading...", 
  description = "Please wait while we fetch your data.",
  className = "" 
}: LoadingStateProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Clear cache before retry
      CacheManager.clearAllCache();
      
      // Call the retry function if provided
      if (onRetry) {
        await onRetry();
      }
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleForceRefresh = () => {
    // Clear all cache and reload the page
    CacheManager.clearAppCache();
    window.location.reload();
  };

  // Show loading spinner
  if (isLoading && !error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    const isNetworkError = error.message?.includes('network') || 
                          error.message?.includes('fetch') ||
                          error.name === 'NetworkError';
    
    const isAuthError = error.message?.includes('Not authenticated') || 
                       error.message?.includes('Authentication required');

    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              {isNetworkError ? (
                <WifiOff className="h-6 w-6 text-destructive" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-destructive" />
              )}
            </div>
            <CardTitle>
              {isAuthError ? 'Session Expired' : 
               isNetworkError ? 'Network Error' : 'Something went wrong'}
            </CardTitle>
            <CardDescription>
              {isAuthError ? 'Please log in again to continue.' :
               isNetworkError ? 'Please check your internet connection and try again.' :
               'An unexpected error occurred. Please try again.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error.message && !isAuthError && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">Error Details:</p>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {error.message}
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              {!isAuthError && (
                <Button 
                  onClick={handleRetry} 
                  disabled={isRetrying}
                  className="flex-1"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </Button>
              )}
              <Button 
                onClick={handleForceRefresh} 
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            </div>
            
            {isAuthError && (
              <Button 
                onClick={() => CacheManager.resetAppState()} 
                className="w-full"
              >
                Go to Login
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show empty state when not loading and no error
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="text-center">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Wifi className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Data Available</h3>
        <p className="text-muted-foreground">There's nothing to display at the moment.</p>
      </div>
    </div>
  );
}

// Simple loading spinner component
export function LoadingSpinner({ 
  size = "default", 
  className = "" 
}: { 
  size?: "small" | "default" | "large";
  className?: string;
}) {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-8 w-8", 
    large: "h-12 w-12"
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]} ${className}`}></div>
  );
}

// Loading skeleton component
export function LoadingSkeleton({ 
  lines = 3, 
  className = "" 
}: { 
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="h-4 bg-muted rounded animate-pulse"
          style={{ 
            width: `${Math.random() * 40 + 60}%` // Random width between 60-100%
          }}
        ></div>
      ))}
    </div>
  );
}
