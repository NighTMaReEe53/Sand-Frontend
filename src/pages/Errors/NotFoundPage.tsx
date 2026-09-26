import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-24 h-24 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 mb-6 shadow-gold-glow">
        <Compass className="w-12 h-12 animate-spin-slow" />
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold font-amiri text-gold-300 mb-3">
        الصفحة غير موجودة (404)
      </h1>

      <p className="text-sm text-ivory-muted max-w-md mb-8 leading-relaxed">
        يبدو أنك ضللت الطريق في صفحات التاريخ! الصفحة التي تحاول الوصول إليها قد تم نقلها أو حذفها.
      </p>

      <Link to="/">
        <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4 rotate-180" />}>
          العودة للصفحة الرئيسية
        </Button>
      </Link>
    </div>
  );
};
