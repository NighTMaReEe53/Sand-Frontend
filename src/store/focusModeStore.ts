import { create } from 'zustand';

export type FocusActivityType = 'EXAM' | 'QUIZ' | 'LECTURE';

export interface UserActivityState {
  state: 'IDLE' | FocusActivityType;
  activityId: string | null;
  startedAt: string | null;
}

interface FocusModeState extends UserActivityState {
  setActivity: (state: FocusActivityType, activityId?: string) => void;
  setIdle: () => void;
}

/**
 * Single source of truth for "user is inside an Exam/Quiz/Lecture".
 * The Dua toast scheduler subscribes to this store to suppress/pause
 * while the user is focused, and to auto-trigger a completion Dua on
 * the transition back to IDLE.
 */
export const useFocusModeStore = create<FocusModeState>()((set) => ({
  state: 'IDLE',
  activityId: null,
  startedAt: null,
  setActivity: (state, activityId) =>
    set({ state, activityId: activityId ?? null, startedAt: new Date().toISOString() }),
  setIdle: () => set({ state: 'IDLE', activityId: null, startedAt: null }),
}));

/** Imperative helpers for exam/quiz/lecture modules. */
export const focusActivity = {
  beginExam: (id?: string) => useFocusModeStore.getState().setActivity('EXAM', id),
  beginQuiz: (id?: string) => useFocusModeStore.getState().setActivity('QUIZ', id),
  beginLecture: (id?: string) => useFocusModeStore.getState().setActivity('LECTURE', id),
  end: () => {
    const prev = useFocusModeStore.getState();
    prev.setIdle();
    return prev.state; // lets callers know which context just ended
  },
};
