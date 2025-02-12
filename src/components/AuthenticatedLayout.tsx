"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type React from "react"; // Added import for React
import { Sidebar } from "./Sidebar";
import Skeleton from "react-loading-skeleton";

export function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, checkSession } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      await checkSession();
      if (!user && !loading) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [user, loading, router, checkSession]);

  if (loading) {
    return <Skeleton height={100} className="my-2" count={3} />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
