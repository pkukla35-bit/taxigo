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
  gallery: string[];
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
    gallery: [
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/1u4lylr3_fKcxwfwiG4eMDe8rfrx7J4b-rBcqNz9Cr5JPHTQqZWybIaSRBCS7Zvnz98PGp-lu8nRflpiOkvQ61xTqZfPxg0b8QtQAJDzzDLJSRz2W4CWEkzj9p-s3ChqXkPaiGB7z9J0to3RzHERd3GR9mfDgWANPHR5b2uQv05fIVBnuGCuad4CX4CF32Ze9MCfMLRaz.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/bo8omojz__WODmwSyszXYHGkICPkZBVdUtOU7o71COs1MSAr71Eh-K5vM7pNs8XfANys9F9coqmsYaVQzKmB7DaXZ3ESRdqQnoneGy0Gw2iNEXV9-LLq5tqXliXlATwvROZQYRODnLvFgXHpz3hfb9iZf5p0_7HeeCfLzzsjTTMPxk5Na4fGL8Ep51mFYURjgb1EP85kQ.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/d1l74zt9_M5rFJ58PPxAE6o6JMcfnCCX7sP0IbFm-7bC9G8AXpk2pMF1Zrw5QcP9Du_tUvnR1ZTFNECXlzFFXcY7BFslk5wkRlun_3zzv2h0j9TKqmG1k1HyRIttW0tAhIqghfbnqx8DuG3hE2PK0fMBuLWwp6Eh2zCt0QwSE7-dJU_vKku2W1594g4c-DyzUW2F6nhCd.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/dgsgto25_QeQSv9KXBIia2LEu0f34xtEL0xz58DxfMXnfUjo8aBNtUjwPnHtw_2CGxG2MGE55L9fp7AQFQ-lkowZS3fMg4fKDf2Ro-EUsNrwZ7r4t-Okhfdr9oc5KAW2ekNDlSFQdrOPIf6xQV2H3hzPN-NsrPmnsNrGnaMv9DxTiYI-Sv7O6XroUwmLyHN5jKdkwqwZ5.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/i2bz3rsb_WHOl8Xs0zoTmpbpFbkVHqRqrUBSQi_u4NdQBD1nKxM174_s5273GGPykZPnJiNUB6j5bvCWv4kPLnsHgZV2OqJA6cBnWOCh56vmxkXiOn-Rq_qOGvhG0xSK68CU1ujgQ9RQzvCQJT7-PHfPPbJekzUISeiQpNYn3HqkCR-t1YTDd3UBLudkC60Lm4SZ-btXg.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/jut9xmva_nxsYuQekiqrQ6dpWsSoC3oGETGJSpr-OdjCfvAPIBvB8vOpWz3mNMmFhLg1-fxIl7tnBxM_Vyd8rJqplFXb0xGr3JcQIMMxMSeDk7KYjgFQ6k1EQMpE5o54NipT6TnF3DGWmg1-V8CvLHU-7_vo_dYFGyX_sbFIosgeSMkUSAkRMpzoNxv5z036pO2RbK5-c.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/ucr1r7co_Nqijir-7MxONvGH1PIB9UvrT4PENGJzMl003BZRmXxSWPk02pd_n4pdf9B73JQ2BitFSAQD7nR6iRr988mO3rpLrYaw-7WKcv_hXNMRYvffv56UOk10WTIRRwHQcqN_a1U355KfMMZocHJ5_S74467GOoGyuFJ4HUm4S2kdTqHKjpvgaJX84O-G_XS90ZWLq.jpg"
    ],
    badge: "🌟 BESTSELLER",
    badgeColors: ["#2E7D32", "#43a047"],
    flag: "PL",
    title: "Wycieczka w Pieniny z Krakowa",
    subtitle: "Niedzica • Czorsztyn • Rejs • Plaża Zamajerz",
    heroImage: "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/bo8omojz__WODmwSyszXYHGkICPkZBVdUtOU7o71COs1MSAr71Eh-K5vM7pNs8XfANys9F9coqmsYaVQzKmB7DaXZ3ESRdqQnoneGy0Gw2iNEXV9-LLq5tqXliXlATwvROZQYRODnLvFgXHpz3hfb9iZf5p0_7HeeCfLzzsjTTMPxk5Na4fGL8Ep51mFYURjgb1EP85kQ.jpg",
    price: 550,
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
    included: ["Transport prywatny Toyotą Prius (tam i z powrotem)", "Kierowca", "Czekanie podczas zwiedzania", "Pomoc w zakupie biletów", "Rekomendacje knajp"],
    excluded: ["Bilety do zamków (~30-50 zł)", "Bilet na rejs (~30 zł)", "Obiad w karczmie (we własnym zakresie)"],
    ctaNote: "💡 Bilety atrakcji możesz dokupić w aplikacji",
  },
  // 2. DUNAJEC
  {
    slug: "dunajec",    gallery: [
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/2mi92ztn_QUmIsxuA5lytTAb4xt6ab5exOLH9JUpxJ4uLuMZmSxXfv1o0iMB6Q0AFiqk5FqNrCn2TuTIHPejhEq-OGnUIJAFiavpJazub97waeMYXvUR8Mkjl5nxNsI1frwCCabavCp5lIZw3g2zbC0_O5oZSMLMMIIVU700vkilw702YRA_66y2fTNs0LEtnJFUbI7qV.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/3vw9nkxw_WbrLcz0A-g0f9PF2pvBUGbFRYaMAzmls65UYS0o733ksfD4dDc9T5xVsuZ5aJQGDcrtSA5PbQzSYKTQOyDoINUVKmtuVbHy10rxi4cMAkkdl63BgcpOs1zq0kxFVAESiIeDle0XM-poR5DGq9oDMXVUtcdMCtnVMaye8k3j8APP7T564kKCeRg_lnkL5u0HJ.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/61f1lfen_FJWYzel5YTKp9BXO8Pu5OYyBpCv3GZO7VlhH6WALNAmYhibr6JJkQ0yxRWEHH3NO2g_vtUKGIruYBKquxdOqD_k1s1VufFsaNtY9l8hEw5Yx2VntpXStEfR35iIe51rmZdTdvy82BClCWrF8bYINJKYvI6ILMwdq-ln1vX50jfkubs8epPSqUuDTRCqTp1b8.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/6okmh5b4_xhtN78_dE1Hq3CUB1JwyozHZem_g8kpEWh_JMonxbwshAZnSpmOXBWqB63YlDCCt-f0QOYcsQzYviN7DQjed5gpiAMYMW5Q-lqxUfImP6bhXhXvwyvjgwAPJZx6MS_ON8f_z_1Z6aeqmFGzTreKCfSenBgokxDkMqZDLlH4vuTY8q4GigcltUWwXVFZgLxAo.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/akepg4re_Aq-pNwwnn9eUfcSB3jGluypnr4S0Rrfy5cy5uHdmxGdZxn5YDI_c-rJM1ormxbQv5vLviZUSNvLcLs3TdoSMh-r333ai7dTvqRCi33GJ-IC_M_hu6hX8tpbpHn5dWNJHIwN95lu2vAzb4o_jKN_0niuEF9g6eu3caiCbyZ7QFDdh1ZSJ7BIkF_Y45KD8K6fL.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/drd65q22_F6Y6yIxFBki1CVlxij_TpilpU5CDVZfx5cBMFeGSW2W_vOPEyFUPNUYeuLuNo9oz_CNzeBnu3wc_3eb-IaB67XJz2VtmJJUjpKkNlTP1ViVwQI7YV8NlnO1qFl3-iPLs-Zvgj51iNuC2wkt1XyWqgIK77PO1_1nlMTALLYZu-KnEJu_YRkWcyVJGKsf56YId.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/gg75qbw8_ZzbsVeCikxI2jeplO5dYnVaFPRvFyLXrTVzzTVu9Rpqc65rY9A4JkY9pgU7e2emwxogJr7ZoiXVOzPDb603uduXcsmEq9TSh1SKnVkIiVBZM0pn4R07L9Rne8iT7afUtououf08Qv3rQoFGyNxIi9ZwqNge__6verEazcP4kOqDi1ooyl1mn-zMQRNI05D5m.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/ohfdd51n_OlnaMJzYyc94aAr5cQNoWavXnSVAzs1js3YMPxg88lOUNdwOKKdMDDpzZmcIwGVM0K-TBmF95XcfP7t2UKhSty-6LDX7ATbaLJ8iH5UldSLAhCZ9MsaPCfki09DUs0EUSihFMY1FWSC_NghV0EuQhdZynRpPAF5jpPGd8xHAiYXFh-MxtT1gXO2M-xr8OhgN.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/pu8mhy6q_oGqs6K7PIF5DnIm5KBDwSDh8uyxJR-WXeb-YZYt1Y13WpHZ2IoHQDQAf3NhOZRad0nohJsoiPdMennf8UABwWd-9dGbeFKhSoPCEokNMcqETEc8JJepYWjvaenR_9b4egmMPtaDM1Cs_bN14m7cwHSXSwVAleXpbyhZvBuLvE4BqzWoc99-YC8vMuMsxF4az.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/s096rp3a_5PU78NICs35w4_pQV1VvJIsXB8WoSXF4sOWYt1C1w8V8uHXU5WSY87X7a3uzCyH_i3GCiE6PKyvGeolktmU6plo3-xCXW_md2rJz1yvSQyH10o7t6_y-CeBRaygJwQWDUHdX1_AQyuYIjRLThkHZy3eRAX-zIWnUf3OfLG-sw1ujn5JInVVZFRWtFKNaPoRA.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/s4gjyt4w_R2KCTT21uJKsPy9T97IjEvJPNaCMahYZaphI98lwI01xK1C-4kfVwL4ipkdAjsm0MICsNgZ1ABoV50rdQtB3T6FUntJhZ0uP2QGcKF0KBbVOOp0u1IyY-m6IqhDfD67tfCk3bBBc8fK0VPSjhdhlcaWfnRsTvROxcB-CSGfRwtK-NFzYFh-WsH_0NhfAteW2.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/uhi8253y_9vUNOriRqE_ZsmUOBRMuYWPiwxR-GmfJ0spR1ZPndUoEqTLBvyoWzDayOzUzyNZwAO5T01E-EnSdS_OoJa3v67w6WYCPoGMj2nkPZBrdo8KG_N2TxUSPEs98nZzNzzXVe9QRa7tUcxrBmyU2i-FmncbsTzy3UB93BumLKBZaOuIfvItMvVz9HZLwqZHx0o8u.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/yokmuour_AVbqJwYOIM-vUeF7_0TljbfT48Hta7yByfRMkWkHUrZbnoLsKc_YtRejpuscryljOcM54980ON27WoRctvTwV7mQ5q9qELBKupcURfSS2UqvU9UwHzuf2ZI0bQATjZKVhaVIZs6syWX9dRT2waHTQfwUh7vDnVHEvJSckS9-TmessgRH9J89zVLVDaTEYmoD.jpg"
    ],
    badge: "🛶 PRZYGODA",
    badgeColors: ["#1976D2", "#2196F3"],
    flag: "PL",
    title: "Spływ Dunajcem z Krakowa",
    subtitle: "Spływ Dunajcem • Szczawnica • Palenica • Wąwóz Homole",
    heroImage: "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/ohfdd51n_OlnaMJzYyc94aAr5cQNoWavXnSVAzs1js3YMPxg88lOUNdwOKKdMDDpzZmcIwGVM0K-TBmF95XcfP7t2UKhSty-6LDX7ATbaLJ8iH5UldSLAhCZ9MsaPCfki09DUs0EUSihFMY1FWSC_NghV0EuQhdZynRpPAF5jpPGd8xHAiYXFh-MxtT1gXO2M-xr8OhgN.jpg",
    price: 650,
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
    included: ["Transport prywatny Toyotą Prius (tam i z powrotem)", "Kierowca", "Pomoc w zakupie biletów", "Transfer z mety spływu"],
    excluded: ["Spływ Dunajcem (~90-100 zł/os)", "Kolejka na Palenicę (~30 zł)", "Wstęp do Homole (~5-10 zł)", "Obiad (we własnym zakresie)"],
    ctaNote: "💡 Bilety atrakcji w jednym checkout",
  },
  // 3. SLOWACJA - NUMBER ONE
  {
    slug: "slowacja",
    gallery: [
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/91hl9eiq_ChatGPT%20Image%2019%20maj%202026%2C%2011_20_31.png",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/0c8gtkwl_K-Or_DvV0gzZFPQpbs1HDNcjRt0hUXVFHLGt_KVkJJQfz8X9nWLJaWROA0d4avvHNX1_Mpuxd__kmvmYpzzWBh8LVv3bbgbEPorvrJbl7XRhVwF164paIeaWcgWzay8lN4gGoUvLnDQdu5_rk-2Yt9oAq7VuKl7pafG1WZ9_MnVm7U5qCI2RwcsGs4-oKF4x.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/jp0wjqga_i5C0P59CGNWKdxEDEmSZTOEYZvp7FOZyaNBFMgUa81igdWZNJjfYLi58GQPZhF_VORIX1sLUVoAW9zXlpSth6CvQH2hE5u3EATTvd-JxLzV53XgAK1V_jK1-QPXcBimcaJo6zYiPjHjMuSDaYk6wSWf3Vgtrpd0ewQxP0uNGABS-8C0ZhJUj6Whs-l7p3Aeo.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/dtaenq2p_37HJ0uS0W8naDWCNEgAGHHzpK_BOKJT2qn65t34pi-4-sCiSXkqZvfjeyYLx4-wO9vFkIwgimIggNp6SkTcD01L_xhqlahDY27k5ZBP-lRmrt3wSeg6x_g_Gs4yZdZ-1F12H8TW6Qmk-2eDvp-bvfXFesz6o483U6seKGQ8WsTXWcvSBsfPUXBAep4dggDR3.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/qx7cv3yf_TcsfOcow-oqLIsWAwLM00aaoqVPopWz4SSiqkgi_OpBwX1uKyBTKMrhhtmaB7RvydPPapOd4_FRJhbcQEKaa0XyOpgePHHHHWGQr0xNkWaAI0rwHjMHuwJSKVWaYvct32nl38CNtFYZpq9P2sYaemo07NmCjW5J1fxA9GsVdHbF9xjY1JPuINTArTWIbWsSI.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/2ovjtjx6_6HUCNODBDZIGduBSipcjYp_PWSiDFWqArPuSJJ5mlaSvVqnH2_Ttyd5NaO5GQCGJintiFnaKP1v5peTsnW5E62lC_Iq532fynzMQLnifA1Cmu5_9jdHSEIcRYUSbgu6CAs22ik-A9oz1c4Ogsk3HmNwHFAjPdIlvdGUcgw3OOPFC9lJmGxT5ktwPLJQtBOaL.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/6o7h3j23_v1RgJ22UbvYnCS13yBkEobhVFNtAlCNCvPfRmW_XUvCI5kq-nkYyifdGB8tERck8gzdzlb6jkOCZz4aFsxanE87MHTR6WFVF2NXI9aYEwPQgpJhVi08ZSK9_xsM8e_Dy0WhJgE9JSmDG7_xJ8e-rECYPykWz4RdjGw79S1NFlChgB1B47mzPCnkmEZV-6ufW.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/m6cagd6h_jlG41Vbbpf-iORsFJtjADOmcQkO432x8Jdff6DXKgUZmGSXEFcxz0ONeMBWeXqJCeiQ9uDqFEgPdXBDsrdXEZi_6hkxRnUJ8m0xRt7EqrcwCXZ_wF0V9vvQ7JxQiQcULq1KnJEYgAyTT2-r2nej0KOQg-B3ZaCW5SXXMnM-1en2pyuUJyBuFwW7fzhLoU0PE.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/x75tqz02_gTM2rX4VypWwTN1wttwhxghnvsG5zz6xxKXN88vs5ZcJBf3uIWcses1V9WirduLJuAqXvrFv8Djjs3pMsyJsrZ6fQC3lZfgCO9jrHysKWh-ExvrA9pWo85MlpgxuAhm4IbfEbYXWLx8kZ5kxPG8e0GkLXdP79BzUsp_eJk7gknwBZgNJ7a_w_IZoEOV4dAim.jpg"
    ],
    badge: "⭐ NUMBER ONE",
    badgeColors: ["#c0392b", "#e67e22"],
    flag: "SK",
    title: "Najpiękniejsza Słowacja z Krakowa",
    subtitle: "Bachledova • Jaskinia Bielańska • Strbskie Pleso",
    heroImage: "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/91hl9eiq_ChatGPT%20Image%2019%20maj%202026%2C%2011_20_31.png",
    price: 750,
    duration: "~14h",
    attractionsCount: 3,
    maxPeople: 4,
    accent: "#c0392b",
    bgAccent: "#fde2e2",
    attractions: [],
    timeline: [
      { time: "06:00", icon: "🚗", title: "Wyjazd z Krakowa", description: "Trasa: Kraków → Zakopane → Jurgów → Słowacja" },
      { time: "08:30", icon: "⛰️", title: "Bachledova + Chodnik w Koronach", description: "Spacer w koronach drzew, wieża panoramiczna (~2h)" },
      { time: "11:00", icon: "🦇", title: "Jaskinia Bielańska (Belianska jaskyňa)", description: "Trasa 1370 m, ~70 min zwiedzania, ponad 800 schodów, stalaktyty, draperie, jeziora (5-6°C — zabierz bluzę)" },
      { time: "13:30", icon: "💎", title: "Szczyrbskie Pleso", description: "Spacer wokół jeziora, kawa z widokiem (~1.5h)" },
      { time: "16:00", icon: "🏠", title: "Powrót do Krakowa", description: "Przyjazd ~19:30-20:30" },
    ],
    mapImage: "/trip3-map.png",
    mapLegend: "1. Bachledova • 2. Jaskinia Bielańska • 3. Szczyrbskie Pleso",
    climateSubtitle: "Premium dzień przez 3 zupełnie różne atrakcje słowackich Tatr",
    climateList: ["spokojne widoki", "góry bez dużego wysiłku", "miejsca instagramowe", "naturę i relaks"],
    climateHighlight: "Najpiękniej: czerwiec-październik, szczególnie jesienią",
    included: ["Transport prywatny Toyotą Prius tam i z powrotem (Polska→Słowacja)", "Kierowca", "Czekanie podczas zwiedzania", "Pomoc w zakupie biletów", "Przekroczenie granicy + opłaty drogowe"],
    excluded: ["Bilet do Jaskini Bielańskiej (~12 €/os)", "Chodnik w Koronach (~22 €/os)", "Obiad w Strbskim (we własnym zakresie)"],
    ctaNote: "💡 Bilety atrakcji w jednym checkout (EUR/PLN)",
  },
  // 4. WODOSPADY
  {
    slug: "wodospady",
    gallery: [
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/0awpxjeq_YDgtz1MwDLu510YDaSSnNObqR6Y98m0oi2q8VrxOm-OaWBGP0banUTN3qLDnD0cK2Xa81B5EZEsTP-196B0CUH6XFqYx_Y3m85tnonCnBAWH5L4guCSb-xOoAEH5hhVAnVrZ4omM3O9BTBgrAn-IeQ7Vr2Qj02Mo2i3czM5fdUGz-vFIYt4bOyg5ze-UZFSX.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/74rza2dt_an9hI86bcI08W9TxXVT-rkdaOxRcIZ_YuqZOu8h_SLMoKZfD91dH2UX_tvLtFpa0hE4TK56zpOa3-ZqmDDaQWbyXBK2NxfkUYyetPjjEv3vYke-Szo3sbMv4d_Sgz8FT3dzQ373QgZWOIKxIG05sySZfShu0eJpJCyZEawllG5VFsTUFhJXgI7nt4PzzS80A.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/8pcf4hw8_v8ADiO7ZUMNxq_Qp-LeQvz2Gi6W4SKkxceer1z_YwXnOMgZB_6IBld01y4_7N76PqaRCslQ3HbGlQiqbWy_kErbilKtks1w7ZBCMZrh1gnghQ9AIYQk1_x4ffDO5R3_dIdHkdSxrRDwiDz5jxZNUpvaj88UK-TdSPt2QyJUtE000rCFKgy5hE66xvc0JRDkK.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/gw8ghmnb_ZwggXDohOcj6LbymCO6MLICBQPtdChOPmtyIuLYHkb5Tb_M6jn_xCt_dzBLCM_WGONcWYd3xW8b82KUS8PE0jCgx_HiGrDA-44T_jN0861iidc_7Fx7AryIVoMvAjaNhEEDzvFSHxWD6laMbjNywnn_M_N22A01EtFllUuL65HlfRKmsOFxI6lrrcncCOcMp.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/m2kzz5fq_Iqx3XzA99LBj2kOqJW3qQHEPNeIv9EgcYTAKtnBIDMsHKBdP_3uVk5u5Ok2si87gW8ssQTgcOdD1gzVhtE9URQtakqpjdvKO4cLFQCayj0CgG0fPSn-tvK-1qdI7AR_rHxstPLrVmERcmPZU1NDEHMI7MVcldvwSAtnmCRm2oUFEWrzvkXHQBjk8-fuMFPJG.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/omkq8nwq_XfNwtCgJ4MGAmgq9ak4-6VdHZAoECkYOsEkD8ArpyE4e0gKk1y7E1P_g0HKAS-zhyKMGDQKj8_tKkg2YvJ5nhp67Jn8OsRJ06Ywq-pv-v1m3rIiwrvmwz4GOhkORqHpmT6IUoFGiPltooTJfADs8M9p_fa1YkqqfyEQb_RTBH4NB-RRKASxYQxO0j1E-WYJL.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/oti77lpv_5BAeqjSzsltg4qDCpmiITGqw4fon_St44F_2iYTR7jTpSrrsTchcpEIYnR7GL3DZHZA6wNZ9OmH_sI7-boldrFSdYFgdrurIQEw420BkAQkyajB-d32S4zUU2iKPwCu_4nfA09qV_YZaB_2_d41Jt5U-ZUgV5xmDcWh80D2zt46hfc6qC4HDorZxBNPDHxUl.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/r1t7110v_4U37K0_nmm1_zhPw0TKapyBCDB2NSy25gx4f7BdT3-Sigb6ak9f4epoxCB2XSc8ygv5k0OA5_EBpIt8jdb_MHhwB2WInictp5GKENIbc3_X62mv5DbcAjjfpGU1YEhozRFVY556rB430LZQXHOpp1s6sSb6-htzZBPT0pPUb4aNyUi8OoaW18yRGud7haD_p.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/tn57fqd3_Illfi6vsITgHgQGr_s7DqmzfLLZj_kEeQZVbJIfmo30bZ_WUrZ1Xnblwbu7C604foba5G59xNen_1NToqejoVl-VwZzXnoraUqoh8e1LAD6tz8RgsFfLVzd9jk0foxrA0LgxJSO96vyUs9tAsfb-UJoyPhgkhcuqQ01w8mm4wDn4UWMM-mA0ByZfd6NbvH3B.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/yg16addc_sJ4vje2ya3U-HcBh8mLdyeKyjjgDeIbY49F8pDkD-gBgsqur034E2J3LmXB5TbtXW4L-0mWAPTAoc18c3B7lAQInuquoU1QB1OnVyho7V9JqxaUbiL_Yz7UZDdcuIf-pxNVVuY20rvBnAlmzf2D1XunoIshnsVV1hhNcvKEtzPKJ7fu_LPB0HHel1fEjd2nb.jpg"
    ],
    badge: "💧 ORYGINAŁ",
    badgeColors: ["#0d7377", "#14b8a6"],
    flag: "SK",
    title: "Wodospady Studeneckie z Krakowa",
    subtitle: "Stary Smokowiec • Hrebienok • Wodospady Tatr",
    heroImage: "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/8pcf4hw8_v8ADiO7ZUMNxq_Qp-LeQvz2Gi6W4SKkxceer1z_YwXnOMgZB_6IBld01y4_7N76PqaRCslQ3HbGlQiqbWy_kErbilKtks1w7ZBCMZrh1gnghQ9AIYQk1_x4ffDO5R3_dIdHkdSxrRDwiDz5jxZNUpvaj88UK-TdSPt2QyJUtE000rCFKgy5hE66xvc0JRDkK.jpg",
    price: 650,
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
    included: ["Transport prywatny Toyotą Prius tam i z powrotem (Polska→Słowacja)", "Kierowca", "Pomoc w zakupie biletów", "Przekroczenie granicy + opłaty drogowe"],
    excluded: ["Bilet na kolejkę Smokowiec → Hrebienok (~10 €/os)", "Wstęp do TPN słowackiego (~5 €/os)", "Obiad (we własnym zakresie)"],
    ctaNote: "💡 Bilety atrakcji w jednym checkout (EUR/PLN)",
  },
  // 5. ZAKOPANE
  {
    slug: "zakopane",
    gallery: [
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/qd16neg6_265363_tatry_morskie_oko.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/gh52wn3m_f571b4c62d6e9eac4f29309d4b23702a.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/3jt6s7ow_f33003e02c4f3d86e655d8876a3f88b3.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/bmdgvqyd_aS7ONH7LRMKo5vBTbxxivVD8JgLoMbnI94sm72sCr5JrWRy2_7ymMvA8bSLNxJjQPSgS-qNaDiqxkiKxjeGQO9liAB3GoRwmixlYeMK_InSNEhjKVq0h2L77MXUgdTSOnAVSjbRv80QAvMLKb9WeCIWm_5fiyE_ZFDCvQZ4Bpp9DuMiLpjK4I0UT9e61SI-3.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/2ex177xi_HiFZm8GYzW0d-RDpBSxJ7pa3aioSNkoz4n6lv68f97k5PEB--LW84q2ZgxgZymprEBuSBLRRg_AyT6OzbFk386QGDBEO7LUv2sF2xmWuouStVRCOWQKclexRw12beant3kjE5qANpa87AvWMIkLx1lI56k4SFXGK5_8UqXtNICIdsWmnyHGh2q3weFS9YCww.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/34uj9hu6_HHTnSgCGcEFTbPldMPTRIySyKTbdDlc4qN3qVHdb0tejTohnAwYyheX6Tng-4iuJHcN1c2_N11ppOY3zMe_LRyNB7UWRhYFMcTZd6lqfuxTz46Xs-rnc713isSheWsz0Tf_2cjhwxxA4ZFGUSUsOv2ldrgQ2Bf3JCVxOaw9R_GU17YxS121arik7pFBNfOCp.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/7bxtprdy_ytiqWfoHF2tuJZW8L0onIKO9_cHZ6WOlsqEoZO8jWjEaUejpZJp_svKIso1ZY5BnRm72YRDdsyvT4SLUzZGyR4595bQuByDCx_96ru5Ilsu6me2cXTHQ4B_T9TZH3_H4mafn2x30RR_1x7sST4bT5ZNlop5K2HM7fz6Iq39ME6JuIxBmSggSY6QWW-iNHGJ7.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/dm10vjl1_PKMfrd5SWiGV7ThIl4UjFl1r5rvTjefPP2OJvmSbvIqpbvUBcsZhM0CTZFPVXzVae0P1HfdWgkshaJQreiiFr8k7w_nULvmuSPH955k3uuxXorLvKd7t-jqyX-36G5eLLkvIfQIOjWGszDuENhWEdm-vD56bqALS0olEDLuB5yt1AV8TlngMQMxwJaK-K52k.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/ea4s6qjy_NqgXfh4Ns5k1_xWTGloIj4kLGm4wo1coggUNgUXw9IKTNKQOBPLKVGuSQMViBlETfbARamdimmnq4Uoy8ngJZAX_LAa9FNUMq0Es-I97XNpwQTnaLGF2zkaNmCED8NB-k06HDoQxpxR8fy1aAEWnJ12l5axCs5Ay1t5ZXFsIMbaxYcnnyhI-nt8XAL_rx0U3.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/fqdihjcr_aBnMjw_SGzJ8UelrG7MLDh3J97GdJzLO1GGn8GtvFB1Hx_eW4bSDCs47djqawHNDNkcheEC41iPDr5Y51WnLsktShwk2u66SrvvRdJxP241n_wn4KoehSEd94op_V1m-PBrjXYwUeEu06Gtq7YzUVomZdkbL-nZrSSaQNpDjPGPK2ArXCAbs6S2ULhgaEUOV.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/kbrhxmv0_YwV5vZWljpiVUW2qYcI5nYxkxl-8YVC_Vi7nG8d_P0sk-kf3w7E93NgvTiwKcS3LuDxC27Vr4jeH-VcxJYS6Q_RiBCKBiHiQ8-BqLck3ALrgVEH87TyTzDaOY5A_71xqhpMj7El8XdeEkmKuhP6aTWyLaIHDuVEbeOreljrPOdUx3C5zN54FcXe3qwPjWItT.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/kztto5jz_F9YP2hsBpTKqzyrb59cMmi9EVqzfoiXTwPp3ErSRIkK77lAqJAb6PVDjGPqNS-C01PXV_jog8tAlopDLwSsc2FmcW7jBSsLn-P_z_KfU_MeIwDiCfHs8jrLHx5-JQm6huRJ1OjM2nbMyMBqwA2nkNElHSYP0sO2JWmuwMWU8oSiWB5jlfTMxS_Tl7qzHHJfU.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/lq9an5ig_DtvWmkUCqHuO0xE97n1Hp7RBhNWdSWQBVOpePyrGyaUucXt-XztNVMYjPqOg7Zy3mI7ZSDEe9-rmRBr6QLUTAMMFRktNmTilEfVuPxUZ6AsrFYrfCn-V9n6DMy9ZNk6D6A8WTlk-3JKmmssulcD2mgJo0BEZ4uqLvTjvaHtzKUf9VdPK13XmxwoEOQzkIF-H.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/ruiw735f_R_1Pl483FRXKC9aIRJbzEdtI_tm4z7e15tcNp_rxlD8hl8fntpC5gjzijsEBUMFCGu8n-NjOenOSV6xtB7VmfQBBKhsAc2ZJMF7nFyTbzgu_gaE9R7iv-yKISdjSRA78QYCO5cOeSaU3eQS_TjtTzCG_oWVa4R0cEM64fLfVp4D-L8NwYXoNAHm0sK5H6XhG.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/t2r6z7ee_-ISoV5MKNej-vm5N98XoEjNm_U-3kkzHixrTEgwMRz8Y1i5LKEeKNSxTncWXBPcXJHSonJleJXuZ8A_WCHFzFWvwj16A1FcTFEvrPyTf4fcfRnAuVtKLuCJzqR8A0qqvCmOqLkjtgxsv8v6vjohuIcvfH70b26lYBz6jqXNmsSuw8sYbt2RIY5BSwQZycmBe.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/urmviuj3_inukccIyrFWknaDoWwRk3qTaH0AylXh-8ks_EgK3a03iJHcBEOjzLwYdNbicauNIMBcG57fRP1Ykcsbj8ocvLlLthzlmVcnoVghRemY01eHnwcALJtae2OHjHkiXBEP0FKbSGIaVdtKzy1CygkK2ZyKIcrWYEStBlgY6wnsH-3mOs6FQNH_arQFCXzlubt04.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/wy90snog_JoyifS8Q3gmEITWHoV_2uLzzv57n3Q7CJUmpcaeKWbHlrvxWeBM7FxJTsDY3kdQGU1prNXXLbeATIllexRGD7qBh3do93eMpcpM_PG_27zoD4TJqGAP2sXIhDCyPYL5lWHq0BETCSsBajixKRyJvrQNBgotJwYkory60YKZFweAde_9hGi4yU5Q19n8pgQV7.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/xg6y4zpz_c04Rs6bCIa5K6-DN0TQbVVwQlt0cZgHD4zMQsQ7Q8EBNDTunwh5osoQlh5nz4xkdGbLib7fozOq-qMLBixDveVL_XTqOcPTlGccG9fYaya4PzpPayt5ULTdpNC2Mj-EDVU2QSy6Qw8KhA91swetn5E1CW3mJ0CIbRidT8wKmJ_C_QwgAM5PQMREsCxu5IG50.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/yf3xvbh8_qUnwHB3dsd6eBtnlyLeWIf9bbdttKH2xfqQS-5pXfXN5UkXdKfBVn_PgOfqCLOpa7QVX0PwejYziwDf9Hs5B1ndebyecMaxT6_t40SlBKmmbjsfAmghrGHJVmO6C1LmEI-KZGdh_QULfLt_b4rozuY7vSRN743g0L-Xsr1HLcll2o5sVoigkAZuGjhpVgZOo.jpg",
      "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/zr322qm9_OAGkpf9bn6RUbn8Cen49izqD4zwgIfrvw-CpMO5DAWS8kafBAUj0wXFRpvZ6tky6AG1eYrA02ghjbiOIWDuX1DaqBxLkcRVaozogcvsAlwe5obKv-Q4_dInR2hb4jik7UVDZ6bwHKg5OK_ThI3qI6WQyOfPC_59dJCOw8tbNoF39I1q90MnjlgazP9ZPrVrN.jpg"
    ],
    badge: "🏔️ KLASYK",
    badgeColors: ["#d35400", "#e67e22"],
    flag: "PL",
    title: "Zakopane + Kasprowy lub Morskie Oko",
    subtitle: "Krupówki • Gubałówka • do wyboru: Kasprowy Wierch (od 6 czerwca) lub Morskie Oko",
    heroImage: "https://customer-assets.emergentagent.com/job_mobility-platform-130/artifacts/qd16neg6_265363_tatry_morskie_oko.jpg",
    price: 600,
    duration: "~12-14h",
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
      { time: "14:00", icon: "✨", title: "Do wyboru: Kasprowy LUB Morskie Oko", description: "🚡 Kasprowy Wierch (1985 m) — kolejka z Kuźnic, panorama Tatr (~2-3h, czynne od 6 czerwca)\n🏞️ LUB Morskie Oko (1395 m) — z Palenicy Białczańskiej, asfaltowa droga ~2-2.5h w jedną stronę, schronisko PTTK i wodospad Mickiewicza po drodze" },
      { time: "17:00", icon: "🏠", title: "Powrót do Krakowa", description: "Przyjazd ~20:00-22:00 (Kasprowy) lub ~21:00-23:00 (Morskie Oko)" },
    ],
    mapImage: "/trip5-map.png",
    mapLegend: "1. Krupówki • 2. Gubałówka • 3. Karczma • 4. Kasprowy lub Morskie Oko",
    climateSubtitle: "Klasyk turystyczny — wszystkie ikony Zakopanego w jeden dzień",
    climateList: ["Tatry bez długiego trekkingu", "wybór: kolejka lub spacer do Morskiego Oka", "klimatyczne zdjęcia", "atmosfera Zakopanego"],
    climateHighlight: "Najpiękniej: czerwiec-październik. Kasprowy: od 6 czerwca. Morskie Oko: cały rok",
    included: ["Transport prywatny Toyotą Prius (tam i z powrotem)", "Kierowca", "Czekanie podczas zwiedzania", "Pomoc w zakupie biletów", "Rezerwacja stolika w karczmie", "Przejazd do Palenicy Białczańskiej (przy wyborze Morskiego Oka)"],
    excluded: ["Kolejka na Gubałówkę (~28 zł)", "Kolejka na Kasprowy (~109 zł — przy wyborze Kasprowego)", "Wstęp do TPN (~9 zł)", "Obiad (we własnym zakresie)"],
    ctaNote: "💡 Przed wycieczką ustalimy wybór: Kasprowy lub Morskie Oko",
  },
];

export const getTripBySlug = (slug: string): Trip | undefined =>
  TRIPS.find((t) => t.slug === slug);
