import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  X,
  Home,
  BookOpen,
  Layers,
  ClipboardList,
  Award,
  FileQuestion,
  Sparkles,
  AlarmClock,
  Calendar,
  FileText,
  BookCheck,
  HelpCircle,
  Swords,
  Trophy,
  ShoppingBag,
  MoonStar,
  User,
  Wallet,
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  GraduationCap,
  ShieldCheck,
  LogIn,
  UserPlus,
  Radio,
  Search,
  Users,
  Eye,
  MessageCircle,
  FileCheck,
  Info,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLogoutMutation } from '../../hooks/mutations/useAuthMutations';
import { formatGradeLevel } from '../../lib/utils';
import { smoothScrollToTop } from './ScrollToTop';
import { ThemeToggle } from '../ui/ThemeToggle';

interface NavSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  hasBacklog?: boolean;
  backlogCount?: number | string;
  hasMistakes?: boolean;
}

interface DrawerLinkItem {
  to: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
  highlight?: boolean;
  roles?: ('STUDENT' | 'TEACHER' | 'ADMIN' | 'PARENT')[];
  guestVisible?: boolean;
}

interface DrawerSection {
  title: string;
  items: DrawerLinkItem[];
  roles?: ('STUDENT' | 'TEACHER' | 'ADMIN' | 'PARENT')[];
  guestVisible?: boolean;
}

