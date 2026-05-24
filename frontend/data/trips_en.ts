// English translations for all 5 trips
// Keys match Trip['slug'] from trips.ts
import type { Trip, TimelineStep } from "./trips";

type TripEN = Pick<
  Trip,
  | "title"
  | "subtitle"
  | "description"
  | "highlights"
  | "timeline"
  | "mapLegend"
  | "climateSubtitle"
  | "climateList"
  | "climateHighlight"
  | "included"
  | "excluded"
  | "ctaNote"
>;

export const TRIPS_EN: Record<string, TripEN> = {
  pieniny: {
    title: "Pieniny Mountains Tour from Krakow",
    subtitle: "Niedzica • Czorsztyn • Lake Cruise • Zamajerz Beach",
    description:
      "The Pieniny tour is the perfect option for families, couples and groups of friends who want to see the most beautiful corners of this extraordinary region in one day — without rushing, without the crowds and with a private driver at your disposal.\n\nWe depart from Krakow in the morning in a comfortable, hybrid Toyota Prius. After about 2.5 hours we arrive in Niedzica, where we visit the famous \"Dunajec\" Castle — a medieval fortress built on a rock above Lake Czorsztyn. The chambers, courtyard and the legend of the hidden Inca treasure will impress even the biggest skeptics of history.\n\nNext, it's time for a cruise on Lake Czorsztyn aboard a historic paddle steamer. 50 minutes of pure relaxation as the panorama of two castles and the Pieniny peaks unfolds before you. After the cruise we stop for lunch at the atmospheric Karczma Zadyma — sour cabbage soup, fresh trout from a local farm and traditional highlander potato pancakes are an absolute must-try.\n\nThe afternoon belongs to Czorsztyn Castle — picturesque 14th-century ruins from which, through the Gothic windows, you can admire the view straight onto Niedzica. We end the day at Zamajerz Beach — an elegant mini-resort right by the lake where you can have coffee, rent a SUP board or simply relax with a view of the mountains.\n\nFor 750 PLN per car (up to 4 people) you get private transport there and back, a driver-guide, waiting time during sightseeing, and help with buying tickets. This is a tour after which you return calm, well-fed and with hundreds of photos.",
    highlights: [
      "🏰 Niedzica Castle with the legend of the Inca treasure",
      "🚢 Paddle steamer cruise on Lake Czorsztyn",
      "🍽️ Lunch at the atmospheric Karczma Zadyma",
      "🏯 Romantic ruins of Czorsztyn Castle",
      "🏖️ Relax and coffee at Zamajerz Beach",
    ],
    timeline: [
      { time: "08:00", icon: "🚗", title: "Departure from Krakow", description: "Route: Krakow → Nowy Targ → Niedzica (~2.5h)" },
      { time: "10:00", icon: "🏰", title: "Niedzica Castle", description: "Chambers, courtyard, the legend of the Inca treasure" },
      { time: "11:45", icon: "🌄", title: "Dam & viewpoint", description: "Lake panorama, view of both castles" },
      { time: "12:30", icon: "🚢", title: "Cruise on Lake Czorsztyn", description: "Paddle steamer, 50 min of relaxation" },
      { time: "13:30", icon: "🍽️", title: "Lunch at Karczma Zadyma", description: "Sour cabbage soup, trout, highlander potato pancakes" },
      { time: "15:15", icon: "🏯", title: "Czorsztyn Castle ruins", description: "Atmospheric ruins, view through the windows" },
      { time: "16:30", icon: "🏖️", title: "Zamajerz Beach", description: "Coffee, lakeside relaxation, SUP" },
      { time: "17:30", icon: "🏠", title: "Return to Krakow", description: "Arrival ~19:30-20:00" },
    ],
    mapLegend: "1. Niedzica • 2. Cruise • 3. Inn • 4. Czorsztyn • 5. Beach",
    climateSubtitle: "A relaxed day for families and people who want to sightsee without rushing",
    climateList: ["scenic panoramas", "castle & lake atmosphere", "lakeside relaxation", "regional cuisine"],
    climateHighlight: "Best time to visit: May–October",
    included: [
      "Private transport in a Toyota Prius (round trip)",
      "Driver",
      "Waiting time during sightseeing",
      "Help with buying tickets",
      "Restaurant recommendations",
    ],
    excluded: [
      "Castle entry tickets (~30-50 PLN)",
      "Cruise ticket (~30 PLN)",
      "Lunch at the inn (at your own expense)",
    ],
    ctaNote: "💡 Attraction tickets can be purchased through the app",
  },

  dunajec: {
    title: "Dunajec River Rafting Trip from Krakow",
    subtitle: "Dunajec Rafting • Szczawnica • Palenica • Homole Gorge",
    description:
      "Rafting down the Dunajec is a classic of Polish mountain tourism — a tour that combines excitement, nature and history in one unforgettable adventure. Perfect for active families, couples and groups of friends who want a shot of adrenaline while also escaping the city bustle.\n\nWe set off very early — at 6:30 from Krakow — to catch the first rafts in Sromowce Wyżne. The traditional wooden rafts are steered by highlander raftsmen in regional dress who, during the cruise, share legends, anecdotes and point out the most beautiful spots of the Pieniny. The route leads through spectacular cliffs, including the iconic Three Crowns peak, and ends in Szczawnica after about 2-2.5 hours on the water.\n\nSzczawnica is the spa-town gem of the Pieniny. After rafting we have time for a walk along the beautiful promenade by the Grajcarek stream and a lunch at Karczma u Połonacy serving local cuisine. Next we take the cable car up Palenica (722 m a.s.l.), which offers views across the entire Pieniny range and, in good weather, all the way to the Tatras.\n\nThe culmination of the day is the Homole Gorge — one of the most spectacular sites in the Polish mountains. Wooden footbridges lead along a crystal-clear stream between vertical cliffs reaching up to 130 m. The walk takes 1-1.5 hours and leaves you with views you won't forget.\n\nFor 790 PLN per car (up to 4 people) — private round-trip transport in a comfortable Toyota Prius, a driver, transfer from the rafting finish point and help with buying tickets. A day full of water, mountains, sunshine and authentic highlander atmosphere.",
    highlights: [
      "🛶 Traditional Dunajec rafting (2-2.5h)",
      "⛰️ Views of the Three Crowns from the water",
      "☕ Walk along the Szczawnica promenade",
      "🚡 Palenica cable car with Tatras panorama",
      "🏞️ Homole Gorge — wooden footbridges & 130 m cliffs",
    ],
    timeline: [
      { time: "06:30", icon: "🚗", title: "Departure from Krakow", description: "Early start. Krakow → Nowy Targ → Sromowce" },
      { time: "09:00", icon: "🛶", title: "Dunajec rafting starts", description: "Rafting Marina Sromowce Wyżne" },
      { time: "11:30", icon: "🛶", title: "Finish in Szczawnica", description: "~2-2.5h on the water through the Pieniny" },
      { time: "12:00", icon: "🍽️", title: "Szczawnica — walk & lunch", description: "Promenade by the Grajcarek, Karczma u Polowacy" },
      { time: "14:00", icon: "🚡", title: "Palenica Cable Car", description: "722m, panorama of the Pieniny + Tatras" },
      { time: "16:00", icon: "🏞️", title: "Homole Gorge", description: "Wooden footbridges, stream, cliffs (1-1.5h)" },
      { time: "17:30", icon: "🏠", title: "Return to Krakow", description: "Arrival ~20:00-21:00" },
    ],
    mapLegend: "1. Sromowce • 2. Szczawnica • 3. Palenica • 4. Homole",
    climateSubtitle: "An active tour with a river adventure twist",
    climateList: ["mountain river rafting", "wooden bridges and footbridges", "alpine atmosphere of Szczawnica", "gorges and cliffs"],
    climateHighlight: "Best time to visit: May–September (rafting season)",
    included: [
      "Private transport in a Toyota Prius (round trip)",
      "Driver",
      "Help with buying tickets",
      "Transfer from the rafting finish point",
    ],
    excluded: [
      "Dunajec rafting (~90-100 PLN/person)",
      "Palenica cable car (~30 PLN)",
      "Homole entry (~5-10 PLN)",
      "Lunch (at your own expense)",
    ],
    ctaNote: "💡 Attraction tickets in one checkout",
  },

  slowacja: {
    title: "Most Beautiful Slovakia Tour from Krakow",
    subtitle: "Bachledova • Belianska Cave • Strbske Pleso",
    description:
      "The Most Beautiful Slovakia is a premium tour combining three completely different faces of the Slovak Tatras in one unforgettable day. We recommend it to people who want to see something more than the classic Zakopane — without demanding trekking, but with views worthy of alpine resorts.\n\nWe depart from Krakow at 6:00 so that before noon we can start the day in Bachledova Valley at the foot of the Belianske Tatras. The Treetop Walk is a 1.2 km wooden path through the spruce canopy at a height of 10-30 m above the ground, ending with a 32-meter viewing tower in the shape of a spiral helix. From the top, a majestic panorama unfolds over the Tatras, valleys and forests — this is an instagrammable spot, perfect for family memories.\n\nThe next stop is the Belianska Cave (Belianska jaskyňa) — one of the most beautiful karst caves in Central Europe. A 1370 m sightseeing route leads through more than 800 steps among impressive stalactites, calcite draperies, underground lakes and fantastical rock formations. The temperature inside is 5-6°C, so a sweater and comfortable shoes are essential. Guided tours last about 70 minutes.\n\nWe close the day at Strbske Pleso — a crystal-clear glacial lake (1346 m a.s.l.) surrounded by spruce forest and Tatra peaks. The walk around the lake takes about 1.5 hours and is absolute relaxation with a view. You can stop for coffee at the legendary Grand Hotel Kempinski or pick a café with a terrace over the water.\n\nFor 890 PLN per car (up to 4 people) — private round-trip transport in a Toyota Prius (border crossing and road tolls included), driver, waiting time during sightseeing, help with buying tickets. A tour that combines the thrill of altitude, the magic of the underground, and the calm of an alpine lake.",
    highlights: [
      "🌲 Treetop Walk with a 32-meter viewing tower",
      "🦇 Belianska Cave — 1370 m of underground trail",
      "💎 Strbske Pleso — a crystal-clear glacial lake",
      "📸 The most instagrammable views of the Slovak Tatras",
      "🛂 Stress-free border crossing",
    ],
    timeline: [
      { time: "06:00", icon: "🚗", title: "Departure from Krakow", description: "Route: Krakow → Zakopane → Jurgów → Slovakia" },
      { time: "08:30", icon: "⛰️", title: "Bachledova + Treetop Walk", description: "Walk in the treetops, panoramic tower (~2h)" },
      { time: "11:00", icon: "🦇", title: "Belianska Cave (Belianska jaskyňa)", description: "1370 m route, ~70 min visit, over 800 steps, stalactites, draperies, lakes (5-6°C — bring a sweater)" },
      { time: "13:30", icon: "💎", title: "Strbske Pleso", description: "Walk around the lake, coffee with a view (~1.5h)" },
      { time: "16:00", icon: "🏠", title: "Return to Krakow", description: "Arrival ~19:30-20:30" },
    ],
    mapLegend: "1. Bachledova • 2. Belianska Cave • 3. Strbske Pleso",
    climateSubtitle: "A premium day across 3 completely different attractions of the Slovak Tatras",
    climateList: ["peaceful views", "mountains without big effort", "instagrammable places", "nature & relaxation"],
    climateHighlight: "Best time to visit: June–October, especially autumn",
    included: [
      "Private transport in a Toyota Prius round trip (Poland→Slovakia)",
      "Driver",
      "Waiting time during sightseeing",
      "Help with buying tickets",
      "Border crossing + road tolls",
    ],
    excluded: [
      "Belianska Cave ticket (~12 €/person)",
      "Treetop Walk (~22 €/person)",
      "Lunch at Strbske (at your own expense)",
    ],
    ctaNote: "💡 Attraction tickets in one checkout (EUR/PLN)",
  },

  wodospady: {
    title: "Cold Stream Waterfalls Tour from Krakow",
    subtitle: "Stary Smokovec • Hrebienok • Tatra Waterfalls",
    description:
      "The Cold Stream Waterfalls are a hidden gem of the Slovak Tatras — a tour for those who love the roar of mountain water, forest paths and views you won't find in any guidebook. Perfect for nature lovers, couples and people looking for quiet away from the crowds of Morskie Oko.\n\nWe depart from Krakow at 5:30 — early, but worth it. After crossing the border in Łysa Polana, we reach Stary Smokovec, one of the most elegant Slovak Tatra resorts. A walk among the historic spa buildings, coffee in the shade of the legendary Grandhotel Praha and the early 20th-century atmosphere are a great start to the day.\n\nFrom the center of Smokovec we take the cog railway up to Hrebienok (1285 m a.s.l.) — a short but spectacular ride through the Tatra forest. From Hrebienok a marked trail leads to the Cold Stream Waterfalls (Studené potoky), where the stream splits into four spectacular cascades: the Great, the Small, the Long and the Middle Waterfall. Wooden footbridges, walkways above the streams and mossy rocks create a fairy-tale atmosphere.\n\nThe loop takes about 2.5-3 hours — it's a walk, not a climb. The route is challenging in only one spot (a short climb up to the Great Waterfall), the rest is pleasant forest paths. Along the way we pass the Symbolic Cemetery of Tatra Victims — a quiet, reflective place among the spruces.\n\nTo finish we stop for lunch in a highlander inn in Smokovec or at Hrebienok — we recommend bryndzové halušky (gnocchi with sheep cheese and bacon) or kapustnica. Return to Krakow at about 18:30-19:30.\n\nFor 690 PLN per car (up to 4 people) — private round-trip transport, driver, help with buying tickets and the border crossing. A tour after which you return filled with forest air and silence.",
    highlights: [
      "🏘️ Walk through historic Stary Smokovec",
      "🚆 Cog railway up to Hrebienok (1285 m)",
      "💧 Four spectacular cascades of the Cold Stream Waterfalls",
      "🌲 Wooden footbridges in deep Tatra forest",
      "🍲 Lunch at an authentic highlander inn",
    ],
    timeline: [
      { time: "05:30", icon: "🚗", title: "Departure from Krakow", description: "Route: Krakow → Zakopane → Łysa Polana → Smokovec" },
      { time: "08:30", icon: "🏘️", title: "Stary Smokovec", description: "Resort, coffee, atmosphere, Grandhotel Praha" },
      { time: "09:30", icon: "🚆", title: "Cog railway to Hrebienok", description: "1285 m, viewpoints, mountain hut" },
      { time: "10:00", icon: "💧", title: "Cold Stream Waterfalls", description: "Forest, footbridges, cascades, loop ~2.5-3h" },
      { time: "13:30", icon: "🍽️", title: "Lunch in Smokovec or Hrebienok", description: "Highlander inn, regional flavors" },
      { time: "15:30", icon: "🏠", title: "Return to Krakow", description: "Arrival ~18:30-19:30" },
    ],
    mapLegend: "1. Smokovec • 2. Hrebienok • 3. Waterfalls",
    climateSubtitle: "An atmospheric and lesser-known route, perfect for nature lovers",
    climateList: ["mountain streams", "wooden footbridges", "forests and waterfalls", "Tatra panoramas"],
    climateHighlight: "Best time to visit: June–October. Spring = high water",
    included: [
      "Private transport in a Toyota Prius round trip (Poland→Slovakia)",
      "Driver",
      "Help with buying tickets",
      "Border crossing + road tolls",
    ],
    excluded: [
      "Smokovec → Hrebienok cog railway ticket (~10 €/person)",
      "Slovak TANAP entry (~5 €/person)",
      "Lunch (at your own expense)",
    ],
    ctaNote: "💡 Attraction tickets in one checkout (EUR/PLN)",
  },

  zakopane: {
    title: "Zakopane + Kasprowy or Morskie Oko",
    subtitle: "Krupówki • Gubałówka • your choice: Kasprowy Wierch (from June 6) or Morskie Oko",
    description:
      "Zakopane is an immortal classic of Polish tourism — the Winter Capital of Poland, the gateway to the Tatras and a place everyone must see at least once in a lifetime. Our tour combines all the city's main attractions with a choice of one of two iconic mountain destinations: Kasprowy Wierch or Morskie Oko.\n\nWe leave Krakow at 7:00 via the famous Zakopianka route. After about 2-2.5 hours we arrive at the heart of the Podhale region. The first stop is a walk along Krupówki — the most famous promenade in Poland. Wooden chalets in Zakopane style, oscypek (smoked sheep cheese) stalls, regional shops and live highlander music create a unique atmosphere.\n\nNext we take the historic funicular railway up to Gubałówka (1126 m a.s.l.). From the viewing terrace a classic Tatra panorama unfolds — a photograph that has to be in every Poland album. At the top you can taste regional delicacies or walk along the ridge to Butorowy Wierch.\n\nFor lunch we book a table at one of the best highlander inns — we suggest Karczma „Po Zbóju\" with its signature sour cabbage soup, moskole (potato pancakes), oscypek with cranberry sauce and traditional highlander pancakes. This is the kind of cuisine you won't find at any chain restaurant.\n\nIn the afternoon you choose one of two options:\n\n🚡 KASPROWY WIERCH (1985 m a.s.l., open from June 6) — cable car from Kuźnice, 360° panorama, the Polish-Slovak border under your feet, the High Tatras within arm's reach. Going up + time at the top + coming down takes 2-3 hours.\n\n🏞️ MORSKIE OKO (1395 m a.s.l., available all year) — the most famous lake in the Polish Tatras. From Palenica Białczańska we walk along an asphalt road for about 2-2.5 hours one way. Along the way you'll pass the PTTK mountain hut and the Mickiewicz Waterfall. You can also hire a horse cart (fasiąg).\n\nFor 790 PLN per car (up to 4 people) — private round-trip transport, driver, waiting time during sightseeing, table reservation at the inn, help with buying tickets and (with the Morskie Oko option) drive to Palenica Białczańska. The Kasprowy/Morskie Oko choice is confirmed before departure — based on weather and your preference.",
    highlights: [
      "🛍️ Walk along the legendary Krupówki promenade",
      "🚞 Funicular railway up to Gubałówka",
      "🍲 Lunch at the authentic Karczma Po Zbóju",
      "🚡 Choice: Kasprowy Wierch (1985 m) or Morskie Oko (1395 m)",
      "📸 Classic Tatra panorama from the Gubałówka terrace",
    ],
    timeline: [
      { time: "07:00", icon: "🚗", title: "Departure from Krakow", description: "Route: Krakow → Zakopianka → Zakopane (~2-2.5h)" },
      { time: "09:00", icon: "🛍️", title: "Walk along Krupówki", description: "The most famous promenade in Poland" },
      { time: "10:30", icon: "🚞", title: "Gubałówka", description: "Funicular railway, Tatra panorama" },
      { time: "12:00", icon: "🍽️", title: "Lunch at Karczma Po Zbóju", description: "Sour cabbage soup, moskole, oscypek, pancakes" },
      { time: "14:00", icon: "✨", title: "Choice: Kasprowy OR Morskie Oko", description: "🚡 Kasprowy Wierch (1985 m) — cable car from Kuźnice, Tatra panorama (~2-3h, open from June 6)\n🏞️ OR Morskie Oko (1395 m) — from Palenica Białczańska, asphalt road ~2-2.5h one way, PTTK hut and Mickiewicz Waterfall along the way" },
      { time: "17:00", icon: "🏠", title: "Return to Krakow", description: "Arrival ~20:00-22:00 (Kasprowy) or ~21:00-23:00 (Morskie Oko)" },
    ],
    mapLegend: "1. Krupówki • 2. Gubałówka • 3. Inn • 4. Kasprowy or Morskie Oko",
    climateSubtitle: "A tourist classic — all the Zakopane icons in one day",
    climateList: ["Tatras without long trekking", "choice: cable car or walk to Morskie Oko", "atmospheric photos", "Zakopane vibes"],
    climateHighlight: "Best time to visit: June–October. Kasprowy: from June 6. Morskie Oko: all year",
    included: [
      "Private transport in a Toyota Prius (round trip)",
      "Driver",
      "Waiting time during sightseeing",
      "Help with buying tickets",
      "Table reservation at the inn",
      "Drive to Palenica Białczańska (with the Morskie Oko option)",
    ],
    excluded: [
      "Gubałówka funicular (~28 PLN)",
      "Kasprowy cable car (~109 PLN — with the Kasprowy option)",
      "TANAP entry (~9 PLN)",
      "Lunch (at your own expense)",
    ],
    ctaNote: "💡 We will confirm before the tour: Kasprowy or Morskie Oko",
  },
};

/**
 * Returns a Trip with localized fields based on the language.
 * For 'pl' returns the original trip. For 'en' overrides text fields with English translations.
 */
export function localizeTrip(trip: Trip, lang: "pl" | "en"): Trip {
  if (lang === "pl") return trip;
  const en = TRIPS_EN[trip.slug];
  if (!en) return trip;
  return {
    ...trip,
    title: en.title,
    subtitle: en.subtitle,
    description: en.description,
    highlights: en.highlights,
    timeline: en.timeline,
    mapLegend: en.mapLegend,
    climateSubtitle: en.climateSubtitle,
    climateList: en.climateList,
    climateHighlight: en.climateHighlight,
    included: en.included,
    excluded: en.excluded,
    ctaNote: en.ctaNote,
  };
}
