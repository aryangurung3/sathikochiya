import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { ChangeDetailsForm } from "@/components/ChangeDetailsForm";

export default function ChangeDetailsPage() {
  return (
    <AuthenticatedLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Change User Details</h1>
        <ChangeDetailsForm />
      </div>
    </AuthenticatedLayout>
  );
}
