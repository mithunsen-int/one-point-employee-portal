import { StakeholderPanelLayout } from "@/modules/stakeholder-panel-ui/components/StakeholderPanelLayout";
import { SubmitRequestForm } from "@/modules/stakeholder-panel-ui/components/SubmitRequestForm";

export default function NewTransferRequestPage() {
  return (
    <StakeholderPanelLayout>
      <SubmitRequestForm />
    </StakeholderPanelLayout>
  );
}
