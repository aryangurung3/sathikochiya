import { ExpenseManagement } from "@/components/ExpenseManagement";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export default async function ExpensesPage() {
  const session = await getServerSession();
  const expenses = await prisma.expense.findMany({
    where: {
      userId: session?.user?.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <AuthenticatedLayout>
      <h1 className="text-3xl font-bold mb-6">Expenses</h1>
      <ExpenseManagement initialExpenses={expenses} />
    </AuthenticatedLayout>
  );
}