export const NavSidebarDrawer: React.FC<NavSidebarDrawerProps> = ({
  isOpen,
  onClose,
  hasBacklog = false,
  backlogCount,
  hasMistakes = false,
}) => {
  const { user, isAuthenticated, role } = useAuthStore();
  const { mutate: logout, isPending: isLoggingOut } = useLogoutMutation();
  const location = useLocation();
  const [searchFilter, setSearchFilter] = useState('');

  const isStudent = role === 'STUDENT';
  const isTeacher = role === 'TEACHER';
  const isAdmin = role === 'ADMIN';

  const displayName =
    user?.studentProfile?.fullName ||
    user?.teacherProfile?.fullName ||
    user?.email?.split('@')[0] ||
    'زائر';
  const displayPhoto =
    user?.studentProfile?.photoUrl || user?.teacherProfile?.photoUrl || null;
  const gradeLevel = user?.studentProfile?.gradeLevel;

  // Track route changes so drawer closes ONLY when navigating to a new path
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      if (isOpen) {
        onClose();
      }
    }
  }, [location.pathname, isOpen, onClose]);

  // Handle ESC key and scroll locking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      setSearchFilter('');
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Comprehensive sections covering ALL platform pages
  const sections: DrawerSection[] = useMemo(() => [
    {
      title: 'القسم التعليمي والمحاضرات',
      guestVisible: true,
      items: [
        { to: '/', label: 'الرئيسية', description: 'الصفحة الرئيسية للمنصة', icon: Home, guestVisible: true },
        { to: '/courses', label: 'تصفح كل الكورسات', description: 'استكشف المناهج والمحاضرات المتاحة', icon: Layers, guestVisible: true },
        ...(isAuthenticated && isStudent
          ? [
              { to: '/my-courses', label: 'كورساتي واشتراكاتي', description: 'الكورسات المفعلة بحسابك', icon: BookOpen },
              { to: '/live-lectures', label: 'المحاضرات المباشرة (Live)', description: 'البث المباشر واللقاءات التفاعلية', icon: Radio },
              { to: '/my-materials', label: 'مكتبة مذكراتي وملفاتي', description: 'ملفات الـ PDF والمذكرات الدراسية', icon: BookCheck },
            ]
          : []),
      ],
    },
    {
      title: 'المذاكرة والتحصيل والتقييم',
      roles: ['STUDENT'],
      items: [
        {
          to: '/my-mistakes',
          label: 'تدرب على أخطائك (بنك الأخطاء)',
          description: 'امتحانات تدريبية ذكية من الأسئلة التي أخطأت فيها',
          icon: Sparkles,
          highlight: true,
          badge: hasMistakes ? 'تدريب ذكي' : undefined,
          badgeColor: 'bg-gold-500/20 text-gold-400 border border-gold-500/40',
        },
        {
          to: '/my-homeworks',
          label: 'واجباتي وتسليماتي',
          description: 'سجل حل الواجبات وتقييمات المعلم',
          icon: Award,
        },
        {
          to: '/my-results',
          label: 'امتحاناتي وشهاداتي',
          description: 'سجل درجات الاختبارات والكويزات والشهادات',
          icon: ClipboardList,
        },
        {
          to: '/my-performance',
          label: 'تحليلات الأداء والإحصائيات',
          description: 'رسوم بيانية ومستوى تقدمك ومعدلات الحضور',
          icon: BarChart3,
        },
        ...(hasBacklog
          ? [
              {
                to: '/my-backlog',
                label: 'المتأخرات الدراسية',
                description: 'الدروس والواجبات المتبقية لإنجازها',
                icon: AlarmClock,
                badge: backlogCount ?? 'متأخر',
                badgeColor: 'bg-red-500 text-white shadow-sm',
              },
            ]
          : []),
        {
          to: '/my-mistakes',
          label: 'بنك التدريب وأخطائي',
          description: 'تدريبات ذكية من الأسئلة التي تحتاج مراجعتها',
          icon: FileQuestion,
        },
        {
          to: '/study-planner',
          label: 'المخطط الدراسي الذكي',
          description: 'تنظيم جدول المذاكرة الأسبوعي وإدارة الوقت',
          icon: Calendar,
        },
        {
          to: '/summaries',
          label: 'ملخصات المواد والكورسات',
          description: 'أفضل ملخصات الدروس ومشاركات المتفوقين',
          icon: FileText,
        },
        {
          to: '/qa',
          label: 'منتدى الأسئلة والأجوبة (Q&A)',
          description: 'اطرح أسئلتك وتناقش مع المعلم وزملائك',
          icon: HelpCircle,
        },
      ],
    },
    {
      title: 'التنافس والتحفيز والروحانيات',
      guestVisible: true,
      items: [
        ...(isAuthenticated && isStudent
          ? [
              { to: '/challenges', label: 'التحديات والمواجهات التنافسية', description: 'تحديات سريعة ومبارزات علمية ضد زملائك', icon: Swords },
              { to: '/exam-rankings', label: 'ترتيب الطلاب والمتصدرين', description: 'أوائل الامتحانات ولوحات الشرف', icon: Trophy },
              { to: '/shop/avatars', label: 'متجر الأفاتار والإطارات', description: 'استبدل عملات المذاكرة بإطارات وشخصيات مميزة', icon: ShoppingBag },
            ]
          : []),
        { to: '/adhkar', label: 'أذكار وأدعية المسلم', description: 'حصن المسلم وأدعية المذاكرة وتيسير الفهم', icon: MoonStar, guestVisible: true },
      ],
    },
    {
      title: 'الحساب والمنصة',
      items: [
        ...(isAuthenticated
          ? [
              { to: '/profile', label: 'ملفي الشخصي وإحصائياتي', description: 'بيانات الحساب وتفاصيل الأداء', icon: User },
              ...(isStudent
                ? [{ to: '/my-payments', label: 'سجل الاشتراكات والمدفوعات', description: 'إيصالات السداد وحالة التفعيل', icon: Wallet }]
                : []),
              ...(isTeacher || isAdmin
                ? [
                    { to: '/dashboard', label: 'لوحة التحكم والإدارة', description: 'إدارة الكورسات والطلاب والامتحانات', icon: LayoutDashboard, highlight: true },
                    { to: '/dashboard/analytics', label: 'تحليلات المنصة والطلاب', description: 'إحصائيات تفصيلية ومعدلات الإكمال', icon: BarChart3 },
                    { to: '/dashboard/students/monitor', label: 'متابعة الطلاب', description: 'مراقبة حضور ونشاط الطلاب', icon: Eye },
                    { to: '/dashboard/qa-inbox', label: 'صندوق أسئلة الطلاب', description: 'الإجابة على استفسارات الطلاب', icon: MessageCircle },
                    { to: '/dashboard/summaries-moderation', label: 'مراجعة واعتماد الملخصات', description: 'فحص ملخصات الطلاب والموافقة عليها', icon: FileCheck },
                  ]
                : []),
              ...(role === 'PARENT'
                ? [{ to: '/parent', label: 'متابعة أبنائي', description: 'تقارير حضور ودرجات الأبناء', icon: Users }]
                : []),
            ]
          : [
              { to: '/auth/login', label: 'تسجيل الدخول', description: 'ادخل لحسابك لحفظ تقدمك', icon: LogIn, guestVisible: true },
              { to: '/auth/register', label: 'إنشاء حساب جديد', description: 'انضم لمنصة سند التعليمية', icon: UserPlus, guestVisible: true },
            ]),
        { to: '/about', label: 'عن منصة سند', description: 'رؤيتنا ورسالتنا وفريق العمل', icon: Info, guestVisible: true },
      ],
    },
  ], [isAuthenticated, isStudent, isTeacher, isAdmin, role, hasMistakes, hasBacklog, backlogCount]);

  // Filter sections and items based on search query and roles
  const filteredSections = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    return sections
      .map((sec) => {
        // Role gate check for whole section
        if (sec.roles && !sec.roles.includes(role as any)) return null;
        if (!isAuthenticated && !sec.guestVisible) return null;

        const visibleItems = sec.items.filter((item) => {
          if (item.roles && !item.roles.includes(role as any)) return false;
          if (!isAuthenticated && !item.guestVisible) return false;
          if (!query) return true;
          return (
            item.label.toLowerCase().includes(query) ||
            (item.description && item.description.toLowerCase().includes(query))
          );
        });

        if (!visibleItems.length) return null;
        return { ...sec, items: visibleItems };
      })
      .filter((s): s is DrawerSection => s !== null);
  }, [sections, role, isAuthenticated, searchFilter]);

  // Elegant, smooth slide entrance animation without dizzying shake/rotation
  const drawerVariants: Variants = {
    hidden: {
      x: '100%',
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.22,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: {
      x: '100%',
      opacity: 0,
      transition: { duration: 0.22, ease: 'easeInOut' },
    },
  };

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden" dir="rtl">
          {/* Backdrop with smooth fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Body - Anchored solidly to the physical RIGHT edge */}
          <motion.aside
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-y-0 right-0 z-[10000] flex h-full w-full max-w-sm sm:max-w-md flex-col border-l shadow-md overflow-hidden"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
          >
            {/* Header: Platform Identity & Close Button */}
            <div
              className="relative flex items-center justify-between border-b px-4 py-3 shrink-0 overflow-hidden"
              style={{
                borderColor: 'var(--line)',
                backgroundColor: 'var(--surface)',
              }}
            >
              {/* Subtle top accent bar */}
              <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-l from-transparent via-[var(--primary)] to-transparent opacity-60" />

              <div className="flex items-center gap-2.5 min-w-0">
                {/* Logo chip */}
                <div
                  className="w-10 h-10 rounded-xl border-2 p-1 flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'var(--surface-alt)',
                    borderColor: 'color-mix(in srgb, var(--primary) 35%, transparent)',
                  }}
                >
                  <img src="/image/logo.png" alt="شعار سند" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <h2
                    className="text-sm font-bold leading-tight tracking-tight"
                    style={{ color: 'var(--ink)' }}
                  >
                    منصة سند التعليمية
                  </h2>
                  <p className="text-[10px] truncate" style={{ color: 'var(--ink-muted)' }}>
                    دليلك الشامل لجميع صفحات المنصة
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all active:scale-95 hover:bg-[var(--surface-alt)] cursor-pointer shrink-0"
                style={{
                  borderColor: 'var(--line)',
                  color: 'var(--ink-muted)',
                }}
                aria-label="إغلاق القائمة"
                title="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Search within Drawer */}
            <div className="p-3 border-b shrink-0" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)' }}>
              <div className="relative">
                <Search
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'var(--ink-muted)' }}
                />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="ابحث عن أي صفحة أو أداة…"
                  className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border outline-none transition-all placeholder:text-[var(--ink-muted)] focus:border-[var(--primary)]"
                  style={{
                    backgroundColor: 'var(--surface-alt)',
                    borderColor: 'var(--line)',
                    color: 'var(--ink)',
                  }}
                />
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchFilter('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded-md text-ink-muted hover:text-ink cursor-pointer"
                  >
                    مسح
                  </button>
                )}
              </div>
            </div>

            {/* User Profile Glance Card */}
            <div
              className="p-3.5 border-b shrink-0"
              style={{
                borderColor: 'var(--line)',
                backgroundColor: 'var(--surface)',
              }}
            >
              {isAuthenticated && user ? (
                <Link
                  to="/profile"
                  onClick={() => { smoothScrollToTop(0.6); onClose(); }}
                  className="group flex items-center gap-3 p-2.5 rounded-xl border transition-all hover:border-[var(--primary)]/60"
                  style={{
                    backgroundColor: 'var(--surface-alt)',
                    borderColor: 'var(--line)',
                  }}
                >
                  <div
                    className="relative shrink-0 w-10 h-10 rounded-xl border-2 overflow-hidden flex items-center justify-center font-bold text-sm"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'color-mix(in srgb, var(--primary) 40%, transparent)',
                      color: 'var(--primary)',
                    }}
                  >
                    {displayPhoto ? (
                      <img src={displayPhoto} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      displayName[0] || <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold truncate group-hover:text-[var(--primary)] transition-colors" style={{ color: 'var(--ink)' }}>
                        {displayName}
                      </p>
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: 'var(--primary-soft)',
                          borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
                          color: 'var(--primary)',
                        }}
                      >
                        {isTeacher ? 'مدرس' : isAdmin ? 'أدمن' : 'طالب'}
                      </span>
                    </div>
                    {isStudent && gradeLevel ? (
                      <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--ink-muted)' }}>
                        <GraduationCap className="w-3.5 h-3.5 text-[var(--primary)]" />
                        <span>{formatGradeLevel(gradeLevel)}</span>
                      </p>
                    ) : (
                      <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--ink-muted)' }}>{user.email}</p>
                    )}
                  </div>
                  <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 shrink-0" style={{ color: 'var(--ink-muted)' }} />
                </Link>
              ) : (
                /* Guest card: two distinct-colored buttons */
                <div
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--surface-alt)',
                    borderColor: 'var(--line)',
                  }}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>مرحباً بك في منصة سند</p>
                    <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>سجل دخولك لمتابعة دروسك</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Primary = gold/brand */}
                    <Link
                      to="/login"
                      onClick={() => { smoothScrollToTop(0.6); onClose(); }}
                      className="px-3 py-1.5 rounded-md text-xs font-bold transition-all hover:brightness-110 active:scale-95"
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--on-primary)',
                      }}
                    >
                      دخول
                    </Link>
                    {/* Accent = teal — clearly different */}
                    <Link
                      to="/register"
                      onClick={() => { smoothScrollToTop(0.6); onClose(); }}
                      className="px-3 py-1.5 rounded-md text-xs font-bold transition-all hover:brightness-110 active:scale-95"
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: 'white',
                      }}
                    >
                      تسجيل
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Sections list */}
            <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4 custom-scrollbar">
              {filteredSections.map((sec, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  {/* Section header with line divider */}
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <span
                      className="h-px flex-1"
                      style={{ backgroundColor: 'var(--line)' }}
                    />
                    <h3
                      className="text-[10px] font-bold uppercase tracking-widest shrink-0"
                      style={{ color: 'var(--primary)' }}
                    >
                      {sec.title}
                    </h3>
                    <span
                      className="h-px flex-1"
                      style={{ backgroundColor: 'var(--line)' }}
                    />
                  </div>

                  <div className="space-y-0.5">
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.to;

                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => { smoothScrollToTop(0.6); onClose(); }}
                          className={`group flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl text-xs transition-all border ${
                            isActive
                              ? 'shadow-sm font-bold'
                              : 'border-transparent hover:bg-[var(--surface-alt)] hover:border-[var(--line)]'
                          }`}
                          style={{
                            backgroundColor: isActive
                              ? 'var(--primary-soft)'
                              : 'transparent',
                            borderColor: isActive
                              ? 'color-mix(in srgb, var(--primary) 35%, transparent)'
                              : undefined,
                            color: isActive ? 'var(--primary)' : 'var(--ink)',
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors shrink-0"
                              style={{
                                backgroundColor: isActive
                                  ? 'var(--primary)'
                                  : 'var(--surface-alt)',
                                color: isActive
                                  ? 'var(--on-primary, #000)'
                                  : 'var(--ink-muted)',
                              }}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <div className="min-w-0">
                              <span className="block font-bold truncate leading-tight">
                                {item.label}
                              </span>
                              {item.description && (
                                <span
                                  className="block text-[10px] font-normal truncate leading-tight mt-0.5"
                                  style={{ color: 'var(--ink-muted)' }}
                                >
                                  {item.description}
                                </span>
                              )}
                            </div>
                          </div>

                          {item.badge !== undefined && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                                item.badgeColor || ''
                              }`}
                              style={
                                !item.badgeColor
                                  ? {
                                      backgroundColor: 'var(--primary-soft)',
                                      color: 'var(--primary)',
                                      borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
                                    }
                                  : undefined
                              }
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredSections.length === 0 && (
                <div className="py-12 text-center text-xs" style={{ color: 'var(--ink-muted)' }}>
                  لم نجد أي صفحات مطابقة لكلمة البحث "{searchFilter}"
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div
              className="p-3 border-t flex items-center justify-between gap-3 shrink-0"
              style={{
                borderColor: 'var(--line)',
                backgroundColor: 'var(--surface)',
              }}
            >
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <span className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
                  المظهر (داكن / فاتح)
                </span>
              </div>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  disabled={isLoggingOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-60 shadow-sm"
                  style={{
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--error, #ef4444)',
                  }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isLoggingOut ? 'خروج…' : 'تسجيل خروج'}</span>
                </button>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(drawerContent, document.body);
};
