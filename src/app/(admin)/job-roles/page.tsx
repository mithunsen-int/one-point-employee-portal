import { AdminPanelLayout } from "@/modules/admin-panel-ui/components/AdminPanelLayout";
import { JobRoleManagement } from "@/modules/admin-panel-ui/components/JobRoleManagement";

export default function JobRolesPage() {
  return (
    <AdminPanelLayout>
      <JobRoleManagement />
    </AdminPanelLayout>
  );
}
