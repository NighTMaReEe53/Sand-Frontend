import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, HelpCircle, ArrowLeft } from 'lucide-react';
import { useCoursesQuery } from '../../hooks/queries/useCourses';

type CommunityKind = 'qa' | 'summaries';

export const CourseCommunityPickerPage: React.FC<{ kind: CommunityKind }> = ({ kind }) => {
  const [courseId, setCourseId] = useState('');
  const { data, isLoading } = useCoursesQuery({ enrolledOnly: true }, true);
  const courses = data?.courses ?? [];
  const isQa = kind === 'qa';
  const Icon = isQa ? HelpCircle : FileText;
  const target = courseId ? `/courses/${courseId}/${isQa ? 'qa' : 'summaries'}` : '#';

  return (
    <main className="community-picker mx-auto my-10 w-full max-w-3xl px-4 pb-16 sm:px-6" dir="rtl">
      <style>{`@keyframes communityIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.community-picker section{animation:communityIn .4s ease-out both}@media(prefers-reduced-motion:reduce){.community-picker section{animation:none}}`}</style>
      <section className="rounded-3xl border border-surface-border bg-surface-card p-6 shadow-md sm:p-10">
        <div className="flex items-start gap-4">
          <span className="rounded-2xl bg-primary/15 p-3 text-primary"><Icon className="h-7 w-7" /></span>
          <div>
            <p className="text-xs sm:text-sm font-bold text-primary font-sst">مساحة الطلاب</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black font-din text-ink">{isQa ? 'الأسئلة والأجوبة' : 'ملخصات الكورسات'}</h1>
            <p className="mt-2 text-xs sm:text-sm leading-6 text-ink-muted font-sst">اختر كورسًا مشتركًا للدخول إلى المساحة الخاصة به.</p>
          </div>
        </div>
        <label className="mt-8 block text-sm font-bold text-ink font-sst">اختر الكورس</label>
        <div className="relative mt-2"><BookOpen className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" /><select value={courseId} onChange={(e) => setCourseId(e.target.value)} disabled={isLoading} className="w-full appearance-none rounded-2xl border border-line bg-surface-alt px-11 py-3.5 text-ink text-sm outline-none transition focus:border-primary font-sst"><option value="">{isLoading ? 'جاري تحميل الكورسات...' : 'اختر الكورس'}</option>{courses.map((course: any) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></div>
        <Link to={target} onClick={(e) => { if (!courseId) e.preventDefault(); }} className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 font-bold transition ${courseId ? 'bg-primary text-white hover:bg-primary/90' : 'cursor-not-allowed bg-white/10 text-ivory-muted'}`}><span>الدخول للمساحة</span><ArrowLeft className="h-4 w-4" /></Link>
      </section>
    </main>
  );
};
