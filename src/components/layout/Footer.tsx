import React from "react";
import { Link } from "react-router-dom";
import { smoothScrollToTop } from "./ScrollToTop";
import { useAuthStore } from "../../store/authStore";
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  BookOpen,
  GraduationCap,
  Sparkles,
  Heart,
  Send,
  Home,
  User,
  UserPlus,
  LogIn,
  School,
  MoonStar,
} from "lucide-react";

/* ------------------------------------------------------------------
   Footer — Creative dark-theme redesign
   • Facebook / YouTube / Telegram icons rendered BESIDE text links
   • Eye-comfortable ivory text + warm gold accent on a deep gradient
   • Fully responsive (1 → 2 → 4 columns)
------------------------------------------------------------------ */

const GOLD = "#C9A15A";

/* ─── Brand Social SVG Icons ─── */
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

/* ─── Social platform data (icon + text link) ─── */
const SOCIALS = [
  {
    name: "فيسبوك",
    sub: "مجتمع سند التعليمي",
    href: "https://www.facebook.com",
    Icon: FacebookIcon,
    color: "#1877F2",
  },
  {
    name: "يوتيوب",
    sub: "قناة الشرح والتلخيص",
    href: "https://www.youtube.com",
    Icon: YouTubeIcon,
    color: "#FF0000",
  },
  {
    name: "تيليجرام",
    sub: "@sanad_edu",
    href: "https://t.me",
    Icon: TelegramIcon,
    color: "#0088cc",
  },
];

/* ─── NavLink with BIG colored icon beside text ─── */
const FooterLink: React.FC<{
  to: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  color?: string;
  external?: boolean;
}> = ({ to, children, icon, color = GOLD, external }) => {
  const cls =
    "group inline-flex items-center gap-3 rounded-xl border border-transparent px-2 py-1.5 -mx-2 text-sm text-ivory/65 transition-all duration-300 hover:bg-white/[0.03] leading-relaxed";

  const inner = (
    <>
      <span
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 transition-all duration-300 group-hover:scale-110 group-hover:border-[var(--c)]/50 group-hover:shadow-card-dark"
        style={
          {
            backgroundColor: `${color}1f`,
            ["--c" as string]: color,
          } as React.CSSProperties
        }
      >
        {/* solid color fill on hover */}
        <span
          className="absolute inset-0 rounded-xl bg-[var(--c)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden
        />
        {/* icon — brand colored, turns white on hover */}
        <span className="relative z-10 text-[var(--c)] transition-colors duration-300 group-hover:text-white">
          {icon}
        </span>
      </span>
      <span className="transition-all duration-300 group-hover:translate-x-[-2px] group-hover:text-ivory">
        {children}
      </span>
    </>
  );

  if (external) {
    return (
      <li>
        <a href={to} target="_blank" rel="noopener noreferrer" className={cls}>
          {inner}
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link to={to} className={cls} onClick={() => smoothScrollToTop(0.6)}>
        {inner}
      </Link>
    </li>
  );
};


/* ─── Section heading ─── */
const SectionTitle: React.FC<{
  children: React.ReactNode;
  icon: React.ReactNode;
}> = ({ children, icon }) => (
  <h4 className="flex items-center gap-2.5 text-sm font-bold text-gold-300 mb-5">
    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-500/15 text-gold-300 ring-1 ring-gold-500/30">
      {icon}
    </span>
    {children}
  </h4>
);

/* ─── Contact row: BIG colored icon beside text (matches nav links) ─── */
const ContactRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  text: string;
  href?: string;
  color: string;
}> = ({ icon, label, text, href, color }) => {
  const content = (
    <div className="flex items-center gap-3">
      <span
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 transition-all duration-300 group-hover:scale-110 group-hover:border-[var(--c)]/50 group-hover:shadow-card-dark"
        style={
          {
            backgroundColor: `${color}1f`,
            ["--c" as string]: color,
          } as React.CSSProperties
        }
      >
        <span
          className="absolute inset-0 rounded-xl bg-[var(--c)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden
        />
        <span className="relative z-10 text-[var(--c)] transition-colors duration-300 group-hover:text-white">
          {icon}
        </span>
      </span>
      <div className="min-w-0 text-right">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ivory/35">
          {label}
        </p>
        <p className="truncate text-[12px] text-ivory/60 transition-colors duration-300 group-hover:text-ivory/90">
          {text}
        </p>
      </div>
    </div>
  );

  return (
    <li>
      {href ? (
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="group block rounded-xl border border-transparent px-2 py-1.5 -mx-2 transition-all duration-300 hover:bg-white/[0.03]"
        >
          {content}
        </a>
      ) : (
        <div className="block rounded-xl border border-transparent px-2 py-1.5 -mx-2">
          {content}
        </div>
      )}
    </li>
  );
};

