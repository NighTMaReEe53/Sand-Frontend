import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Gem,
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
  Image,
  Coins,
  Eye,
  EyeOff,
  Loader2,
  X,
  Check,
  GripVertical,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { avatarsApi, Avatar, CreateAvatarDto, UpdateAvatarDto } from '../../api/avatars.api';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';

const AdminAvatarsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState<Avatar | null>(null);

  const { data: avatars, isLoading } = useQuery<Avatar[]>({
    queryKey: ['admin-avatars'],
    queryFn: avatarsApi.adminGetAll,
  });

  const createMutation = useMutation({
    mutationFn: avatarsApi.adminCreate,
    onSuccess: () => {
      toast.success('تم إضافة الأفاتار بنجاح');
      queryClient.invalidateQueries({ queryKey: ['admin-avatars'] });
      setIsCreateModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'فشل إضافة الأفاتار');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAvatarDto }) =>
      avatarsApi.adminUpdate(id, dto),
    onSuccess: () => {
      toast.success('تم تحديث الأفاتار بنجاح');
      queryClient.invalidateQueries({ queryKey: ['admin-avatars'] });
      setEditingAvatar(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'فشل تحديث الأفاتار');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: avatarsApi.adminDelete,
    onSuccess: () => {
      toast.success('تم حذف الأفاتار بنجاح');
      queryClient.invalidateQueries({ queryKey: ['admin-avatars'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'فشل حذف الأفاتار');
    },
  });

  const togglePublish = (avatar: Avatar) => {
    updateMutation.mutate({
      id: avatar.id,
      dto: { isPublished: !avatar.isPublished },
    });
  };

  return (
    <div className="min-h-screen bg-bg text-ivory rounded-md">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:py-12 space-y-8">
        {/* Back link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-base text-ivory-muted hover:text-gold-300 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
          لوحة التحكم
        </Link>

        {/* Header */}
        <div className="relative rounded-3xl  p-6 sm:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-violet-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-gold-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="relative">
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-black to-[var(--primary)] " />
                <span className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-gold-500/20 border border-violet-500/30">
                  <Gem className="w-8 h-8 text-white" />
                </span>
              </span>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-ivory flex items-center gap-3">
                  إدارة الأفاتار
                </h1>
                <p className="text-base text-ivory-muted mt-1">
                  إضافة وتعديل وحذف الأفاتار المتاحة للطلاب
                </p>
              </div>
            </div>

            <Button
              size="lg"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="w-5 h-5" />}
            >
              إضافة أفاتار جديد
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/30">
                <Gem className="w-6 h-6 text-violet-400" />
              </span>
              <div>
                <p className="text-2xl font-black text-violet-300">{avatars?.length ?? 0}</p>
                <p className="text-sm text-ivory-muted">إجمالي الأفاتار</p>
              </div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                <Eye className="w-6 h-6 text-emerald-400" />
              </span>
              <div>
                <p className="text-2xl font-black text-emerald-300">
                  {avatars?.filter((a) => a.isPublished).length ?? 0}
                </p>
                <p className="text-sm text-ivory-muted">منشور</p>
              </div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30">
                <EyeOff className="w-6 h-6 text-amber-400" />
              </span>
              <div>
                <p className="text-2xl font-black text-amber-300">
                  {avatars?.filter((a) => !a.isPublished).length ?? 0}
                </p>
                <p className="text-sm text-ivory-muted">غير منشور</p>
              </div>
            </div>
          </div>
        </div>

        {/* Avatars list */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-ivory flex items-center gap-2">
            <Gem className="w-6 h-6 text-gold-400" />
            قائمة الأفاتار
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : !avatars?.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-3xl border border-dashed border-surface-border bg-surface-card/50">
              <span className="flex items-center justify-center w-20 h-20 rounded-2xl bg-surface border border-surface-border">
                <Image className="w-10 h-10 text-ivory-muted/30" />
              </span>
              <div>
                <p className="text-lg font-bold text-ivory">لا يوجد أفاتار</p>
                <p className="text-sm text-ivory-muted mt-1">ابدأ بإضافة أفاتار جديدة للطلاب</p>
              </div>
              <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                إضافة أول أفاتار
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {avatars.map((avatar, i) => (
                <motion.div
                  key={avatar.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    avatar.isPublished
                      ? 'bg-surface-card border-surface-border hover:border-violet-500/30'
                      : 'bg-surface-card/50 border-surface-border/50 opacity-70'
                  }`}
                >
                  {/* Avatar preview */}
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface border border-surface-border">
                      {avatar.imageUrl ? (
                        <img
                          src={avatar.imageUrl}
                          alt={avatar.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500/10 to-gold-500/10">
                          <Image className="w-8 h-8 text-ivory-muted/30" />
                        </div>
                      )}
                    </div>
                    {!avatar.isPublished && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                        <EyeOff className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-ivory truncate">{avatar.name}</h3>
                      {!avatar.isPublished && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-400">
                          غير منشور
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1.5 text-sm text-gold-300">
                        <Coins className="w-4 h-4" />
                        {avatar.price} عملة
                      </span>
                      {avatar.sortOrder !== undefined && (
                        <span className="text-xs text-ivory-muted">
                          الترتيب: {avatar.sortOrder}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant={avatar.isPublished ? 'outline' : 'secondary'}
                      onClick={() => togglePublish(avatar)}
                      disabled={updateMutation.isPending}
                    >
                      {avatar.isPublished ? (
                        <span className="flex items-center gap-1">
                          <EyeOff className="w-4 h-4" />
                          إخفاء
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          نشر
                        </span>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingAvatar(avatar)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذا الأفاتار؟')) {
                          deleteMutation.mutate(avatar.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <CreateAvatarModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(dto) => createMutation.mutate(dto)}
        isPending={createMutation.isPending}
      />

      {/* Edit Modal */}
      {editingAvatar && (
        <EditAvatarModal
          avatar={editingAvatar}
          isOpen
          onClose={() => setEditingAvatar(null)}
          onSubmit={(dto) => updateMutation.mutate({ id: editingAvatar.id, dto })}
          isPending={updateMutation.isPending}
        />
      )}
    </div>
  );
};

// ─── Create Avatar Modal ──────────────────────────────────────────
const CreateAvatarModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateAvatarDto) => void;
  isPending: boolean;
}> = ({ isOpen, onClose, onSubmit, isPending }) => {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState(100);
  const [sortOrder, setSortOrder] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      imageUrl: imageUrl.trim() || undefined,
      price,
      sortOrder,
    });
  };

  const handleClose = () => {
    setName('');
    setImageUrl('');
    setPrice(100);
    setSortOrder(0);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="إضافة أفاتار جديد" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gold-300/90 mb-2">اسم الأفاتار</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="مثال: أفاتار ذهبي"
            className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-base text-ivory outline-none focus:border-gold-400 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gold-300/90 mb-2">رابط الصورة (اختياري)</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/avatar.png"
            dir="ltr"
            className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-base text-ivory outline-none focus:border-gold-400 transition-colors"
          />
          {imageUrl && (
            <div className="mt-3 flex justify-center">
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-surface-border">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gold-300/90 mb-2">السعر (عملة)</label>
            <input
              type="number"
              min={1}
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value) || 1)}
              required
              className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-base text-ivory outline-none focus:border-gold-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gold-300/90 mb-2">الترتيب</label>
            <input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-base text-ivory outline-none focus:border-gold-400 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" isLoading={isPending} leftIcon={<Check className="w-4 h-4" />}>
            إضافة الأفاتار
          </Button>
          <Button type="button" variant="outline" onClick={handleClose}>
            إلغاء
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Edit Avatar Modal ──────────────────────────────────────────
const EditAvatarModal: React.FC<{
  avatar: Avatar;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: UpdateAvatarDto) => void;
  isPending: boolean;
}> = ({ avatar, isOpen, onClose, onSubmit, isPending }) => {
  const [name, setName] = useState(avatar.name);
  const [imageUrl, setImageUrl] = useState(avatar.imageUrl ?? '');
  const [price, setPrice] = useState(avatar.price);
  const [sortOrder, setSortOrder] = useState(avatar.sortOrder ?? 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      imageUrl: imageUrl.trim() || undefined,
      price,
      sortOrder,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`تعديل — ${avatar.name}`} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gold-300/90 mb-2">اسم الأفاتار</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-base text-ivory outline-none focus:border-gold-400 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gold-300/90 mb-2">رابط الصورة</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/avatar.png"
            dir="ltr"
            className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-base text-ivory outline-none focus:border-gold-400 transition-colors"
          />
          {imageUrl && (
            <div className="mt-3 flex justify-center">
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-surface-border">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gold-300/90 mb-2">السعر (عملة)</label>
            <input
              type="number"
              min={1}
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value) || 1)}
              required
              className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-base text-ivory outline-none focus:border-gold-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gold-300/90 mb-2">الترتيب</label>
            <input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-base text-ivory outline-none focus:border-gold-400 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" isLoading={isPending} leftIcon={<Check className="w-4 h-4" />}>
            حفظ التغييرات
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminAvatarsPage;
