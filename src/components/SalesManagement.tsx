"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Search,
  PlusCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type MenuItem = {
  id: string;
  title: string;
  price: number;
};

type SaleItem = {
  id?: string;
  menuItem: MenuItem;
  quantity: number;
};

type Sale = {
  id: string;
  customerName: string;
  items: SaleItem[];
  total: number;
  createdAt: Date | string;
};

export function SalesManagement({ initialSales }: { initialSales: Sale[] }) {
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [customerName, setCustomerName] = useState("");
  const [currentSaleItems, setCurrentSaleItems] = useState<SaleItem[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchMenuItems();
  });

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("/api/menu-items");
      if (!response.ok) {
        throw new Error("Failed to fetch menu items");
      }
      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast({
        title: "Error",
        description: "Failed to fetch menu items. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addItemToSale = () => {
    if (!selectedMenuItem) {
      toast({
        title: "Error",
        description: "Please select a menu item.",
        variant: "destructive",
      });
      return;
    }

    const parsedQuantity = Number.parseInt(quantity);

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be greater than zero.",
        variant: "destructive",
      });
      return;
    }

    const menuItem = menuItems.find((item) => item.id === selectedMenuItem);
    if (menuItem) {
      const newItem: SaleItem = {
        menuItem,
        quantity: parsedQuantity,
      };
      setCurrentSaleItems([...currentSaleItems, newItem]);
      setSelectedMenuItem("");
      setQuantity("");
    }
  };

  const removeItemFromSale = (index: number) => {
    setCurrentSaleItems(currentSaleItems.filter((_, i) => i !== index));
  };

  const calculateTotal = (items: SaleItem[]) => {
    return items.reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0
    );
  };

  const addSale = async () => {
    if (customerName && currentSaleItems.length > 0 && !isLoading) {
      setIsLoading(true);
      try {
        const response = await fetch("/api/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName,
            items: currentSaleItems,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to add sale");
        }

        const newSale = await response.json();
        setSales([newSale, ...sales]);
        setCustomerName("");
        setCurrentSaleItems([]);
        toast({
          title: "Sale added",
          description: `A new sale for ${newSale.customerName} has been added.`,
        });
        router.refresh();
      } catch (error) {
        console.error("Error adding sale:", error);
        toast({
          title: "Error",
          description: "Failed to add sale. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const startEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setCustomerName(sale.customerName);
    setCurrentSaleItems(sale.items);
  };

  const updateSale = async () => {
    if (
      editingSale &&
      customerName &&
      currentSaleItems.length > 0 &&
      !isLoading
    ) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/sales/${editingSale.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName,
            items: currentSaleItems,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update sale");
        }

        const updatedSale = await response.json();
        setSales(
          sales.map((sale) => (sale.id === updatedSale.id ? updatedSale : sale))
        );
        setEditingSale(null);
        setCustomerName("");
        setCurrentSaleItems([]);
        toast({
          title: "Sale updated",
          description: `The sale for ${updatedSale.customerName} has been updated.`,
        });
        router.refresh();
      } catch (error) {
        console.error("Error updating sale:", error);
        toast({
          title: "Error",
          description: "Failed to update sale. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const deleteSale = async (saleId: string) => {
    if (!isLoading) {
      setIsLoading(true);
      setIsDeletingId(saleId);
      try {
        const response = await fetch(`/api/sales/${saleId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete sale");
        }

        setSales(sales.filter((sale) => sale.id !== saleId));
        toast({
          title: "Sale deleted",
          description: "The sale has been successfully deleted.",
        });
        router.refresh();
      } catch (error) {
        console.error("Error deleting sale:", error);
        toast({
          title: "Error",
          description: "Failed to delete sale. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setIsDeletingId(null);
      }
    }
  };

  const filteredSales = useMemo(() => {
    return sales.filter((sale) =>
      sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sales, searchTerm]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSales.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          {editingSale ? "Edit Sale" : "Add New Sale"}
        </h2>
        {/* ... (rest of the form code remains unchanged) ... */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="menuItem">Menu Item</Label>
              <Select
                value={selectedMenuItem}
                onValueChange={setSelectedMenuItem}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select menu item" />
                </SelectTrigger>
                <SelectContent>
                  {menuItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Qty"
              />
            </div>
            <Button onClick={addItemToSale} className="mt-auto">
              Add Item
            </Button>
          </div>
          {currentSaleItems.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Current Sale Items</h3>
              <ul className="space-y-2">
                {currentSaleItems.map((item, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span>
                      {item.menuItem.title} x{item.quantity}
                    </span>
                    <span>
                      Rs. {(item.menuItem.price * item.quantity).toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItemFromSale(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="mt-2 font-semibold">
                Total: Rs. {calculateTotal(currentSaleItems).toFixed(2)}
              </div>
            </div>
          )}
          <Button
            onClick={editingSale ? updateSale : addSale}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editingSale ? "Updating Sale..." : "Adding Sale..."}
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                {editingSale ? "Update Sale" : "Add Sale"}
              </>
            )}
          </Button>
          {editingSale && (
            <Button
              onClick={() => {
                setEditingSale(null);
                setCustomerName("");
                setCurrentSaleItems([]);
              }}
              className="w-full"
              variant="outline"
            >
              Cancel Edit
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Sales List</h2>
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-64">
            <Input
              type="text"
              placeholder="Search by customer name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>{sale.customerName}</TableCell>
                <TableCell>
                  {sale.items.map((item, index) => (
                    <div key={index}>
                      {item.menuItem.title} x{item.quantity}
                    </div>
                  ))}
                </TableCell>
                <TableCell>Rs. {sale.total.toFixed(2)}</TableCell>
                <TableCell>
                  {new Date(sale.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" onClick={() => startEditSale(sale)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Are you sure you want to delete this sale?
                          </DialogTitle>
                        </DialogHeader>
                        <p>This action cannot be undone.</p>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => {}}>
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => deleteSale(sale.id)}
                            disabled={isDeletingId === sale.id}
                          >
                            {isDeletingId === sale.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 flex justify-between items-center">
          <div>
            Showing {indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredSales.length)} of{" "}
            {filteredSales.length} entries
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => paginate(currentPage + 1)}
              disabled={indexOfLastItem >= filteredSales.length}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
