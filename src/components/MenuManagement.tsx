"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMenuItems } from "@/hooks/useMenuItems";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export function MenuManagement() {
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const { menuItems, isDeleting, addMenuItem, deleteMenuItem } = useMenuItems();

  const handleAddMenuItem = async () => {
    if (newItemTitle && newItemPrice) {
      await addMenuItem(newItemTitle, Number.parseFloat(newItemPrice));
      setNewItemTitle("");
      setNewItemPrice("");
    }
  };

  const openDeleteDialog = (id: string) => {
    setItemToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteMenuItem = async () => {
    if (itemToDelete) {
      await deleteMenuItem(itemToDelete);
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Add New Menu Item</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="itemTitle">Item Title</Label>
            <Input
              id="itemTitle"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="Enter item title"
            />
          </div>
          <div>
            <Label htmlFor="itemPrice">Item Price</Label>
            <Input
              id="itemPrice"
              type="number"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              placeholder="Enter item price"
            />
          </div>
          <Button onClick={handleAddMenuItem} className="w-full">
            Add Menu Item
          </Button>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Current Menu Items</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <li
              key={item.id}
              className="bg-gray-100 p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-gray-600">Rs. {item.price.toFixed(2)}</p>
              </div>
              <Button
                variant="destructive"
                onClick={() => openDeleteDialog(item.id)}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Are you sure you want to delete this item?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              menu item and all associated sales from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMenuItem}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
