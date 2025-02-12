import { SalesManagement } from "@/components/SalesManagement";
import prisma from "@/lib/prisma";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";

export default async function Home() {
  const sales = await prisma.sale.findMany({
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const serializedSales = sales.map((sale) => ({
    ...sale,
    createdAt: sale.createdAt.toISOString(),
    updatedAt: sale.updatedAt.toISOString(),
    items: sale.items.map((item) => ({
      ...item,
      menuItem: {
        ...item.menuItem,
      },
    })),
  }));

  return (
    <AuthenticatedLayout>
      <h1 className="text-3xl font-bold mb-6">Sathi ko Chiya</h1>
      <SalesManagement initialSales={serializedSales} />
    </AuthenticatedLayout>
  );
}
