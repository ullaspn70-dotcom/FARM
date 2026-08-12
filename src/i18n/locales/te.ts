import { mergeLocale } from "../contentTranslate";
import hi from "./hi";

const teOverrides: Record<string, string> = {
  "app.tagline": "డిజిటల్ వ్యవసాయ జీవ భద్రతా వేదిక",
  "nav.dashboard": "డాష్‌బోర్డ్",
  "nav.actionCenter": "చర్య కేంద్రం",
  "nav.passport": "జీవ భద్రతా పాస్‌పోర్ట్",
  "role.farmer": "రైతు",
  "dashboard.reportIncident": "సంఘటన నివేదించండి",
  "dashboard.viewPassport": "పాస్‌పోర్ట్ చూడండి",
  "actionCenter.title": "జీవ భద్రతా చర్య కేంద్రం",
  "content.checklist.entryGate": "ప్రవేశ ద్వారం వాహన disinfection",
  "content.checklist.waterChlorine": "నీటి chlorine స్థాయి verified",
  "content.checklist.mortalityLog": "రోజువారీ mortality లాగ్",
  "content.checklist.visitorCheckin": "సందర్శక check-in verified",
  "content.checklist.shedSanitation": "షెడ్ sanitation తనిఖీ",
};

export default mergeLocale(hi, teOverrides);
