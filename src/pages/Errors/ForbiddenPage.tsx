import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const ForbiddenPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-24 h-24 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-6 shadow-2xl">
        <ShieldAlert className="w-12 h-12" />
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold font-amiri text-gold-300 mb-3">
        غير مصرّح لك بالوصول (403)
      </h1>

      <p className="text-sm text-ivory-muted max-w-md mb-8 leading-relaxed">
        عفواً، هذه الصفحة مخصصة فقط لأدوار محددة (مثل المعلم أو المشرف) ولا تملك الصلاحية الكافية لعرضها بحسابك الحالي.
      </p>

      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4 rotate-180" />}>
            العودة للرئيسية
          </Button>
        </Link>
        <Link to="/courses">
          <Button variant="outline">
            تصفح الكورسات
          </Button>
        </Link>
      </div>
    </div>
  );
};
