import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Navbar } from "./components/common/Navbar";
import { Sidebar, type NavTab } from "./components/common/Sidebar";
import { MobileNav } from "./components/common/MobileNav";
import { FarmerDashboard } from "./components/farmer/FarmerDashboard";
import { BiosecurityPassportModal } from "./components/farmer/BiosecurityPassportModal";
import { RiskDashboard } from "./components/risk/RiskDashboard";
import { IncidentReportForm } from "./components/incident/IncidentReportForm";
import { VetDashboard } from "./components/vet/VetDashboard";
import { CorrectiveActionsList } from "./components/corrective/CorrectiveActionsList";
import { OfficerDashboard } from "./components/officer/OfficerDashboard";
import { GisFarmMap } from "./components/gis/GisFarmMap";
import { NotificationCenter } from "./components/notifications/NotificationCenter";
import { AarohiAdvisorModal } from "./components/common/AarohiAdvisorModal";
import "./App.css";

function AppContent() {
  const { role } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [isReportIncidentOpen, setIsReportIncidentOpen] = useState(false);
  const [isAarohiOpen, setIsAarohiOpen] = useState(false);

  const farmerDashboard = (
    <FarmerDashboard
      onOpenPassport={() => setIsPassportOpen(true)}
      onOpenReportIncident={() => setIsReportIncidentOpen(true)}
      onNavigateToActions={() => setActiveTab("actions")}
      onNavigateToRisk={() => setActiveTab("risk")}
    />
  );

  return (
    <div className="bioshield-app">
      <Navbar onToggleMobileNav={() => setIsMobileNavOpen(true)} />

      <div className="app-workspace-layout">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenPassport={() => setIsPassportOpen(true)}
          onOpenReportIncident={() => setIsReportIncidentOpen(true)}
          onOpenAarohi={() => setIsAarohiOpen(true)}
        />

        <MobileNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
          onOpenPassport={() => setIsPassportOpen(true)}
          onOpenReportIncident={() => setIsReportIncidentOpen(true)}
        />

        <main className="bioshield-main-content">
          {activeTab === "overview" &&
            (role === "farmer"
              ? farmerDashboard
              : role === "veterinarian"
              ? <VetDashboard />
              : <OfficerDashboard onNavigateToGis={() => setActiveTab("gis")} />)}

          {activeTab === "passport" && farmerDashboard}

          {activeTab === "risk" && <RiskDashboard />}

          {activeTab === "incident" &&
            (role === "veterinarian" ? <VetDashboard /> : farmerDashboard)}

          {activeTab === "actions" && <CorrectiveActionsList />}

          {activeTab === "gis" && (
            <GisFarmMap onOpenPassport={() => setIsPassportOpen(true)} />
          )}

          {activeTab === "officer" && (
            <OfficerDashboard onNavigateToGis={() => setActiveTab("gis")} />
          )}
        </main>
      </div>

      <BiosecurityPassportModal
        isOpen={isPassportOpen}
        onClose={() => setIsPassportOpen(false)}
      />

      <IncidentReportForm
        isOpen={isReportIncidentOpen}
        onClose={() => setIsReportIncidentOpen(false)}
      />

      <AarohiAdvisorModal
        isOpen={isAarohiOpen}
        onClose={() => setIsAarohiOpen(false)}
      />

      <NotificationCenter />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
