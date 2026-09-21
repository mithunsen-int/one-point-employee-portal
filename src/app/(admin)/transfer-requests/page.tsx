import { AdminPanelLayout } from "@/modules/admin-panel-ui/components/AdminPanelLayout";
import { MonitoringList } from "@/modules/admin-panel-ui/components/MonitoringList";

export default function TransferRequestsPage() {
  return (
    <AdminPanelLayout>
      <MonitoringList />
    </AdminPanelLayout>
  );
}
