import React from "react";

interface StatusBadgeProps {
  type: "risk" | "incident" | "action" | "farmType";
  value: string;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, size = "md" }) => {
  const val = value.toLowerCase();

  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
  let label = value;

  if (type === "risk") {
    if (val === "safe" || val === "low") {
      badgeStyle = "badge-safe";
      label = "Low Risk / Safe";
    } else if (val === "caution" || val === "medium") {
      badgeStyle = "badge-caution";
      label = "Medium Risk / Caution";
    } else if (val === "critical" || val === "high") {
      badgeStyle = "badge-critical";
      label = "High Risk / Critical";
    }
  } else if (type === "incident") {
    if (val === "reported") {
      badgeStyle = "badge-info";
      label = "Reported — Awaiting Verification";
    } else if (val === "under review") {
      badgeStyle = "badge-caution";
      label = "Under Review";
    } else if (val === "verified") {
      badgeStyle = "badge-safe";
      label = "Verified";
    } else if (val === "more info required") {
      badgeStyle = "badge-warning";
      label = "More Info Required";
    } else if (val === "rejected") {
      badgeStyle = "badge-muted";
      label = "Rejected";
    }
  } else if (type === "action") {
    if (val === "pending") {
      badgeStyle = "badge-muted";
    } else if (val === "in progress") {
      badgeStyle = "badge-info";
    } else if (val === "evidence submitted") {
      badgeStyle = "badge-warning";
    } else if (val === "awaiting verification") {
      badgeStyle = "badge-caution";
    } else if (val === "verified" || val === "closed") {
      badgeStyle = "badge-safe";
    }
  } else if (type === "farmType") {
    badgeStyle = "badge-farmtype";
    label = value === "poultry" ? "Poultry Farm" : value === "pig" ? "Pig Farm" : "Mixed Livestock";
  }

  const sizeClass = size === "sm" ? "badge-sm" : size === "lg" ? "badge-lg" : "badge-md";

  return <span className={`status-badge ${badgeStyle} ${sizeClass}`}>{label}</span>;
};
