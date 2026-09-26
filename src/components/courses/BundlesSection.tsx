import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, ArrowLeft, Loader2 } from 'lucide-react';
import { axiosInstance } from '../../api/axiosInstance';
import { formatPrice } from '../../lib/utils';
import { Button } from '../ui/Button';

interface BundleItem {
  id: string;
  title: string;
  description?: string | null;
  price: string | number;
  courseCount: number;
  originalTotal: number;
  savings: number;
  teacher?: { fullName: string };
  courses: { id: string; title: string; price: string | number; isFree: boolean }[];
}

export const BundlesSection: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['bundles-public'],
    queryFn: async () => {
      const res = await axiosInstance.get<{ bundles: BundleItem[] }>('/bundles');
      return res.data.bundles;
    },
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-gold-400" />
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <section className="space-y-4 text-right">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-gold-400" />
        <h2 className="text-lg font-bold font-display text-gold-300">باقات موفرة</h2>
        <span className="text-xs text-ivory-muted">اشترك في مجموعة كورسات بسعر أقل</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {data.map((b) => (
          <div
            key={b.id}
            className="p-5 rounded-2xl bg-surface-card border border-gold-500/30 hover:border-gold-500/60 transition-all space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-sm font-bold font-display text-ivory">{b.title}</h3>
                {b.teacher && (
                  <p className="text-[11px] text-ivory-muted">الأستاذ {b.teacher.fullName}</p>
                )}
              </div>
              <Badge_>{b.courseCount} كورسات</Badge_>
            </div>

            {b.description && (
              <p className="text-[11px] text-ivory-muted line-clamp-2 leading-relaxed">{b.description}</p>
            )}

            <ul className="space-y-1 pr-1">
              {b.courses.slice(0, 3).map((c) => (
                <li key={c.id} className="text-[11px] text-ivory-muted flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-gold-400 shrink-0" />
                  <span className="truncate">{c.title}</span>
                </li>
              ))}
              {b.courses.length > 3 && (
                <li className="text-[10px] text-gold-400/80 pr-3">
                  +{b.courses.length - 3} كورسات أخرى
                </li>
              )}
            </ul>

            <div className="pt-3 border-t border-surface-border flex items-center justify-between gap-3 flex-wrap">
              <div className="space-y-0.5">
                <p className="text-lg font-bold text-gold-300">{formatPrice(Number(b.price))}</p>
                {b.savings > 0 && (
                  <p className="text-[10px] text-emerald-400">
                    وفّر {formatPrice(b.savings)}{' '}
                    <s className="text-ivory-muted/60">{formatPrice(b.originalTotal)}</s>
                  </p>
                )}
              </div>
              <Link to={`/checkout?bundle=${b.id}`}>
                <Button size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                  شراء الباقة
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const Badge_: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="px-2 py-1 rounded-full bg-gold-500/15 text-gold-300 text-[10px] font-bold whitespace-nowrap">
    {children}
  </span>
);
