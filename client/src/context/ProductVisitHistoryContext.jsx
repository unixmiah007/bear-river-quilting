import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  readProductVisitHistory,
  recordProductVisit as persistProductVisit,
} from '../lib/productVisitHistory.js';

const ProductVisitHistoryContext = createContext(null);

export function ProductVisitHistoryProvider({ children }) {
  const [entries, setEntries] = useState(() => readProductVisitHistory());

  const recordVisit = useCallback((productId) => {
    setEntries(persistProductVisit(productId));
  }, []);

  const api = useMemo(
    () => ({
      entries,
      recordVisit,
    }),
    [entries, recordVisit]
  );

  return (
    <ProductVisitHistoryContext.Provider value={api}>{children}</ProductVisitHistoryContext.Provider>
  );
}

export function useProductVisitHistory() {
  const ctx = useContext(ProductVisitHistoryContext);
  if (!ctx) {
    throw new Error('useProductVisitHistory must be used inside ProductVisitHistoryProvider');
  }
  return ctx;
}
