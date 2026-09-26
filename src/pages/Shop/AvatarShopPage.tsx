import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Coins,
  ShoppingBag,
  Check,
  ArrowRight,
  Sparkles,
  Loader2,
  Lock,
  Image,
  BookOpen,
  FileText,
  Target,
  Crown,
  Star,
  TrendingUp,
  Gem,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { coinsApi, CoinBalance } from '../../api/coins.api';
import { avatarsApi, Avatar } from '../../api/avatars.api';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

const coinRewards = [
  {
    icon: BookOpen,
    title: 'إكمال درس',
    amount: '+10',
    description: 'عملية لكل درس',
    color: 'emerald',
  },
  {
    icon: FileText,
    title: 'نجاح امتحان',
    amount: '+100',
    description: 'عملية للنجاح • +200 للتميز',
    color: 'violet',
  },
  {
    icon: Target,
    title: 'واجب + كويز',
    amount: '+50',
    description: 'عملية للنجاح',
    color: 'gold',
  },
];

const colorMap = {
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    text: 'text-emerald-400',
    amount: 'text-emerald-300',
    icon: 'text-emerald-400',
  },
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/25',
    text: 'text-violet-400',
    amount: 'text-violet-300',
    icon: 'text-violet-400',
  },
  gold: {
    bg: 'bg-gold-500/10',
    border: 'border-gold-500/25',
    text: 'text-gold-400',
    amount: 'text-gold-300',
    icon: 'text-gold-400',
  },
};

const AvatarShopPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: balanceData, isLoading: balanceLoading } = useQuery<CoinBalance>({
    queryKey: ['coins-balance'],
    queryFn: coinsApi.getBalance,
  });

  const { data: shopAvatars, isLoading: shopLoading } = useQuery<Avatar[]>({
    queryKey: ['avatars-shop'],
    queryFn: avatarsApi.getShop,
  });

  const { data: ownedAvatars } = useQuery({
    queryKey: ['avatars-owned'],
    queryFn: avatarsApi.getOwned,
  });

  const ownedIds = new Set(ownedAvatars?.map((a) => a.id) ?? []);
  const activeId = ownedAvatars?.find((a) => a.isActive)?.id;

  const buyMutation = useMutation({
    mutationFn: avatarsApi.buyAvatar,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['coins-balance'] });
      queryClient.invalidateQueries({ queryKey: ['avatars-owned'] });
      queryClient.invalidateQueries({ queryKey: ['avatars-shop'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'فشل شراء الأفاتار');
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: avatarsApi.setActive,
    onSuccess: (data, avatarId) => {
      toast.success(data.message);
      const activated = shopAvatars?.find((a) => a.id === avatarId) || ownedAvatars?.find((a) => a.id === avatarId);
      const photoUrl = data.photoUrl ?? activated?.imageUrl ?? null;
      if (photoUrl) {
        useAuthStore.getState().updateUserProfile({ photoUrl });
        queryClient.setQueryData(['user-profile'], (current: any) =>
          current ? { ...current, photoUrl } : current,
        );
      }
      queryClient.invalidateQueries({ queryKey: ['avatars-owned'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
    },
  });

  const removeActiveMutation = useMutation({
    mutationFn: avatarsApi.removeActive,
    onSuccess: () => {
      toast.success('تم إزالة الأفاتار');
      useAuthStore.getState().updateUserProfile({ photoUrl: null });
      queryClient.setQueryData(['user-profile'], (current: any) =>
        current ? { ...current, photoUrl: null } : current,
      );
      queryClient.invalidateQueries({ queryKey: ['avatars-owned'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
    },
  });

  const balance = balanceData?.balance ?? 0;

  return (
    <div className="min-h-screen bg-bg text-ivory">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-bl from-gold-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-64 h-64 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 w-80 h-80 bg-gradient-to-t from-emerald-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:py-12 space-y-8">
        {/* Back link */}
        <div className="flex items-center gap-4">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-base text-ivory-muted hover:text-gold-300 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            العودة للملف الشخصي
          </Link>
          <Link
            to="/shop/frames"
            className="inline-flex items-center gap-2 text-base text-amber-300 hover:text-amber-200 transition-colors font-bold"
          >
            <Sparkles className="w-5 h-5" />
            تصفح الإطارات
          </Link>
        </div>

        {/* Header */}
        <div className="relative rounded-3xl border border-gold-500/20 bg-gradient-to-br from-surface-card via-surface-card to-gold-500/5 p-6 sm:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-gold-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-violet-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="relative">
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-black to-[var(--primary)]" />
                <span className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500/20 to-violet-500/20 border border-gold-500/30">
                  <ShoppingBag className="w-8 h-8 text-white" />
                </span>
              </span>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-ivory font-amira flex items-center gap-3">
                  متجر الأفاتار
                  <Sparkles className="w-6 h-6 text-gold-400/80" />
                </h1>
                <p className="text-base text-ivory-muted mt-1">
                  اجمع العملات واشترِ أفاتار لملفك الشخصي
                </p>
              </div>
            </div>

            {/* Coin balance */}
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-l from-gold-500/15 to-gold-500/5 border border-gold-500/30">
              <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-r from-[var(--primary)] to-black border border-gold-500/30">
                <Coins className="w-6 h-6 text-gold-400" />
              </span>
              <div>
                {balanceLoading ? (
                  <Skeleton className="w-24 h-8" />
                ) : (
                  <p className="text-3xl font-black text-gold-300 tabular-nums">{balance}</p>
                )}
                <p className="text-sm text-ivory-muted">العملات الخاصه بك</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coins earning info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {coinRewards.map((reward, i) => {
            const colors = colorMap[reward.color as keyof typeof colorMap];
            return (
              <motion.div
                key={reward.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
                className={`relative p-5 rounded-2xl border ${colors.border} ${colors.bg} overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/5 to-transparent rounded-full blur-2xl pointer-events-none" />
                <div className="relative space-y-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-current/20 ${colors.icon}`}>
                      <reward.icon className="w-5 h-5" />
                    </span>
                    <span className={`font-bold ${colors.text}`}>{reward.title}</span>
                  </div>
                  <p className={`text-3xl font-black ${colors.amount} tabular-nums`}>{reward.amount}</p>
                  <p className="text-sm text-ivory-muted">{reward.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Avatar grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-ivory flex items-center gap-2 font-amira">
              <Gem className="w-6 h-6 text-violet-400" />
              الأفاتار المتاحة
            </h2>
            {ownedAvatars && ownedAvatars.length > 0 && (
              <span className="text-sm text-ivory-muted">
                تمتلك {ownedAvatars.length} أفاتار
              </span>
            )}
          </div>

          {shopLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
              ))}
            </div>
          ) : !shopAvatars?.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-3xl border border-dashed border-surface-border bg-surface-card/50">
              <span className="flex items-center justify-center w-20 h-20 rounded-2xl bg-surface border border-surface-border">
                <Image className="w-10 h-10 text-ivory-muted/30" />
              </span>
              <div>
                <p className="text-lg font-bold text-ivory">لا توجد أفاتار متاحة حالياً</p>
                <p className="text-sm text-ivory-muted mt-1">سيتم إضافة أفاتار قريباً!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
              {shopAvatars.map((avatar, i) => {
                const isOwned = ownedIds.has(avatar.id);
                const isActive = activeId === avatar.id;
                const canAfford = balance >= avatar.price;

                return (
                  <motion.div
                    key={avatar.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * i, duration: 0.3 }}
                    className={`avatar-shop-card group ${isActive ? 'avatar-shop-card--active' : ''}`}
                    aria-label={`${avatar.name}${isActive ? '، الأفاتار المفعّل' : isOwned ? '، تمتلكه' : `، سعره ${avatar.price} عملة`}`}
                  >
                    {/* The artwork lives in its own framed stage, so every image
                        feels intentional instead of looking like a raw upload. */}
                    <div className="avatar-shop-art">
                      <span className="avatar-shop-orbit" aria-hidden="true" />
                      {avatar.imageUrl ? (
                        <img
                          src={avatar.imageUrl}
                          alt={avatar.name}
                          className="avatar-shop-image"
                        />
                      ) : (
                        <div className="avatar-shop-image flex items-center justify-center">
                          <Image className="w-12 h-12 text-ivory-muted/40" />
                        </div>
                      )}

                      <span className="avatar-shop-shine" aria-hidden="true" />

                      {/* Active badge */}
                      {isActive && (
                        <div className="avatar-shop-status avatar-shop-status--active">
                          <Crown className="w-3.5 h-3.5" />
                          مفعّل
                        </div>
                      )}

                      {/* Owned badge */}
                      {isOwned && !isActive && (
                        <div className="avatar-shop-status avatar-shop-status--owned">
                          <Check className="w-3.5 h-3.5" />
                          مملوك
                        </div>
                      )}

                      {/* Price tag */}
                      {!isOwned && (
                        <div className="avatar-shop-price">
                          <Coins className="w-3.5 h-3.5 text-gold-400" />
                          <span className="text-gold-300">{avatar.price}</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="avatar-shop-content">
                      <div className="min-w-0">
                        <h3 className="text-base font-black text-ivory truncate">{avatar.name}</h3>
                        <p className="mt-1 text-[11px] text-ivory-muted truncate">
                          {isActive ? 'اختيارك الحالي' : isOwned ? 'جاهز لتفعيله' : canAfford ? 'متاح لك الآن' : `تحتاج ${avatar.price - balance} عملة إضافية`}
                        </p>
                      </div>

                      {isOwned ? (
                        <Button
                          size="md"
                          variant={isActive ? 'outline' : 'secondary'}
                          className="avatar-shop-action w-full"
                          onClick={() =>
                            isActive
                              ? removeActiveMutation.mutate()
                              : setActiveMutation.mutate(avatar.id)
                          }
                          disabled={setActiveMutation.isPending || removeActiveMutation.isPending}
                          leftIcon={isActive ? <Lock className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        >
                          {isActive ? 'إزالة' : 'تفعيل'}
                        </Button>
                      ) : (
                        <Button
                          size="md"
                          className="avatar-shop-action w-full"
                          onClick={() => buyMutation.mutate(avatar.id)}
                          disabled={!canAfford || buyMutation.isPending}
                          isLoading={buyMutation.isPending}
                          leftIcon={canAfford ? <ShoppingBag className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        >
                          {canAfford ? 'شراء' : 'غير كافٍ'}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* How to earn section */}
        <div className="relative rounded-3xl border border-surface-border bg-surface-card/50 p-6 sm:p-8 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-b from-violet-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="relative space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-ivory flex items-center justify-center gap-2">
                <TrendingUp className="w-6 h-6 text-violet-400" />
                كيف تجمع العملات؟
              </h2>
              <p className="text-base text-ivory-muted">اكسب العملات من أنشطة التعلم اليومية</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: BookOpen, label: 'شاهد الدروس', amount: '+10', color: 'emerald' },
                { icon: FileText, label: 'حل الواجبات', amount: '+50', color: 'gold' },
                { icon: Target, label: 'اجتز الكويزات', amount: '+50', color: 'violet' },
                { icon: Star, label: 'تمّيز في الامتحان', amount: '+200', color: 'gold' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.3 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-surface/50 border border-surface-border hover:border-violet-500/30 transition-colors"
                >
                  <span className={`flex items-center justify-center w-10 h-10 rounded-xl bg-${item.color}-500/15 border border-${item.color}-500/30`}>
                    <item.icon className={`w-5 h-5 text-${item.color}-400`} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ivory">{item.label}</p>
                    <p className={`text-lg font-black text-${item.color}-300`}>{item.amount}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarShopPage;
