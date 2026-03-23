import { useState, useEffect, useRef } from "react";
import AdminLayout, { type View } from "@/components/AdminLayout";
import KycQueueView    from "@/pages/KycQueueView";
import RiskEventsView  from "@/pages/RiskEventsView";
import AuditLogView    from "@/pages/AuditLogView";
import UsersView       from "@/pages/UsersView";
import UserProfileView from "@/pages/UserProfileView";
import ActivityLogsView from "@/pages/ActivityLogsView";
import { useLoading } from "@/context/LoadingContext";

export default function KycDashboard() {
  const [activeView,       setActiveView]       = useState<View>("kyc");
  const [profileEmail,     setProfileEmail]     = useState<string | null>(null);
  const [profileFromView,  setProfileFromView]  = useState<View>("users");
  const { startLoading, stopLoading } = useLoading();
  const prevView = useRef<string>(activeView);

  useEffect(() => {
    if (prevView.current !== activeView) {
      prevView.current = activeView;
      startLoading();
      const t = setTimeout(() => stopLoading(), 500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [activeView, startLoading, stopLoading]);

  const openProfile = (email: string, fromView: View) => {
    startLoading();
    setProfileEmail(email);
    setProfileFromView(fromView);
    setTimeout(() => stopLoading(), 500);
  };

  const closeProfile = () => {
    startLoading();
    setProfileEmail(null);
    setActiveView(profileFromView);
    setTimeout(() => stopLoading(), 500);
  };

  const handleSetView = (v: View) => {
    setActiveView(v);
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
      {activeView === "kyc"      && <KycQueueView />}
      {activeView === "users"    && <UsersView onOpenProfile={(email) => openProfile(email, "users")} />}
      {activeView === "risk"     && <RiskEventsView />}
      {activeView === "activity" && <ActivityLogsView onOpenProfile={(email) => openProfile(email, "activity")} />}
      {activeView === "audit"    && <AuditLogView />}
    </AdminLayout>
  );
}
