import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { readFavoriteIds, toggleFavoriteId, writeFavoriteIds } from '../lib/favoritesStorage.js';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = useState(() => readFavoriteIds());

  const isFavorite = useCallback(
    (productId) => favoriteIds.includes(Number(productId)),
    [favoriteIds]
  );

  const toggleFavorite = useCallback((productId) => {
    const next = toggleFavoriteId(productId);
    setFavoriteIds(next);
    return next.includes(Number(productId));
  }, []);

  const removeFavorite = useCallback((productId) => {
    const n = Number(productId);
    const next = writeFavoriteIds(favoriteIds.filter((id) => id !== n));
    setFavoriteIds(next);
  }, [favoriteIds]);

  const api = useMemo(
    () => ({
      favoriteIds,
      isFavorite,
      toggleFavorite,
      removeFavorite,
    }),
    [favoriteIds, isFavorite, toggleFavorite, removeFavorite]
  );

  return <FavoritesContext.Provider value={api}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider');
  return ctx;
}
