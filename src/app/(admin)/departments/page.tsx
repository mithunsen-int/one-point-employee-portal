import { AdminPanelLayout } from "@/modules/admin-panel-ui/components/AdminPanelLayout";
import { DepartmentManagement } from "@/modules/admin-panel-ui/components/DepartmentManagement";

export default function DepartmentsPage() {
  return (
    <AdminPanelLayout>
      <DepartmentManagement />
    </AdminPanelLayout>
  );
}
