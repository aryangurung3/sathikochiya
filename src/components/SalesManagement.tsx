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
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import * as XLSX from "xlsx";

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
  customerName: string | null;
  tableNumber: string;
  space: string;
  items: SaleItem[];
  total: number;
  createdAt: Date | string;
  isPaid: boolean;
};

export function SalesManagement({ initialSales }: { initialSales: Sale[] }) {
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [space, setSpace] = useState("");
  const [currentSaleItems, setCurrentSaleItems] = useState<SaleItem[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPaid, setFilterPaid] = useState<string>("all");
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange>();

  useEffect(() => {
    fetchMenuItems();
    fetchSales();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [dateRange?.from, dateRange?.to]);

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

  const fetchSales = async () => {
    try {
      let url = "/api/sales";
      if (dateRange?.from && dateRange?.to) {
        const params = new URLSearchParams({
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
        });
        url += `?${params.toString()}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch sales");
      }
      const data = await response.json();
      setSales(data);
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast({
        title: "Error",
        description: "Failed to fetch sales. Please try again.",
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
    if (tableNumber && currentSaleItems.length > 0 && !isLoading) {
      setIsLoading(true);
      try {
        const response = await fetch("/api/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName,
            tableNumber,
            space,
            items: currentSaleItems,
            isPaid: false,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to add sale");
        }

        const newSale = await response.json();
        setSales([newSale, ...sales]);
        setCustomerName("");
        setTableNumber("");
        setCurrentSaleItems([]);
        toast({
          title: "Sale added",
          description: `A new sale for table ${newSale.tableNumber} has been added.`,
        });
        fetchSales();
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
    } else {
      toast({
        title: "Error",
        description: "Table number and at least one item are required.",
        variant: "destructive",
      });
    }
  };

  const startEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setCustomerName(sale.customerName || "");
    setTableNumber(sale.tableNumber);
    setSpace(sale.space);
    setCurrentSaleItems(sale.items);
  };

  const updateSale = async () => {
    if (
      editingSale &&
      tableNumber &&
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
            tableNumber,
            space,
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
        setTableNumber("");
        setSpace("");
        setCurrentSaleItems([]);
        toast({
          title: "Sale updated",
          description: `The sale for table ${updatedSale.tableNumber} has been updated.`,
        });
        fetchSales();
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
        fetchSales();
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

  const togglePaidStatus = async (sale: Sale) => {
    try {
      const response = await fetch(`/api/sales/${sale.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid: !sale.isPaid }),
      });

      if (!response.ok) {
        throw new Error("Failed to update paid status");
      }

      const updatedSale = await response.json();
      setSales(
        sales.map((s) =>
          s.id === updatedSale.id ? { ...s, ...updatedSale } : s
        )
      );
      toast({
        title: "Status updated",
        description: `Sale for table ${updatedSale.tableNumber} is now ${
          updatedSale.isPaid ? "paid" : "unpaid"
        }.`,
      });
      fetchSales();
    } catch (error) {
      console.error("Error updating paid status:", error);
      toast({
        title: "Error",
        description: "Failed to update paid status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchesSearch =
        (sale.customerName?.toLowerCase() ?? "").includes(
          searchTerm.toLowerCase()
        ) || sale.tableNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterPaid === "all" ||
        (filterPaid === "paid" && sale.isPaid) ||
        (filterPaid === "unpaid" && !sale.isPaid);

      return matchesSearch && matchesFilter;
    });
  }, [sales, searchTerm, filterPaid]);

  const downloadExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredSales.map((sale) => ({
        "Table Number": sale.tableNumber,
        Space: sale.space,
        Customer: sale.customerName || "N/A",
        Items: sale.items
          .map((item) => `${item.menuItem.title} x${item.quantity}`)
          .join(", "),
        Total: `Rs. ${sale.total.toFixed(2)}`,
        Date: new Date(sale.createdAt).toLocaleString(),
        Status: sale.isPaid ? "Paid" : "Unpaid",
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sales");

      // Generate filename with date range if present
      let filename = "sales";
      if (dateRange?.from && dateRange?.to) {
        filename += `_${dateRange.from.toISOString().split("T")[0]}_to_${
          dateRange.to.toISOString().split("T")[0]
        }`;
      }
      filename += ".xlsx";

      // Download file
      XLSX.writeFile(wb, filename);

      toast({
        title: "Success",
        description: "Sales data has been downloaded.",
      });
    } catch (error) {
      console.error("Error downloading excel:", error);
      toast({
        title: "Error",
        description: "Failed to download sales data.",
        variant: "destructive",
      });
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredSales.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          {editingSale ? "Edit Sale" : "Add New Sale"}
        </h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="tableNumber">Table Number</Label>
            <Input
              id="tableNumber"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Enter table number"
              required
            />
          </div>
          <div>
            <Label htmlFor="space">Space</Label>
            <Select value={space} onValueChange={setSpace} required>
              <SelectTrigger>
                <SelectValue placeholder="Select space" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inside">Inside</SelectItem>
                <SelectItem value="outside">Outside</SelectItem>
                <SelectItem value="group-stage">Group Stage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="customerName">Customer Name (Optional)</Label>
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
            onClick={async () => {
              if (!space) {
                toast({
                  title: "Error",
                  description: "Space selection is required.",
                  variant: "destructive",
                });
                return;
              }
              if (editingSale) {
                await updateSale();
              } else {
                await addSale();
              }
            }}
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
                setTableNumber("");
                setSpace("");
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
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Input
                type="text"
                placeholder="Search by customer or table"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
              {dateRange && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateRange(undefined);
                    setCurrentPage(1); // Reset to first page when clearing date filter
                  }}
                >
                  Reset Date
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={filterPaid}
              onValueChange={(value: string) =>
                setFilterPaid(value as "all" | "paid" | "unpaid")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={downloadExcel}>
              <Download className="h-4 w-4 mr-2" />
              Download Excel
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table</TableHead>
              <TableHead>Space</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>{sale.tableNumber}</TableCell>
                <TableCell>{sale.space}</TableCell>
                <TableCell>{sale.customerName || "N/A"}</TableCell>
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
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      sale.isPaid
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {sale.isPaid ? "Paid" : "Unpaid"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePaidStatus(sale)}
                      className={sale.isPaid ? "bg-green-100" : "bg-red-100"}
                    >
                      {sale.isPaid ? "Mark Unpaid" : "Mark Paid"}
                    </Button>
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
