import React, { useEffect } from "react";
import { Bell, X } from "lucide-react";
import type { NotificationItem } from "../../types";
import { useTranslation } from "../../context/LocaleContext";
import { translateContent } from "../../i18n/contentTranslate";

interface NotificationToastProps {
  notification: NotificationItem | null;
  onDismiss: () => void;
  onOpen: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  onOpen,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(onDismiss, 10000);
    return () => window.clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  return (
    <div className="notification-toast" role="alert" aria-live="polite">
      <button type="button" className="notification-toast-body" onClick={onOpen}>
        <span className="notification-toast-icon">
          <Bell size={18} />
        </span>
        <span className="notification-toast-text">
          <strong>{translateContent(notification.title, t)}</strong>
          <span>{translateContent(notification.message, t)}</span>
        </span>
      </button>
      <button
        type="button"
        className="notification-toast-close"
        onClick={onDismiss}
        aria-label={t("common.close")}
      >
        <X size={16} />
      </button>
    </div>
  );
};
