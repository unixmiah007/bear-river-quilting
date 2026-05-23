import { createContext, useContext, useRef } from 'react';
import { pickHomeHeroBackground } from '../lib/homeHeroBackgrounds.js';

const HomeHeroBackgroundContext = createContext(null);

/** Picks one hero background per homepage visit (new pick on full refresh). */
export function HomeHeroBackgroundProvider({ children }) {
  const srcRef = useRef(null);
  if (!srcRef.current) {
    srcRef.current = pickHomeHeroBackground();
  }
  return (
    <HomeHeroBackgroundContext.Provider value={srcRef.current}>
      {children}
    </HomeHeroBackgroundContext.Provider>
  );
}

export function useHomeHeroBackground() {
  const src = useContext(HomeHeroBackgroundContext);
  if (!src) {
    throw new Error('useHomeHeroBackground must be used within HomeHeroBackgroundProvider on /');
  }
  return src;
}
