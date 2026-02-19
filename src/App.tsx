import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ThemeProvider } from "next-themes";

// Auth Context
import { AuthProvider } from "@/contexts/AuthContext";

// Guards
import { AuthGuard, AdminGuard } from "@/components/guards/AuthGuard";

// Layout
import { AdminLayout } from "@/components/layout/AdminLayout";

// Error Handling
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { CacheManager, queryDefaults } from "@/utils/cacheManager";

// Pages
import { SignInPage } from "@/pages/auth/SignInPage";
import { OrdersPage } from "@/pages/orders/OrdersPage";
import { OrderDetailPage } from "@/pages/orders/OrderDetailPage";
import { CastingModulePage } from "@/pages/CastingModulePage";
import { DiamondsPage } from "@/pages/DiamondsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import SystemSettingsPage from "@/pages/SystemSettingsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

// Debug environment variables
console.log("App: Environment variables check:", {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? "SET" : "MISSING",
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? "SET" : "MISSING",
});

// Create QueryClient with optimized caching for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Increased staleTime to reduce unnecessary refetches
      staleTime: 1000 * 60 * 15, // 15 minutes (was 5)
      // Increased gcTime to keep data in cache longer
      gcTime: 1000 * 60 * 30, // 30 minutes (was 10)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount: number, error: any) => {
        // Don't retry on auth errors
        if (
          error?.message?.includes("Not authenticated") ||
          error?.status === 401 ||
          error?.code === "PGRST301"
        ) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount: number, error: any) => {
        // Don't retry on auth errors
        if (
          error?.message?.includes("Not authenticated") ||
          error?.status === 401 ||
          error?.code === "PGRST301"
        ) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
    },
  },
});

// Set up cache manager with query client
CacheManager.setQueryClient(queryClient);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Auth Routes */}
                <Route path="/auth/login" element={<SignInPage />} />

                {/* Admin Routes with Layout and Guards */}
                <Route
                  path="/"
                  element={
                    <AuthGuard>
                      <AdminLayout />
                    </AuthGuard>
                  }
                >
                  <Route index element={<Navigate to="/orders" replace />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="orders/:id" element={<OrderDetailPage />} />
                  <Route
                    path="casting-module"
                    element={<CastingModulePage />}
                  />

                  {/* Admin-only routes */}
                  <Route
                    path="diamonds"
                    element={
                      <AdminGuard>
                        <DiamondsPage />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="settings"
                    element={
                      <AdminGuard>
                        <SettingsPage />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="system-settings"
                    element={
                      <AdminGuard>
                        <SystemSettingsPage />
                      </AdminGuard>
                    }
                  />
                </Route>

                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
