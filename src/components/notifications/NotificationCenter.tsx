import React, { useEffect } from "react";
import { X, Bell, ShieldAlert, CheckCircle2, Calendar, AlertTriangle } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { useTranslation } from "../../context/LocaleContext";
import { translateContent } from "../../i18n/contentTranslate";

export const NotificationCenter: React.FC = () => {
  const { notifications, isDrawerOpen, setIsDrawerOpen, markAsRead, refreshNotifications } =
    useNotifications();
  const { t } = useTranslation();

  useEffect(() => {
    if (isDrawerOpen) {
      void refreshNotifications(true);
    }
  }, [isDrawerOpen, refreshNotifications]);

  if (!isDrawerOpen) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={() => setIsDrawerOpen(false)} />
      <aside className="notification-drawer">
        <div className="drawer-header">
          <div className="header-title-row">
            <Bell size={20} className="bell-icon" />
            <h3>{t("notification.title")}</h3>
          </div>
          <button className="drawer-close-btn" onClick={() => setIsDrawerOpen(false)} aria-label={t("common.close")}>
            <X size={20} />
          </button>
        </div>
        <div className="notifications-list">
          {notifications.length === 0 ? (
            <div className="empty-notif">{t("notification.empty")}</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`notif-card ${!n.read ? "unread" : ""}`} onClick={() => markAsRead(n.id)}>
                <div className="notif-top">
                  <div className={`notif-type-icon type-${n.type}`}>
                    {n.type === "incident" ? <ShieldAlert size={16} /> : n.type === "verification" || n.type === "evidence" ? <CheckCircle2 size={16} /> : n.type === "inspection" ? <Calendar size={16} /> : <AlertTriangle size={16} />}
                  </div>
                  <strong className="notif-title">{translateContent(n.title, t)}</strong>
                  <span className="notif-time">{n.timestamp}</span>
                </div>
                <p className="notif-message">{translateContent(n.message, t)}</p>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
};
