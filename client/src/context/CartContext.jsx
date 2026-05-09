import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'cms_cart_v1';

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadStored());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const api = useMemo(() => {
    function addItem(product, quantity = 1) {
      const qty = Math.max(1, Math.min(99, Number(quantity) || 1));
      setItems((prev) => {
        const idx = prev.findIndex((x) => x.productId === product.id);
        if (idx === -1) {
          return [
            ...prev,
            {
              productId: product.id,
              name: product.name,
              price: Number(product.price),
              image_url: product.image_url ?? null,
              quantity: qty,
            },
          ];
        }
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: Math.min(99, next[idx].quantity + qty) };
        return next;
      });
    }

    function updateQty(productId, quantity) {
      const qty = Math.max(1, Math.min(99, Number(quantity) || 1));
      setItems((prev) => prev.map((x) => (x.productId === productId ? { ...x, quantity: qty } : x)));
    }

    function removeItem(productId) {
      setItems((prev) => prev.filter((x) => x.productId !== productId));
    }

    function clearCart() {
      setItems([]);
    }

    const itemCount = items.reduce((sum, x) => sum + x.quantity, 0);
    const total = items.reduce((sum, x) => sum + Number(x.price) * x.quantity, 0);

    return { items, addItem, updateQty, removeItem, clearCart, itemCount, total };
  }, [items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
