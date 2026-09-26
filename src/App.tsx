import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { SmoothScrollProvider } from './contexts/SmoothScrollProvider';
import { ThemeProvider, useTheme } from './contexts/ThemeProvider';
import { AppRouter } from './router/AppRouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Smart retry: never re-fire 4xx (auth/validation errors are permanent),
      // retry transient network/5xx failures once.
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
      // Perf/stability defaults: data is considered fresh for 3 minutes and
      // cached for 15, so navigation and tab-switching NEVER trigger
      // request storms. Queries that need live updates (exams, challenges,
      // live lectures, notification bell) opt into their own
      // refetchInterval / staleTime locally.
      staleTime: 1000 * 60 * 3,       // 3 دقائق — يمنع الـ refetch عند التنقل
      // Keep recently visited pages in memory long enough for real study
      // sessions. Returning to a course after browsing another page should
      // paint from cache immediately, not restart its loading state.
      gcTime: 1000 * 60 * 30,          // 30 دقيقة في الـ cache
      // Refetch stale queries when a screen is mounted so updates made on
      // another screen/tab are visible without a hard refresh.
      refetchOnMount: true,
      refetchOnWindowFocus: false,     // مش بيجيب data كل ما تيجي للتبويب
      refetchOnReconnect: true,        // بيجيب data عند عودة الاتصال
    },
  },
});

const ThemeAwareToaster: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme}
      className="sanad-toaster"
      position="top-center"
      richColors={false}
      dir="rtl"
      visibleToasts={4}
      gap={10}
      toastOptions={{
        duration: 4500,
      }}
    />
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <SmoothScrollProvider>
          <AppRouter />
          <ThemeAwareToaster />
          </SmoothScrollProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
