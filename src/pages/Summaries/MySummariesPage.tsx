import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { summariesApi, Summary } from '../../api/summaries.api';

export function MySummariesPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['mySummaries', page],
    queryFn: () => summariesApi.getMySummaries({ page, limit: 20 }),
  });

  const statusBadge: Record<string, React.ReactElement> = {
    PENDING: <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">بانتظار المراجعة</span>,
    APPROVED: <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">تم الاعتماد</span>,
    REJECTED: <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full">مرفوض</span>,
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold text-ivory">ملخصاتي</h1>

      {isLoading ? (
        <div className="text-center text-white/60 py-8">جاري التحميل...</div>
      ) : (
        <div className="space-y-3">
          {data?.summaries?.map((s: Summary & { courseName: string }) => (
            <div key={s.id} className="bg-white/10 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-ivory font-medium">{s.title}</h3>
                {statusBadge[s.status || 'PENDING']}
              </div>
              <span className="text-white/40 text-sm">{s.courseName}</span>
              {s.rejectionReason && (
                <p className="text-red-400 text-sm">سبب الرفض: {s.rejectionReason}</p>
              )}
              <div className="text-xs text-white/40">
                {new Date(s.createdAt).toLocaleDateString('ar-EG')}
                {s.approvedAt && ` - تم الاعتماد ${new Date(s.approvedAt).toLocaleDateString('ar-EG')}`}
              </div>
            </div>
          ))}
          {data?.summaries?.length === 0 && (
            <div className="text-center text-white/60 py-8">لم تقم بإنشاء أي ملخص بعد</div>
          )}
        </div>
      )}
    </div>
  );
}
