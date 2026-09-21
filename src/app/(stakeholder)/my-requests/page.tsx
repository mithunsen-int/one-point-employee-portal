import { StakeholderPanelLayout } from "@/modules/stakeholder-panel-ui/components/StakeholderPanelLayout";
import { MyRequestsList } from "@/modules/stakeholder-panel-ui/components/MyRequestsList";

export default function MyRequestsPage() {
  return (
    <StakeholderPanelLayout>
      <MyRequestsList />
    </StakeholderPanelLayout>
  );
}
