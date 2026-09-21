import { AdminPanelLayout } from "@/modules/admin-panel-ui/components/AdminPanelLayout";
import { UserManagement } from "@/modules/admin-panel-ui/components/UserManagement";

export default function UsersPage() {
  return (
    <AdminPanelLayout>
      <UserManagement />
    </AdminPanelLayout>
  );
}
