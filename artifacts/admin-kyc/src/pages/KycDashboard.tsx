import { useState } from "react";
import AdminLayout, { type View } from "@/components/AdminLayout";
import KycQueueView   from "@/pages/KycQueueView";
import RiskEventsView from "@/pages/RiskEventsView";
import AuditLogView   from "@/pages/AuditLogView";

export default function KycDashboard() {
  const [activeView, setActiveView] = useState<View>("kyc");

  return (
    <AdminLayout activeView={activeView} setActiveView={setActiveView}>
      {activeView === "kyc"   && <KycQueueView />}
      {activeView === "risk"  && <RiskEventsView />}
      {activeView === "audit" && <AuditLogView />}
    </AdminLayout>
  );
}
