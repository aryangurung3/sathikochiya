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
import { Textarea } from "@/components/ui/textarea";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import * as XLSX from "xlsx";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

type Expense = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  remarks?: string | null;
  total: number;
  createdAt: Date | string;
};

export function ExpenseManagement({
  initialExpenses,
}: {
  initialExpenses: Expense[];
}) {
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch("/api/expenses");
      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch expenses. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addExpense = async () => {
    if (name && quantity && price && !isLoading) {
      setIsLoading(true);
      try {
        const now = new Date();
        const expenseDate = selectedDate
          ? new Date(
              selectedDate.getFullYear(),
              selectedDate.getMonth(),
              selectedDate.getDate(),
              now.getHours(),
              now.getMinutes(),
              now.getSeconds()
            )
          : now;

        const response = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            quantity: Number.parseFloat(quantity),
            price: Number(price),
            remarks,
            createdAt: expenseDate.toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to add expense");
        }

        const newExpense = await response.json();
        setExpenses([newExpense, ...expenses]);
        setName("");
        setQuantity("");
        setPrice("");
        setRemarks("");
        setSelectedDate(undefined); // Reset the date picker
        toast({
          title: "Expense added",
          description: `A new expense "${newExpense.name}" has been added.`,
        });
        fetchExpenses();
      } catch (error) {
        console.error("Error adding expense:", error);
        toast({
          title: "Error",
          description: "Failed to add expense. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      toast({
        title: "Error",
        description: "Name, quantity, and price are required.",
        variant: "destructive",
      });
    }
  };

  const updateExpense = async () => {
    if (editingExpense && name && quantity && price && !isLoading) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/expenses/${editingExpense.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            quantity: Number.parseFloat(quantity),
            price: Number(price),
            remarks,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update expense");
        }

        const updatedExpense = await response.json();
        setExpenses(
          expenses.map((expense) =>
            expense.id === updatedExpense.id ? updatedExpense : expense
          )
        );
        setEditingExpense(null);
        setName("");
        setQuantity("");
        setPrice("");
        setRemarks("");
        toast({
          title: "Expense updated",
          description: `The expense "${updatedExpense.name}" has been updated.`,
        });
        fetchExpenses();
      } catch (error) {
        console.error("Error updating expense:", error);
        toast({
          title: "Error",
          description: "Failed to update expense. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (!isLoading) {
      setIsLoading(true);
      setIsDeletingId(expenseId);
      try {
        const response = await fetch(`/api/expenses/${expenseId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete expense");
        }

        setExpenses(expenses.filter((expense) => expense.id !== expenseId));
        toast({
          title: "Expense deleted",
          description: "The expense has been successfully deleted.",
        });
        fetchExpenses();
      } catch (error) {
        console.error("Error deleting expense:", error);
        toast({
          title: "Error",
          description: "Failed to delete expense. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setIsDeletingId(null);
      }
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // First, apply search filter
      const matchesSearch = expense.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // Then, apply date range filter if it exists
      if (dateRange?.from && dateRange?.to) {
        const expenseDate = new Date(expense.createdAt);
        const isWithinDateRange =
          expenseDate >= dateRange.from && expenseDate <= dateRange.to;
        return matchesSearch && isWithinDateRange;
      }

      return matchesSearch;
    });
  }, [expenses, searchTerm, dateRange]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredExpenses.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const startEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setName(expense.name);
    setQuantity(String(expense.quantity));
    setPrice(String(expense.price));
    setRemarks(expense.remarks || "");
  };

  const downloadExcel = () => {
    try {
      // Prepare data for export - use filteredExpenses to include date range and search filters
      const exportData = filteredExpenses.map((expense) => ({
        Name: expense.name,
        Quantity: expense.quantity,
        "Price (Rs.)": expense.price.toFixed(2),
        "Total (Rs.)": expense.total.toFixed(2),
        Remarks: expense.remarks || "N/A",
        Date: new Date(expense.createdAt).toLocaleString(),
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Expenses");

      // Generate filename with date range if present
      let filename = "expenses";
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
        description: "Expenses data has been downloaded.",
      });
    } catch (error) {
      console.error("Error downloading excel:", error);
      toast({
        title: "Error",
        description: "Failed to download expenses data.",
        variant: "destructive",
      });
    }
  };

  const datePickerSection = (
    <div>
      <Label htmlFor="expenseDate">Expense Date (Optional)</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={`w-full justify-start text-left font-normal ${
              !selectedDate && "text-muted-foreground"
            }`}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate
              ? format(selectedDate, "PPP")
              : "Select date (defaults to today)"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          {editingExpense ? "Edit Expense" : "Add New Expense"}
        </h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Expense Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter expense name"
              required
            />
          </div>
          {datePickerSection}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                required
              />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter remarks"
              className="resize-none"
            />
          </div>
          {quantity && price && (
            <div className="font-semibold">
              Total: Rs. {(Number(quantity) * Number(price)).toFixed(2)}
            </div>
          )}
          <Button
            onClick={editingExpense ? updateExpense : addExpense}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editingExpense ? "Updating Expense..." : "Adding Expense..."}
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                {editingExpense ? "Update Expense" : "Add Expense"}
              </>
            )}
          </Button>
          {editingExpense && (
            <Button
              onClick={() => {
                setEditingExpense(null);
                setName("");
                setQuantity("");
                setPrice("");
                setRemarks("");
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
        <h2 className="text-xl font-semibold mb-4">Expenses List</h2>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Input
                type="text"
                placeholder="Search by expense name"
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
          <Button variant="outline" onClick={downloadExcel}>
            <Download className="h-4 w-4 mr-2" />
            Download Excel
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.name}</TableCell>
                <TableCell>{expense.quantity.toFixed(2)}</TableCell>
                <TableCell>Rs. {expense.price.toFixed(2)}</TableCell>
                <TableCell>Rs. {expense.total.toFixed(2)}</TableCell>
                <TableCell>{expense.remarks || "N/A"}</TableCell>
                <TableCell>
                  {new Date(expense.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      onClick={() => startEditExpense(expense)}
                    >
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
                            Are you sure you want to delete this expense?
                          </DialogTitle>
                        </DialogHeader>
                        <p>This action cannot be undone.</p>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => {}}>
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => deleteExpense(expense.id)}
                            disabled={isDeletingId === expense.id}
                          >
                            {isDeletingId === expense.id ? (
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
            {Math.min(indexOfLastItem, filteredExpenses.length)} of{" "}
            {filteredExpenses.length} entries
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
              disabled={indexOfLastItem >= filteredExpenses.length}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
