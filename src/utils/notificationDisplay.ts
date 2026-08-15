import type { NotificationItem } from "../types";
import { translateContent } from "../i18n/contentTranslate";

export type VetDecisionStatus = "confirmed" | "rejected" | "more_info";

export function getVetDecisionStatus(notification: NotificationItem): VetDecisionStatus | null {
  if (notification.type !== "verification") return null;

  const haystack = `${notification.title} ${notification.message}`.toLowerCase();

  if (
    haystack.includes("rejected") ||
    haystack.includes("not confirmed") ||
    haystack.includes("declined")
  ) {
    return "rejected";
  }
  if (haystack.includes("verified") || haystack.includes("confirmed")) {
    return "confirmed";
  }
  if (
    haystack.includes("more information") ||
    haystack.includes("info requested") ||
    haystack.includes("more info required") ||
    haystack.includes("action needed")
  ) {
    return "more_info";
  }

  return null;
}

export function translateNotificationTitle(
  title: string,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  return translateContent(title, t);
}

export function translateNotificationMessage(
  message: string,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  const verified = message.match(
    /^Incident (.+) has been verified\. Biosecurity score updated to (\d+)\/100\. (.+)$/
  );
  if (verified) {
    return t("notification.msg.incidentVerified", {
      id: verified[1],
      score: verified[2],
      note: verified[3],
    });
  }

  const rejected = message.match(/^Incident (.+) at (.+) was rejected\. Reason: (.+)$/);
  if (rejected) {
    return t("notification.msg.incidentRejected", {
      id: rejected[1],
      farm: rejected[2],
      reason: rejected[3],
    });
  }

  const moreInfo = message.match(/^Incident (.+) at (.+): (.+)$/);
  if (moreInfo && message.toLowerCase().includes("upload")) {
    return t("notification.msg.incidentMoreInfo", {
      id: moreInfo[1],
      farm: moreInfo[2],
      request: moreInfo[3],
    });
  }

  const legacy = message.match(/^Incident (.+) update by Veterinarian Officer\.$/i);
  if (legacy) {
    return t("notification.msg.incidentVetUpdateLegacy", { id: legacy[1] });
  }

  return translateContent(message, t);
}

export function getVetStatusLabel(
  status: VetDecisionStatus,
  t: (key: string) => string
): string {
  if (status === "confirmed") return t("notification.vetStatus.confirmed");
  if (status === "rejected") return t("notification.vetStatus.rejected");
  return t("notification.vetStatus.moreInfo");
}
