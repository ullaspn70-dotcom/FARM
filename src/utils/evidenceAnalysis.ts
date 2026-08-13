import type { CorrectiveAction, EvidenceAnalysis } from "../types";

/** Client-side fallback when backend analyze endpoint is not deployed yet. */
export function analyzeEvidenceLocally(action: CorrectiveAction): EvidenceAnalysis {
  const title = action.title || "";
  const desc = action.description || "";
  const notes = action.submittedEvidence?.notes || "";
  const combined = `${title} ${desc} ${notes}`.toLowerCase();

  const observations: string[] = [];
  const recommended: EvidenceAnalysis["recommendedActions"] = [];

  if (action.submittedEvidence) {
    observations.push(`Farmer submitted file: ${action.submittedEvidence.fileName}`);
    if (action.submittedEvidence.location) {
      observations.push(`Capture location: ${action.submittedEvidence.location}`);
    }
    if (notes.trim()) {
      observations.push(`Farmer note: ${notes.trim()}`);
    }
  } else {
    observations.push("No evidence file attached yet.");
  }

  observations.push(`Required corrective action: ${title}`);

  if (/disinfect|sanit|decontam|virkon/.test(combined)) {
    recommended.push({
      title: "Verify disinfectant concentration log",
      description: "Confirm 2% Virkon or approved equivalent was applied at all entry points.",
      priority: "high",
    });
    if (!/photo/.test(notes.toLowerCase()) && action.submittedEvidence) {
      observations.push(
        "Image submitted — visually confirm disinfectant equipment and wet surfaces are visible."
      );
    }
  }

  if (/visitor|entry|gate/.test(combined)) {
    recommended.push({
      title: "Audit visitor register for last 72 hours",
      description: "Cross-check visitor log against submitted evidence timestamps.",
      priority: "medium",
    });
  }

  if (/isolat|mortality|shed|batch/.test(combined)) {
    recommended.push({
      title: "Confirm isolation protocol compliance",
      description: "Verify affected batch is segregated and movement restrictions are posted.",
      priority: "urgent",
    });
  }

  if (/movement|transport|vehicle/.test(combined)) {
    recommended.push({
      title: "Review vehicle disinfection records",
      description: "Match wheel-bath and spray evidence with vehicle entry log.",
      priority: "high",
    });
  }

  if (/quarantine|new stock/.test(combined)) {
    recommended.push({
      title: "Validate quarantine duration",
      description: "Ensure new arrivals completed minimum quarantine period before integration.",
      priority: "medium",
    });
  }

  if (recommended.length === 0) {
    recommended.push({
      title: "Schedule follow-up field verification",
      description: "If photo evidence is unclear, request a follow-up image or on-site check.",
      priority: "medium",
    });
  }

  let completeness: EvidenceAnalysis["completeness"] = "partial";
  if (action.submittedEvidence && notes.trim().length > 20) completeness = "good";
  if (!action.submittedEvidence) completeness = "missing";

  return {
    summary: `System-assisted review of evidence for “${title}”. Submission completeness: ${completeness}.`,
    observations,
    recommendedActions: recommended.slice(0, 5),
    analysisMethod: "rule-based",
    disclaimer:
      "Aarohi provides system-assisted biosecurity guidance from submitted evidence metadata. Always follow certified veterinary protocols — this is not an automatic diagnosis.",
    completeness,
  };
}

export const VET_PLAN_MARKER = "[Veterinary Action Plan]";

export function isVeterinaryActionPlan(action: CorrectiveAction): boolean {
  return (
    action.source === "veterinary_action_plan" ||
    (action.description?.includes(VET_PLAN_MARKER) ?? false)
  );
}

export function stripVetPlanMarker(description: string): string {
  return description.replace(VET_PLAN_MARKER, "").replace(/^\s+/, "").trim();
}
