"""
Demo seed script — run separately from production API logic.

Usage:
  cd backend
  python -m scripts.seed
"""

from datetime import date, datetime, timezone

from app.core.security import get_password_hash
from app.database.session import SessionLocal
from app.models.corrective_action import ActionEvidence, CorrectiveAction
from app.models.enums import (
    ActionPriority,
    ComplianceStatus,
    CorrectiveActionStatus,
    FarmType,
    IncidentSeverity,
    IncidentStatus,
    NotificationType,
    RegistrationStatus,
    RiskFactorCategory,
    RiskLevel,
    RiskTrend,
    UserRole,
    VerificationStatus,
)
from app.models.farm import Farm, Zone
from app.models.health import ChecklistItem
from app.models.incident import Incident, IncidentEvidence
from app.models.inspection import Inspection
from app.models.notification import Notification
from app.models.passport import BiosecurityPassport
from app.models.risk import RiskFactor, RiskScoreHistory
from app.models.spatial import SpatialZone, VetFacility
from app.models.user import District, User, UserFarmAssignment
from app.models.enums import InspectionResult, InspectionStatus


def seed() -> None:
    db = SessionLocal()
    try:
        if db.query(District).count() > 0:
            print("Database already seeded. Skipping.")
            return

        district = District(id="district-ranchi", name="Ranchi District", state="Jharkhand")
        db.add(district)

        farmer = User(
            email="farmer@bioshield.local",
            password_hash=get_password_hash("farmer123"),
            full_name="Rajesh Kumar",
            role=UserRole.FARMER,
            district_id=district.id,
        )
        vet = User(
            email="vet@bioshield.local",
            password_hash=get_password_hash("vet123"),
            full_name="Dr. A. K. Sharma",
            role=UserRole.VETERINARIAN,
            district_id=district.id,
        )
        officer = User(
            email="officer@bioshield.local",
            password_hash=get_password_hash("officer123"),
            full_name="District Animal Husbandry Officer",
            role=UserRole.OFFICER,
            district_id=district.id,
        )
        db.add_all([farmer, vet, officer])
        db.flush()

        farms_data = [
            {
                "id": "FARM-JH-2026-0487",
                "name": "GreenValley Bio-Farm #04",
                "location": "Ranchi District, Jharkhand",
                "owner_name": "Rajesh Kumar",
                "farm_type": FarmType.POULTRY,
                "capacity": 3500,
                "animal_count": 2850,
                "biosecurity_score": 78,
                "previous_score": 74,
                "risk_level": RiskLevel.SAFE,
                "compliance_rate": 88.0,
                "vaccination_coverage": 94.0,
                "visitors_today": 8,
                "vehicles_today": 4,
                "active_incidents": 1,
                "active_alerts": 2,
                "latitude": 23.3441,
                "longitude": 85.3096,
                "owner_phone": "+91 98765 43210",
            },
            {
                "id": "FARM-JH-2026-0102",
                "name": "Apex Swine Breeding Center",
                "location": "Ramgarh, Jharkhand",
                "owner_name": "Suresh Mahato",
                "farm_type": FarmType.PIG,
                "capacity": 1200,
                "animal_count": 940,
                "biosecurity_score": 42,
                "previous_score": 58,
                "risk_level": RiskLevel.CRITICAL,
                "compliance_rate": 58.0,
                "vaccination_coverage": 76.0,
                "visitors_today": 14,
                "vehicles_today": 9,
                "active_incidents": 3,
                "active_alerts": 5,
                "latitude": 23.63,
                "longitude": 85.51,
                "owner_phone": "+91 94321 87654",
            },
            {
                "id": "FARM-JH-2026-0331",
                "name": "SunRise Poultry Haven",
                "location": "Hazaribagh, Jharkhand",
                "owner_name": "Anita Devi",
                "farm_type": FarmType.POULTRY,
                "capacity": 5000,
                "animal_count": 4200,
                "biosecurity_score": 65,
                "previous_score": 68,
                "risk_level": RiskLevel.CAUTION,
                "compliance_rate": 74.0,
                "vaccination_coverage": 88.0,
                "visitors_today": 6,
                "vehicles_today": 3,
                "active_incidents": 1,
                "active_alerts": 2,
                "latitude": 23.99,
                "longitude": 85.36,
                "owner_phone": "+91 91234 56789",
            },
            {
                "id": "FARM-JH-2026-0789",
                "name": "Chota Nagpur Livestock Complex",
                "location": "Khunti, Jharkhand",
                "owner_name": "Vikram Singh",
                "farm_type": FarmType.MIXED,
                "capacity": 2500,
                "animal_count": 1800,
                "biosecurity_score": 89,
                "previous_score": 87,
                "risk_level": RiskLevel.SAFE,
                "compliance_rate": 95.0,
                "vaccination_coverage": 98.0,
                "visitors_today": 4,
                "vehicles_today": 2,
                "active_incidents": 0,
                "active_alerts": 0,
                "latitude": 23.07,
                "longitude": 85.27,
                "owner_phone": "+91 99887 76655",
            },
        ]

        for data in farms_data:
            farm = Farm(district_id=district.id, registration_status=RegistrationStatus.REGISTERED, **data)
            db.add(farm)
            db.add(
                BiosecurityPassport(
                    id=f"PASS-{data['id']}",
                    farm_id=data["id"],
                    hygiene_score=min(100, data["biosecurity_score"] + 6),
                    visitor_control_score=max(0, data["biosecurity_score"] - 1),
                    quarantine_protocol_score=min(100, data["biosecurity_score"] + 7),
                    waste_management_score=max(0, data["biosecurity_score"] - 8),
                    compliance_status=ComplianceStatus.COMPLIANT if data["biosecurity_score"] >= 75 else ComplianceStatus.ATTENTION_REQUIRED,
                    risk_trend=RiskTrend.IMPROVING if data["risk_level"] == RiskLevel.SAFE else RiskTrend.DETERIORATING,
                    passport_qr_code=f"BS-PASSPORT-{data['id']}-VERIFIED",
                    issue_date=date(2026, 1, 15),
                    last_inspection_date=date(2026, 8, 1),
                )
            )

        db.add(UserFarmAssignment(user_id=farmer.id, farm_id="FARM-JH-2026-0487", is_owner=True))

        db.add_all([
            ChecklistItem(id="check-1", farm_id="FARM-JH-2026-0487", title="Entry gate vehicle dip disinfected", completed=True),
            ChecklistItem(id="check-2", farm_id="FARM-JH-2026-0487", title="Water chlorination level verified (2.5 ppm)", completed=True),
            ChecklistItem(id="check-3", farm_id="FARM-JH-2026-0487", title="Daily flock mortality & morbidity logged", completed=True),
            ChecklistItem(id="check-4", farm_id="FARM-JH-2026-0487", title="Visitor digital check-in records verified", completed=True),
            ChecklistItem(id="check-5", farm_id="FARM-JH-2026-0487", title="Shed 02 deep sanitation protocol check", completed=False, priority="important"),
        ])

        db.add(
            Inspection(
                id="INSP-2026-08",
                farm_id="FARM-JH-2026-0487",
                inspector_id=vet.id,
                inspector_name="Dr. A. K. Sharma (District Vet Officer)",
                inspection_date=date(2026, 8, 1),
                result=InspectionResult.PASSED,
                notes="Shed sanitation and perimeter fencing fully compliant. Vehicle dip active.",
                status=InspectionStatus.COMPLETED,
            )
        )

        inc1 = Incident(
            id="INC-2026-881",
            farm_id="FARM-JH-2026-0102",
            incident_type="Sudden High Mortality",
            animal_type="Pig (Growers)",
            number_affected=18,
            observed_at=datetime(2026, 8, 10, 14, 30, tzinfo=timezone.utc),
            description="Sudden high fever and respiratory distress in Shed 02 grower pigs.",
            location="Shed 02 - Isolation Ward",
            status=IncidentStatus.UNDER_REVIEW,
            severity=IncidentSeverity.CRITICAL,
            veterinarian_notes="Awaiting swab laboratory report.",
        )
        inc2 = Incident(
            id="INC-2026-879",
            farm_id="FARM-JH-2026-0487",
            incident_type="Feed Discoloration & Moisture Breach",
            animal_type="Poultry (Broilers)",
            number_affected=45,
            observed_at=datetime(2026, 8, 11, 8, 15, tzinfo=timezone.utc),
            description="Slight feed moisture contamination detected in Feed Bin 03.",
            location="Feed Storage Shed C",
            status=IncidentStatus.REPORTED,
            severity=IncidentSeverity.MEDIUM,
        )
        db.add_all([inc1, inc2])
        db.add(
            IncidentEvidence(
                id="IEV-001",
                incident_id="INC-2026-881",
                file_name="lesions_obs_01.jpeg",
                file_url="http://localhost:8000/uploads/demo/lesions_obs_01.jpeg",
            )
        )

        act1 = CorrectiveAction(
            id="ACT-2026-101",
            farm_id="FARM-JH-2026-0487",
            title="Sanitize & Decontaminate Shed 02 Buffer Area",
            description="Apply recommended chemical disinfectant solution across Shed 02 entry perimeter.",
            priority=ActionPriority.HIGH,
            assigned_person="Rajesh Kumar (Farm Manager)",
            deadline=date(2026, 8, 12),
            status=CorrectiveActionStatus.IN_PROGRESS,
            evidence_required=True,
            verification_status=VerificationStatus.UNVERIFIED,
        )
        act2 = CorrectiveAction(
            id="ACT-2026-104",
            farm_id="FARM-JH-2026-0487",
            title="Replace Vehicle Disinfection Basin Fluid",
            description="Flush current disinfection basin at Main Gate and replenish with fresh QAC disinfectant.",
            priority=ActionPriority.URGENT,
            assigned_person="Manoj Singh (Site Operations)",
            deadline=date(2026, 8, 11),
            status=CorrectiveActionStatus.EVIDENCE_SUBMITTED,
            evidence_required=True,
            verification_status=VerificationStatus.VERIFICATION_PENDING,
        )
        act3 = CorrectiveAction(
            id="ACT-2026-092",
            farm_id="FARM-JH-2026-0102",
            title="Enforce Strict Perimeter Isolation Zone",
            description="Install bio-secure barrier netting along South perimeter fence.",
            priority=ActionPriority.URGENT,
            assigned_person="Suresh Mahato",
            deadline=date(2026, 8, 10),
            status=CorrectiveActionStatus.PENDING,
            evidence_required=True,
            verification_status=VerificationStatus.UNVERIFIED,
        )
        db.add_all([act1, act2, act3])
        db.add(
            ActionEvidence(
                id="AEV-001",
                action_id="ACT-2026-104",
                file_url="http://localhost:8000/uploads/demo/gate_basin_refill.jpg",
                file_name="gate_basin_refill.jpg",
                notes="Basin cleaned and refilled with 2% Virkon solution.",
                location="Lat: 23.3441° N, Long: 85.3096° E",
                captured_at=datetime(2026, 8, 11, 9, 45, tzinfo=timezone.utc),
            )
        )

        risk_factors = [
            ("rf-1", "FARM-JH-2026-0487", "Nearby incident confirmed in Ramgarh sector", 18, RiskFactorCategory.INCIDENT),
            ("rf-2", "FARM-JH-2026-0487", "Mortality rate increase (+3.2% in Shed 02)", 12, RiskFactorCategory.MORTALITY),
            ("rf-3", "FARM-JH-2026-0487", "Shed 02 sanitation check delay", 6, RiskFactorCategory.SANITATION),
            ("rf-4", "FARM-JH-2026-0487", "Increased vehicle movement at Entry Gate", 3, RiskFactorCategory.VISITOR),
        ]
        for rf_id, farm_id, label, delta, category in risk_factors:
            db.add(
                RiskFactor(
                    id=rf_id,
                    farm_id=farm_id,
                    label=label,
                    delta=delta,
                    category=category,
                    description=f"Risk factor: {label}",
                )
            )

        for score, day in [(72, 5), (74, 6), (73, 7), (78, 11)]:
            db.add(
                RiskScoreHistory(
                    id=f"RH-{day}",
                    farm_id="FARM-JH-2026-0487",
                    score=score,
                    recorded_at=datetime(2026, 8, day, 12, 0, tzinfo=timezone.utc),
                )
            )

        db.add(
            VetFacility(
                id="VET-FAC-01",
                name="District Veterinary Diagnostic Lab",
                owner="Govt of Jharkhand Animal Husbandry Dept",
                contact="+91 651 2234567",
                latitude=23.36,
                longitude=85.33,
            )
        )
        db.add(
            SpatialZone(
                id="cz-001",
                name="Ramgarh Containment Buffer",
                center_lat=23.63,
                center_lng=85.51,
                radius_km=15.0,
                zone_type="containment",
                related_farm_id="FARM-JH-2026-0102",
                reason="Swine respiratory outbreak — Apex Swine Breeding Center",
                active=True,
            )
        )

        notifications = [
            ("NOTIF-001", "New Incident Reported", "High mortality reported at Apex Swine Breeding Center.", NotificationType.INCIDENT, True, None),
            ("NOTIF-002", "Evidence Submitted for Verification", "GreenValley Bio-Farm submitted evidence for ACT-2026-104.", NotificationType.EVIDENCE, False, UserRole.VETERINARIAN),
            ("NOTIF-003", "Biosecurity Score Updated", "GreenValley Bio-Farm biosecurity score increased to 78/100.", NotificationType.RISK, False, UserRole.FARMER),
            ("NOTIF-004", "Inspection Scheduled", "Routine biosecurity inspection assigned for SunRise Poultry Haven.", NotificationType.INSPECTION, False, UserRole.OFFICER),
        ]
        for nid, title, message, ntype, broadcast, role in notifications:
            db.add(
                Notification(
                    id=nid,
                    title=title,
                    message=message,
                    notification_type=ntype,
                    broadcast_all=broadcast,
                    target_role=role,
                )
            )

        db.commit()
        print("Seed completed successfully.")
        print("Demo credentials:")
        print("  farmer@bioshield.local / farmer123")
        print("  vet@bioshield.local / vet123")
        print("  officer@bioshield.local / officer123")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
