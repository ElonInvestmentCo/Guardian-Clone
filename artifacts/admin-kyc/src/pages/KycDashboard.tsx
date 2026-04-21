import { useState, useEffect, useRef } from "react";
import AdminLayout, { type View } from "@/components/AdminLayout";
import DashboardView           from "@/pages/DashboardView";
import KycQueueView            from "@/pages/KycQueueView";
import RiskEventsView          from "@/pages/RiskEventsView";
import AuditLogView            from "@/pages/AuditLogView";
import UsersView               from "@/pages/UsersView";
import UserProfileView         from "@/pages/UserProfileView";
import ActivityLogsView        from "@/pages/ActivityLogsView";
import RegistrationLogView     from "@/pages/RegistrationLogView";
import SignatureAuditLogView   from "@/pages/SignatureAuditLogView";
import SignaturesView          from "@/pages/SignaturesView";
import { useLoading } from "@/context/LoadingContext";
import type { SignatureStatus } from "@/lib/api";

export default function KycDashboard() {
  const [activeView,           setActiveView]           = useState<View>("dashboard");
  const [profileEmail,         setProfileEmail]         = useState<string | null>(null);
  const [profileFromView,      setProfileFromView]      = useState<View>("users");
  const [signaturesFilter,     setSignaturesFilter]     = useState<SignatureStatus | "">("");
  const { startLoading, stopLoading } = useLoading();
  const prevView = useRef<string>(activeView);

  useEffect(() => {
    if (prevView.current !== activeView) {
      prevView.current = activeView;
      startLoading();
      requestAnimationFrame(() => stopLoading());
    }
  }, [activeView, startLoading, stopLoading]);

  const openProfile = (email: string, fromView: View) => {
    setProfileEmail(email);
    setProfileFromView(fromView);
  };

  const closeProfile = () => {
    setProfileEmail(null);
    setActiveView(profileFromView);
  };

  const handleSetView = (v: View) => {
    setActiveView(v);
    setProfileEmail(null);
  };

  const handleNavigateToSignatures = (filter: SignatureStatus | "") => {
    setSignaturesFilter(filter);
    setActiveView("signatures");
    setProfileEmail(null);
  };

  if (profileEmail) {
    return (
      <AdminLayout activeView={profileFromView} setActiveView={handleSetView}>
        <UserProfileView email={profileEmail} onBack={closeProfile} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeView={activeView} setActiveView={handleSetView}>
      {activeView === "dashboard"    && <DashboardView onNavigateToSignatures={handleNavigateToSignatures} />}
      {activeView === "kyc"          && <KycQueueView onOpenProfile={(email) => openProfile(email, "kyc")} />}
      {activeView === "users"        && <UsersView onOpenProfile={(email) => openProfile(email, "users")} />}
      {activeView === "signatures"   && <SignaturesView initialFilter={signaturesFilter} />}
      {activeView === "risk"         && <RiskEventsView />}
      {activeView === "activity"     && <ActivityLogsView onOpenProfile={(email) => openProfile(email, "activity")} />}
      {activeView === "audit"        && <AuditLogView />}
      {activeView === "registrations"&& <RegistrationLogView />}
      {activeView === "sig-audit"    && <SignatureAuditLogView />}
    </AdminLayout>
  );
}
