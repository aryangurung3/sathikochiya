"use client";

import type React from "react";
import { createContext, useState, useContext } from "react";

export type MenuItem = {
  id: string;
  title: string;
  price: number;
};

type MenuContextType = {
  menuItems: MenuItem[];
  addMenuItem: (item: MenuItem) => void;
};

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const addMenuItem = (item: MenuItem) => {
    setMenuItems((prevItems) => [...prevItems, item]);
  };

  return (
    <MenuContext.Provider value={{ menuItems, addMenuItem }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return context;
}
