import React from 'react';
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  BookOpen,
  ShieldCheck,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { paymentsApi } from '../../api/payments.api';
import { formatGradeLevel } from '../../lib/utils';
import { CoursePrice } from '../ui/CoursePrice';

const CHECKOUT_STORAGE_KEY = 'sanad_checkout';

export const CartDrawer: React.FC = () => {
  const { items, isOpen, setOpen, removeItem, getTotalPrice, clearCart } = useCartStore();
  const navigate = useNavigate();

  /** Remove item. If a checkout was already initiated for this course, cancel it. */
  const handleRemoveItem = async (courseId: string) => {
    try {
      const raw = localStorage.getItem(CHECKOUT_STORAGE_KEY);
      if (raw) {
        const checkout = JSON.parse(raw);
        // Cancel the payment silently so the DB record isn't left dangling
        if (checkout?.paymentId) {
          paymentsApi.cancel(checkout.paymentId).catch(() => {/* silent */});
          localStorage.removeItem(CHECKOUT_STORAGE_KEY);
        }
      }
    } catch { /* ignore parse errors */ }
    removeItem(courseId);
  };

  const handleCheckout = () => {
    setOpen(false);
    navigate('/checkout');
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            className="animate-cart-backdrop fixed inset-0 bg-black/60"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 z-50">
            <div
              className="animate-cart-drawer relative w-screen max-w-md flex flex-col bg-[var(--surface)] text-[var(--ink)] border-r border-[var(--line)] shadow-xl overflow-hidden"
            >
              {/* Subtle top primary accent line */}
              <span className="absolute top-0 right-0 left-0 h-[2.5px] bg-gradient-to-l from-transparent via-[var(--primary)] to-transparent" />

              {/* ─── Header ─────────────────────────────────────── */}
              <div className="relative z-10 px-5 pt-5 pb-4 border-b border-[var(--line)] bg-[var(--surface)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] shadow-sm">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      {items.length > 0 && (
                        <span
                          key={items.length}
                          className="animate-pop absolute -top-1.5 -left-1.5 min-w-[20px] h-5 px-1 rounded-full bg-[var(--primary)] text-[var(--on-primary)] text-[11px] font-black flex items-center justify-center ring-2 ring-[var(--surface)] shadow-sm"
                        >
                          {items.length}
                        </span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold font-display text-[var(--ink)] leading-tight">
                        سلة الكورسات
                      </h2>
                      <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-[var(--primary)]" />
                        {items.length === 0
                          ? 'السلة فارغة'
                          : `${items.length} ${items.length === 1 ? 'كورس جاهز للاشتراك' : 'كورسات جاهزة للاشتراك'}`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-xl border border-[var(--line)] text-[var(--ink-muted)] hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10 transition-all cursor-pointer"
                    aria-label="إغلاق السلة"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ─── Items ──────────────────────────────────────── */}
              <div className="relative z-10 flex-1 overflow-y-auto px-5 py-5 space-y-3.5">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div
                      className="w-20 h-20 rounded-2xl bg-[var(--surface-alt)] border border-[var(--line)] flex items-center justify-center relative text-[var(--primary)] shadow-sm"
                    >
                      <ShoppingBag className="w-9 h-9 opacity-80" strokeWidth={1.5} />
                      <Sparkles className="absolute top-2.5 right-2.5 w-4 h-4 text-[var(--primary)]" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold font-display text-[var(--ink)]">
                        سلتك تنتظر أول كورس
                      </h3>
                      <p className="text-xs text-[var(--ink-muted)] leading-relaxed max-w-[260px] mx-auto">
                        استكشف الكورسات والباقات المناسبة ليك، وابدأ مذاكرة منظمة من مكان واحد.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setOpen(false);
                        navigate('/courses');
                      }}
                      className="mt-2 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 bg-[var(--primary)] text-[var(--on-primary)] hover:brightness-105 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>تصفح الكورسات الآن</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    {items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="group relative flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--surface-alt)] border border-[var(--line)] hover:border-[var(--primary)]/50 transition-all duration-200 overflow-hidden shadow-sm"
                      >
                        {/* Index chip */}
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-md bg-[var(--surface)] border border-[var(--line)] text-[var(--ink-muted)] text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>

                        <div className="relative w-[64px] h-[64px] rounded-xl overflow-hidden border border-[var(--line)] shrink-0 bg-[var(--surface)]">
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--primary)] bg-[var(--primary-soft)]">
                              <BookOpen className="h-6 w-6" strokeWidth={1.5} />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 pr-1">
                          <h4 className="text-xs sm:text-sm font-bold text-[var(--ink)] truncate group-hover:text-[var(--primary)] transition-colors">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-[var(--ink-muted)] mt-1 inline-block px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--line)]">
                            {formatGradeLevel(item.gradeLevel)}
                          </span>
                          <div className="mt-1.5">
                            <CoursePrice price={item.price} isFree={item.isFree} size="xs" />
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="self-center text-red-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
                          title="حذف من السلة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* ─── Footer ─────────────────────────────────────── */}
              {items.length > 0 && (
                <div
                  className="relative z-10 px-5 pt-4 pb-5 border-t border-[var(--line)] bg-[var(--surface)] space-y-3.5"
                >
                  {/* Total card */}
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] shadow-sm">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold text-[var(--ink-muted)]">المجموع الإجمالي</p>
                      <p className="text-[10px] text-emerald-500 flex items-center gap-1 font-semibold">
                        <ShieldCheck className="w-3 h-3" />
                        اشتراك فوري بعد التأكيد
                      </p>
                    </div>
                    <CoursePrice price={getTotalPrice()} size="md" />
                  </div>

                  {/* Checkout button */}
                  <button
                    onClick={handleCheckout}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 px-5 bg-[var(--primary)] text-[var(--on-primary)] hover:brightness-105 active:scale-[0.98] font-bold text-sm shadow-sm transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>متابعة الدفع وإتمام الاشتراك</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={clearCart}
                    className="w-full text-center text-[11px] text-[var(--ink-muted)] hover:text-red-400 transition-colors cursor-pointer"
                  >
                    إفراغ السلة بالكامل
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
