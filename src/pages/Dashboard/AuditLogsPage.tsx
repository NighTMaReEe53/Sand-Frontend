import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  Search,
  ScrollText,
  LogIn,
  LogOut,
  Wallet,
  CreditCard,
  Pencil,
  Trash2,
  UserRound,
  Globe,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { axiosInstance } from '../../api/axiosInstance';
import { formatDate } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { PageHeader, EmptyState } from '../../components/dashboard/PageHeader';

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: { email: string; role: string } | null;
}

const ACTION_COLORS: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  LOGIN: 'success',
  LOGOUT: 'neutral',
  PAYMENT_ACCEPTED: 'success',
  PAYMENT_REJECTED: 'danger',
  CHECKOUT_CREATED: 'warning',
};

/** Per-action icon + Arabic label */
const ACTION_META: Record<string, { icon: React.ElementType; label: string }> = {
  LOGIN: { icon: LogIn, label: 'تسجيل دخول' },
  LOGOUT: { icon: LogOut, label: 'خروج' },
  PAYMENT_ACCEPTED: { icon: Wallet, label: 'قبول دفعة' },
  PAYMENT_REJECTED: { icon: CreditCard, label: 'رفض دفعة' },
  CHECKOUT_CREATED: { icon: CreditCard, label: 'بدء دفع' },
  PARTICIPANT_MUTED: { icon: UserRound, label: 'كتم مشارك' },
  MUTE_ALL: { icon: UserRound, label: 'كتم الجميع' },
  PARTICIPANT_REMOVED: { icon: UserRound, label: 'إخراج مشارك' },
};
const DEFAULT_ACTION = { icon: Pencil, label: '' };

export const AuditLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-logs', page, actionFilter, entityFilter],
    queryFn: async () => {
      const res = await axiosInstance.get<{
        logs: AuditLogEntry[];
        pagination: { page: number; totalPages: number; total: number };
      }>('/audit-logs', {
        params: {
          page,
          limit: 50,
          ...(actionFilter && { action: actionFilter }),
          ...(entityFilter && { entity: entityFilter }),
        },
      });
      return res.data;
    },
    retry: 1,
  });

  return (
    <div className="space-y-6 text-right">
      <PageHeader
        id="audit"
        icon={ScrollText}
        title="سجل العمليات الحساسة"
        subtitle="تتبع كامل لعمليات الدخول والدفع والتغييرات الإدارية."
      />

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-surface-card border border-surface-border hover:border-gold-500/25 transition-colors">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ivory-muted" />
          <input
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value.toUpperCase());
              setPage(1);
            }}
            placeholder="فلترة بالعملية (مثال: PAYMENT_)"
            dir="ltr"
            className="w-full bg-surface border border-surface-border rounded-lg pr-9 pl-3 py-2 text-xs text-ivory focus:border-gold-500 outline-none text-left"
          />
        </div>
        <div className="relative">
          <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gold-400/60 pointer-events-none" />
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="w-full appearance-none bg-surface border border-surface-border rounded-lg pr-9 pl-3 py-2 text-xs text-ivory focus:border-gold-500 outline-none cursor-pointer"
          >
            <option value="">كل الكيانات</option>
            <option value="Payment">Payment</option>
            <option value="User">User</option>
            <option value="Course">Course</option>
            <option value="Lesson">Lesson</option>
            <option value="Exam">Exam</option>
            <option value="LiveLecture">LiveLecture</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : isError || !data ? (
        <p className="text-sm text-red-400">تعذر تحميل السجل.</p>
      ) : data.logs.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="لا توجد سجلات مطابقة"
          description="جرّب تغيير عوامل التصفية أو عد لصفحة سابقة."
        />
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-surface-card border border-surface-border overflow-x-auto">
          {/* top accent line */}
          <span className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-l from-transparent via-gold-500/70 to-transparent z-[1]" />
          <table className="w-full text-xs text-right min-w-[760px]">
            <thead className="bg-surface text-gold-300/80">
              <tr>
                <th className="px-4 py-3.5 font-bold">التاريخ</th>
                <th className="px-4 py-3.5 font-bold">العملية</th>
                <th className="px-4 py-3.5 font-bold">الكيان</th>
                <th className="px-4 py-3.5 font-bold">المستخدم</th>
                <th className="px-4 py-3.5 font-bold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {data.logs.map((log) => {
                const meta = ACTION_META[log.action] ?? DEFAULT_ACTION;
                const ActionIcon = meta.icon;
                const isDanger =
                  ACTION_COLORS[log.action] === 'danger';
                return (
                  <tr
                    key={log.id}
                    className={`transition-colors group/row ${
                      isDanger ? 'bg-red-500/[0.04]' : ''
                    } hover:bg-surface/70`}
                  >
                    <td className="px-4 py-3 text-ivory-muted whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDanger ? 'bg-red-400' : 'bg-gold-500/60'}`} />
                        {formatDate(log.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`flex w-6 h-6 items-center justify-center rounded-lg border ${
                            isDanger
                              ? 'bg-red-500/10 border-red-500/30 text-red-400'
                              : ACTION_COLORS[log.action] === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-gold-500/10 border-gold-500/25 text-gold-300'
                          }`}
                        >
                          <ActionIcon className="w-3 h-3" />
                        </span>
                        <Badge variant={ACTION_COLORS[log.action] ?? 'neutral'}>
                          {meta.label || log.action}
                        </Badge>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ivory-muted" dir="ltr">
                      {log.entity ?? '—'}
                      {log.entityId && (
                        <span className="block text-[9px] text-ivory-muted/60 font-mono">{log.entityId.slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className="px-4 py-3" dir="ltr">
                      {log.user?.email ? (
                        <span className="inline-flex items-center gap-1.5 text-ivory">
                          <UserRound className="w-3 h-3 text-gold-400/70" />
                          {log.user.email}
                        </span>
                      ) : (
                        <span className="text-ivory-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ivory-muted/70 font-mono text-[10px]" dir="ltr">
                      {log.ipAddress || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl bg-surface-card border border-surface-border text-gold-400 hover:border-gold-500/40 transition-colors disabled:opacity-30 disabled:hover:border-surface-border"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            السابق
          </button>
          <span className="text-[11px] font-bold text-ivory-muted px-2">
            صفحة {data.pagination.page} من {data.pagination.totalPages}
          </span>
          <button
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl bg-surface-card border border-surface-border text-gold-400 hover:border-gold-500/40 transition-colors disabled:opacity-30 disabled:hover:border-surface-border"
          >
            التالي
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
