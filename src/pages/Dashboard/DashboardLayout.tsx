import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  FileQuestion,
  LogOut,
  Home,
  ShieldAlert,
  Database,
  BarChart3,
  ShieldCheck,
  Search as SearchIcon,
  UserPlus,
  Radio,
  PanelLeftClose,
  Menu,
  X,
  Eye,
  Users,
  FileUp,
  BookOpenCheck,
  Gem,
  Frame,
  MessageCircle,
  Clock,
  FileSpreadsheet,
  ListTodo,
  Moon,
  Sun,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useLogoutMutation } from "../../hooks/mutations/useAuthMutations";
import { useTheme } from "../../contexts/ThemeProvider";

const YELLOW = "var(--color-gold-400, #ffc107)";

export const DashboardLayout: React.FC = () => {
  const { role } = useAuthStore();
  const { mutate: logout } = useLogoutMutation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // collapsible mini-sidebar (desktop), persisted across visits
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("dashboard-sidebar-collapsed") === "1"
  );
  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem("dashboard-sidebar-collapsed", prev ? "0" : "1");
      return !prev;
    });
  };

  // mobile slide-in drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = () => setDrawerOpen(false);

  // sidebar nav scroll progress (0..1)
  const navRef = useRef<HTMLElement>(null);
  const [navProgress, setNavProgress] = useState(0);
  const handleNavScroll = () => {
    const el = navRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setNavProgress(max > 4 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0);
  };

  // lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // close the drawer with Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (role !== "TEACHER" && role !== "ADMIN") {
    return (
      <div className="relative min-h-screen overflow-hidden p-4">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[36rem] -translate-x-1/2 rounded-full opacity-10 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--primary), transparent 70%)",
          }}
        />
        <div className="relative mx-auto mt-24 max-w-md space-y-4 rounded-3xl border border-red-500/30 bg-surface-card p-8 text-center shadow-card">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10">
            <ShieldAlert className="h-8 w-8 text-red-400" />
          </span>
          <h2
            className="text-xl font-bold font-amiri"
            style={{ color: "var(--primary)" }}
          >
            غير مصرح بالدخول
          </h2>
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
            لوحة إدارة سند — كل أدوات المنصة في مكان واحد.
          </p>
          <Link
            to="/"
            className="inline-block rounded-lg border px-4 py-2 text-xs transition-colors hover:bg-[var(--primary-soft)]"
            style={{ borderColor: "var(--line)", color: "var(--primary)" }}
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const links = [
    {
      group: "عام",
      items: [
        {
          to: "/dashboard/overview",
          label: "نظرة عامة",
          icon: LayoutDashboard,
        },
        {
          to: "/dashboard/tasks",
          label: "مركز المهام",
          icon: ListTodo,
        },
        {
          to: "/dashboard/analytics",
          label: "تحليلات الأداء",
          icon: BarChart3,
        },
        {
          to: "/dashboard/live-lectures",
          label: "المحاضرات المباشرة",
          icon: Radio,
        },
      ],
    },
    {
      group: "المحتوى والامتحانات",
      items: [
        { to: "/dashboard/courses", label: "إدارة الكورسات", icon: BookOpen },
        { to: "/dashboard/materials", label: "مكتبة الملفات", icon: FileUp },
        {
          to: "/dashboard/exams",
          label: "الامتحانات والأسئلة",
          icon: FileQuestion,
        },
        {
          to: "/dashboard/homeworks",
          label: "تسليمات الواجبات",
          icon: BookOpenCheck,
        },
        {
          to: "/dashboard/question-bank",
          label: "بنك الأسئلة المركزي",
          icon: Database,
        },
        {
          to: "/dashboard/qa-inbox",
          label: "صندوق أسئلة الطلاب",
          icon: MessageCircle,
        },
        {
          to: "/dashboard/summaries-moderation",
          label: "إدارة الملخصات",
          icon: FileUp,
        },
      ],
    },
    {
      group: "الطلاب والمتابعة والتقارير",
      items: [
        {
          to: "/dashboard/students/monitor",
          label: "متابعة الطلاب",
          icon: Eye,
        },
        {
          to: "/dashboard/students/backlog",
          label: "متأخرات الطلاب",
          icon: Clock,
        },
        {
          to: "/dashboard/students/reports",
          label: "التقارير الفورية (أولياء الأمور)",
          icon: FileSpreadsheet,
        },
        {
          to: "/dashboard/students/search",
          label: "البحث عن طالب",
          icon: SearchIcon,
        },
        { to: "/dashboard/students/add", label: "إضافة طالب", icon: UserPlus },
        {
          to: "/dashboard/payments",
          label: "مراجعة المدفوعات",
          icon: CreditCard,
        },
      ],
    },
    ...(role === "ADMIN"
      ? [
          {
            group: "النظام",
            items: [
              {
                to: "/dashboard/teachers",
                label: "إدارة المعلمين",
                icon: Users,
              },
              { to: "/dashboard/avatars", label: "إدارة الأفاتار", icon: Gem },
              { to: "/dashboard/frames", label: "إدارة الإطارات", icon: Frame },
              {
                to: "/dashboard/audit-logs",
                label: "سجل العمليات الحساسة",
                icon: ShieldCheck,
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="relative min-h-screen text-right print:min-h-0 print:p-0">
      {/* ─── ambient background (calm, subtle) ──────────────────── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 print:hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 35% at 100% 0%, rgba(201,161,90,0.03), transparent 70%), linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.08))",
          }}
        />
      </div>

      {/* ─── mobile menu FAB ────────────────────────────────────── */}
      <button
        onClick={() => setDrawerOpen((v) => !v)}
        title={drawerOpen ? "إغلاق القائمة" : "فتح القائمة"}
        aria-label={drawerOpen ? "إغلاق القائمة" : "فتح القائمة"}
        className="fixed left-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-2xl border border-surface-border bg-surface-card text-ink shadow-card transition-all duration-300 active:scale-95 md:hidden cursor-pointer print:hidden"
      >
        <span
          className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-surface-card bg-gold-400"
        />
        {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* ─── mobile drawer backdrop ─────────────────────────────── */}
      <div
        aria-hidden
        onClick={closeDrawer}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden print:hidden ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div className="relative flex flex-col md:flex-row print:block">
        {/* ─── Sidebar (mobile: slide-in drawer · desktop: sticky panel) ── */}
        <aside
          data-lenis-prevent
          className={`fixed inset-y-0 right-0 z-50 w-72 max-w-[84vw] border-l border-surface-border bg-surface-card p-5 transition-all duration-300 ease-out md:sticky md:top-0 md:z-20 md:h-screen md:translate-x-0 md:border-l-0 lg:m-5 lg:rounded-[1.75rem] lg:border lg:shadow-card backdrop-blur-xl print:hidden ${
            collapsed ? "md:w-[88px] md:px-3" : "md:w-72 md:p-6"
          } ${drawerOpen ? "max-md:translate-x-0" : "max-md:translate-x-full"}`}
        >
          {/* subtle decorative ambient glows */}
          <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-gold-500/[0.03] blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-sky-500/[0.02] blur-2xl" />

          <div className="relative flex h-full flex-col">
            {/* brand — fixed at top */}
            <div
              className={`relative flex shrink-0 items-center gap-3 pb-4 border-b border-surface-border/70 ${
                collapsed ? "md:justify-center md:gap-0" : ""
              }`}
            >
              <Link
                to="/"
                title="العودة للموقع"
                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-surface-border bg-surface-alt p-1.5 shadow-sm transition-transform duration-300 hover:scale-105"
              >
                <img
                  src="/image/logo.png"
                  alt="شعار المنصة"
                  className="h-full w-full object-contain"
                />
              </Link>
              <div
                className={`min-w-0 flex-1 ${
                  collapsed ? "max-md:block md:hidden" : "block"
                }`}
              >
                <span className="block truncate text-base font-black text-ink font-amira">
                  لوحة التحكم
                </span>
                <span className="block truncate text-[11px] font-bold text-ink-muted">
                  سند — إدارة المنصة
                </span>
              </div>
              {/* desktop-only collapse toggle */}
              <button
                onClick={toggleCollapsed}
                title={collapsed ? "توسيع القائمة" : "تصغير القائمة"}
                aria-label={collapsed ? "توسيع القائمة" : "تصغير القائمة"}
                aria-expanded={!collapsed}
                className="absolute -left-3 top-8 hidden h-7 w-7 items-center justify-center rounded-full border border-surface-border bg-surface-alt text-ink-muted shadow-sm transition-all duration-300 hover:scale-110 hover:text-ink hover:border-gold-500/40 lg:flex cursor-pointer"
                style={{ transform: collapsed ? "translateX(0)" : undefined }}
              >
                <span
                  className={`flex transition-transform duration-300 ${
                    collapsed ? "rotate-180" : "rotate-0"
                  }`}
                >
                  <PanelLeftClose className="h-3.5 w-3.5 rotate-180" />
                </span>
              </button>
            </div>

            {/* Nav groups + scroll progress — the scrollable middle */}
            <div className="relative min-h-0 flex-1 pt-3">
              <nav
                ref={navRef}
                onScroll={handleNavScroll}
                data-lenis-prevent
                className={`h-full space-y-4 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(201,161,90,0.2)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-surface-border [&::-webkit-scrollbar-track]:bg-transparent ${
                  collapsed ? "" : "md:space-y-4"
                }`}
              >
                {links.map((group) => (
                  <div key={group.group} className="space-y-1">
                    <p
                      className={`px-3 pb-1 text-[0.72rem] font-bold tracking-wide text-ink-muted/70 ${
                        collapsed ? "max-md:block md:hidden" : "block"
                      }`}
                    >
                      {group.group}
                    </p>
                    {collapsed && (
                      <div className="mx-3 mb-2 border-t border-surface-border/60 hidden md:block" />
                    )}
                    {group.items.map((link) => {
                      const Icon = link.icon;
                      return (
                        <NavLink
                          key={link.to}
                          to={link.to}
                          onClick={closeDrawer}
                          title={collapsed ? link.label : undefined}
                          className={({ isActive }) =>
                            `group relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200 ${
                              collapsed
                                ? "md:mx-auto md:h-10 md:w-full md:justify-center md:px-0"
                                : ""
                            } ${
                              isActive
                                ? "bg-gold-500/15 text-gold-400 border border-gold-500/35 font-black shadow-sm"
                                : "text-ink-muted hover:bg-surface-alt hover:text-ink"
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Icon
                                className={`h-4 w-4 shrink-0 transition-colors ${
                                  isActive
                                    ? "text-gold-400 font-black"
                                    : "text-ink-muted/80 group-hover:text-gold-400"
                                }`}
                              />
                              <span
                                className={`truncate text-xs ${
                                  isActive
                                    ? "text-gold-400 font-black"
                                    : "text-ink-muted group-hover:text-ink"
                                } ${
                                  collapsed ? "max-md:block md:hidden" : "block"
                                }`}
                              >
                                {link.label}
                              </span>
                              {isActive && (
                                <span
                                  aria-hidden
                                  className={`mr-auto h-1.5 w-1.5 rounded-full bg-gold-400 shadow-sm ${
                                    collapsed
                                      ? "max-md:block md:hidden"
                                      : "block"
                                  }`}
                                />
                              )}
                              {/* active indicator dot under icon (collapsed) */}
                              {isActive && collapsed && (
                                <span
                                  aria-hidden
                                  className="absolute -bottom-0.5 h-1.5 w-1.5 rounded-full bg-gold-400 hidden md:block shadow-sm"
                                />
                              )}
                              {/* hover tooltip (collapsed) */}
                              {collapsed && (
                                <span
                                  role="tooltip"
                                  className="pointer-events-none absolute right-0 top-1/2 z-[60] hidden -translate-y-1/2 translate-x-[calc(-100%-10px)] whitespace-nowrap rounded-xl border border-surface-border bg-surface-card px-3 py-1.5 text-xs font-bold text-ink opacity-0 shadow-2xl transition-opacity duration-200 group-hover:opacity-100 md:block"
                                >
                                  {link.label}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                ))}
              </nav>
              {/* nav scroll progress */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-1 -bottom-1 hidden h-[3px] overflow-hidden rounded-full bg-surface-border md:block"
              >
                <span
                  className="block h-full rounded-full transition-[width] duration-150 ease-out bg-gold-400"
                  style={{ width: `${navProgress * 100}%` }}
                />
              </span>
            </div>

            {/* Footer Actions — pinned bottom */}
            <div
              className={`${
                collapsed ? "space-y-2" : "space-y-1"
              } mt-4 shrink-0 border-t border-surface-border pt-4`}
            >
              <button
                type="button"
                onClick={toggleTheme}
                title={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
                aria-label={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
                className={`group relative flex w-full items-center gap-2.5 rounded-xl bg-gold-500 px-3 py-2 text-right text-xs font-bold text-white shadow-sm transition-all hover:bg-gold-400 hover:shadow-gold-glow/30 cursor-pointer ${
                  collapsed ? "md:h-10 md:justify-center md:px-0" : ""
                }`}
              >
                {isDark ? <Sun className="h-4 w-4 shrink-0 text-white" /> : <Moon className="h-4 w-4 shrink-0 text-white" />}
                {!collapsed && <span>{isDark ? "الوضع الفاتح" : "الوضع الداكن"}</span>}
                {collapsed && (
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute right-0 top-1/2 z-[60] hidden -translate-y-1/2 translate-x-[calc(-100%-10px)] whitespace-nowrap rounded-lg border border-surface-border bg-surface-card px-2.5 py-1.5 text-[11px] font-bold text-ink opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100 md:block"
                  >
                    {isDark ? "الوضع الفاتح" : "الوضع الداكن"}
                  </span>
                )}
              </button>

              <Link
                to="/"
                title="العودة للموقع الرئيسي"
                onClick={closeDrawer}
                className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink ${
                  collapsed ? "md:h-10 md:w-full md:justify-center md:px-0" : ""
                }`}
              >
                <Home className="h-4 w-4 shrink-0 text-gold-400 group-hover:text-gold-300 transition-colors" />
                {!collapsed && <span>العودة للموقع الرئيسي</span>}
                {collapsed && (
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute right-0 top-1/2 z-[60] hidden -translate-y-1/2 translate-x-[calc(-100%-10px)] whitespace-nowrap rounded-lg border border-surface-border bg-surface-card px-2.5 py-1.5 text-[11px] font-bold text-ink opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100 md:block"
                  >
                    العودة للموقع الرئيسي
                  </span>
                )}
              </Link>

              <button
                onClick={() =>
                  logout(undefined, { onSuccess: () => navigate("/") })
                }
                title="تسجيل الخروج"
                className={`group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-right text-xs text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 cursor-pointer ${
                  collapsed ? "md:h-10 md:justify-center md:px-0" : ""
                }`}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span>تسجيل الخروج</span>}
                {collapsed && (
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute right-0 top-1/2 z-[60] hidden -translate-y-1/2 translate-x-[calc(-100%-10px)] whitespace-nowrap rounded-lg border border-surface-border bg-surface-card px-2.5 py-1.5 text-[11px] font-bold text-red-400 opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100 md:block"
                  >
                    تسجيل الخروج
                  </span>
                )}
              </button>

              {!collapsed && (
                <p
                  className="select-none px-3 pt-1 text-center text-[0.58rem] tracking-[0.22em] text-ink-muted/40"
                  dir="ltr"
                >
                  SANAD · DASHBOARD
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* ─── Main Content Area ──────────────────────────────────── */}
        <main className="relative z-10 min-w-0 flex-1 p-5 sm:p-8 lg:p-10 print:p-0 print:m-0 print:w-full print:block">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
