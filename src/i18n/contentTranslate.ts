import type { TranslationDictionary } from "./types";
import en from "./locales/en";

/** Maps exact English API/UI strings to translation keys */
export const CONTENT_TO_KEY: Record<string, string> = {
  "Entry gate vehicle dip disinfected": "content.checklist.entryGate",
  "Water chlorination level verified (2.5 ppm)": "content.checklist.waterChlorine",
  "Daily mortality & morbidity logged": "content.checklist.mortalityLog",
  "Daily flock mortality & morbidity logged": "content.checklist.mortalityLogFlock",
  "Visitor digital check-in records verified": "content.checklist.visitorCheckin",
  "Shed deep sanitation protocol check": "content.checklist.shedSanitation",
  "Shed 02 deep sanitation protocol check": "content.checklist.shed02Sanitation",
  "Compliant": "passport.compliance.compliant",
  "Attention Required": "passport.compliance.attention",
  "Non-Compliant": "passport.compliance.nonCompliant",
  "Passed": "passport.result.passed",
  "Conditional Pass": "passport.result.conditional",
  "Needs Improvement": "passport.result.needsImprovement",
  "Sudden Mortality Increase": "incident.type.mortality",
  "Respiratory Symptoms": "incident.type.respiratory",
  "Respiratory Distress Symptoms": "incident.type.respiratory",
  "Feed / Water Contamination": "incident.type.feedWater",
  "Feed or Water Contamination": "incident.type.feedWater",
  "Perimeter Fencing / Bio-Barrier Breach": "incident.type.perimeter",
  "Unverified Visitor Entry": "incident.type.visitor",
  "Reported": "status.incident.reported",
  "Under Review": "status.incident.review",
  "Verified": "status.incident.verified",
  "More Info Required": "status.incident.moreInfo",
  "Rejected": "status.incident.rejected",
  "Pending": "status.action.pending",
  "In Progress": "status.action.inProgress",
  "Evidence Submitted": "status.action.evidenceSubmitted",
  "Awaiting Verification": "status.action.awaitingVerification",
  "Closed": "status.action.closed",
};

export function translateContent(
  text: string,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  if (!text) return text;
  const key = CONTENT_TO_KEY[text.trim()];
  if (key) {
    const translated = t(key);
    if (translated !== key) return translated;
  }
  return text;
}

export function mergeLocale(base: TranslationDictionary, overrides: TranslationDictionary): TranslationDictionary {
  return { ...base, ...overrides };
}

export { en };
