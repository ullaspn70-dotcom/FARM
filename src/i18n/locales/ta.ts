import { mergeLocale } from "../contentTranslate";
import hi from "./hi";

const taOverrides: Record<string, string> = {
  "app.tagline": "டிஜிற്റல் பண்ணை உயிர் பாதுகாப்பு தளம்",
  "nav.dashboard": "டாஷ்போர்டு",
  "nav.actionCenter": "செயல் மையம்",
  "nav.passport": "உயிர் பாதுகாப்பு பாஸ்போர்ட்",
  "role.farmer": "விவசாயி",
  "dashboard.reportIncident": "சம்பவம் அறிக்கை",
  "dashboard.viewPassport": "பாஸ்போர்ட் பார்க்க",
  "actionCenter.title": "உயிர் பாதுகாப்பு செயல் மையம்",
  "content.checklist.entryGate": "நுழைவு வாகன disinfection",
  "content.checklist.waterChlorine": "தண்ணீர் chlorine சரிபார்க்கப்பட்டது",
  "content.checklist.mortalityLog": "தினசரி mortality பதிவு",
  "content.checklist.visitorCheckin": "பார்வையாளர் check-in சரிபார்க்கப்பட்டது",
  "content.checklist.shedSanitation": "கொட்டகை sanitation சோதனை",
};

export default mergeLocale(hi, taOverrides);
