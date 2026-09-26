import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { WifiOff } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Global connection feedback. It uses browser online/offline events only —
 * no polling and no extra API request — then refreshes stale server data when
 * the connection comes back.
 */
export const ConnectivityStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine,
  );
  const hasMounted = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const setOffline = () => {
      setIsOnline(false);
      if (hasMounted.current) {
        toast.error('أنت غير متصل بالإنترنت', {
          description: 'يمكنك متابعة المحتوى المفتوح، لكن الحفظ والتحديثات ستتوقف مؤقتًا.',
        });
      }
    };
    const setOnline = () => {
      setIsOnline(true);
      if (hasMounted.current) {
        toast.success('عاد الاتصال بالإنترنت', {
          description: 'يتم الآن تحديث بياناتك بأمان.',
        });
        void queryClient.invalidateQueries({ refetchType: 'active' });
      }
    };

    window.addEventListener('offline', setOffline);
    window.addEventListener('online', setOnline);
    hasMounted.current = true;
    return () => {
      window.removeEventListener('offline', setOffline);
      window.removeEventListener('online', setOnline);
    };
  }, [queryClient]);

  if (isOnline) return null;

  return (
    <aside
      role="status"
      aria-live="assertive"
      className="fixed inset-x-0 top-0 z-[100] border-b border-amber-400/35 bg-amber-500/95 px-4 py-2 text-center text-sm font-bold text-surface-dark shadow-lg"
    >
      <span className="mx-auto flex w-fit items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        لا يوجد اتصال بالإنترنت — سنعيد التحديث تلقائيًا عند عودة الشبكة.
      </span>
    </aside>
  );
};
