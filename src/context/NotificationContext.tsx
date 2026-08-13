import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { NotificationItem } from "../types";
import { notificationService } from "../services/api";
import { useAuth } from "./AuthContext";

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  markAsRead: (id: string) => Promise<void>;
  refreshNotifications: (force?: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchNotifications = useCallback(async (force = false) => {
    try {
      const items = await notificationService.getNotifications(role, { force });
      setNotifications(items);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [role]);

  useEffect(() => {
    const schedule = () => void fetchNotifications();
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(schedule, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(schedule, 100);
    return () => clearTimeout(timer);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isDrawerOpen,
      setIsDrawerOpen,
      markAsRead,
      refreshNotifications: fetchNotifications,
    }),
    [notifications, unreadCount, isDrawerOpen, markAsRead, fetchNotifications]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
