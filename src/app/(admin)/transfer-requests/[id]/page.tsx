import { AdminPanelLayout } from "@/modules/admin-panel-ui/components/AdminPanelLayout";
import { TransferRequestDetail } from "@/modules/admin-panel-ui/components/TransferRequestDetail";

export default async function TransferRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AdminPanelLayout>
      <TransferRequestDetail id={id} />
    </AdminPanelLayout>
  );
}