/* ─── Big social icon button WITH tooltip ───
   Subtle brand-tinted background + brand-colored icon by default;
   on hover the background fills solid brand color and the icon turns white. */
const SocialIconBtn: React.FC<{
  href: string;
  label: string;
  Icon: React.FC;
  color: string;
}> = ({ href, label, Icon, color }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--c)]/50 hover:shadow-card-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
    style={{ ["--c" as string]: color } as React.CSSProperties}
  >
    {/* subtle base tint */}
    <span
      className="absolute inset-0 rounded-2xl transition-opacity duration-300"
      style={{ backgroundColor: `${color}26` }}
      aria-hidden
    />
    {/* solid brand fill on hover */}
    <span
      className="absolute inset-0 rounded-2xl bg-[var(--c)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      aria-hidden
    />
    {/* colored glow behind on hover */}
    <span
      className="absolute inset-0 rounded-2xl bg-[var(--c)] opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60"
      aria-hidden
    />
    {/* icon — brand colored, turns white on hover */}
    <span className="relative z-10 text-[var(--c)] transition-transform duration-300 group-hover:scale-110 group-hover:text-white">
      <Icon />
    </span>
    {/* tooltip — colored text */}
    <span
      className="pointer-events-none absolute -top-10 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] font-bold opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100"
      style={{ backgroundColor: "#0B151D", color, borderColor: `${color}66` }}
      role="tooltip"
    >
      {label}
    </span>
  </a>
);

