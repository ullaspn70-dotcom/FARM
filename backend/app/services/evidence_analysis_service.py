"""Rule-based evidence analysis — system-assisted, veterinarian-controlled."""

from app.models.corrective_action import ActionEvidence, CorrectiveAction


def _keywords(text: str) -> set[str]:
    return set(text.lower().replace("-", " ").split())


class EvidenceAnalysisService:
    @staticmethod
    def analyze(action: CorrectiveAction, evidence: ActionEvidence | None) -> dict:
        title = action.title or ""
        desc = action.description or ""
        notes = (evidence.notes if evidence else "") or ""
        combined = f"{title} {desc} {notes}".lower()

        observations: list[str] = []
        recommended: list[dict] = []

        if evidence:
            observations.append(f"Farmer submitted file: {evidence.file_name}")
            if evidence.location:
                observations.append(f"Capture location: {evidence.location}")
            if notes.strip():
                observations.append(f"Farmer note: {notes.strip()}")
        else:
            observations.append("No evidence file attached yet.")

        observations.append(f"Required corrective action: {title}")

        if any(k in combined for k in ("disinfect", "sanit", "decontam", "virkon")):
            recommended.append({
                "title": "Verify disinfectant concentration log",
                "description": "Confirm 2% Virkon or approved equivalent was applied at all entry points.",
                "priority": "high",
            })
            if "photo" not in notes.lower() and evidence:
                observations.append(
                    "Image submitted — visually confirm disinfectant equipment and wet surfaces are visible."
                )

        if any(k in combined for k in ("visitor", "entry", "gate")):
            recommended.append({
                "title": "Audit visitor register for last 72 hours",
                "description": "Cross-check visitor log against submitted evidence timestamps.",
                "priority": "medium",
            })

        if any(k in combined for k in ("isolat", "mortality", "shed", "batch")):
            recommended.append({
                "title": "Confirm isolation protocol compliance",
                "description": "Verify affected batch is segregated and movement restrictions are posted.",
                "priority": "urgent",
            })

        if any(k in combined for k in ("movement", "transport", "vehicle")):
            recommended.append({
                "title": "Review vehicle disinfection records",
                "description": "Match wheel-bath and spray evidence with vehicle entry log.",
                "priority": "high",
            })

        if any(k in combined for k in ("quarantine", "new stock")):
            recommended.append({
                "title": "Validate quarantine duration",
                "description": "Ensure new arrivals completed minimum quarantine period before integration.",
                "priority": "medium",
            })

        if not recommended:
            recommended.append({
                "title": "Schedule follow-up field verification",
                "description": "If photo evidence is unclear, request a follow-up image or on-site check.",
                "priority": "medium",
            })

        completeness = "partial"
        if evidence and notes.strip() and len(notes) > 20:
            completeness = "good"
        if not evidence:
            completeness = "missing"

        return {
            "summary": (
                f"System-assisted review of evidence for “{title}”. "
                f"Submission completeness: {completeness}."
            ),
            "observations": observations,
            "recommended_actions": recommended[:5],
            "analysis_method": "rule-based",
            "disclaimer": (
                "Aarohi provides system-assisted biosecurity guidance from submitted evidence metadata. "
                "Always follow certified veterinary protocols — this is not an automatic diagnosis."
            ),
        }
