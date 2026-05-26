"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, ShippingOption } from "@/types";
// CartItem re-exported so match() lambda can reference its type

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  shippingOption: ShippingOption | null;
  shippingCp: string;

  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string, color: string | null) => void;
  updateQuantity: (productId: string, size: string, color: string | null, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setShippingOption: (option: ShippingOption | null) => void;
  setShippingCp: (cp: string) => void;
  totalItems: () => number;
  totalPrice: () => number;
  totalWithShipping: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      shippingOption: null,
      shippingCp: "",

      addItem: (newItem) => {
        set((state) => {
          const match = (i: CartItem) =>
            i.product_id === newItem.product_id &&
            i.size === newItem.size &&
            i.color === newItem.color;

          const existing = state.items.find(match);
          if (existing) {
            return {
              items: state.items.map((i) =>
                match(i) ? { ...i, quantity: i.quantity + newItem.quantity } : i
              ),
              isOpen: true,
            };
          }
          return { items: [...state.items, newItem], isOpen: true };
        });
      },

      removeItem: (productId, size, color) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.product_id === productId && i.size === size && i.color === color)
          ),
        }));
      },

      updateQuantity: (productId, size, color, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size, color);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === productId && i.size === size && i.color === color
              ? { ...i, quantity }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [], shippingOption: null, shippingCp: "" }),
      openCart:   () => set({ isOpen: true }),
      closeCart:  () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      setShippingOption: (option) => set({ shippingOption: option }),
      setShippingCp:     (cp)     => set({ shippingCp: cp }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      totalWithShipping: () => {
        const base = get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        return base + (get().shippingOption?.cost ?? 0);
      },
    }),
    {
      name: "valmont-cart",
      // shippingOption no se persiste (precio cotizado puede vencer)
      // shippingCp sí se persiste para comodidad del usuario
      partialize: (state) => ({ items: state.items, shippingCp: state.shippingCp }),
    }
  )
);