export const Footer: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  // Hide auth links once a student is logged in; show them to guests.
  const showAuthLinks = !(isAuthenticated && role === "STUDENT");

  return (
    <footer
      className="relative w-full overflow-hidden text-right text-ivory"
      dir="rtl"
    >
      {/* ─── Decorative layer ─── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* warm gold glow */}
        <div className="absolute -top-20 right-0 h-80 w-96 rounded-full bg-gold-500/[0.08] blur-3xl" />
        {/* cool blue glow */}
        <div className="absolute -bottom-24 left-0 h-72 w-80 rounded-full bg-[#1B4B84]/[0.10] blur-3xl" />

        {/* open book — bottom left */}
        <svg
          className="absolute -bottom-6 -left-6 w-56 opacity-[0.10] animate-[float_6s_ease-in-out_infinite]"
          viewBox="0 0 120 96"
          fill="none"
        >
          <path
            d="M60 22C46 12 24 10 10 14v66c14-4 36-2 50 8V22z"
            stroke={GOLD}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M60 22c14-10 36-12 50-8v66c-14-4-36-2-50 8V22z"
            stroke={GOLD}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M18 30c9-1.5 20-.5 34 4M18 42c9-1.5 20-.5 34 4M18 54c9-1.5 20-.5 30 3.6M102 30c-9-1.5-20-.5-34 4M102 42c-9-1.5-20-.5-34 4M102 54c-9-1.5-20-.5-30 3.6"
            stroke={GOLD}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path d="M78 15v20l5-4 5 4V13" fill={GOLD} opacity=".8" />
        </svg>

        {/* graduation cap — bottom right */}
        <svg
          className="absolute bottom-[12%] right-[4%] w-28 opacity-[0.08]"
          viewBox="0 0 96 72"
          fill="none"
        >
          <path
            d="M48 12L8 30l40 18 40-18-40-18z"
            stroke={GOLD}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M24 38v14c0 5 11 10 24 10s24-5 24-10V38"
            stroke={GOLD}
            strokeWidth="1.6"
          />
          <circle cx="84" cy="56" r="3.4" fill={GOLD} />
          <path
            d="M84 32v20"
            stroke={GOLD}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ─── Gold top hairline ─── */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{
          background:
            "linear-gradient(to left, transparent, var(--gold, #C9A15A) 50%, transparent)",
          opacity: 0.45,
        }}
        aria-hidden
      />

      {/* ─── Main content ─── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-14 pb-0 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[2.2fr_1fr_1fr_1.5fr]">
          {/* ─── Brand Column ─── */}
          <div className="space-y-6">
            {/* Logo + name */}
            <Link
              to="/"
              onClick={() => smoothScrollToTop(0.6)}
              className="inline-flex items-center gap-2 group transition-transform duration-200 hover:scale-[1.02]"
            >
              <div className="relative h-16 w-16 overflow-hidden flex items-center justify-center shadow-gold-glow rounded-xl">
                <div className="absolute inset-0" />
                <img
                  src="/image/logo.png"
                  alt="شعار منصة سند التعليمية"
                  className="relative h-full w-full object-contain p-0.5"
                />
              </div>
              <div>
                <span className="block font-amira text-xl font-bold text-gold-300 group-hover:text-gold-200 transition-colors">
                  منصة سند
                </span>
                <span className="block text-[10px] tracking-widest text-gold-300/70 uppercase">
                  منصة تعليم مصرية — تعليم يصنع الفرق
                </span>
              </div>
            </Link>

            {/* Description */}
            <p className="max-w-xs text-xs leading-6 text-ivory/60">
              نضع بين يديك كل ما تحتاجه لتتعلم بشكل أفضل، تفهم أكثر، وتصل إلى
              أهدافك بثقة.{" "}
            </p>

            {/* Social icons — one row, big, brand-colored, tooltip on hover */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold tracking-widest text-ivory/40 uppercase">
                تابعنا على
              </p>
              <div className="flex items-center gap-3">
                {SOCIALS.map((s) => (
                  <SocialIconBtn
                    key={s.name}
                    href={s.href}
                    label={s.name}
                    Icon={s.Icon}
                    color={s.color}
                  />
                ))}
              </div>
            </div>

            {/* trust badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                {
                  icon: <GraduationCap className="w-3 h-3" />,
                  text: "٥٠٠٠+ طالب",
                },
                { icon: <Sparkles className="w-3 h-3" />, text: "٩٨٪ نجاح" },
                { icon: <Globe className="w-3 h-3" />, text: "متاح أونلاين" },
              ].map(({ icon, text }) => (
                <span
                  key={text}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/25 bg-gold-500/10 px-2.5 py-1 text-[10px] font-bold text-gold-200/90"
                >
                  {icon}
                  {text}
                </span>
              ))}
            </div>
          </div>

          {/* ─── Quick Links ─── */}
          <div>
            <SectionTitle icon={<BookOpen className="w-3.5 h-3.5" />}>
              روابط سريعة
            </SectionTitle>
            <ul className="space-y-1.5">
              <FooterLink
                to="/"
                icon={<Home className="w-[18px] h-[18px]" />}
                color="#C9A15A"
              >
                الرئيسية
              </FooterLink>
              <FooterLink
                to="/courses"
                icon={<BookOpen className="w-[18px] h-[18px]" />}
                color="#3B82F6"
              >
                جميع الكورسات
              </FooterLink>
              <FooterLink
                to="/about"
                icon={<User className="w-[18px] h-[18px]" />}
                color="#818CF8"
              >
                عن منصة سند
              </FooterLink>
              {showAuthLinks && (
                <FooterLink
                  to="/auth/register"
                  icon={<UserPlus className="w-[18px] h-[18px]" />}
                  color="#2E9E6B"
                >
                  تسجيل طالب جديد
                </FooterLink>
              )}
              {showAuthLinks && (
                <FooterLink
                  to="/auth/login"
                  icon={<LogIn className="w-[18px] h-[18px]" />}
                  color="#14B8A6"
                >
                  تسجيل الدخول
                </FooterLink>
              )}
              <FooterLink
                to="/adhkar"
                icon={<MoonStar className="w-[18px] h-[18px]" />}
                color="#F59E0B"
              >
                أذكار الدراسة
              </FooterLink>
            </ul>
          </div>

          {/* ─── Academic Stages ─── */}
          <div>
            <SectionTitle icon={<GraduationCap className="w-3.5 h-3.5" />}>
              المراحل الدراسية
            </SectionTitle>
            <ul className="space-y-1.5">
              <FooterLink
                to="/courses?gradeLevel=SEC_3_LITERARY"
                icon={<GraduationCap className="w-[18px] h-[18px]" />}
                color="#8B5CF6"
              >
                الثانوية العامة (أدبي)
              </FooterLink>
              <FooterLink
                to="/courses?gradeLevel=SEC_3_SCIENCE"
                icon={<GraduationCap className="w-[18px] h-[18px]" />}
                color="#EC4899"
              >
                الثانوية العامة (علمي)
              </FooterLink>
              <FooterLink
                to="/courses?gradeLevel=SEC_2"
                icon={<School className="w-[18px] h-[18px]" />}
                color="#0EA5E9"
              >
                الصف الثاني الثانوي
              </FooterLink>
              <FooterLink
                to="/courses?gradeLevel=SEC_1"
                icon={<School className="w-[18px] h-[18px]" />}
                color="#22C55E"
              >
                الصف الأول الثانوي
              </FooterLink>
              <FooterLink
                to="/courses?gradeLevel=PREP_3"
                icon={<BookOpen className="w-[18px] h-[18px]" />}
                color="#F97316"
              >
                المرحلة الإعدادية
              </FooterLink>
            </ul>
          </div>

          {/* ─── Contact ─── */}
          <div>
            <SectionTitle icon={<Phone className="w-3.5 h-3.5" />}>
              التواصل والدعم
            </SectionTitle>
            <ul className="space-y-1.5">
              <ContactRow
                icon={<Phone className="w-[18px] h-[18px]" />}
                label="هاتف / واتساب"
                text="01012345678"
                href="tel:+201012345678"
                color="#2E9E6B"
              />
              <ContactRow
                icon={<Mail className="w-[18px] h-[18px]" />}
                label="البريد الإلكتروني"
                text="support@sanad.education"
                href="mailto:support@sanad.education"
                color="#C9A15A"
              />
              <ContactRow
                icon={<Send className="w-[18px] h-[18px]" />}
                label="تيليجرام"
                text="@sanad_edu"
                href="https://t.me/sanad_edu"
                color="#29A8E0"
              />
              <ContactRow
                icon={<MapPin className="w-[18px] h-[18px]" />}
                label="العنوان"
                text="القاهرة / الجيزة — سناتر معتمدة"
                color="#F59E0B"
              />
            </ul>
          </div>
        </div>

        {/* ─── Bottom bar ─── */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-gold-500/20 py-5 sm:flex-row">
          <p className="flex items-center gap-1.5 text-[11px] text-ivory/40">
            <span>© {new Date().getFullYear()} منصة سند</span>
            <span className="text-ivory/20">•</span>
            <span>جميع الحقوق محفوظة</span>
          </p>
          <p className="flex items-center gap-1 order-first text-[11px] text-ivory/35 sm:order-last">
            صُنع بـ
            <Heart className="mx-0.5 inline h-3 w-3 fill-red-400 text-red-400" />
            لنجاح الطلاب المصريين
          </p>
        </div>
      </div>
    </footer>
  );
};
