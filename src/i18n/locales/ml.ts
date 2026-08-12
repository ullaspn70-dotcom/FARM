import type { TranslationDictionary } from "../types";
import hi from "./hi";
import { mergeLocale } from "../contentTranslate";

/** Malayalam — full farmer UI via Hindi base + ML overrides (expand over time) */
const mlOverrides: TranslationDictionary = {
  "app.tagline": "ഡിജിറ്റൽ കൃഷി ജൈവ സുരക്ഷാ പ്ലാറ്റ്ഫോം",
  "nav.dashboard": "ഡാഷ്‌ബോർഡ്",
  "nav.actionCenter": "ആക്ഷൻ സെന്റർ",
  "nav.passport": "ജൈവ സുരക്ഷാ പാസ്പോർട്ട്",
  "nav.language": "ഭാഷ",
  "role.farmer": "കർഷകൻ",
  "dashboard.reportIncident": "സംഭവം റിപ്പോർട്ട് ചെയ്യുക",
  "dashboard.viewPassport": "പാസ്പോർട്ട് കാണുക",
  "actionCenter.title": "ജൈവ സുരക്ഷാ ആക്ഷൻ സെന്റർ",
  "content.checklist.entryGate": "പ്രവേശന കവാടം വാഹന désinfeksjon",
  "content.checklist.waterChlorine": "വെള്ളം ക്ലോറination നില verified",
  "content.checklist.mortalityLog": "ദൈനംദിന മരണ രേഖ",
  "content.checklist.visitorCheckin": "സന്ദർശക ഡിജിറ്റൽ check-in verified",
  "content.checklist.shedSanitation": "ഷെഡ് sanitation പരിശോധന",
};

export default mergeLocale(hi, mlOverrides);
