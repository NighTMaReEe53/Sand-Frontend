import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Role } from '../types/auth.types';
import { useCartStore } from './cartStore';

interface AuthState {
  user: User | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  updateUserProfile: (profile: any) => void;
  logout: () => void;
}

/**
 * Auth responses carry the role profile in `profile`, whereas the UI uses
 * studentProfile/teacherProfile. Normalize it once at the store boundary so
 * every component has the real name and photo immediately after login.
 */
const normalizeUser = (user: User): User => {
  const profile = (user as User & { profile?: User['studentProfile'] | User['teacherProfile'] }).profile;
  if (!profile) return user;

  return {
    ...user,
    studentProfile:
      user.role === 'STUDENT' ? user.studentProfile || (profile as User['studentProfile']) : user.studentProfile,
    teacherProfile:
      user.role === 'TEACHER' ? user.teacherProfile || (profile as User['teacherProfile']) : user.teacherProfile,
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        const normalizedUser = normalizeUser(user);
        return set({
          user: normalizedUser,
          token,
          role: normalizedUser.role,
          isAuthenticated: true,
        });
      },

      setToken: (token) =>
        set((state) => ({
          token,
          isAuthenticated: !!token && !!state.user,
        })),

      setUser: (user) => {
        const normalizedUser = normalizeUser(user);
        return set({
          user: normalizedUser,
          role: normalizedUser.role,
        });
      },

      updateUserProfile: (profile) =>
        set((state) => {
          if (!state.user) return state;
          const isTeacher = state.user.role === 'TEACHER';
          return {
            user: {
              ...state.user,
              studentProfile: !isTeacher ? { ...state.user.studentProfile, ...profile } : state.user.studentProfile,
              teacherProfile: isTeacher ? { ...state.user.teacherProfile, ...profile } : state.user.teacherProfile,
            },
          };
        }),

      logout: () => {
        // Keep each student's saved cart, but detach it from the active UI.
        // It will be restored only after the same account signs in again.
        useCartStore.getState().setOwner(null);
        set({
          user: null,
          token: null,
          role: null,
          isAuthenticated: false,
        });
      },
    }),
    {
name: 'sanad_auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Restores only the current account's cart after a browser refresh.
        useCartStore.getState().setOwner(state?.user?.id ?? null);
      },
    }
  )
);
