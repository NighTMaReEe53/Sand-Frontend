import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  User,
  LogOut,
  BookOpen,
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  CalendarDays,
  Wallet,
  FileText,
  Radio,
  AlarmClock,
  Menu,
  ChevronDown,
  Users,
  Library,
  Eye,
  MessageCircle,
  FileCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { NotificationBell } from './NotificationBell';
import { useLogoutMutation } from '../../hooks/mutations/useAuthMutations';
import { useProfileQuery } from '../../hooks/queries/useProfile';
import { useMyBacklogQuery } from '../../hooks/queries/useBacklog';
import { useChallengeAvailabilityQuery } from '../../hooks/queries/useChallenges';
import { useMyMistakesQuery } from '../../hooks/queries/useExams';
import { Button } from '../ui/Button';
import { GlobalSearchBar } from './GlobalSearchBar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { NavSidebarDrawer } from './NavSidebarDrawer';
import { smoothScrollToTop } from './ScrollToTop';

const DropdownItem: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  badgeColor?: string;
  onNavigate: () => void;
}> = ({ to, icon, label, badge, badgeColor, onNavigate }) => (
  <Link
    to={to}
    onClick={() => { smoothScrollToTop(0.6); onNavigate(); }}
    className="group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-200 hover:bg-[var(--primary-soft)] hover:-translate-x-1"
    style={{ color: 'var(--ink)' }}
  >
    <div className="flex items-center gap-3">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary)' }}
      >
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </div>
    {badge !== undefined && (
      <span
        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
          badgeColor || 'bg-gold-500/15 text-gold-300 border-gold-500/30'
        }`}
      >
        {badge}
      </span>
    )}
  </Link>
);


export const Navbar: React.FC = () => {
  const { user, isAuthenticated, role } = useAuthStore();
  const isStudentAccount = isAuthenticated && user?.role === 'STUDENT';
  const canSearch =
    isAuthenticated && (user?.role === 'STUDENT' || user?.role === 'TEACHER' || user?.role === 'ADMIN');
  const { items, toggleCart } = useCartStore();
  const { mutate: logout, isPending: isLoggingOut } = useLogoutMutation();

  const hasSessionProfile = Boolean(user?.studentProfile?.fullName || user?.teacherProfile?.fullName);
  const { data: currentProfile } = useProfileQuery(isAuthenticated && !hasSessionProfile);
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Stable callbacks for opening/closing drawer
  const handleOpenDrawer = useCallback(() => {
    setSidebarDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSidebarDrawerOpen(false);
  }, []);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-close user dropdown on route change
  useEffect(() => {
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Click outside to close user dropdown
  useEffect(() => {
    if (!userDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [userDropdownOpen]);

  // Track scroll position for backdrop blur styling
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const displayName =
    currentProfile?.fullName || user?.studentProfile?.fullName || user?.teacherProfile?.fullName || 'حسابي';
  const displayPhoto =
    currentProfile?.photoUrl || user?.teacherProfile?.photoUrl || user?.studentProfile?.photoUrl || null;
  const displayRole = currentProfile?.role || role;

  // Cached requests (5 minutes) for notifications and drawer badges without repeated network traffic
  const { data: backlog } = useMyBacklogQuery(isAuthenticated && role === 'STUDENT');
  const backlogBadge = backlog?.totalItems ? (backlog.totalItems > 99 ? '99+' : backlog.totalItems) : undefined;
  const hasBacklog = Boolean(backlog && backlog.totalItems > 0);

  const { data: mistakesData } = useMyMistakesQuery(isAuthenticated && role === 'STUDENT');
  const hasMistakes = Boolean(mistakesData?.hasMistakes);

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        setUserDropdownOpen(false);
        navigate('/');
      },
    });
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? 'backdrop-blur-md shadow-sm shadow-black/5' : 'shadow-none'
      }`}
      style={{
        backgroundColor: scrolled
          ? 'color-mix(in srgb, var(--surface) 95%, transparent)'
          : 'var(--bg)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-18 lg:h-20 gap-1.5 sm:gap-4">
          {/* ════ 1. Right: Menu Drawer Button ════ */}
          <div className="flex items-center shrink-0 justify-start">
            <motion.button
              type="button"
              onClick={handleOpenDrawer}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl border transition-all duration-200 hover:border-[var(--primary)] hover:bg-[var(--surface-alt)] group cursor-pointer"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
                color: 'var(--ink)',
              }}
              title="القائمة الرئيسية وجميع صفحات المنصة"
              aria-label="فتح القائمة الرئيسية وجميع الصفحات"
            >
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-105 shrink-0"
                style={{
                  backgroundColor: 'var(--primary-soft)',
                  color: 'var(--primary)',
                }}
              >
                <Menu className="w-4 h-4" />
              </div>
              <span className="hidden sm:block text-xs font-bold" style={{ color: 'var(--ink)' }}>
                القائمة
              </span>
              {hasBacklog && (
                <span
                  className="w-2 h-2 rounded-full bg-red-500 animate-pulse"
                  title="لديك متأخرات دراسية"
                />
              )}
            </motion.button>
          </div>

          {/* ════ 2. Center: animated brand mark ════ */}
          <div className="flex-1 flex items-center justify-center min-w-0 px-1">
            <Link
              to="/"
              className="sanad-nav-brand group"
              title="الصفحة الرئيسية لمنصة سند"
              aria-label="الصفحة الرئيسية لمنصة سند التعليمية"
              onClick={() => smoothScrollToTop(0.6)}
            >
              <div className="sanad-brand-wrapper">
                {/* 1. Logo Mark: larger, stays on the right in RTL */}
                <div className="sanad-brand-logo">
                  <img
                    src="/image/logo.png"
                    alt="شعار منصة سند التعليمية"
                    className="w-full h-full object-contain drop-shadow-md select-none pointer-events-none"
                    draggable={false}
                  />
                </div>

                {/* 2. Brand Text: reveals to the left of the logo in RTL */}
                <div className="sanad-brand-text" aria-hidden="true">
                  <span className="sanad-brand-prefix">منصة</span>
                  <span className="sanad-brand-title">سند</span>
                </div>
              </div>
            </Link>
          </div>

          {/* ════ 3. Left: Search, Theme, Cart, Bell, Profile ════ */}
          <div className="flex items-center gap-1 sm:gap-2 justify-end shrink-0">
            {/* Global Search Bar */}
            {canSearch && <GlobalSearchBar shortcutEnabled />}

            {/* Theme Toggle (Dark / Light) */}
            <ThemeToggle className="h-8 w-8 sm:h-9 sm:w-9" />

            {/* Cart Button (students only) */}
            {isStudentAccount && (
              <button
                type="button"
                onClick={toggleCart}
                className="relative p-1.5 sm:p-2 rounded-xl border transition-all duration-200 hover:border-[var(--primary)] active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--line)',
                  color: 'var(--primary)',
                }}
                title="سلة الكورسات"
                aria-label="سلة الكورسات"
              >
                <ShoppingBag className="w-4 h-4" />
                {items.length > 0 && (
                  <span
                    className="absolute -top-1 -left-1 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: 'var(--primary)', color: 'var(--on-primary, #000)' }}
                  >
                    {items.length}
                  </span>
                )}
              </button>
            )}

            {/* Notifications Bell */}
            {isAuthenticated && <NotificationBell active={true} />}

            {/* Profile Dropdown or Auth Buttons */}
            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1 sm:gap-2 p-1 pl-1.5 sm:pl-2.5 pr-1 rounded-xl border transition-all duration-200 text-right group hover:border-[var(--primary)] cursor-pointer"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                  title="إعدادات وحساب المستخدم"
                  aria-label="فتح قائمة الحساب"
                >
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg p-0.5 flex-shrink-0"
                    style={{ backgroundColor: 'var(--primary-soft)' }}
                  >
                    <div
                      className="w-full h-full rounded-md flex items-center justify-center font-bold text-xs overflow-hidden"
                      style={{ backgroundColor: 'var(--surface)', color: 'var(--primary)' }}
                    >
                      {displayPhoto ? (
                        <img
                          src={displayPhoto}
                          alt={`صورة ${displayName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : displayName !== 'حسابي' ? (
                        displayName[0]
                      ) : (
                        <User className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>
                  <div className="leading-tight pr-1 hidden lg:block">
                    <span
                      className="block text-xs font-bold truncate max-w-[85px]"
                      style={{ color: 'var(--ink)' }}
                    >
                      {displayName}
                    </span>
                    <span className="block text-[9px] font-medium" style={{ color: 'var(--ink-muted)' }}>
                      {displayRole === 'TEACHER' ? 'مدرس' : displayRole === 'ADMIN' ? 'أدمن' : displayRole === 'PARENT' ? 'ولي أمر' : 'طالب'}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      userDropdownOpen ? 'rotate-180 text-[var(--primary)]' : ''
                    }`}
                    style={{ color: userDropdownOpen ? undefined : 'var(--ink-muted)' }}
                  />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute left-0 mt-2 w-60 sm:w-64 max-w-[calc(100vw-24px)] rounded-2xl border z-[60] text-right overflow-hidden shadow-md animate-auth-rise"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--line)',
                    }}
                  >
                    {/* Header */}
                    <div
                      className="flex items-center gap-3 px-4 py-3.5 border-b"
                      style={{
                        borderColor: 'var(--line)',
                        background:
                          'linear-gradient(135deg, color-mix(in srgb, var(--primary) 16%, transparent) 0%, transparent 70%)',
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full p-0.5 shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--gold-bright), var(--primary))' }}
                      >
                        <div
                          className="w-full h-full rounded-full flex items-center justify-center font-bold overflow-hidden text-xs"
                          style={{ backgroundColor: 'var(--surface)', color: 'var(--primary)' }}
                        >
                          {displayPhoto ? (
                            <img
                              src={displayPhoto}
                              alt={`صورة ${displayName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : displayName !== 'حسابي' ? (
                            displayName[0]
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate" style={{ color: 'var(--ink)' }}>
                          {displayName}
                        </p>
                        <span
                          className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold"
                          style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary)' }}
                        >
                          {displayRole === 'TEACHER' ? 'مدرس' : displayRole === 'ADMIN' ? 'أدمن' : displayRole === 'PARENT' ? 'ولي أمر' : 'طالب'}
                        </span>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="py-2 px-2 space-y-0.5 max-h-[320px] overflow-y-auto custom-scrollbar">
                      <DropdownItem
                        to="/profile"
                        icon={<User className="w-4 h-4" />}
                        label="الملف الشخصي"
                        onNavigate={() => setUserDropdownOpen(false)}
                      />

                      {role === 'STUDENT' && (
                        <>
                          <DropdownItem
                            to="/study-planner"
                            icon={<CalendarDays className="w-4 h-4" />}
                            label="المخطط الدراسي الذكي"
                            onNavigate={() => setUserDropdownOpen(false)}
                          />
                          <DropdownItem
                            to="/my-courses"
                            icon={<BookOpen className="w-4 h-4" />}
                            label="كورساتي واشتراكاتي"
                            onNavigate={() => setUserDropdownOpen(false)}
                          />
                          <DropdownItem
                            to="/my-materials"
                            icon={<Library className="w-4 h-4" />}
                            label="مكتبة ملفاتي"
                            onNavigate={() => setUserDropdownOpen(false)}
                          />
                          <DropdownItem
                            to="/live-lectures"
                            icon={<Radio className="w-4 h-4" />}
                            label="المحاضرات المباشرة"
                            onNavigate={() => setUserDropdownOpen(false)}
                          />
                          <DropdownItem
                            to="/my-backlog"
                            icon={<AlarmClock className="w-4 h-4 text-red-400" />}
                            label="متأخراتي"
                            badge={backlogBadge}
                            badgeColor="bg-red-500/20 text-red-400 border-red-500/30"
                            onNavigate={() => setUserDropdownOpen(false)}
                          />
                          <DropdownItem
                            to="/my-results"
                            icon={<FileText className="w-4 h-4" />}
                            label="نتائجي وشهاداتي"
                            onNavigate={() => setUserDropdownOpen(false)}
                          />
                          <DropdownItem
                            to="/my-performance"
                            icon={<TrendingUp className="w-4 h-4" />}
                            label="تحليل أدائي"
                            onNavigate={() => setUserDropdownOpen(false)}
                          />
                          <DropdownItem
                            to="/my-payments"
                            icon={<Wallet className="w-4 h-4" />}
                            label="مدفوعاتي"
                            onNavigate={() => setUserDropdownOpen(false)}
                          />
                        </>
                      )}

                      {role === 'TEACHER' && (
                        <>
                          <DropdownItem
                            to="/dashboard"
                            icon={<LayoutDashboard className="w-4 h-4" />}
                            label="لوحة التحكم للمدرس"
                            onNavigate={() => setUserDropdownOpen(false)}
                          />
                          <DropdownItem
                            to="/dashboard/students/monitor"
                            icon={<Eye className="w-4 h-4" />}
                            label="متابعة الطلاب"
                            onNavigate={() => setUserDropdownOpen(false)}
                          />
                          <DropdownItem
                            to="/dashboard/qa-inbox"
                            icon={<MessageCircle className="w-4 h-4" />}
                            label="أسئلة الطلاب"
                            onNavigate={() => setUserDropdownOpen(false)}
                          />
                          <DropdownItem
                            to="/dashboard/summaries-moderation"
                            icon={<FileCheck className="w-4 h-4" />}
                            label="مراجعة الملخصات"
                            onNavigate={() => setUserDropdownOpen(false)}
                          />
                        </>
                      )}

                      {role === 'ADMIN' && (
                        <DropdownItem
                          to="/dashboard"
                          icon={<ShieldCheck className="w-4 h-4" />}
                          label="لوحة تحكم الأدمن"
                          onNavigate={() => setUserDropdownOpen(false)}
                        />
                      )}

                      {role === 'PARENT' && (
                        <DropdownItem
                          to="/parent"
                          icon={<Users className="w-4 h-4" />}
                          label="متابعة أبنائي"
                          onNavigate={() => setUserDropdownOpen(false)}
                        />
                      )}
                    </div>

                    {/* Logout */}
                    <div className="border-t p-2" style={{ borderColor: 'var(--line)' }}>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-right font-medium transition-all duration-200 hover:bg-red-500/10 disabled:opacity-60 group cursor-pointer"
                        style={{ color: 'var(--error)' }}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10 transition-transform duration-200 group-hover:scale-110">
                          <LogOut className={`w-3.5 h-3.5 ${isLoggingOut ? 'animate-spin' : ''}`} />
                        </span>
                        <span>{isLoggingOut ? 'جاري تسجيل الخروج…' : 'تسجيل الخروج'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link to="/auth/login" onClick={() => smoothScrollToTop(0.6)}>
                  <Button variant="outline" size="sm" className="text-xs py-1 sm:py-1.5 px-2.5 sm:px-3 rounded-md">
                    دخول
                  </Button>
                </Link>
                <Link to="/auth/register" onClick={() => smoothScrollToTop(0.6)} className="hidden sm:inline-block">
                  <Button variant="primary" size="sm" className="text-xs py-1 sm:py-1.5 px-2.5 sm:px-3 rounded-md">
                    حساب جديد
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide-out Sidebar Drawer containing ALL platform pages */}
      <NavSidebarDrawer
        isOpen={sidebarDrawerOpen}
        onClose={handleCloseDrawer}
        hasBacklog={hasBacklog}
        backlogCount={backlogBadge}
        hasMistakes={hasMistakes}
      />
    </header>
  );
};
