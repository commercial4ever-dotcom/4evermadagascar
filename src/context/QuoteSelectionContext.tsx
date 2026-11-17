import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ProductItem, QuoteProductLine } from '../types.ts';

interface QuoteSelectionContextValue {
  items: QuoteProductLine[];
  totalQuantity: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (item: { productId?: string; code: string; name: string }, quantity?: number) => void;
  addProduct: (product: ProductItem, quantity?: number) => void;
  updateQuantity: (code: string, name: string, quantity: number) => void;
  removeItem: (code: string, name: string) => void;
  clearSelection: () => void;
}

const STORAGE_KEY = '4ever_quote_selection_v1';

const QuoteSelectionContext = createContext<QuoteSelectionContextValue | null>(null);

export function QuoteSelectionProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QuoteProductLine[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage errors
    }
  }, [items]);

  const addItem = (item: { productId?: string; code: string; name: string }, quantity = 1) => {
    const qty = Math.max(1, Math.floor(quantity));
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.code === item.code && p.name === item.name);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [...prev, { productId: item.productId, code: item.code, name: item.name, quantity: qty }];
    });
  };

  const addProduct = (product: ProductItem, quantity = 1) => {
    addItem({ productId: product.id, code: product.code, name: product.name }, quantity);
  };

  const updateQuantity = (code: string, name: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(code, name);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.code === code && item.name === name ? { ...item, quantity: Math.floor(quantity) } : item,
      ),
    );
  };

  const removeItem = (code: string, name: string) => {
    setItems((prev) => prev.filter((item) => !(item.code === code && item.name === name)));
  };

  const clearSelection = () => {
    setItems([]);
  };

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <QuoteSelectionContext.Provider
      value={{
        items,
        totalQuantity,
        isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        addItem,
        addProduct,
        updateQuantity,
        removeItem,
        clearSelection,
      }}
    >
      {children}
    </QuoteSelectionContext.Provider>
  );
}

export function useQuoteSelection() {
  const ctx = useContext(QuoteSelectionContext);
  if (!ctx) {
    throw new Error('useQuoteSelection must be used within QuoteSelectionProvider');
  }
  return ctx;
}
