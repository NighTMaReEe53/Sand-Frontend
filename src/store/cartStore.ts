import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Course } from '../types/course.types';

export interface CartItem {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  price: number;
  isFree: boolean;
  gradeLevel: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  /** The cart is scoped to the signed-in account, never to the browser alone. */
  ownerId: string | null;
  cartsByUser: Record<string, CartItem[]>;
  setOwner: (userId: string | null) => void;
  addItem: (course: Course) => boolean;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setOpen: (open: boolean) => void;
  toggleCart: () => void;
  getTotalPrice: () => number;
  hasItem: (id: string) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      ownerId: null,
      cartsByUser: {},

      setOwner: (userId) =>
        set((state) => ({
          ownerId: userId,
          // A logged-out visitor must not see the previous student's items.
          items: userId ? state.cartsByUser[userId] || [] : [],
          isOpen: false,
        })),

      addItem: (course: Course) => {
        if (course.isEnrolled || course.enrollmentStatus === 'ACTIVE') {
          return false; // Already enrolled in course
        }

        const { items } = get();
        if (items.some((item) => item.id === course.id)) {
          return false; // Already in cart
        }

        const priceNum = typeof course.price === 'string' ? parseFloat(course.price) : course.price;

        const newItem: CartItem = {
          id: course.id,
          title: course.title,
          thumbnailUrl: course.thumbnailUrl,
          price: isNaN(priceNum) ? 0 : priceNum,
          isFree: course.isFree,
          gradeLevel: course.gradeLevel,
        };

        set((state) => {
          const nextItems = [...state.items, newItem];
          return {
            items: nextItems,
            isOpen: true,
            cartsByUser: state.ownerId
              ? { ...state.cartsByUser, [state.ownerId]: nextItems }
              : state.cartsByUser,
          };
        });
        return true;
      },

      removeItem: (id: string) => {
        set((state) => {
          const nextItems = state.items.filter((item) => item.id !== id);
          return {
            items: nextItems,
            cartsByUser: state.ownerId
              ? { ...state.cartsByUser, [state.ownerId]: nextItems }
              : state.cartsByUser,
          };
        });
      },

      clearCart: () =>
        set((state) => ({
          items: [],
          cartsByUser: state.ownerId
            ? { ...state.cartsByUser, [state.ownerId]: [] }
            : state.cartsByUser,
        })),

      setOpen: (isOpen) => set({ isOpen }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.isFree ? 0 : item.price), 0);
      },

      hasItem: (id: string) => {
        return get().items.some((item) => item.id === id);
      },
    }),
    {
name: 'sanad_cart',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      // Do not persist the active account or its derived items. This prevents
      // a previous user's cart from flashing while another account signs in.
      partialize: (state) => ({ cartsByUser: state.cartsByUser }),
      migrate: (persistedState: any, version) => {
        if (version < 2) {
          // Older builds stored one browser-wide cart. It cannot be safely
          // attributed to an account, so leave it out instead of leaking it.
          return { cartsByUser: {} };
        }
        return persistedState;
      },
    }
  )
);
