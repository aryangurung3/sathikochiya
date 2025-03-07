"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Coffee, DollarSign, LogOut, BarChart, Receipt } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Sidebar() {
  const { logout, user } = useAuth();
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-4">Chiya Cafe</h2>
      <nav className="mb-4">
        <Link href="/dashboard">
          <Button
            variant={pathname === "/dashboard" ? "default" : "ghost"}
            className="w-full justify-start mb-2"
          >
            <BarChart className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <Link href="/menu">
          <Button
            variant={pathname === "/menu" ? "default" : "ghost"}
            className="w-full justify-start mb-2"
          >
            <Coffee className="mr-2 h-4 w-4" />
            Menu
          </Button>
        </Link>
        <Link href="/">
          <Button
            variant={pathname === "/" ? "default" : "ghost"}
            className="w-full justify-start mb-2"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Sales
          </Button>
        </Link>
        <Link href="/expenses">
          <Button
            variant={pathname === "/expenses" ? "default" : "ghost"}
            className="w-full justify-start mb-2"
          >
            <Receipt className="mr-2 h-4 w-4" />
            Expenses
          </Button>
        </Link>
        {/* <Link href="/change-details">
          <Button
            variant={pathname === "/change-details" ? "default" : "ghost"}
            className="w-full justify-start"
          >
            <UserCog className="mr-2 h-4 w-4" />
            Change Details
          </Button>
        </Link> */}
      </nav>
      <Separator className="my-4" />
      <div className="mt-auto">
        <p className="text-sm text-gray-500 mb-2">
          Logged in as: {user?.email}
        </p>
        <Button variant="outline" className="w-full" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
