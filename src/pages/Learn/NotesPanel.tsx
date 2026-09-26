import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StickyNote,
  Bookmark as BookmarkIcon,
  Plus,
  Trash2,
  Play,
  Loader2,
  Pencil,
  X,
} from 'lucide-react';
import { notesApi } from '../../api/notes.api';
import { Note, Bookmark } from '../../types/notes.types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface NotesPanelProps {
  lessonId: string;
  getCurrentTimestamp: () => number | null;
  seekTo: (seconds: number) => void;
}

const formatTs = (s: number): string => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

export const NotesPanel: React.FC<NotesPanelProps> = ({
  lessonId,
  getCurrentTimestamp,
  seekTo,
}) => {
  const [tab, setTab] = useState<'notes' | 'bookmarks'>('notes');
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[] | null>(null);
  const [newContent, setNewContent] = useState('');
  const [attachTimestamp, setAttachTimestamp] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const loadAll = useCallback(async () => {
    try {
      const [n, b] = await Promise.all([
        notesApi.listNotes({ lessonId, limit: 100 }),
        notesApi.listBookmarks({ lessonId }),
      ]);
      setNotes(n.notes);
      setBookmarks(b);
    } catch {
      setError('تعذر تحميل الملاحظات والعلامات المرجعية.');
    }
  }, [lessonId]);

  useEffect(() => {
    setNotes(null);
    setBookmarks(null);
    loadAll();
  }, [loadAll]);

  // The player reports fractional seconds — the backend requires integers,
  // so always round before sending (a float would fail validation with a 400).
  const getRoundedTimestamp = (): number | undefined => {
    const ts = getCurrentTimestamp();
    if (ts === null || !Number.isFinite(ts)) return undefined;
    return Math.max(0, Math.floor(ts));
  };

  const extractServerMessage = (err: unknown, fallback: string): string => {
    const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response
      ?.data?.message;
    if (Array.isArray(msg)) return msg.join('، ');
    return msg || fallback;
  };

  const handleCreateNote = async () => {
    if (!newContent.trim() || busyRef.current) return;
    busyRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await notesApi.createNote({
        lessonId,
        content: newContent.trim(),
        ...(attachTimestamp && { videoTimestampSeconds: getRoundedTimestamp() }),
      });
      setNewContent('');
      loadAll();
    } catch (err) {
      if (
        (err as { response?: { status?: number } })?.response?.status === 401 ||
        (err as { response?: { status?: number } })?.response?.status === 403
      ) {
        setError('انتهت الجلسة أو لا تملك صلاحية الحفظ، سجل الدخول مرة أخرى.');
      } else {
        setError(extractServerMessage(err, 'تعذر حفظ الملاحظة.'));
      }
    } finally {
      setSaving(false);
      busyRef.current = false;
    }
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim()) return;
    try {
      await notesApi.updateNote(noteId, { content: editContent.trim() });
      setEditingId(null);
      loadAll();
    } catch (err) {
      setError(extractServerMessage(err, 'تعذر تعديل الملاحظة.'));
    }
  };

  const handleAddBookmark = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const ts = getCurrentTimestamp();
      if (ts !== null) {
        await notesApi.createBookmark({ lessonId, videoTimestampSeconds: Math.floor(ts) });
        loadAll();
      }
    } catch {
      setError('تعذر إضافة العلامة المرجعية.');
    } finally {
      busyRef.current = false;
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    try {
      await notesApi.deleteBookmark(id);
      loadAll();
    } catch {
      /* ignore */
    }
  };

  const isLoading = notes === null || bookmarks === null;

  return (
    <div className="rounded-2xl bg-surface-card border border-surface-border overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-surface-border bg-surface">
        <button
          type="button"
          onClick={() => setTab('notes')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors ${
            tab === 'notes' ? 'text-gold-300 border-b-2 border-gold-400' : 'text-ivory-muted'
          }`}
        >
          <StickyNote className="w-4 h-4" />
          ملاحظاتي ({notes?.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setTab('bookmarks')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors ${
            tab === 'bookmarks' ? 'text-gold-300 border-b-2 border-gold-400' : 'text-ivory-muted'
          }`}
        >
          <BookmarkIcon className="w-4 h-4" />
          علامات مرجعية ({bookmarks?.length ?? 0})
        </button>
      </div>

      <div className="p-4 space-y-3">
        {error && <p className="text-[11px] text-red-400">{error}</p>}

        {tab === 'notes' ? (
          <>
            {/* Create note */}
            <div className="space-y-2">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="اكتب ملاحظتك هنا..."
                rows={2}
                className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2 text-xs text-ivory placeholder-ivory-muted/50 focus:border-gold-500 outline-none resize-none text-right"
              />
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-[10px] text-ivory-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attachTimestamp}
                    onChange={(e) => setAttachTimestamp(e.target.checked)}
                    className="accent-gold-500"
                  />
                  إرفاق التوقيت الحالي
                  {attachTimestamp && getCurrentTimestamp() !== null && (
                    <span dir="ltr">({formatTs(getCurrentTimestamp()!)})</span>
                  )}
                </label>
                <Button
                  size="sm"
                  onClick={handleCreateNote}
                  isLoading={saving}
                  disabled={!newContent.trim()}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  حفظ
                </Button>
              </div>
            </div>

            {/* Notes list */}
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-gold-400" />
              </div>
            ) : notes!.length === 0 ? (
              <p className="text-center text-[11px] text-ivory-muted py-4">لا توجد ملاحظات على هذا الدرس.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {notes!.map((n) => (
                  <li key={n.id} className="p-3 rounded-xl bg-surface border border-surface-border space-y-1.5">
                    {editingId === n.id ? (
                      <>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={2}
                          className="w-full bg-bg border border-surface-border rounded-lg px-2 py-1.5 text-xs text-ivory focus:border-gold-500 outline-none resize-none text-right"
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1 text-ivory-muted hover:text-ivory"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <Button size="sm" onClick={() => handleSaveEdit(n.id)}>
                            حفظ
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-ivory leading-relaxed whitespace-pre-line">{n.content}</p>
                        <div className="flex items-center justify-between">
                          {n.videoTimestampSeconds !== null ? (
                            <button
                              type="button"
                              onClick={() => seekTo(n.videoTimestampSeconds!)}
                              className="flex items-center gap-1 text-[10px] text-gold-400 hover:text-gold-300"
                            >
                              <Play className="w-3 h-3" />
                              <span dir="ltr">{formatTs(n.videoTimestampSeconds)}</span>
                            </button>
                          ) : (
                            <span />
                          )}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(n.id);
                                setEditContent(n.content);
                              }}
                              className="p-1 rounded text-ivory-muted hover:text-gold-400 transition-colors"
                              title="تعديل"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await notesApi.deleteNote(n.id);
                                loadAll();
                              }}
                              className="p-1 rounded text-ivory-muted hover:text-red-400 transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddBookmark}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              علامة عند التوقيت الحالي
              {getCurrentTimestamp() !== null && (
                <span dir="ltr"> ({formatTs(getCurrentTimestamp()!)})</span>
              )}
            </Button>

            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-gold-400" />
              </div>
            ) : bookmarks!.length === 0 ? (
              <p className="text-center text-[11px] text-ivory-muted py-4">لا توجد علامات مرجعية.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {bookmarks!.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-surface-border"
                  >
                    <button
                      type="button"
                      onClick={() => b.videoTimestampSeconds !== null && seekTo(b.videoTimestampSeconds)}
                      className="flex items-center gap-2 text-xs text-ivory hover:text-gold-300"
                    >
                      {b.videoTimestampSeconds !== null && (
                        <>
                          <Play className="w-3 h-3 text-gold-400" />
                          <span dir="ltr">{formatTs(b.videoTimestampSeconds)}</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBookmark(b.id)}
                      className="p-1 rounded text-ivory-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
};
