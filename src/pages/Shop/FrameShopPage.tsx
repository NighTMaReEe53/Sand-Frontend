import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Frame,
  ArrowRight,
  Coins,
  Check,
  Crown,
  Sparkles,
  Loader2,
  ShoppingCart,
  Star,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { framesApi, Frame as FrameType, OwnedFrame } from '../../api/frames.api';
import { coinsApi } from '../../api/coins.api';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

const FrameShopPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: shopFrames, isLoading: shopLoading } = useQuery<FrameType[]>({
    queryKey: ['frames-shop'],
    queryFn: framesApi.getShop,
  });

  const { data: ownedFrames } = useQuery<OwnedFrame[]>({
    queryKey: ['frames-me'],
    queryFn: framesApi.getOwned,
  });

  const { data: coinData } = useQuery({
    queryKey: ['coins-me'],
    queryFn: coinsApi.getBalance,
  });

  const buyMutation = useMutation({
    mutationFn: framesApi.buyFrame,
    onSuccess: () => {
      toast.success('تم شراء الإطار بنجاح!');
      queryClient.invalidateQueries({ queryKey: ['frames-shop'] });
      queryClient.invalidateQueries({ queryKey: ['frames-me'] });
      queryClient.invalidateQueries({ queryKey: ['coins-me'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'فشل شراء الإطار');
    },
  });

  const activateMutation = useMutation({
    mutationFn: framesApi.setActive,
    onSuccess: () => {
      toast.success('تم تفعيل الإطار بنجاح!');
      queryClient.invalidateQueries({ queryKey: ['frames-me'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'فشل تفعيل الإطار');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: framesApi.removeActive,
    onSuccess: () => {
      toast.success('تم إزالة الإطار.');
      queryClient.invalidateQueries({ queryKey: ['frames-me'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'فشل إزالة الإطار');
    },
  });

  const balance = coinData?.balance ?? 0;
  const ownedIds = new Set(ownedFrames?.map((f) => f.id) ?? []);
  const activeFrameId = ownedFrames?.find((f) => f.isActive)?.id;

  return (
    <div className="min-h-screen bg-bg text-ivory">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -left-32 w-64 h-64 bg-gradient-to-br from-gold-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:py-12 space-y-8">
        {/* Back link */}
        <Link
          to="/shop/avatars"
          className="inline-flex items-center gap-2 text-base text-ivory-muted hover:text-gold-300 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
          المتجر
        </Link>

        {/* Header */}
        <div className="relative rounded-3xl border border-amber-500/20 bg-gradient-to-br from-surface-card via-surface-card to-amber-500/5 p-6 sm:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-amber-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-gold-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="relative">
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/20 to-gold-500/20 blur-xl" />
                <span className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-gold-500/20 border border-amber-500/30">
                  <Frame className="w-8 h-8 text-amber-300" />
                </span>
              </span>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-ivory flex items-center gap-3">
                  متجر الإطارات
                </h1>
                <p className="text-base text-ivory-muted mt-1">
                  إطارات مميزة لإضفاء لمسة فريدة على ملفك الشخصي
                </p>
              </div>
            </div>

            {/* Coin Balance */}
            <span className="relative">
              <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/15 to-gold-500/15 blur-xl" />
              <span className="relative flex items-center gap-3 px-6 py-3 rounded-2xl bg-surface-card/80 border border-amber-500/20 backdrop-blur-sm">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30">
                  <Coins className="w-5 h-5 text-amber-300" />
                </span>
                <div>
                  <p className="text-xs text-ivory-muted">رصيدك</p>
                  <p className="text-xl font-black text-amber-300">{balance.toLocaleString()}</p>
                </div>
              </span>
            </span>
          </div>
        </div>

        {/* My Frames (if owned) */}
        {ownedFrames && ownedFrames.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-ivory flex items-center gap-2">
              <Crown className="w-6 h-6 text-gold-400" />
              إطاراتي
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ownedFrames.map((frame, i) => (
                <motion.div
                  key={frame.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3 }}
                  className={`relative p-5 rounded-2xl border transition-all ${
                    frame.isActive
                      ? 'bg-gradient-to-br from-amber-500/10 to-gold-500/10 border-amber-500/40 shadow-lg shadow-amber-500/10'
                      : 'bg-surface-card border-surface-border hover:border-amber-500/30'
                  }`}
                >
                  {frame.isActive && (
                    <span className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold">
                      <Crown className="w-3 h-3" />
                      مفعّل
                    </span>
                  )}

                  <div className="flex items-center gap-3 mb-3">
                    {frame.imageUrl ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-surface-border">
                        <img src={frame.imageUrl} alt={frame.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/15 to-gold-500/15 border border-amber-500/20 flex items-center justify-center">
                        <Frame className="w-6 h-6 text-amber-300" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-ivory">{frame.name}</h3>
                      <p className="text-xs text-ivory-muted">تم الشراء</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={frame.isActive ? 'outline' : 'secondary'}
                    className="w-full"
                    onClick={() =>
                      frame.isActive
                        ? deactivateMutation.mutate()
                        : activateMutation.mutate(frame.id)
                    }
                    isLoading={activateMutation.isPending || deactivateMutation.isPending}
                    leftIcon={frame.isActive ? <Frame className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  >
                    {frame.isActive ? 'إزالة الإطار' : 'تفعيل الإطار'}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Shop */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-ivory flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-gold-400" />
            الإطارات المتاحة
          </h2>

          {shopLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : !shopFrames?.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-3xl border border-dashed border-surface-border bg-surface-card/50">
              <span className="flex items-center justify-center w-20 h-20 rounded-2xl bg-surface border border-surface-border">
                <Frame className="w-10 h-10 text-ivory-muted/30" />
              </span>
              <div>
                <p className="text-lg font-bold text-ivory">لا يوجد إطارات حالياً</p>
                <p className="text-sm text-ivory-muted mt-1">سيتم إضافة إطارات قريباً</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shopFrames.map((frame, i) => {
                const owned = ownedIds.has(frame.id);
                const canAfford = balance >= frame.price;

                return (
                  <motion.div
                    key={frame.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.3 }}
                    className="relative flex flex-col p-5 rounded-2xl bg-surface-card border border-surface-border hover:border-amber-500/30 transition-all"
                  >
                    {/* Frame preview */}
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-surface border border-surface-border mb-4">
                      {frame.imageUrl ? (
                        <img src={frame.imageUrl} alt={frame.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-500/10 to-gold-500/10 gap-2">
                          <Frame className="w-12 h-12 text-amber-300/40" />
                          <span className="text-xs text-ivory-muted">معاينة الإطار</span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-ivory mb-2">{frame.name}</h3>

                    <div className="flex items-center gap-1.5 text-sm text-gold-300 mb-4">
                      <Coins className="w-4 h-4" />
                      <span className="font-bold">{frame.price.toLocaleString()}</span>
                      <span className="text-ivory-muted">عملة</span>
                    </div>

                    <div className="mt-auto">
                      {owned ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          leftIcon={<Check className="w-4 h-4" />}
                          disabled
                        >
                          مملوك بالفعل
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant={canAfford ? 'secondary' : 'outline'}
                          className={`w-full ${!canAfford ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => buyMutation.mutate(frame.id)}
                          isLoading={buyMutation.isPending}
                          disabled={!canAfford}
                          leftIcon={<ShoppingCart className="w-4 h-4" />}
                        >
                          {canAfford ? 'شراء الإطار' : 'رصيد غير كافٍ'}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* How to earn coins */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-ivory flex items-center gap-2">
            <Star className="w-6 h-6 text-gold-400" />
            كيف تكسب عملات؟
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '📚', label: 'إكمال الدرس', amount: '+10', color: 'from-blue-500/10 to-blue-600/10', border: 'border-blue-500/20' },
              { icon: '📝', label: 'اجتياز الاختبار', amount: '+50', color: 'from-emerald-500/10 to-emerald-600/10', border: 'border-emerald-500/20' },
              { icon: '🎯', label: 'اختبار ممتاز', amount: '+100', color: 'from-amber-500/10 to-amber-600/10', border: 'border-amber-500/20' },
              { icon: '🏆', label: 'اجتياز الامتحان', amount: '+100', color: 'from-violet-500/10 to-violet-600/10', border: 'border-violet-500/20' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.3 }}
                className={`p-4 rounded-2xl bg-gradient-to-br ${item.color} border ${item.border} flex items-center gap-3`}
              >
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-bold text-ivory">{item.label}</p>
                  <p className="text-lg font-black text-gold-300">{item.amount}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrameShopPage;
