import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout, { type View } from "@/components/AdminLayout";
import DashboardView     from "@/pages/DashboardView";
import KycQueueView      from "@/pages/KycQueueView";
import RiskEventsView    from "@/pages/RiskEventsView";
import AuditLogView      from "@/pages/AuditLogView";
import UsersView         from "@/pages/UsersView";
import UserProfileView   from "@/pages/UserProfileView";
import ActivityLogsView  from "@/pages/ActivityLogsView";
import FundRequestsView  from "@/pages/FundRequestsView";
import { useLoading } from "@/context/LoadingContext";
import {
  useAdminRealtime,
  type RegistrationEvent,
  type ApplicationCompleteEvent,
  type ConnectionStatus,
} from "@/hooks/useAdminRealtime";
import { toast } from "@/lib/guardian-toast";

export default function KycDashboard() {
  const [activeView,       setActiveView]       = useState<View>("dashboard");
  const [profileEmail,     setProfileEmail]     = useState<string | null>(null);
  const [profileFromView,  setProfileFromView]  = useState<View>("users");
  const [realtimeStatus,   setRealtimeStatus]   = useState<ConnectionStatus>("connecting");
  const { startLoading, stopLoading } = useLoading();
  const prevView = useRef<string>(activeView);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (prevView.current !== activeView) {
      prevView.current = activeView;
      startLoading();
      requestAnimationFrame(() => stopLoading());
    }
  }, [activeView, startLoading, stopLoading]);

  const handleNewRegistration = useCallback((event: RegistrationEvent) => {
    toast.info(
      "New User Registered",
      event.email,
      6000,
    );
    queryClient.invalidateQueries({ queryKey: ["dashboard-users"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-queue"] });
    queryClient.invalidateQueries({ queryKey: ["kyc-queue"] });
    queryClient.invalidateQueries({ queryKey: ["all-users"] });
    queryClient.invalidateQueries({ queryKey: ["registration-log"] });
  }, [queryClient]);

  const handleApplicationComplete = useCallback((event: ApplicationCompleteEvent) => {
    toast.success(
      "Application Complete",
      `${event.email} finished all ${event.totalSteps} steps`,
      6000,
    );
    queryClient.invalidateQueries({ queryKey: ["dashboard-queue"] });
    queryClient.invalidateQueries({ queryKey: ["kyc-queue"] });
    queryClient.invalidateQueries({ queryKey: ["all-users"] });
    queryClient.invalidateQueries({ queryKey: ["registration-log"] });
  }, [queryClient]);

  const { status } = useAdminRealtime({
    onNewRegistration: handleNewRegistration,
    onApplicationComplete: handleApplicationComplete,
  });

  useEffect(() => {
    setRealtimeStatus(status);
  }, [status]);

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

  if (profileEmail) {
    return (
      <AdminLayout activeView={profileFromView} setActiveView={handleSetView}>
        <UserProfileView email={profileEmail} onBack={closeProfile} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeView={activeView} setActiveView={handleSetView}>
      {activeView === "dashboard" && <DashboardView realtimeStatus={realtimeStatus} />}
      {activeView === "kyc"      && <KycQueueView onOpenProfile={(email) => openProfile(email, "kyc")} />}
      {activeView === "users"    && <UsersView onOpenProfile={(email) => openProfile(email, "users")} />}
      {activeView === "funds"    && <FundRequestsView />}
      {activeView === "risk"     && <RiskEventsView />}
      {activeView === "activity" && <ActivityLogsView onOpenProfile={(email) => openProfile(email, "activity")} />}
      {activeView === "audit"    && <AuditLogView />}
    </AdminLayout>
  );
}
