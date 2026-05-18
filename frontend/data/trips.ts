// All trip data for TAXIGO Trips - single source of truth
export type Attraction = {
  title: string;
  description: string;
  bullets?: string[];
  italicNote?: string;
  warning?: string;
  photos: string[];
};

export type TimelineStep = {
  time: string;
  icon: string;
  title: string;
  description: string;
};

export type Trip = {
  slug: string;
  badge: string;
  badgeColors: [string, string]; // gradient
  flag: "PL" | "SK";
  title: string;
  subtitle: string;
  heroImage: string;
  price: number;
  duration: string;
  attractionsCount: number;
  maxPeople: number;
  accent: string; // primary color
  bgAccent: string; // light bg
  attractions: Attraction[];
  timeline: TimelineStep[];
  mapImage: string;
  mapLegend: string;
  climateSubtitle: string;
  climateList: string[];
  climateHighlight: string;
  included: string[];
  excluded: string[];
  ctaNote: string;
};

export const TRIPS: Trip[] = [
  // 1. PIENINY
  {
    slug: "pieniny",
    badge: "🌟 BESTSELLER",
    badgeColors: ["#2E7D32", "#43a047"],
    flag: "PL",
    title: "Wycieczka w Pieniny z Krakowa",
    subtitle: "Niedzica • Czorsztyn • Rejs • Plaża Zamajerz",
    heroImage: "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/bo8omojz__WODmwSyszXYHGkICPkZBVdUtOU7o71COs1MSAr71Eh-K5vM7pNs8XfANys9F9coqmsYaVQzKmB7DaXZ3ESRdqQnoneGy0Gw2iNEXV9-LLq5tqXliXlATwvROZQYRODnLvFgXHpz3hfb9iZf5p0_7HeeCfLzzsjTTMPxk5Na4fGL8Ep51mFYURjgb1EP85kQ.jpg",
    price: 350,
    duration: "~12h",
    attractionsCount: 5,
    maxPeople: 4,
    accent: "#2E7D32",
    bgAccent: "#e8f5e9",
    attractions: [],
    timeline: [
      { time: "08:00", icon: "🚗", title: "Wyjazd z Krakowa", description: "Trasa: Kraków → Nowy Targ → Niedzica (~2.5h)" },
      { time: "10:00", icon: "🏰", title: "Zamek w Niedzicy", description: "Komnaty, dziedziniec, legenda o skarbie Inków" },
      { time: "11:45", icon: "🌄", title: "Zapora i punkt widokowy", description: "Panorama jeziora, widok na oba zamki" },
      { time: "12:30", icon: "🚢", title: "Rejs po Jeziorze Czorsztyńskim", description: "Statek kołowy, 50 min relaksu" },
      { time: "13:30", icon: "🍽️", title: "Obiad w Karczmie Zadyma", description: "Kwaśnica, pstrąg, placki po zbójnicku" },
      { time: "15:15", icon: "🏯", title: "Ruiny Zamku w Czorsztynie", description: "Klimatyczne ruiny, widok przez okna" },
      { time: "16:30", icon: "🏖️", title: "Plaża Zamajerz", description: "Kawa, relaks nad wodą, SUP" },
      { time: "17:30", icon: "🏠", title: "Powrót do Krakowa", description: "Przyjazd ~19:30-20:00" },
    ],
    mapImage: "/trip1-map.png",
    mapLegend: "1. Niedzica • 2. Rejs • 3. Karczma • 4. Czorsztyn • 5. Plaża",
    climateSubtitle: "Spokojny dzień dla rodzin i osób, które chcą zwiedzać bez pośpiechu",
    climateList: ["malownicze panoramy", "klimat zamków i jeziora", "relaks nad wodą", "regionalna kuchnia"],
    climateHighlight: "Najpiękniej: maj-październik",
    included: ["Transport tam i z powrotem", "Kierowca-przewodnik", "Czekanie podczas zwiedzania", "Pomoc w zakupie biletów", "Rekomendacje knajp"],
    excluded: ["Bilety do zamków (~30-50 zł)", "Bilet na rejs (~30 zł)", "Obiad w karczmie"],
    ctaNote: "💡 Bilety atrakcji możesz dokupić w aplikacji",
  },
  // 2. DUNAJEC
  {
    slug: "dunajec",
    badge: "🛶 PRZYGODA",
    badgeColors: ["#1976D2", "#2196F3"],
    flag: "PL",
    title: "Spływ Dunajcem z Krakowa",
    subtitle: "Pieniny • Szczawnica • Palenica • Wąwóz Homole",
    heroImage: "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/ohfdd51n_OlnaMJzYyc94aAr5cQNoWavXnSVAzs1js3YMPxg88lOUNdwOKKdMDDpzZmcIwGVM0K-TBmF95XcfP7t2UKhSty-6LDX7ATbaLJ8iH5UldSLAhCZ9MsaPCfki09DUs0EUSihFMY1FWSC_NghV0EuQhdZynRpPAF5jpPGd8xHAiYXFh-MxtT1gXO2M-xr8OhgN.jpg",
    price: 350,
    duration: "~12h",
    attractionsCount: 4,
    maxPeople: 4,
    accent: "#1976D2",
    bgAccent: "#e3f2fd",
    attractions: [],
    timeline: [
      { time: "06:30", icon: "🚗", title: "Wyjazd z Krakowa", description: "Wczesny start. Kraków → Nowy Targ → Sromowce" },
      { time: "09:00", icon: "🛶", title: "Start spływu Dunajcem", description: "Przystań Flisacka Sromowce Wyżne" },
      { time: "11:30", icon: "🛶", title: "Meta w Szczawnicy", description: "~2-2.5h na wodzie przez Pieniny" },
      { time: "12:00", icon: "🍽️", title: "Szczawnica — spacer i obiad", description: "Promenada nad Grajcarkiem, Karczma u Polowacy" },
      { time: "14:00", icon: "🚡", title: "Kolej Linowa Palenica", description: "722m, panorama Pienin + Tatry" },
      { time: "16:00", icon: "🏞️", title: "Wąwóz Homole", description: "Drewniane kładki, potok, skały (1-1.5h)" },
      { time: "17:30", icon: "🏠", title: "Powrót do Krakowa", description: "Przyjazd ~20:00-21:00" },
    ],
    mapImage: "/trip2-map.png",
    mapLegend: "1. Sromowce • 2. Szczawnica • 3. Palenica • 4. Homole",
    climateSubtitle: "Aktywna wycieczka z elementem przygody na rzece",
    climateList: ["spływ górską rzeką", "drewniane mostki i kładki", "alpejski klimat Szczawnicy", "wąwozy i skały"],
    climateHighlight: "Najpiękniej: maj-wrzesień (sezon spływów)",
    included: ["Transport tam i z powrotem", "Kierowca-przewodnik", "Pomoc w zakupie biletów", "Transfer z mety spływu"],
    excluded: ["Spływ Dunajcem (~90-100 zł/os)", "Kolejka na Palenicę (~30 zł)", "Wstęp do Homole (~5-10 zł)", "Obiad"],
    ctaNote: "💡 Bilety atrakcji w jednym checkout",
  },
  // 3. SLOWACJA - NUMBER ONE
  {
    slug: "slowacja",
    badge: "⭐ NUMBER ONE",
    badgeColors: ["#c0392b", "#e67e22"],
    flag: "SK",
    title: "Najpiękniejsza Słowacja z Krakowa",
    subtitle: "Bachledova • Strbskie Pleso • Jaskinia Lodowa",
    heroImage: "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/m6cagd6h_jlG41Vbbpf-iORsFJtjADOmcQkO432x8Jdff6DXKgUZmGSXEFcxz0ONeMBWeXqJCeiQ9uDqFEgPdXBDsrdXEZi_6hkxRnUJ8m0xRt7EqrcwCXZ_wF0V9vvQ7JxQiQcULq1KnJEYgAyTT2-r2nej0KOQg-B3ZaCW5SXXMnM-1en2pyuUJyBuFwW7fzhLoU0PE.jpg",
    price: 380,
    duration: "~16h",
    attractionsCount: 3,
    maxPeople: 4,
    accent: "#c0392b",
    bgAccent: "#fde2e2",
    attractions: [],
    timeline: [
      { time: "05:30", icon: "🚗", title: "Wyjazd z Krakowa", description: "Trasa: Kraków → Zakopane → Jurgów → Słowacja" },
      { time: "08:30", icon: "⛰️", title: "Bachledova + Chodnik w Koronach", description: "Spacer w koronach drzew, wieża panoramiczna (~2h)" },
      { time: "11:30", icon: "💎", title: "Szczyrbskie Pleso", description: "Spacer wokół jeziora, kawa z widokiem (~1.5h)" },
      { time: "14:00", icon: "❄️", title: "Demianowska Jaskinia Lodowa", description: "Lodowe formacje, przewodnik (~45 min + dojście)" },
      { time: "16:00", icon: "🏠", title: "Powrót do Krakowa", description: "Przyjazd ~21:00-22:00" },
    ],
    mapImage: "/trip3-map.png",
    mapLegend: "1. Bachledova • 2. Szczyrbskie Pleso • 3. Jaskinia",
    climateSubtitle: "Premium dzień przez 3 zupełnie różne atrakcje słowackich Tatr",
    climateList: ["spokojne widoki", "góry bez dużego wysiłku", "miejsca instagramowe", "naturę i relaks"],
    climateHighlight: "Najpiękniej: czerwiec-październik, szczególnie jesienią",
    included: ["Transport tam i z powrotem (Polska→Słowacja)", "Kierowca-przewodnik", "Czekanie podczas zwiedzania", "Pomoc w zakupie biletów", "Przekroczenie granicy + opłaty drogowe"],
    excluded: ["Bilet online do Jaskini Demianowskiej (~10 €/os)", "Chodnik w Koronach (~22 €/os)", "Obiad w Strbskim"],
    ctaNote: "💡 Bilety atrakcji w jednym checkout (EUR/PLN)",
  },
  // 4. WODOSPADY
  {
    slug: "wodospady",
    badge: "💧 ORYGINAŁ",
    badgeColors: ["#0d7377", "#14b8a6"],
    flag: "SK",
    title: "Wodospady Studeneckie z Krakowa",
    subtitle: "Stary Smokowiec • Hrebienok • Wodospady Tatr",
    heroImage: "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/8pcf4hw8_v8ADiO7ZUMNxq_Qp-LeQvz2Gi6W4SKkxceer1z_YwXnOMgZB_6IBld01y4_7N76PqaRCslQ3HbGlQiqbWy_kErbilKtks1w7ZBCMZrh1gnghQ9AIYQk1_x4ffDO5R3_dIdHkdSxrRDwiDz5jxZNUpvaj88UK-TdSPt2QyJUtE000rCFKgy5hE66xvc0JRDkK.jpg",
    price: 350,
    duration: "~12h",
    attractionsCount: 3,
    maxPeople: 4,
    accent: "#0d7377",
    bgAccent: "#d1f2eb",
    attractions: [],
    timeline: [
      { time: "05:30", icon: "🚗", title: "Wyjazd z Krakowa", description: "Trasa: Kraków → Zakopane → Łysa Polana → Smokowiec" },
      { time: "08:30", icon: "🏘️", title: "Stary Smokowiec", description: "Kurort, kawa, klimat, Grandhotel Praha" },
      { time: "09:30", icon: "🚆", title: "Kolejka szynowa na Hrebienok", description: "1285 m, punkty widokowe, schronisko" },
      { time: "10:00", icon: "💧", title: "Wodospady Studeneckie", description: "Las, mostki, kaskady, pętla ~2.5-3h" },
      { time: "13:30", icon: "🍽️", title: "Obiad w Smokowcu lub Hrebienku", description: "Góralska karczma, regionalne smaki" },
      { time: "15:30", icon: "🏠", title: "Powrót do Krakowa", description: "Przyjazd ~18:30-19:30" },
    ],
    mapImage: "/trip4-map.png",
    mapLegend: "1. Smokowiec • 2. Hrebienok • 3. Wodospady",
    climateSubtitle: "Klimatyczna i mało znana trasa, idealna dla miłośników natury",
    climateList: ["górskie potoki", "drewniane mostki", "lasy i wodospady", "tatrzańskie panoramy"],
    climateHighlight: "Najpiękniej: czerwiec-październik. Wiosna = duża woda",
    included: ["Transport tam i z powrotem (Polska→Słowacja)", "Kierowca-przewodnik", "Pomoc w zakupie biletów", "Przekroczenie granicy + opłaty drogowe"],
    excluded: ["Bilet na kolejkę Smokowiec → Hrebienok (~10 €/os)", "Wstęp do TPN słowackiego (~5 €/os)", "Obiad"],
    ctaNote: "💡 Bilety atrakcji w jednym checkout (EUR/PLN)",
  },
  // 5. ZAKOPANE
  {
    slug: "zakopane",
    badge: "🏔️ KLASYK",
    badgeColors: ["#d35400", "#e67e22"],
    flag: "PL",
    title: "Zakopane + Kasprowy Wierch z Krakowa",
    subtitle: "Krupówki • Gubałówka • Karczma • Kasprowy 1985m",
    heroImage: "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/dm10vjl1_PKMfrd5SWiGV7ThIl4UjFl1r5rvTjefPP2OJvmSbvIqpbvUBcsZhM0CTZFPVXzVae0P1HfdWgkshaJQreiiFr8k7w_nULvmuSPH955k3uuxXorLvKd7t-jqyX-36G5eLLkvIfQIOjWGszDuENhWEdm-vD56bqALS0olEDLuB5yt1AV8TlngMQMxwJaK-K52k.jpg",
    price: 350,
    duration: "~12h",
    attractionsCount: 4,
    maxPeople: 4,
    accent: "#d35400",
    bgAccent: "#fde6d3",
    attractions: [],
    timeline: [
      { time: "07:00", icon: "🚗", title: "Wyjazd z Krakowa", description: "Trasa: Kraków → Zakopianka → Zakopane (~2-2.5h)" },
      { time: "09:00", icon: "🛍️", title: "Spacer po Krupówkach", description: "Najbardziej znany deptak w Polsce" },
      { time: "10:30", icon: "🚞", title: "Gubałówka", description: "Kolejka linowo-terenowa, panorama Tatr" },
      { time: "12:00", icon: "🍽️", title: "Obiad w Karczmie Po Zbóju", description: "Kwaśnica, moskole, oscypek, placki" },
      { time: "14:00", icon: "🚡", title: "Kasprowy Wierch — 1985 m", description: "Kolejka z Kuźnic, panorama Tatr (~2-3h)" },
      { time: "17:00", icon: "🏠", title: "Powrót do Krakowa", description: "Przyjazd ~20:00-22:00 (korki na Zakopiance)" },
    ],
    mapImage: "/trip5-map.png",
    mapLegend: "1. Krupówki • 2. Gubałówka • 3. Karczma • 4. Kasprowy",
    climateSubtitle: "Klasyk turystyczny — wszystkie ikony Zakopanego w jeden dzień",
    climateList: ["Tatry bez długiego trekkingu", "relaks i widoki", "klimatyczne zdjęcia", "atmosfera Zakopanego"],
    climateHighlight: "Najpiękniej: czerwiec-październik (jesień = obłędne kolory!)",
    included: ["Transport tam i z powrotem", "Kierowca-przewodnik", "Czekanie podczas zwiedzania", "Pomoc w zakupie biletów", "Rezerwacja stolika w karczmie"],
    excluded: ["Kolejka na Gubałówkę (~28 zł)", "Kolejka na Kasprowy (~109 zł)", "Wstęp do TPN (~9 zł)", "Obiad"],
    ctaNote: "💡 Bilety atrakcji w jednym checkout",
  },
];

export const getTripBySlug = (slug: string): Trip | undefined =>
  TRIPS.find((t) => t.slug === slug);
