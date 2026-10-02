import React, { createContext, useContext, useEffect, useState } from 'react';

type AppState = {
  cart: string[];
  favorites: string[];
  uptimeSeconds: number;
  addToCart: (id: string) => void;
  toggleFavorite: (id: string) => void;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [uptimeSeconds, setUptimeSeconds] = useState(0);

  useEffect(() => {
    setInterval(() => {
      setUptimeSeconds((s) => s + 1);
    }, 1000);
  }, []);

  const addToCart = (id: string) => setCart((c) => [...c, id]);
  const toggleFavorite = (id: string) =>
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  return (
    <AppContext.Provider
      value={{ cart, favorites, uptimeSeconds, addToCart, toggleFavorite }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
