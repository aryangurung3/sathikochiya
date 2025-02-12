"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export type MenuItem = {
  id: string;
  title: string;
  price: number;
};

export function useMenuItems() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await fetch("/api/menu-items");
      if (!response.ok) {
        throw new Error("Failed to fetch menu items");
      }
      const items = await response.json();
      setMenuItems(items);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast({
        title: "Error",
        description: "Failed to fetch menu items. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const addMenuItem = useCallback(
    async (title: string, price: number) => {
      try {
        const response = await fetch("/api/menu-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, price }),
        });

        if (!response.ok) {
          throw new Error("Failed to add menu item");
        }

        const newItem = await response.json();
        setMenuItems((prevItems) => [...prevItems, newItem]);
        toast({
          title: "Menu item added",
          description: `${newItem.title} has been added to the menu.`,
        });
      } catch (error) {
        console.error("Error adding menu item:", error);
        toast({
          title: "Error",
          description: "Failed to add menu item. Please try again.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const deleteMenuItem = useCallback(
    async (id: string) => {
      setIsDeleting(true);
      try {
        const response = await fetch("/api/menu-items", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          throw new Error("Failed to delete menu item");
        }

        setMenuItems((prevItems) => prevItems.filter((item) => item.id !== id));
        toast({
          title: "Menu item deleted",
          description: "The menu item and associated sales have been removed.",
        });
      } catch (error) {
        console.error("Error deleting menu item:", error);
        toast({
          title: "Error",
          description: "Failed to delete menu item. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(false);
      }
    },
    [toast]
  );

  return { menuItems, isDeleting, fetchMenuItems, addMenuItem, deleteMenuItem };
}
