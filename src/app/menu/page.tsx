import { MenuManagement } from "@/components/MenuManagement";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";

export default function MenuPage() {
  return (
    <AuthenticatedLayout>
      <h1 className="text-3xl font-bold mb-6">Sathi ko Chiya Menu</h1>
      <MenuManagement />
    </AuthenticatedLayout>
  );
}
