import React from "react";
import { ShieldCheck, Bell, UserCheck, Stethoscope, Landmark, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

interface NavbarProps {
  onToggleMobileNav?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileNav }) => {
  const { role, setRole, activeFarm, setActiveFarm, allFarms } = useAuth();
  const { unreadCount, setIsDrawerOpen } = useNotifications();

  return (
    <header className="bioshield-navbar">
      <div className="navbar-container">
        {/* Left: Branding & Mobile Menu */}
        <div className="navbar-left">
          <button className="mobile-menu-btn" onClick={onToggleMobileNav} aria-label="Toggle menu">
            <Menu size={22} />
          </button>
          
          <div className="navbar-brand">
            <div className="brand-icon-box">
              <ShieldCheck size={26} color="#FFFFFF" />
            </div>
            <div className="brand-titles">
              <div className="brand-tag">SIH 2026 • SIH260487</div>
              <h1 className="brand-name">AgriSentinel</h1>
              <span className="brand-sub">Digital Farm Biosecurity Platform</span>
            </div>
          </div>
        </div>

        {/* Center: Role Selection Switcher */}
        <div className="navbar-center">
          <div className="role-switcher" role="radiogroup" aria-label="Select User Role">
            <button
              className={`role-btn ${role === "farmer" ? "active" : ""}`}
              onClick={() => setRole("farmer")}
            >
              <UserCheck size={16} />
              <span>Farmer</span>
            </button>
            <button
              className={`role-btn ${role === "veterinarian" ? "active" : ""}`}
              onClick={() => setRole("veterinarian")}
            >
              <Stethoscope size={16} />
              <span>Veterinarian</span>
            </button>
            <button
              className={`role-btn ${role === "officer" ? "active" : ""}`}
              onClick={() => setRole("officer")}
            >
              <Landmark size={16} />
              <span>Govt Officer</span>
            </button>
          </div>
        </div>

        {/* Right: Farm Selector & Notification Bell */}
        <div className="navbar-right">
          <div className="live-badge">
            <span className="live-ping"></span>
            <span>Live Monitor</span>
          </div>

          <div className="farm-selector-wrapper">
            <select
              value={activeFarm.id}
              onChange={(e) => {
                const found = allFarms.find((f) => f.id === e.target.value);
                if (found) setActiveFarm(found);
              }}
              className="farm-select-dropdown"
            >
              {allFarms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name} ({farm.farmType.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <button
            className="notification-bell-btn"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
};
