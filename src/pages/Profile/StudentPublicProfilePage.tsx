import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  User,
  BookOpen,
  FileText,
  CheckCircle2,
  BarChart3,
  Award,
  Calendar,
  GraduationCap,
  Trophy,
  Sparkles,
  ArrowRight,
  Play,
} from 'lucide-react';
import { studentPublicApi, StudentPublicProfile } from '../../api/students.api';
import { SkeletonStudentPublicProfile } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { formatDate, formatGradeLevel } from '../../lib/utils';

const achievementIcons: Record<string, React.ReactNode> = {
  'أول كورس': <BookOpen className="w-3.5 h-3.5" />,
  'متعلم نشيط': <Sparkles className="w-3.5 h-3.5" />,
  'طالب متميز': <Trophy className="w-3.5 h-3.5" />,
  'أول امتحان ناجح': <CheckCircle2 className="w-3.5 h-3.5" />,
  'متفوق في الامتحانات': <Award className="w-3.5 h-3.5" />,
  'نجم الامتحانات': <Trophy className="w-3.5 h-3.5" />,
  'متفوق': <Sparkles className="w-3.5 h-3.5" />,
  'منجز الكويزات': <CheckCircle2 className="w-3.5 h-3.5" />,
};

const achievementColors: Record<string, string> = {
  'أول كورس': 'bg-violet-500/15 text-violet-300 border-violet-400/20',
  'متعلم نشيط': 'bg-sky-500/15 text-sky-300 border-sky-400/20',
  'طالب متميز': 'bg-gold-500/15 text-gold-300 border-gold-400/20',
  'أول امتحان ناجح': 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20',
  'متفوق في الامتحانات': 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20',
  'نجم الامتحانات': 'bg-gold-500/15 text-gold-300 border-gold-400/20',
  'متفوق': 'bg-violet-500/15 text-violet-300 border-violet-400/20',
  'منجز الكويزات': 'bg-sky-500/15 text-sky-300 border-sky-400/20',
};

export const StudentPublicProfilePage: React.FC = () => {
  const { profileId } = useParams<{ profileId: string }>();

  const { data: profile, isLoading, isError } = useQuery<StudentPublicProfile>({
    queryKey: ['student-public-profile', profileId],
    queryFn: () => studentPublicApi.getPublicProfile(profileId!),
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return <SkeletonStudentPublicProfile />;
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-surface-card border border-surface-border flex items-center justify-center mx-auto">
            <User className="w-10 h-10 text-ivory-muted" />
          </div>
          <h2 className="text-xl font-bold text-ivory">الطالب غير موجود</h2>
          <p className="text-ivory-muted text-sm">لم نتمكن من العثور على هذا الملف الشخصي.</p>
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors">
            <ArrowRight className="w-4 h-4" />
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'الكورسات', value: profile.stats.enrolledCourses, Icon: BookOpen, color: 'text-violet-300', bg: 'bg-violet-500/10' },
    { label: 'محاولات الامتحانات', value: profile.stats.totalExamAttempts, Icon: FileText, color: 'text-sky-300', bg: 'bg-sky-500/10' },
    { label: 'امتحانات ناجحة', value: profile.stats.passedExams, Icon: CheckCircle2, color: 'text-emerald-300', bg: 'bg-emerald-500/10' },
    { label: 'متوسط الأداء', value: `${profile.stats.avgScore}%`, Icon: BarChart3, color: 'text-gold-300', bg: 'bg-gold-500/10' },
    { label: 'محاولات الكويزات', value: profile.stats.totalQuizAttempts, Icon: FileText, color: 'text-sky-300', bg: 'bg-sky-500/10' },
    { label: 'كويزات ناجحة', value: profile.stats.passedQuizzes, Icon: CheckCircle2, color: 'text-emerald-300', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="min-h-screen py-10 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Hero Card ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-surface-border bg-gradient-to-br from-surface-card via-surface-card to-violet-500/5 p-8 shadow-sm"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(139,92,246,0.15) 0%, transparent 50%)',
          }} />

          <div className="relative flex items-center gap-6 flex-wrap">
            {/* Avatar */}
            <div className="relative shrink-0">
              {profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt={profile.fullName}
                  draggable={false}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-violet-400/30 shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500/20 to-sky-500/20 border-2 border-violet-400/30 flex items-center justify-center shadow-sm">
                  <User className="w-12 h-12 text-violet-300" />
                </div>
              )}
              {profile.achievements.length > 0 && (
                <span className="absolute -bottom-2 -left-2 w-7 h-7 rounded-full bg-gold-400 flex items-center justify-center shadow-sm">
                  <Trophy className="w-3.5 h-3.5 text-surface-bg" />
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <h1 className="text-2xl font-black text-ivory truncate">{profile.fullName}</h1>
              <div className="flex items-center flex-wrap gap-3 text-sm text-ivory-muted">
                {profile.gradeLevel && (
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-violet-300" />
                    {formatGradeLevel(profile.gradeLevel)}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-sky-300" />
                  انضم {formatDate(profile.memberSince)}
                </span>
              </div>

              {/* Achievements badges */}
              {profile.achievements.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {profile.achievements.map((ach) => (
                    <span
                      key={ach}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-semibold ${achievementColors[ach] ?? 'bg-surface-card text-ivory-muted border-surface-border'}`}
                    >
                      {achievementIcons[ach]}
                      {ach}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Stats Grid ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 * i }}
              className="rounded-2xl border border-surface-border bg-surface-card p-4 flex items-center gap-3 shadow-sm hover:border-violet-500/30 transition-colors"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg} ${s.color}`}>
                <s.Icon className="w-5 h-5" />
              </span>
              <div className="leading-tight min-w-0">
                <p className="text-xl font-black font-display tabular-nums">{s.value}</p>
                <p className="text-[11px] text-ivory-muted truncate">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Enrolled Courses ────────────────────────────────── */}
        {profile.enrolledCourses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-violet-300" />
              </div>
              <h2 className="font-black text-lg text-ivory">الكورسات المشترك فيها</h2>
              <Badge variant="neutral" size="sm">{profile.enrolledCourses.length}</Badge>
            </div>

            <div className="grid gap-3">
              {profile.enrolledCourses.map((c, i) => (
                <motion.div
                  key={c.courseId}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-surface-border hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group"
                >
                  {c.thumbnailUrl ? (
                    <img src={c.thumbnailUrl} alt={c.title} draggable={false} className="w-12 h-12 rounded-xl object-cover border border-surface-border shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-surface-bg border border-surface-border flex items-center justify-center shrink-0">
                      <BookOpen className="w-6 h-6 text-ivory-muted" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-ivory truncate group-hover:text-violet-300 transition-colors">{c.title}</p>
                    {c.subject && <p className="text-xs text-ivory-muted">{c.subject}</p>}
                    {c.teacher && <p className="text-[11px] text-ivory-muted">بواسطة {c.teacher.fullName}</p>}
                  </div>
                  <Link
                    to={`/courses/${c.courseId}`}
                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border border-surface-border hover:border-violet-400 hover:bg-violet-500/10 text-ivory-muted hover:text-violet-300 transition-all"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {profile.enrolledCourses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-dashed border-surface-border bg-surface-card/50 p-10 text-center shadow-sm"
          >
            <BookOpen className="w-10 h-10 text-ivory-muted mx-auto mb-3 opacity-50" />
            <p className="text-ivory-muted text-sm">لم ينضم بعد لأي كورس.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StudentPublicProfilePage;
