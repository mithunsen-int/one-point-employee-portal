import { StakeholderPanelLayout } from "@/modules/stakeholder-panel-ui/components/StakeholderPanelLayout";
import { RequestDetail } from "@/modules/stakeholder-panel-ui/components/RequestDetail";

export default async function MyRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <StakeholderPanelLayout>
      <RequestDetail id={id} />
    </StakeholderPanelLayout>
  );
}
