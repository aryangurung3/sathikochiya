"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DatePickerWithRange,
  type DateRange,
} from "@/components/ui/date-range-picker";
import { PieChart, LineChart } from "@/components/ui/charts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Loader2, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { generatePDF } from "@/lib/generatePDF";
import { useToast } from "@/hooks/use-toast";

type Sale = {
  id: string;
  customerName: string;
  tableNumber: string;
  space: string;
  total: number;
  createdAt: string;
};

type MenuItem = {
  id: string;
  title: string;
  price: number;
};

type SaleItem = {
  id: string;
  menuItemId: string;
  quantity: number;
};

type Expense = {
  id: string;
  total: number;
  createdAt: string; // Add createdAt field
};

export default function DashboardPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();
  const pieChartRef = useRef<HTMLDivElement>(null);
  const lineChartRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let salesUrl = "/api/sales";
      let saleItemsUrl = "/api/sale-items";
      let expensesUrl = "/api/expenses";

      if (dateRange?.from && dateRange?.to) {
        const fromParam = dateRange.from.toISOString();
        const toParam = dateRange.to.toISOString();
        salesUrl += `?from=${fromParam}&to=${toParam}`;
        saleItemsUrl += `?from=${fromParam}&to=${toParam}`;
        expensesUrl += `?from=${fromParam}&to=${toParam}`;
      }

      const [
        salesResponse,
        menuItemsResponse,
        saleItemsResponse,
        expensesResponse,
      ] = await Promise.all([
        fetch(salesUrl),
        fetch("/api/menu-items"),
        fetch(saleItemsUrl),
        fetch(expensesUrl),
      ]);

      const [salesData, menuItemsData, saleItemsData, expensesData] =
        await Promise.all([
          salesResponse.json(),
          menuItemsResponse.json(),
          saleItemsResponse.json(),
          expensesResponse.json(),
        ]);

      setSales(salesData);
      setMenuItems(menuItemsData);
      setSaleItems(saleItemsData);
      setExpenses(expensesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalExpenses = expenses
    .filter((expense) => {
      if (!dateRange?.from || !dateRange?.to) return true;
      const expenseDate = new Date(expense.createdAt);
      return expenseDate >= dateRange.from && expenseDate <= dateRange.to;
    })
    .reduce((sum, expense) => sum + expense.total, 0);

  const pieChartData = menuItems.map((item) => {
    const itemSales = saleItems.filter(
      (saleItem) => saleItem.menuItemId === item.id
    );
    const totalQuantity = itemSales.reduce(
      (sum, saleItem) => sum + saleItem.quantity,
      0
    );
    return {
      name: item.title,
      value: totalQuantity,
    };
  });

  const lineChartData = sales
    .map((sale) => ({
      date: new Date(sale.createdAt).toLocaleDateString(),
      sales: 1,
    }))
    .reduce((acc: { date: string; sales: number }[], curr) => {
      const existingEntry = acc.find((entry) => entry.date === curr.date);
      if (existingEntry) {
        existingEntry.sales += curr.sales;
      } else {
        acc.push(curr);
      }
      return acc;
    }, [])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filteredSales = sales
    .filter(
      (sale) =>
        sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.tableNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 10);

  const handleDownloadReport = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdf = await generatePDF({
        totalSales,
        totalRevenue,
        totalExpenses,
        dateRange: {
          from: dateRange?.from,
          to: dateRange?.to,
        },
        pieChartElement: pieChartRef.current,
        lineChartElement: lineChartRef.current,
        recentSales: filteredSales,
      });

      // Generate filename with current date
      const dateStr = new Date().toISOString().split("T")[0];
      pdf.save(`chiya-cafe-report-${dateStr}.pdf`);

      toast({
        title: "Report Generated",
        description: "Your report has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button
            onClick={handleDownloadReport}
            disabled={isGeneratingPDF || loading}
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </>
            )}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <p className="text-4xl font-bold">{totalSales}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <p className="text-4xl font-bold">
                  Rs. {totalRevenue.toFixed(2)}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <p className="text-4xl font-bold">
                  Rs. {totalExpenses.toFixed(2)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales by Menu Item</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={pieChartRef}>
                {loading ? (
                  <Skeleton className="h-60 w-full" />
                ) : (
                  <PieChart data={pieChartData} />
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sales Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={lineChartRef}>
                {loading ? (
                  <Skeleton className="h-60 w-full" />
                ) : (
                  <LineChart data={lineChartData} />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search by customer name or table number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead>Space</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? Array.from({ length: 10 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Skeleton className="h-6 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-40" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-20" />
                          </TableCell>
                        </TableRow>
                      ))
                    : filteredSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>{sale.tableNumber}</TableCell>
                          <TableCell>{sale.space}</TableCell>
                          <TableCell>{sale.customerName}</TableCell>
                          <TableCell>
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>Rs. {sale.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
