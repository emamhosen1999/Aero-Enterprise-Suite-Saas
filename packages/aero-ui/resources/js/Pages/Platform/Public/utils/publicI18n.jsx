import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// ─── Supported Languages ──────────────────────────────────────────────────────
export const PUBLIC_LANGUAGES = [
  { code: "en",    label: "English",              flag: "🇺🇸", dir: "ltr" },
  { code: "ar",    label: "العربية",               flag: "🇸🇦", dir: "rtl" },
  { code: "de",    label: "Deutsch",               flag: "🇩🇪", dir: "ltr" },
  { code: "es",    label: "Español",               flag: "🇪🇸", dir: "ltr" },
  { code: "fr",    label: "Français",              flag: "🇫🇷", dir: "ltr" },
  { code: "bn",    label: "বাংলা",                 flag: "🇧🇩", dir: "ltr" },
  { code: "hi",    label: "हिन्दी",               flag: "🇮🇳", dir: "ltr" },
  { code: "zh-CN", label: "简体中文",              flag: "🇨🇳", dir: "ltr" },
  { code: "zh-TW", label: "繁體中文",              flag: "🇹🇼", dir: "ltr" },
];

// ─── Translation Dictionary ───────────────────────────────────────────────────
// Covers all UI chrome strings: nav, buttons, footer labels, CTAs
const DICT = {
  en: {
    nav_platform:        "Platform",
    nav_modules:         "Modules",
    nav_enterprise:      "Enterprise",
    nav_pricing:         "Pricing",
    nav_docs:            "Docs",
    nav_features:        "Features",
    nav_about:           "About",
    sign_in:             "Sign In",
    request_demo:        "Request Demo",
    get_started:         "Get Started",
    learn_more:          "Learn More",
    contact_sales:       "Contact Sales",
    newsletter_label:    "STAY UPDATED",
    newsletter_title:    "Platform & Module Updates",
    newsletter_body:     "Release notes, feature previews, and architectural deep-dives. No spam.",
    subscribe:           "Subscribe",
    subscribed_msg:      "You're on the list. Thanks!",
    newsletter_input:    "name@company.com",
    footer_copyright:    "All rights reserved.",
    systems_ok:          "All systems operational",
    privacy_policy:      "Privacy Policy",
    terms_of_service:    "Terms of Service",
    cookie_policy:       "Cookie Policy",
    language:            "Language",
    theme_dark:          "Dark",
    theme_light:         "Light",
  },
  ar: {
    nav_platform:        "المنصة",
    nav_modules:         "الوحدات",
    nav_enterprise:      "المؤسسات",
    nav_pricing:         "الأسعار",
    nav_docs:            "الوثائق",
    nav_features:        "الميزات",
    nav_about:           "حول",
    sign_in:             "تسجيل الدخول",
    request_demo:        "طلب عرض تجريبي",
    get_started:         "ابدأ الآن",
    learn_more:          "اعرف المزيد",
    contact_sales:       "تواصل مع المبيعات",
    newsletter_label:    "ابقَ على اطلاع",
    newsletter_title:    "تحديثات المنصة والوحدات",
    newsletter_body:     "ملاحظات الإصدار ومعاينات الميزات والمقالات التقنية. لا رسائل مزعجة.",
    subscribe:           "اشتراك",
    subscribed_msg:      "تم تسجيلك. شكراً!",
    newsletter_input:    "name@company.com",
    footer_copyright:    "جميع الحقوق محفوظة.",
    systems_ok:          "جميع الأنظمة تعمل",
    privacy_policy:      "سياسة الخصوصية",
    terms_of_service:    "شروط الخدمة",
    cookie_policy:       "سياسة ملفات تعريف الارتباط",
    language:            "اللغة",
    theme_dark:          "داكن",
    theme_light:         "فاتح",
  },
  de: {
    nav_platform:        "Plattform",
    nav_modules:         "Module",
    nav_enterprise:      "Enterprise",
    nav_pricing:         "Preise",
    nav_docs:            "Dokumentation",
    nav_features:        "Funktionen",
    nav_about:           "Über uns",
    sign_in:             "Anmelden",
    request_demo:        "Demo anfordern",
    get_started:         "Loslegen",
    learn_more:          "Mehr erfahren",
    contact_sales:       "Vertrieb kontaktieren",
    newsletter_label:    "IMMER INFORMIERT",
    newsletter_title:    "Plattform- & Modul-Updates",
    newsletter_body:     "Versionshinweise, Feature-Vorschauen und technische Einblicke. Kein Spam.",
    subscribe:           "Abonnieren",
    subscribed_msg:      "Sie sind eingetragen. Danke!",
    newsletter_input:    "name@unternehmen.com",
    footer_copyright:    "Alle Rechte vorbehalten.",
    systems_ok:          "Alle Systeme betriebsbereit",
    privacy_policy:      "Datenschutz",
    terms_of_service:    "Nutzungsbedingungen",
    cookie_policy:       "Cookie-Richtlinie",
    language:            "Sprache",
    theme_dark:          "Dunkel",
    theme_light:         "Hell",
  },
  es: {
    nav_platform:        "Plataforma",
    nav_modules:         "Módulos",
    nav_enterprise:      "Empresas",
    nav_pricing:         "Precios",
    nav_docs:            "Documentación",
    nav_features:        "Funciones",
    nav_about:           "Acerca de",
    sign_in:             "Iniciar sesión",
    request_demo:        "Solicitar demo",
    get_started:         "Comenzar",
    learn_more:          "Saber más",
    contact_sales:       "Contactar ventas",
    newsletter_label:    "MANTENTE INFORMADO",
    newsletter_title:    "Actualizaciones de plataforma y módulos",
    newsletter_body:     "Notas de versión, vistas previas y análisis técnicos. Sin spam.",
    subscribe:           "Suscribirse",
    subscribed_msg:      "¡Estás en la lista. Gracias!",
    newsletter_input:    "nombre@empresa.com",
    footer_copyright:    "Todos los derechos reservados.",
    systems_ok:          "Todos los sistemas operativos",
    privacy_policy:      "Política de Privacidad",
    terms_of_service:    "Términos de Servicio",
    cookie_policy:       "Política de Cookies",
    language:            "Idioma",
    theme_dark:          "Oscuro",
    theme_light:         "Claro",
  },
  fr: {
    nav_platform:        "Plateforme",
    nav_modules:         "Modules",
    nav_enterprise:      "Entreprise",
    nav_pricing:         "Tarifs",
    nav_docs:            "Documentation",
    nav_features:        "Fonctionnalités",
    nav_about:           "À propos",
    sign_in:             "Se connecter",
    request_demo:        "Demander une démo",
    get_started:         "Commencer",
    learn_more:          "En savoir plus",
    contact_sales:       "Contacter les ventes",
    newsletter_label:    "RESTEZ INFORMÉ",
    newsletter_title:    "Mises à jour de la plateforme",
    newsletter_body:     "Notes de version, aperçus des fonctionnalités et analyses techniques. Pas de spam.",
    subscribe:           "S'abonner",
    subscribed_msg:      "Vous êtes inscrit. Merci !",
    newsletter_input:    "nom@entreprise.com",
    footer_copyright:    "Tous droits réservés.",
    systems_ok:          "Tous les systèmes opérationnels",
    privacy_policy:      "Politique de Confidentialité",
    terms_of_service:    "Conditions d'utilisation",
    cookie_policy:       "Politique des Cookies",
    language:            "Langue",
    theme_dark:          "Sombre",
    theme_light:         "Clair",
  },
  bn: {
    nav_platform:        "প্ল্যাটফর্ম",
    nav_modules:         "মডিউল",
    nav_enterprise:      "এন্টারপ্রাইজ",
    nav_pricing:         "মূল্য নির্ধারণ",
    nav_docs:            "ডকুমেন্টেশন",
    nav_features:        "বৈশিষ্ট্য",
    nav_about:           "আমাদের সম্পর্কে",
    sign_in:             "সাইন ইন",
    request_demo:        "ডেমো অনুরোধ",
    get_started:         "শুরু করুন",
    learn_more:          "আরও জানুন",
    contact_sales:       "বিক্রয় যোগাযোগ",
    newsletter_label:    "আপডেট থাকুন",
    newsletter_title:    "প্ল্যাটফর্ম ও মডিউল আপডেট",
    newsletter_body:     "রিলিজ নোট, ফিচার প্রিভিউ এবং প্রযুক্তিগত বিশ্লেষণ। কোনো স্প্যাম নেই।",
    subscribe:           "সদস্যতা নিন",
    subscribed_msg:      "আপনি তালিকায় আছেন। ধন্যবাদ!",
    newsletter_input:    "name@company.com",
    footer_copyright:    "সর্বস্বত্ব সংরক্ষিত।",
    systems_ok:          "সকল সিস্টেম চালু",
    privacy_policy:      "গোপনীয়তা নীতি",
    terms_of_service:    "সেবার শর্তাবলী",
    cookie_policy:       "কুকি নীতি",
    language:            "ভাষা",
    theme_dark:          "অন্ধকার",
    theme_light:         "আলো",
  },
  hi: {
    nav_platform:        "प्लेटफ़ॉर्म",
    nav_modules:         "मॉड्यूल",
    nav_enterprise:      "एंटरप्राइज़",
    nav_pricing:         "मूल्य निर्धारण",
    nav_docs:            "दस्तावेज़",
    nav_features:        "विशेषताएँ",
    nav_about:           "हमारे बारे में",
    sign_in:             "साइन इन",
    request_demo:        "डेमो अनुरोध करें",
    get_started:         "शुरू करें",
    learn_more:          "अधिक जानें",
    contact_sales:       "बिक्री से संपर्क करें",
    newsletter_label:    "अपडेट रहें",
    newsletter_title:    "प्लेटफ़ॉर्म और मॉड्यूल अपडेट",
    newsletter_body:     "रिलीज़ नोट्स, फ़ीचर प्रीव्यू और तकनीकी विश्लेषण। कोई स्पैम नहीं।",
    subscribe:           "सदस्यता लें",
    subscribed_msg:      "आप सूची में हैं। धन्यवाद!",
    newsletter_input:    "name@company.com",
    footer_copyright:    "सर्वाधिकार सुरक्षित।",
    systems_ok:          "सभी सिस्टम चालू हैं",
    privacy_policy:      "गोपनीयता नीति",
    terms_of_service:    "सेवा की शर्तें",
    cookie_policy:       "कुकी नीति",
    language:            "भाषा",
    theme_dark:          "डार्क",
    theme_light:         "लाइट",
  },
  "zh-CN": {
    nav_platform:        "平台",
    nav_modules:         "模块",
    nav_enterprise:      "企业版",
    nav_pricing:         "定价",
    nav_docs:            "文档",
    nav_features:        "功能",
    nav_about:           "关于",
    sign_in:             "登录",
    request_demo:        "申请演示",
    get_started:         "立即开始",
    learn_more:          "了解更多",
    contact_sales:       "联系销售",
    newsletter_label:    "保持更新",
    newsletter_title:    "平台与模块更新",
    newsletter_body:     "发行说明、功能预览和技术深度分析。不发垃圾邮件。",
    subscribe:           "订阅",
    subscribed_msg:      "您已加入列表。谢谢！",
    newsletter_input:    "name@company.com",
    footer_copyright:    "版权所有。",
    systems_ok:          "所有系统正常运行",
    privacy_policy:      "隐私政策",
    terms_of_service:    "服务条款",
    cookie_policy:       "Cookie 政策",
    language:            "语言",
    theme_dark:          "深色",
    theme_light:         "浅色",
  },
  "zh-TW": {
    nav_platform:        "平台",
    nav_modules:         "模組",
    nav_enterprise:      "企業版",
    nav_pricing:         "定價",
    nav_docs:            "文件",
    nav_features:        "功能",
    nav_about:           "關於",
    sign_in:             "登入",
    request_demo:        "申請示範",
    get_started:         "立即開始",
    learn_more:          "了解更多",
    contact_sales:       "聯絡銷售",
    newsletter_label:    "保持更新",
    newsletter_title:    "平台與模組更新",
    newsletter_body:     "發行說明、功能預覽和技術深度分析。不寄垃圾郵件。",
    subscribe:           "訂閱",
    subscribed_msg:      "您已加入名單。謝謝！",
    newsletter_input:    "name@company.com",
    footer_copyright:    "版權所有。",
    systems_ok:          "所有系統正常運行",
    privacy_policy:      "隱私政策",
    terms_of_service:    "服務條款",
    cookie_policy:       "Cookie 政策",
    language:            "語言",
    theme_dark:          "深色",
    theme_light:         "淺色",
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────
const PublicI18nContext = createContext(null);

const LS_LOCALE_KEY = "aero_public_locale";

export function PublicI18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    if (typeof window === "undefined") return "en";
    const stored = localStorage.getItem(LS_LOCALE_KEY);
    return PUBLIC_LANGUAGES.find(l => l.code === stored) ? stored : "en";
  });

  const language = useMemo(
    () => PUBLIC_LANGUAGES.find(l => l.code === locale) ?? PUBLIC_LANGUAGES[0],
    [locale]
  );

  const setLocale = useCallback((code) => {
    if (!PUBLIC_LANGUAGES.find(l => l.code === code)) return;
    localStorage.setItem(LS_LOCALE_KEY, code);
    setLocaleState(code);
  }, []);

  // Apply dir attribute to the root public-page div via dataset
  useEffect(() => {
    const el = document.querySelector(".public-page");
    if (el) {
      el.setAttribute("dir", language.dir);
      el.setAttribute("lang", locale);
    }
  }, [locale, language.dir]);

  const t = useCallback(
    (key) => DICT[locale]?.[key] ?? DICT.en?.[key] ?? key,
    [locale]
  );

  const value = useMemo(() => ({ locale, language, setLocale, t, languages: PUBLIC_LANGUAGES }), [locale, language, setLocale, t]);

  return (
    <PublicI18nContext.Provider value={value}>
      {children}
    </PublicI18nContext.Provider>
  );
}

export function usePublicI18n() {
  const ctx = useContext(PublicI18nContext);
  if (!ctx) throw new Error("usePublicI18n must be used within PublicI18nProvider");
  return ctx;
}
