import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { notificationsApi } from '../../api/notifications.api';
import { formatDate } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications', page, unreadOnly],
    queryFn: () => notificationsApi.list({ page, unreadOnly: unreadOnly || undefined }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 text-right">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <Badge variant="gold">مركز الإشعارات</Badge>
          <h1 className="text-2xl font-bold font-amiri text-gold-300">الإشعارات</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setUnreadOnly((v) => !v);
              setPage(1);
            }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              unreadOnly
                ? 'border-gold-400 text-gold-300'
                : 'border-surface-border text-ivory-muted'
            }`}
          >
            غير المقروءة فقط
          </button>
          <button
            type="button"
            onClick={async () => {
              await notificationsApi.markAllAsRead();
              invalidate();
            }}
            className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 border border-surface-border px-3 py-1.5 rounded-full hover:border-gold-500/40 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            تحديد الكل كمقروء
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : isError || !data ? (
        <p className="text-center text-sm text-red-400 py-12">تعذر تحميل الإشعارات.</p>
      ) : data.notifications.length === 0 ? (
        <div className="p-16 rounded-3xl bg-surface-card border border-surface-border text-center space-y-4">
          <Bell className="w-10 h-10 mx-auto text-gold-500/40" />
          <p className="text-sm text-ivory-muted">لا توجد إشعارات حتى الآن.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {data.notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={async () => {
                    if (!n.isRead) {
                      await notificationsApi.markAsRead(n.id);
                      invalidate();
                    }
                    if (n.linkUrl) navigate(n.linkUrl);
                  }}
                  className={`w-full text-right p-4 rounded-2xl bg-surface-card border transition-all hover:border-gold-500/40 ${
                    n.isRead ? 'border-surface-border opacity-70' : 'border-gold-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-sm ${n.isRead ? 'text-ivory-muted' : 'font-bold text-ivory'}`}>
                      {n.title}
                    </p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-gold-400 shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-ivory-muted mt-1 leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-ivory-muted/60 mt-2">{formatDate(n.createdAt)}</p>
                </button>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-full text-ivory-muted disabled:opacity-30 hover:text-gold-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-ivory-muted flex items-center gap-2">
                <Loader2 className="hidden w-0 h-0" />
                صفحة {data.pagination.page} من {data.pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-full text-ivory-muted disabled:opacity-30 hover:text-gold-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
