import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Printer,
  Download,
  FileSpreadsheet,
  BookOpen,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Users,
  Calendar,
  Phone,
  GraduationCap,
  FileCheck2,
  MonitorPlay,
  ClipboardList,
  Clock,
  ShieldCheck,
  Sun,
  Moon,
  Laptop,
  MessageCircle,
  Loader2,
  Check,
  UserCheck,
} from 'lucide-react';
import { useCoursesQuery } from '../../hooks/queries/useCourses';
import { teacherStudentsApi } from '../../api/phase2-teacher.api';
import { studentsApi } from '../../api/students.api';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate, formatGradeLevel } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeProvider';
import { toast } from 'sonner';

export const DashboardStudentReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCourseId = searchParams.get('courseId') || '';
  const initialStudentId = searchParams.get('studentId') || '';

  const { isDark } = useTheme();
  // PDF / Screen report theme mode: 'auto' | 'dark' | 'light'
  const [reportThemeMode, setReportThemeMode] = useState<'auto' | 'dark' | 'light'>('auto');
  const effectiveTheme = reportThemeMode === 'auto' ? (isDark ? 'dark' : 'light') : reportThemeMode;
  const isDarkTheme = effectiveTheme === 'dark';

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { data: coursesData, isLoading: isLoadingCourses } = useCoursesQuery({ limit: 50, mine: true });

  const courses = useMemo(() => {
    const d = coursesData as any;
    return Array.isArray(d?.data) ? d.data : Array.isArray(d?.courses) ? d.courses : Array.isArray(d) ? d : [];
  }, [coursesData]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId);
  const [studentSearch, setStudentSearch] = useState('');

  // Quick preset notes with icons (no emojis)
  const PRESET_NOTES = [
    {
      id: 'praise',
      label: 'إشادة بالتفوق والالتزام',
      icon: FileCheck2,
      text: 'يسرنا إشعاركم بأن الطالب يظهر التزاماً وتفوقاً ملحوظاً في متابعة المحاضرات وحل الاختبارات، نرجو استمرار تشجيعه ومواصلة هذا الأداء المتميز.',
    },
    {
      id: 'backlog',
      label: 'تنبيه بالغياب والمحاضرات',
      icon: AlertTriangle,
      text: 'نلفت عناية ولي الأمر الكريم بوجود محاضرات متأخرة لم يتم حضورها بعد، يرجى التكرم بمتابعته لاستكمالها في أقرب وقت لتفادي تراكم المنهج.',
    },
    {
      id: 'homework',
      label: 'توجيه بحل الواجبات',
      icon: ClipboardList,
      text: 'يرجى حث الطالب على حل الواجبات والاختبارات الدورية في مواعيدها وعدم إهمالها، حيث أنها مقياس الفهم الحقيقي واستيعاب الدروس.',
    },
    {
      id: 'contact',
      label: 'طلب تواصل مع المدرس',
      icon: Phone,
      text: 'نرجو من ولي الأمر الكريم التواصل مع إدارة المنصة أو مدرس المادة عبر الواتساب لتنسيق خطة دعم ومتابعة مكثفة تضمن تفوق الطالب.',
    },
  ];

  const [teacherNote, setTeacherNote] = useState('');

  // Set default course if none selected
  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  // Update query params when selection changes
  useEffect(() => {
    if (selectedCourseId) {
      const params: Record<string, string> = { courseId: selectedCourseId };
      if (selectedStudentId) params.studentId = selectedStudentId;
      setSearchParams(params, { replace: true });
    }
  }, [selectedCourseId, selectedStudentId, setSearchParams]);

  // Current course metadata
  const currentCourse = useMemo(() => {
    return courses.find((c: any) => c.id === selectedCourseId);
  }, [courses, selectedCourseId]);

  // Fetch course students for the selection dropdown/list
  const { data: courseStudentsData, isLoading: isLoadingCourseStudents } = useQuery({
    queryKey: ['dashboard-reports-course-students', selectedCourseId],
    queryFn: () => teacherStudentsApi.getCourseStudents(selectedCourseId),
    enabled: !!selectedCourseId,
  });

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    const list = courseStudentsData?.students ?? [];
    if (!studentSearch.trim()) return list;
    const q = studentSearch.trim().toLowerCase();
    return list.filter((s) => s.fullName.toLowerCase().includes(q));
  }, [courseStudentsData, studentSearch]);

  // Select the first student automatically if none selected
  useEffect(() => {
    if (!selectedStudentId && filteredStudents.length > 0) {
      setSelectedStudentId(filteredStudents[0].studentId);
    }
  }, [filteredStudents, selectedStudentId]);

  // Fetch detailed student progress & performance for the selected student & course
  const { data: studentDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['dashboard-student-report-detail', selectedCourseId, selectedStudentId],
    queryFn: () => teacherStudentsApi.getStudentDetail(selectedCourseId, selectedStudentId),
    enabled: !!selectedCourseId && !!selectedStudentId,
  });

  // Also fetch full student profile to retrieve guardian phone and extra contact details
  const { data: studentSearchData } = useQuery({
    queryKey: ['dashboard-student-profile-search', studentDetail?.student?.fullName],
    queryFn: () => studentsApi.search(studentDetail!.student.fullName, 1),
    enabled: !!studentDetail?.student?.fullName,
  });

  const fullStudentProfile = studentSearchData?.results?.[0];

  // Resolve Student Academic Stage / Grade Level in proper Arabic
  const studentArabicGrade = useMemo(() => {
    const rawGrade =
      studentDetail?.student?.gradeLevel ||
      fullStudentProfile?.gradeLevel ||
      currentCourse?.gradeLevel;
    return formatGradeLevel(rawGrade);
  }, [studentDetail, fullStudentProfile, currentCourse]);

  // Resolve Guardian Phone & Direct Contact
  const resolvedGuardianPhone = useMemo(() => {
    return (
      studentDetail?.student?.guardianPhone ||
      fullStudentProfile?.guardianPhone ||
      studentDetail?.student?.user?.phone ||
      fullStudentProfile?.phone ||
      null
    );
  }, [studentDetail, fullStudentProfile]);

  const whatsappUrl = useMemo(() => {
    if (!resolvedGuardianPhone) return null;
    const cleaned = resolvedGuardianPhone.replace(/\D/g, '');
    const num = cleaned.startsWith('0') ? '2' + cleaned : cleaned;
    const text = encodeURIComponent(
      `السلام عليكم ورحمة الله وبركاته، تحياتنا لولي أمر الطالب (${studentDetail?.student?.fullName || ''}). نرفق لسيادتكم تقرير المتابعة والتحصيل الأكاديمي الشامل في مادة (${studentDetail?.courseTitle || currentCourse?.title || ''}). نسعد دائماً بتواصلكم ومتابعة تفوق الطالب.`
    );
    return `https://wa.me/${num}?text=${text}`;
  }, [resolvedGuardianPhone, studentDetail, currentCourse]);

  // Derived Performance Metrics & Guardian Evaluations.
  // Use only the latest result for each assessment: an old failed attempt
  // must never keep a student flagged after they have passed a newer attempt.
  const metrics = useMemo(() => {
    if (!studentDetail) return null;

    const lessons = studentDetail.lessons;
    const totalLessons = lessons.length;
    const completedLessons = lessons.filter((l) => l.isCompleted).length;
    const unwatchedLessons = lessons.filter((l) => !l.isCompleted && l.watchedPercentage < 10);
    const partiallyWatched = lessons.filter((l) => !l.isCompleted && l.watchedPercentage >= 10);
    const completionPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const allAssessments = studentDetail.assessments ?? studentDetail.quizScores.map((quiz) => ({
      assessmentId: quiz.quizId,
      type: 'QUIZ' as const,
      title: quiz.quizTitle,
      lessonId: quiz.lessonId,
      attemptNumber: quiz.attemptNumber,
      percentage: quiz.percentage,
      isPassed: quiz.isPassed,
      submittedAt: quiz.submittedAt,
    }));
    const sortedAssessments = [...allAssessments].sort(
      (a, b) => new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime(),
    );
    const latestByAssessment = new Map<string, (typeof allAssessments)[number]>();
    sortedAssessments.forEach((assessment) => {
      const key = `${assessment.type}:${assessment.assessmentId}`;
      if (!latestByAssessment.has(key)) latestByAssessment.set(key, assessment);
    });
    const latestAssessments = [...latestByAssessment.values()];
    const pendingRequirements = studentDetail.pendingRequirements ?? [];
    const overdueRequirements = pendingRequirements.filter((requirement) => requirement.isOverdue);
    const validScores = latestAssessments
      .filter((assessment) => assessment.percentage != null)
      .map((assessment) => assessment.percentage!);
    const avgScore =
      validScores.length > 0
        ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length)
        : null;
    const passedAssessments = latestAssessments.filter((assessment) => assessment.isPassed === true).length;
    const strugglingAssessments = latestAssessments.filter(
      (assessment) => assessment.isPassed === false,
    );

    // Never call a student "excellent" when the platform has no submitted
    // assessment evidence. Completion and assessment quality are separate.
    let ratingBadge = {
      label: 'يحتاج لمتابعة ودعم مستمر',
      status: 'warning',
      color: isDarkTheme
        ? 'text-amber-400 bg-amber-500/15 border-amber-500/30'
        : 'text-amber-800 bg-amber-50 border-amber-300',
      icon: AlertTriangle,
      parentExplanation:
        'هناك دروس غير مكتملة أو نتيجة حديثة تحتاج إلى مراجعة. الأرقام المعروضة أدناه تعتمد على النشاط المسجل فعلياً في هذا الكورس.',
    };

    if (totalLessons === 0) {
      ratingBadge = {
        label: 'لا توجد دروس منشورة للتقييم',
        status: 'neutral',
        color: isDarkTheme
          ? 'text-slate-300 bg-slate-500/15 border-slate-500/30'
          : 'text-slate-700 bg-slate-50 border-slate-300',
        icon: Clock,
        parentExplanation: 'لم تُنشر دروس في هذا الكورس بعد، لذلك لا يمكن إصدار حكم أكاديمي أو توصية متابعة حالياً.',
      };
    } else if (
      completionPercentage >= 80 &&
      avgScore !== null &&
      avgScore >= 75 &&
      strugglingAssessments.length === 0 &&
      pendingRequirements.length === 0
    ) {
      ratingBadge = {
        label: 'طالب متميز ومتفوق',
        status: 'excellent',
        color: isDarkTheme
          ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
          : 'text-emerald-800 bg-emerald-50 border-emerald-300',
        icon: FileCheck2,
        parentExplanation:
          'أداء الطالب ممتاز وملتزم بنسبة حضور واكتمال عالية ونتائج متميزة في التقييمات. نشيد باجتهاده ونوصي باستمرار دعمه وتشجيعه.',
      };
    } else if (
      completionPercentage >= 50 &&
      strugglingAssessments.length === 0 &&
      overdueRequirements.length === 0
    ) {
      ratingBadge = {
        label: avgScore === null ? 'متابعة منتظمة بانتظار التقييم' : 'طالب جيد ومنتظم',
        status: 'good',
        color: isDarkTheme
          ? 'text-sky-400 bg-sky-500/15 border-sky-500/30'
          : 'text-sky-800 bg-sky-50 border-sky-300',
        icon: CheckCircle2,
        parentExplanation:
          avgScore === null
            ? 'الطالب يتابع الدروس بمعدل مقبول، لكن لا توجد نتائج تقييمات مكتملة كافية للحكم على مستوى الفهم بعد.'
            : 'الطالب يواكب الخطة الدراسية بشكل مقبول. استكمال الدروس المتبقية والمحافظة على نتائج التقييم سيحسّن المستوى أكثر.',
      };
    }

    const noteParts: string[] = [];
    const remainingLessons = Math.max(0, totalLessons - completedLessons);
    if (remainingLessons > 0) {
      noteParts.push(`يرجى متابعة استكمال ${remainingLessons} درس متبقٍ في الكورس حتى لا يتراكم المحتوى.`);
    }
    if (overdueRequirements.length > 0) {
      const titles = overdueRequirements.slice(0, 2).map((requirement) => `«${requirement.title}»`).join(' و');
      noteParts.push(`فات موعد ${overdueRequirements.length} امتحان غير مكتمل، منها ${titles}. يُرجى التواصل مع مدرس المادة لتحديد الخطوة التالية.`);
    } else if (pendingRequirements.length > 0) {
      const titles = pendingRequirements.slice(0, 2).map((requirement) => `«${requirement.title}»`).join(' و');
      noteParts.push(`هناك ${pendingRequirements.length} مهمة أو تقييم مطلوب استكماله، منها ${titles}.`);
    }
    if (strugglingAssessments.length > 0) {
      const titles = strugglingAssessments.slice(0, 2).map((assessment) => `«${assessment.title}»`).join(' و');
      noteParts.push(`تحتاج آخر نتيجة في ${titles} إلى مراجعة هادئة ثم إعادة التدريب.`);
    }
    if (latestAssessments.length === 0) {
      noteParts.push('لم تسجل المنصة تقييمات مكتملة بعد؛ يُستحسن حل أول تقييم متاح بعد مراجعة الدرس لقياس الفهم بدقة.');
    }
    if (noteParts.length === 0) {
      noteParts.push('الأداء الحالي منتظم والنتائج الأخيرة مجتازة. نوصي بالاستمرار على المراجعة المنتظمة قبل التقييمات القادمة.');
    }

    return {
      totalLessons,
      completedLessons,
      completionPercentage,
      unwatchedLessons,
      partiallyWatched,
      allAssessments,
      latestAssessments,
      pendingRequirements,
      overdueRequirements,
      passedAssessments,
      avgScore,
      ratingBadge,
      strugglingAssessments,
      recommendedNote: noteParts.join(' '),
    };
  }, [studentDetail, isDarkTheme]);

  // Update the editable note only when the selected student/report changes.
  useEffect(() => {
    if (metrics?.recommendedNote) setTeacherNote(metrics.recommendedNote);
  }, [selectedCourseId, selectedStudentId, metrics?.recommendedNote]);

  // Direct download is a real PDF emitted by Chromium on the server. Verify
  // its signature before saving so an HTML/JSON error can never masquerade as a PDF.
  const handleDownloadPdf = async () => {
    if (!studentDetail || !selectedCourseId || !selectedStudentId) return;

    setIsGeneratingPdf(true);
    const toastId = toast.loading('جاري إنشاء التقرير الرسمي والتحقق من ملف PDF...');

    try {
      const { blob, fileName } = await teacherStudentsApi.downloadGuardianReport(
        selectedCourseId,
        selectedStudentId,
        teacherNote,
      );
      if (blob.size < 5 || (await blob.slice(0, 5).text()) !== '%PDF-') {
        throw new Error('The server did not return a valid PDF document.');
      }
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1_000);
      toast.success('تم تنزيل تقرير PDF صالح وجاهز للقراءة.', { id: toastId });
    } catch (error) {
      console.error('Error downloading guardian PDF:', error);
      toast.error('تعذر إنشاء التقرير الرسمي. لم يتم تنزيل ملف غير صالح، يرجى المحاولة مرة أخرى.', { id: toastId });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. High-Fidelity Print & Save-As-PDF via Isolated Iframe (Guaranteed not to cut off or crash)
  const handlePrint = () => {
    const reportEl = document.getElementById('student-printable-report');
    if (!reportEl || !studentDetail) return;

    // Temporarily pause Lenis to prevent scroll interception
    const lenis = (window as any).__lenis;
    lenis?.stop?.();

    const oldIframe = document.getElementById('report-print-iframe');
    if (oldIframe) oldIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'report-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      lenis?.start?.();
      return;
    }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    const studentName = studentDetail.student.fullName || 'طالب';

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar" class="${isDarkTheme ? 'dark' : ''}">
      <head>
        <meta charset="utf-8">
        <title>تقرير_متابعة_${studentName.replace(/\s+/g, '_')}</title>
        ${styles}
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: ${isDarkTheme ? '#12151c' : '#ffffff'} !important;
            color: ${isDarkTheme ? '#f8fafc' : '#0f172a'} !important;
            font-family: 'IBM Plex Sans Arabic', 'Cairo', 'Segoe UI', Tahoma, sans-serif !important;
          }
          #student-printable-report {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 16px !important;
            border: none !important;
            box-shadow: none !important;
            background: ${isDarkTheme ? '#12151c' : '#ffffff'} !important;
            color: ${isDarkTheme ? '#f8fafc' : '#0f172a'} !important;
          }
          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        </style>
      </head>
      <body class="${isDarkTheme ? 'dark' : ''}">
        ${reportEl.outerHTML}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.warn('Iframe print error:', e);
        window.print();
      } finally {
        lenis?.start?.();
        setTimeout(() => {
          iframe.remove();
        }, 3000);
      }
    }, 400);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* ── Scoped Print Stylesheet ── */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          html, body {
            background: ${isDarkTheme ? '#12151c' : '#ffffff'} !important;
            color: ${isDarkTheme ? '#f8fafc' : '#0f172a'} !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          #student-printable-report {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: ${isDarkTheme ? '#12151c' : '#ffffff'} !important;
            color: ${isDarkTheme ? '#f8fafc' : '#0f172a'} !important;
          }
          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ─── Modern Dashboard Header (Compact, Balanced & SaaS-Grade) ─── */}
      <div className="rounded-3xl border border-surface-border bg-surface-card p-5 sm:p-6 shadow-sm print:hidden">
        <div className="space-y-5">
          {/* Header Title & Context */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-0.5 text-xs font-bold text-gold-400">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                تقارير المتابعة والتحصيل
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-surface-border bg-surface-alt px-2.5 py-0.5 text-[11px] font-semibold text-ink-muted">
                نسخة معتمدة لأولياء الأمور
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-ink font-din">
              تقرير الأداء والمتابعة الأكاديمية للطالب
            </h1>
            <p className="text-xs text-ink-muted max-w-2xl leading-relaxed">
              تقرير واضح لولي الأمر: متابعة الدروس، آخر نتائج التقييمات، والتوصيات المبنية على البيانات المسجلة فقط.
            </p>
          </div>

          {/* Controls: Mode Switcher + Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 border-t border-surface-border pt-4">
            {/* Mode Switcher (Using Lucide Icons - No Emojis) */}
            <div className="flex items-center gap-1 p-1 rounded-2xl border border-surface-border bg-surface-alt">
              <button
                type="button"
                onClick={() => setReportThemeMode('auto')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  reportThemeMode === 'auto'
                    ? 'bg-gold-500 text-white shadow-sm font-black'
                    : 'text-ink-muted hover:text-ink'
                }`}
                title="تلقائي حسب وضع الشاشة الحالي"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>تلقائي</span>
              </button>
              <button
                type="button"
                onClick={() => setReportThemeMode('dark')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  reportThemeMode === 'dark'
                    ? 'bg-slate-800 text-amber-300 border border-amber-400/30 shadow-sm font-black'
                    : 'text-ink-muted hover:text-ink'
                }`}
                title="تفعيل الوضع الداكن الفخم للتقرير والـ PDF"
              >
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span>داكن فخم</span>
              </button>
              <button
                type="button"
                onClick={() => setReportThemeMode('light')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  reportThemeMode === 'light'
                    ? 'bg-white text-slate-900 border border-slate-300 shadow-sm font-black'
                    : 'text-ink-muted hover:text-ink'
                }`}
                title="تفعيل الوضع الفاتح الرسمي للتقرير والطباعة"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>فاتح رسمي</span>
              </button>
            </div>

            {/* Direct PDF Download Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={!studentDetail || isGeneratingPdf}
              className="inline-flex items-center gap-2 rounded-2xl bg-gold-gradient px-4 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>تنزيل PDF مباشر</span>
            </button>

            {/* Print / Save PDF Dialog Button */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={!studentDetail}
              className="inline-flex items-center gap-2 rounded-2xl border border-surface-border bg-surface-alt px-4 py-2.5 text-xs font-bold text-ink shadow-sm hover:border-gold-500/50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-gold-400" />
              <span>طباعة التقرير</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Control Bar: Course Selector + Student Search ─── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 rounded-3xl border border-surface-border bg-surface-card p-5 shadow-sm print:hidden">
        {/* Course Select */}
        <div className="md:col-span-5 space-y-1.5">
          <label className="text-xs font-bold text-ink flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-gold-400" />
            الكورس الدراسي:
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              setSelectedStudentId('');
            }}
            className="w-full rounded-2xl border border-surface-border bg-surface-alt px-3.5 py-2.5 text-xs font-semibold text-ink outline-none focus:border-gold-500/50 cursor-pointer transition-colors"
          >
            {courses.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.title} {c.gradeLevel ? `(${formatGradeLevel(c.gradeLevel)})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Student Search & Select */}
        <div className="md:col-span-7 space-y-1.5">
          <label className="text-xs font-bold text-ink flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gold-400" />
            اختيار الطالب من الكورس:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-6 relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="ابحث باسم الطالب…"
                className="w-full rounded-2xl border border-surface-border bg-surface-alt pr-10 pl-3 py-2.5 text-xs text-ink placeholder:text-ink-muted/70 outline-none focus:border-gold-500/50"
              />
            </div>
            <div className="sm:col-span-6">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full rounded-2xl border border-surface-border bg-surface-alt px-3.5 py-2.5 text-xs font-bold text-gold-400 outline-none focus:border-gold-500/50 cursor-pointer"
              >
                {filteredStudents.length === 0 ? (
                  <option value="">لا يوجد طلاب مطابقون</option>
                ) : (
                  filteredStudents.map((s) => (
                    <option key={s.studentId} value={s.studentId}>
                      {s.fullName} ({s.completionPercentage}%)
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Quick Student Overview Strip (Screen Only) ─── */}
      {studentDetail && (
        <div className="rounded-2xl border border-surface-border bg-surface-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3.5 min-w-0">
            {studentDetail.student.photoUrl ? (
              <img
                src={studentDetail.student.photoUrl}
                alt={studentDetail.student.fullName}
                className="w-12 h-12 rounded-xl object-cover border border-gold-500/40 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gold-gradient flex items-center justify-center text-white font-black text-lg shrink-0">
                {studentDetail.student.fullName?.[0] || 'ط'}
              </div>
            )}
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-ink">{studentDetail.student.fullName}</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-gold-500/30 bg-gold-500/10 px-2 py-0.5 text-[10px] font-bold text-gold-400">
                  <GraduationCap className="w-3 h-3" />
                  {studentArabicGrade}
                </span>
              </div>
              <p className="text-xs text-ink-muted truncate">{studentDetail.courseTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>واتساب ولي الأمر</span>
              </a>
            )}
            <div className="text-xs font-bold text-ink-muted px-3 py-1.5 rounded-xl bg-surface-alt border border-surface-border">
              نسبة الإنجاز: <span className="text-gold-400 font-mono font-bold">{studentDetail.completionPercentage}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ─── PRINTABLE OFFICIAL REPORT DOCUMENT CONTAINER ──────────── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {isLoadingDetail ? (
        <div className="space-y-4 p-8 rounded-3xl border border-surface-border bg-surface-card">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : !studentDetail ? (
        <div className="rounded-3xl border border-dashed border-surface-border bg-surface-card p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-ink-muted mx-auto" />
          <h3 className="text-base font-bold text-ink">لم يتم اختيار طالب لعرض التقرير</h3>
          <p className="text-xs text-ink-muted">
            يرجى اختيار الكورس ثم تحديد الطالب من القائمة أعلاه لاستعراض التقرير المباشر لولي الأمر.
          </p>
        </div>
      ) : (
        <div
          id="student-printable-report"
          className={`relative rounded-3xl border p-6 sm:p-10 shadow-2xl space-y-8 transition-colors ${
            isDarkTheme
              ? 'bg-[#12151c] border-slate-800 text-slate-100 shadow-black/40'
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
          }`}
        >
          {/* ── Official Document Header ── */}
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 pb-6 print-avoid-break ${
              isDarkTheme ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl p-2.5 shadow-sm border ${
                  isDarkTheme ? 'bg-slate-900 border-slate-700/60' : 'bg-white border-slate-200'
                }`}
              >
                <img src="/image/logo.png" alt="شعار منصة سند" className="h-full w-full object-contain" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className={`text-xl sm:text-2xl font-black font-din ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    منصة سند التعليمية
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                      isDarkTheme
                        ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                        : 'border-amber-500/30 bg-amber-50 text-amber-800'
                    }`}
                  >
                    وثيقة رسمية معتمدة
                  </span>
                </div>
                <p className={`text-xs font-bold ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                  تقرير المتابعة والتحصيل الدراسي الأكاديمي الشامل (موجّه لولي الأمر)
                </p>
              </div>
            </div>

            <div
              className={`text-left sm:border-r sm:pr-6 space-y-1.5 ${
                isDarkTheme ? 'sm:border-slate-800' : 'sm:border-slate-200'
              }`}
            >
              <p
                className={`text-xs font-bold flex items-center sm:justify-end gap-1.5 ${
                  isDarkTheme ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className={`text-[11px] ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                كود المتابعة المرجعي:{' '}
                <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                  {studentDetail.student.id.slice(0, 8).toUpperCase()}
                </span>
              </p>
            </div>
          </div>

          {/* ── Student Profile & Enrollment Strip ── */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 print-avoid-break transition-colors ${
              isDarkTheme ? 'border-slate-800 bg-[#171b24]' : 'border-slate-200 bg-slate-50/80'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-dashed border-current/15">
              <div className="flex items-center gap-4">
                {/* Student Photo */}
                {studentDetail.student.photoUrl ? (
                  <img
                    src={studentDetail.student.photoUrl}
                    alt={studentDetail.student.fullName}
                    className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl object-cover border-2 border-amber-500/50 shadow-md shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl bg-gold-gradient flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-md">
                    {studentDetail.student.fullName?.[0] || 'ط'}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-lg sm:text-xl font-black ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                      {studentDetail.student.fullName}
                    </p>
                    {/* Academic Stage / Grade Level in Arabic */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black border ${
                        isDarkTheme
                          ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                          : 'border-amber-500/40 bg-amber-50 text-amber-900'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      {studentArabicGrade}
                    </span>
                  </div>
                  <p className={`text-xs font-semibold ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                    الكورس المسجل: <span className="font-bold text-amber-500">{studentDetail.courseTitle}</span>
                  </p>
                </div>
              </div>

              {/* Direct WhatsApp link for guardian (hidden in print) */}
              {whatsappUrl && (
                <div className="print:hidden shrink-0">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>مراسلة ولي الأمر</span>
                  </a>
                </div>
              )}
            </div>

            {/* Profile Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className={`text-[11px] font-bold ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  المرحلة الدراسية
                </p>
                <p className={`text-sm font-black mt-0.5 ${isDarkTheme ? 'text-amber-300' : 'text-amber-700'}`}>
                  {studentArabicGrade}
                </p>
              </div>

              <div>
                <p className={`text-[11px] font-bold ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  هاتف ولي الأمر للتواصل
                </p>
                <p className={`text-sm font-bold mt-0.5 ${isDarkTheme ? 'text-slate-200' : 'text-slate-900'}`} dir="ltr">
                  {resolvedGuardianPhone || 'مسجل بالمنصة'}
                </p>
              </div>

              <div>
                <p className={`text-[11px] font-bold ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  تاريخ بدء الدراسة
                </p>
                <p className={`text-sm font-bold mt-0.5 ${isDarkTheme ? 'text-slate-200' : 'text-slate-900'}`}>
                  {formatDate(studentDetail.enrolledAt)}
                </p>
              </div>

              <div>
                <p className={`text-[11px] font-bold ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  حالة القيد في المادة
                </p>
                <p className="text-sm font-black mt-0.5 text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  طالب نشط ومسجل
                </p>
              </div>
            </div>
          </div>

          {/* ── Executive Performance Summary (Overall Evaluation for Guardian) ── */}
          <div className="space-y-4 print-avoid-break">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className={`text-base font-black font-din flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                ملخص التقييم العام ومستوى التزام الطالب (لولي الأمر)
              </h3>

              {metrics && (
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black border ${metrics.ratingBadge.color}`}>
                  <metrics.ratingBadge.icon className="w-4 h-4" />
                  {metrics.ratingBadge.label}
                </span>
              )}
            </div>

            {/* Parent-friendly explanation callout */}
            {metrics && (
              <div
                className={`rounded-2xl border p-4 text-xs font-semibold leading-relaxed ${
                  isDarkTheme ? 'border-slate-800 bg-[#171b24] text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <p>
                  <strong className={isDarkTheme ? 'text-amber-400' : 'text-amber-700'}>ملاحظة التقييم الأكاديمي: </strong>
                  {metrics.ratingBadge.parentExplanation}
                </p>
              </div>
            )}

            {/* 4 Performance Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div
                className={`rounded-2xl border p-4 text-center ${
                  isDarkTheme ? 'border-slate-800 bg-[#171b24]' : 'border-slate-200 bg-white'
                }`}
              >
                <p className={`text-2xl sm:text-3xl font-black font-din ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  {metrics?.completionPercentage ?? 0}%
                </p>
                <p className={`text-[11px] font-bold mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  نسبة إنجاز المنهج الكلية
                </p>
              </div>

              <div
                className={`rounded-2xl border p-4 text-center ${
                  isDarkTheme ? 'border-slate-800 bg-[#171b24]' : 'border-slate-200 bg-white'
                }`}
              >
                <p className="text-2xl sm:text-3xl font-black font-din text-emerald-500">
                  {studentDetail.completedLessons} / {studentDetail.totalLessons}
                </p>
                <p className={`text-[11px] font-bold mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  المحاضرات المكتملة
                </p>
              </div>

              <div
                className={`rounded-2xl border p-4 text-center ${
                  isDarkTheme ? 'border-slate-800 bg-[#171b24]' : 'border-slate-200 bg-white'
                }`}
              >
                <p className="text-2xl sm:text-3xl font-black font-din text-amber-500">
                  {metrics?.avgScore != null ? `${metrics.avgScore}%` : '—'}
                </p>
                <p className={`text-[11px] font-bold mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  متوسط آخر نتائج التقييمات
                </p>
              </div>

              <div
                className={`rounded-2xl border p-4 text-center ${
                  isDarkTheme ? 'border-slate-800 bg-[#171b24]' : 'border-slate-200 bg-white'
                }`}
              >
                <p className="text-2xl sm:text-3xl font-black font-din text-rose-500">
                  {Math.max(0, studentDetail.totalLessons - studentDetail.completedLessons)}
                </p>
                <p className={`text-[11px] font-bold mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  محاضرات متبقية لم يكملها
                </p>
              </div>
            </div>
          </div>

          {/* ── Outstanding work: an explicit list, not a guessed recommendation ── */}
          {metrics && (
            <div className={`rounded-2xl border p-4 sm:p-5 space-y-3.5 print-avoid-break ${
              metrics.overdueRequirements.length > 0
                ? isDarkTheme
                  ? 'border-rose-500/30 bg-rose-500/[0.06]'
                  : 'border-rose-200 bg-rose-50/60'
                : isDarkTheme
                  ? 'border-slate-800 bg-[#171b24]'
                  : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className={`text-sm sm:text-base font-black font-din flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    <ClipboardList className={`w-4.5 h-4.5 ${metrics.overdueRequirements.length > 0 ? 'text-rose-500' : 'text-amber-500'}`} />
                    المهام والاختبارات المطلوب استكمالها
                  </h3>
                  <p className={`mt-1 text-[11px] font-medium ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                    نعرض كل العناصر المنشورة التي لا توجد لها محاولة مسلّمة. لا نسمّي الواجب أو الكويز «متأخراً» ما لم يكن له موعد منتهٍ فعلياً.
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black ${
                  metrics.overdueRequirements.length > 0
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-500'
                    : metrics.pendingRequirements.length > 0
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                }`}>
                  {metrics.overdueRequirements.length > 0 ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {metrics.pendingRequirements.length === 0
                    ? 'لا توجد عناصر معلّقة'
                    : `${metrics.pendingRequirements.length} عنصر مطلوب`}
                </span>
              </div>

              {metrics.pendingRequirements.length === 0 ? (
                <p className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  لا توجد واجبات أو اختبارات أو امتحانات منشورة لم يكتمل تسليمها.
                </p>
              ) : (
                <div className={`rounded-xl border overflow-x-auto ${isDarkTheme ? 'border-slate-800' : 'border-slate-200 bg-white'}`}>
                  <table className="w-full min-w-[690px] text-xs text-right border-collapse">
                    <thead>
                      <tr className={isDarkTheme ? 'bg-slate-900/70 text-slate-300' : 'bg-slate-100 text-slate-700'}>
                        <th className="p-3">النوع</th>
                        <th className="p-3">العنصر المطلوب</th>
                        <th className="p-3">الدرس المرتبط</th>
                        <th className="p-3">الحالة</th>
                        <th className="p-3">الموعد / الإتاحة</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkTheme ? 'divide-slate-800' : 'divide-slate-200'}`}>
                      {metrics.pendingRequirements.map((requirement) => {
                        const typeLabel = requirement.type === 'EXAM' ? 'امتحان' : requirement.type === 'HOMEWORK' ? 'واجب' : 'كويز';
                        const schedule = requirement.dueAt
                          ? `الموعد: ${formatDate(requirement.dueAt)}`
                          : requirement.availableFrom
                            ? `متاح منذ: ${formatDate(requirement.availableFrom)}`
                            : 'متاح ضمن محتوى الكورس';
                        return (
                          <tr key={`${requirement.type}-${requirement.requirementId}`} className={requirement.isOverdue ? (isDarkTheme ? 'bg-rose-500/[0.07]' : 'bg-rose-50') : undefined}>
                            <td className={`p-3 font-bold ${isDarkTheme ? 'text-violet-300' : 'text-violet-700'}`}>{typeLabel}</td>
                            <td className={`p-3 font-bold ${isDarkTheme ? 'text-slate-100' : 'text-slate-900'}`}>{requirement.title}</td>
                            <td className={`p-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{requirement.lessonTitle || 'تقييم عام للكورس'}</td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 font-bold ${requirement.isOverdue ? 'text-rose-500' : 'text-amber-500'}`}>
                                {requirement.isOverdue ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                {requirement.statusLabel}
                              </span>
                            </td>
                            <td className={`p-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{schedule}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Section 1: Detailed Lessons Attendance & Watch Status ── */}
          <div className="space-y-3.5 print-avoid-break">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className={`text-sm sm:text-base font-black font-din flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                <MonitorPlay className="w-4.5 h-4.5 text-sky-500" />
                سجل حضور ومشاهدة المحاضرات (تفاصيل الحضور والمتبقي)
              </h3>
              <span className={`text-xs font-bold ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                {studentDetail.completedLessons} من إجمالي {studentDetail.totalLessons} محاضرة
              </span>
            </div>

            <div className={`rounded-2xl border overflow-x-auto ${isDarkTheme ? 'border-slate-800' : 'border-slate-200'}`}>
              <table className="w-full min-w-[720px] text-xs text-right border-collapse">
                <thead>
                  <tr className={`border-b font-bold ${isDarkTheme ? 'bg-[#1b202c] border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                    <th className="p-3">#</th>
                    <th className="p-3">اسم الدرس / المحاضرة</th>
                    <th className="p-3">نسبة المشاهدة</th>
                    <th className="p-3">حالة الحضور</th>
                    <th className="p-3">آخر مشاهدة</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkTheme ? 'divide-slate-800/80' : 'divide-slate-200'}`}>
                  {studentDetail.lessons.map((lesson) => {
                    const pct = Math.round(lesson.watchedPercentage);
                    return (
                      <tr
                        key={lesson.lessonId}
                        className={
                          lesson.isCompleted
                            ? isDarkTheme
                              ? 'bg-emerald-500/[0.04]'
                              : 'bg-emerald-50/50'
                            : pct > 0
                            ? isDarkTheme
                              ? 'bg-amber-500/[0.04]'
                              : 'bg-amber-50/50'
                            : isDarkTheme
                            ? 'bg-rose-500/[0.04]'
                            : 'bg-rose-50/50'
                        }
                      >
                        <td className={`p-3 font-bold tabular-nums ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                          {lesson.orderIndex}
                        </td>
                        <td className={`p-3 font-bold ${isDarkTheme ? 'text-slate-200' : 'text-slate-900'}`}>
                          {lesson.title}
                        </td>
                        <td className="p-3 tabular-nums font-bold" dir="ltr">
                          <div className="flex items-center gap-2">
                            <span>{pct}%</span>
                            <div className={`w-16 h-1.5 rounded-full overflow-hidden ${isDarkTheme ? 'bg-slate-700' : 'bg-slate-200'}`}>
                              <div
                                className={`h-full rounded-full ${
                                  lesson.isCompleted ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          {lesson.isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-emerald-500 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              حضر بالكامل
                            </span>
                          ) : pct > 0 ? (
                            <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
                              <Clock className="w-3.5 h-3.5" />
                              مشاهدة جزئية ({pct}%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-500 font-bold">
                              <XCircle className="w-3.5 h-3.5" />
                              لم يشاهد بعد (متأخر)
                            </span>
                          )}
                        </td>
                        <td className={`p-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                          {formatDate(lesson.lastWatchedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Section 2: Quizzes, Homeworks & Exams Performance ── */}
          <div className="space-y-3.5 print-avoid-break">
            <h3 className={`text-sm sm:text-base font-black font-din flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              <Award className="w-4.5 h-4.5 text-violet-500" />
              سجل نتائج الامتحانات والكويزات والواجبات
            </h3>

            {metrics?.allAssessments.length === 0 ? (
              <div
                className={`rounded-2xl border p-5 text-center text-xs ${
                  isDarkTheme ? 'border-slate-800 bg-[#171b24] text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                لم تُسجّل أي نتيجة مكتملة في هذا الكورس بعد، لذلك لا توجد درجة أو توصية مرتبطة بتقييم.
              </div>
            ) : (
              <div className={`rounded-2xl border overflow-x-auto ${isDarkTheme ? 'border-slate-800' : 'border-slate-200'}`}>
                <table className="w-full min-w-[680px] text-xs text-right border-collapse">
                  <thead>
                    <tr className={`border-b font-bold ${isDarkTheme ? 'bg-[#1b202c] border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                      <th className="p-3">النوع</th>
                      <th className="p-3">التقييم / الاختبار</th>
                      <th className="p-3">المحاولة</th>
                      <th className="p-3">النتيجة المعيارية</th>
                      <th className="p-3">التقدير وحالة النتيجة</th>
                      <th className="p-3">تاريخ التسليم</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkTheme ? 'divide-slate-800/80' : 'divide-slate-200'}`}>
                    {metrics?.allAssessments.map((assessment, idx) => {
                      const typeLabel = assessment.type === 'EXAM' ? 'امتحان' : assessment.type === 'HOMEWORK' ? 'واجب' : 'كويز';
                      const pct = assessment.percentage;
                      const gradeLabel =
                        assessment.isPassed === true
                          ? pct != null && pct >= 85
                            ? 'مجتاز - ممتاز'
                            : 'مجتاز'
                          : assessment.isPassed === false
                            ? 'لم يجتز - يحتاج مراجعة'
                            : 'قيد التقييم';

                      return (
                        <tr key={`${assessment.type}-${assessment.assessmentId}-${idx}`} className={isDarkTheme ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                          <td className={`p-3 font-bold ${isDarkTheme ? 'text-violet-300' : 'text-violet-700'}`}>
                            {typeLabel}
                          </td>
                          <td className={`p-3 font-bold ${isDarkTheme ? 'text-slate-200' : 'text-slate-900'}`}>
                            {assessment.title}
                          </td>
                          <td className={`p-3 tabular-nums font-medium ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                            محاولة {assessment.attemptNumber}
                          </td>
                          <td className="p-3 tabular-nums font-bold" dir="ltr">
                            {pct != null ? `${pct}%` : '—'}
                          </td>
                          <td className="p-3">
                            {assessment.isPassed === true ? (
                              <span className="inline-flex items-center gap-1 text-emerald-500 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {gradeLabel}
                              </span>
                            ) : assessment.isPassed === false ? (
                              <span className="inline-flex items-center gap-1 text-rose-500 font-bold">
                                <XCircle className="w-3.5 h-3.5" />
                                {gradeLabel}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-500 font-bold">
                                <Clock className="w-3.5 h-3.5" />
                                {gradeLabel}
                              </span>
                            )}
                          </td>
                          <td className={`p-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                            {formatDate(assessment.submittedAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Section 3: Weaknesses & Questions to Review (نقاط التحسين) ── */}
          <div className="space-y-3 print-avoid-break">
            <h3 className={`text-sm sm:text-base font-black font-din flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
              نقاط تحتاج مراجعة - بناءً على آخر نتيجة فقط
            </h3>
            <div
              className={`rounded-2xl border p-4 sm:p-5 text-xs space-y-2.5 leading-relaxed ${
                isDarkTheme ? 'border-slate-800 bg-[#171b24]' : 'border-slate-200 bg-slate-50'
              }`}
            >
              {metrics?.strugglingAssessments && metrics.strugglingAssessments.length > 0 ? (
                <div className="space-y-2">
                  <p className={`font-bold ${isDarkTheme ? 'text-amber-400' : 'text-amber-800'}`}>
                    لوحظ تعثر الطالب في الاختبارات أو الموضوعات التالية ويُنصح بمراجعتها فوراً:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5">
                    {metrics.strugglingAssessments.map((assessment, i) => (
                      <li key={i} className={isDarkTheme ? 'text-slate-300' : 'text-slate-700'}>
                        <strong className={isDarkTheme ? 'text-white' : 'text-slate-900'}>{assessment.title}</strong> — آخر نتيجة مسجلة ({assessment.percentage ?? '—'}%) لم تجتز معيار النجاح؛ يُنصح بمراجعة الدرس والتدريب قبل المحاولة التالية.
                      </li>
                    ))}
                  </ul>
                </div>
              ) : metrics?.latestAssessments.length ? (
                <p className="text-emerald-500 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  جميع آخر نتائج التقييمات المسجلة مجتازة، ولا توجد ملاحظة تحسين مبنية على نتيجة قديمة.
                </p>
              ) : (
                <p className={`font-bold ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                  لا توجد نتائج تقييمات مكتملة بعد، لذلك لا يمكن تحديد نقاط قوة أو ضعف دقيقة حالياً.
                </p>
              )}
            </div>
          </div>

          {/* ── Section 4: Teacher's Custom Note to Guardian ── */}
          <div className="space-y-3 print-avoid-break">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                <ClipboardList className="w-4 h-4 text-amber-500" />
                توصية وتوجيه معلم المادة الخاص لولي الأمر:
              </label>

              {/* Quick Template Buttons (Screen Only - Icons Only, No Emojis) */}
              <div className="flex items-center gap-1.5 flex-wrap print:hidden">
                <span className={`text-[11px] font-bold ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  نماذج سريعة:
                </span>
                {PRESET_NOTES.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setTeacherNote(preset.text)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                        isDarkTheme
                          ? 'border-slate-700 bg-slate-800 text-slate-300 hover:border-amber-400/50 hover:text-amber-300'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-amber-400 hover:text-amber-800'
                      }`}
                    >
                      <Icon className="w-3 h-3 text-amber-500" />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editable on screen */}
            <div className="print:hidden">
              <textarea
                rows={3}
                value={teacherNote}
                onChange={(e) => setTeacherNote(e.target.value)}
                placeholder="اكتب ملاحظة أو توصية خاصة بولي أمر هذا الطالب..."
                className={`w-full rounded-2xl border p-3.5 text-xs outline-none transition-colors ${
                  isDarkTheme
                    ? 'border-slate-800 bg-[#171b24] text-slate-100 placeholder:text-slate-500 focus:border-amber-400/50'
                    : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-amber-500/50'
                }`}
              />
            </div>

            {/* Printable static version of the note */}
            <div
              className={`hidden print:block text-xs p-4 rounded-2xl border leading-relaxed ${
                isDarkTheme ? 'border-slate-800 bg-[#171b24] text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-800'
              }`}
            >
              <p className="font-bold mb-1 text-amber-500">نص التوصية لولي الأمر:</p>
              <p>{teacherNote}</p>
            </div>
          </div>

          {/* ── Official Footer & Signatures ── */}
          <div
            className={`pt-6 border-t-2 flex items-center justify-between text-xs print-avoid-break ${
              isDarkTheme ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'
            }`}
          >
            <div className="space-y-1">
              <p className={`font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>توقيع مدرس المادة:</p>
              <p className="font-amira text-amber-500 text-base font-bold">منصة سند التعليمية</p>
            </div>

            <div className="text-center space-y-1">
              <div
                className={`h-14 w-32 border-2 border-dashed rounded-2xl flex items-center justify-center text-[10px] font-bold ${
                  isDarkTheme ? 'border-amber-500/40 text-amber-400 bg-amber-500/5' : 'border-amber-500/50 text-amber-800 bg-amber-50/50'
                }`}
              >
                خاتم المنصة المعتمد
              </div>
            </div>

            <div className="text-left space-y-1">
              <p className={`font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>إقرار استلام ولي الأمر:</p>
              <div className={`h-6 w-36 border-b-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-300'}`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardStudentReportsPage;
