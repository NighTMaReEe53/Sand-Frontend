import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { adhkarApi } from '../../api/adhkar.api';
import { useAuthStore } from '../../store/authStore';
import { useAdhkarDismissalsQuery } from '../../hooks/queries/useAdhkar';

const STORAGE_KEY = 'adhkar:dismissals_v1';
const DISMISSAL_MS = 24 * 60 * 60 * 1000;

type LocalDismissals = Record<string, string>; // itemId -> reappearsAt (ISO)

function readLocal(): LocalDismissals {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LocalDismissals;
    const now = Date.now();
    // Prune expired entries
    const live: LocalDismissals = {};
    for (const [itemId, reappearsAt] of Object.entries(parsed)) {
      if (new Date(reappearsAt).getTime() > now) live[itemId] = reappearsAt;
    }
    return live;
  } catch {
    return {};
  }
}

function writeLocal(map: LocalDismissals) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* storage full/blocked — dismissal stays session-only */
  }
}

/**
 * Adhkar-only tap-to-dismiss state with 24h suppression.
 * Guests: localStorage only. Authenticated users: merged with server records
 * so state follows the user across devices; writes go to both.
 */
export function useAdhkarDismissals() {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: serverDismissals } = useAdhkarDismissalsQuery();
  const [localDismissals, setLocalDismissals] = useState<LocalDismissals>(() => readLocal());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLocalDismissals(readLocal());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const dismissedItemIds = new Set<string>(Object.keys(localDismissals));

  if (isAuthenticated && Array.isArray(serverDismissals)) {
    for (const d of serverDismissals) dismissedItemIds.add(d.itemId);
  }

  const dismissItem = useCallback(
    async (itemId: string) => {
      const reappearsAt = new Date(Date.now() + DISMISSAL_MS).toISOString();
      setLocalDismissals((prev) => {
        const next = { ...prev, [itemId]: reappearsAt };
        writeLocal(next);
        return next;
      });
      if (useAuthStore.getState().isAuthenticated) {
        try {
          await adhkarApi.dismiss(itemId);
          void queryClient.invalidateQueries({ queryKey: ['adhkar-dismissals'] });
        } catch {
          /* offline — local suppression still applies this device */
        }
      }
    },
    [queryClient]
  );

  return { dismissedItemIds, dismissItem };
}
