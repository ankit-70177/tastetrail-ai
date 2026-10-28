// src/data/demoFixtures.js — High-Fidelity Demo Fixtures for TasteTrail AI
// Used EXCLUSIVELY when QLOO_API_KEY is not configured or in offline test environments.
// Every item is explicitly marked with sourceMode: 'demo_fixture'.

export const DEMO_SEARCH_ENTITIES = {
  "indie music": [
    {
      id: "urn:entity:music:genre:indie-rock",
      name: "Indie Rock / Indie Pop",
      type: "urn:entity:music",
      subtype: "genre",
      tags: ["indie", "alternative", "lo-fi", "underground"],
      popularity: 0.78
    },
    {
      id: "urn:entity:artist:peter-cat-recording-co",
      name: "Peter Cat Recording Co.",
      type: "urn:entity:artist",
      subtype: "musician",
      tags: ["indie", "jazz", "ballroom", "delhi-native"],
      popularity: 0.72
    },
    {
      id: "urn:entity:artist:lifafa",
      name: "Lifafa",
      type: "urn:entity:artist",
      subtype: "electronic-indie",
      tags: ["electronic", "synth-pop", "indie", "delhi"],
      popularity: 0.68
    }
  ],
  "korean food": [
    {
      id: "urn:entity:cuisine:korean",
      name: "Korean Cuisine",
      type: "urn:entity:cuisine",
      tags: ["korean", "fermented", "bbq", "street-food", "kimchi"],
      popularity: 0.84
    },
    {
      id: "urn:entity:restaurant:gung-the-palace",
      name: "Gung The Palace",
      type: "urn:entity:restaurant",
      location: "Green Park, New Delhi",
      tags: ["authentic-korean", "traditional-seating", "k-bbq"],
      popularity: 0.79
    }
  ],
  "art": [
    {
      id: "urn:entity:interest:contemporary-art",
      name: "Contemporary Art & Galleries",
      type: "urn:entity:interest",
      tags: ["visual-arts", "modern", "installations", "galleries"],
      popularity: 0.75
    },
    {
      id: "urn:entity:place:ngma-delhi",
      name: "National Gallery of Modern Art (NGMA)",
      type: "urn:entity:place",
      location: "India Gate, New Delhi",
      tags: ["modern-art", "sculptures", "peaceful", "culture"],
      popularity: 0.82
    }
  ],
  "cafes": [
    {
      id: "urn:entity:place:champa-gali",
      name: "Champa Gali Cultural Enclave",
      type: "urn:entity:place",
      location: "Saidulajab, Saket, New Delhi",
      tags: ["artistic-cafes", "fairy-lights", "indie-bookshops", "handcrafted"],
      popularity: 0.81
    },
    {
      id: "urn:entity:place:kunzum-travel-cafe",
      name: "Kunzum Travel & Books Cafe",
      type: "urn:entity:place",
      location: "Hauz Khas Village, New Delhi",
      tags: ["indie-literature", "coffee", "acoustic-evenings", "creative"],
      popularity: 0.76
    }
  ]
};

export const DEMO_INSIGHTS_RESULTS = [
  {
    id: "rec_delhi_1",
    entityId: "urn:entity:place:ngma-delhi",
    name: "National Gallery of Modern Art (NGMA)",
    category: "Art & Culture",
    location: "Jaipur House, India Gate, New Delhi",
    affinityScore: 0.94,
    tags: ["contemporary-art", "sculpture-garden", "tranquil"],
    estimatedCost: "₹150 (Entry ticket)",
    recommendedSlot: "Morning (10:30 AM - 1:00 PM)",
    explanation: "High cross-domain taste correlation with your love for contemporary visual arts and reflective atmosphere.",
    evidenceSignal: "Correlated via: urn:entity:interest:contemporary-art (Affinity: 0.94)",
    sourceMode: "demo_fixture"
  },
  {
    id: "rec_delhi_2",
    entityId: "urn:entity:restaurant:gung-the-palace",
    name: "Gung The Palace",
    category: "Culinary Discovery",
    location: "D-1/B, Green Park, New Delhi",
    affinityScore: 0.91,
    tags: ["authentic-korean", "dolsot-bibimbap", "traditional"],
    estimatedCost: "₹1,200 - ₹1,800 for two",
    recommendedSlot: "Afternoon (1:30 PM - 3:30 PM)",
    explanation: "Authentic Korean dining matching your exact taste preference with intimate, non-commercial booth seating.",
    evidenceSignal: "Correlated via: urn:entity:cuisine:korean (Affinity: 0.91)",
    sourceMode: "demo_fixture"
  },
  {
    id: "rec_delhi_3",
    entityId: "urn:entity:place:champa-gali",
    name: "Champa Gali & Blue Tokai Coffee Roasters",
    category: "Creative Neighborhood",
    location: "Khasra 258, Saidulajab, Saket, New Delhi",
    affinityScore: 0.89,
    tags: ["indie-music", "artisan-coffee", "laneway", "crafts"],
    estimatedCost: "₹400 - ₹700",
    recommendedSlot: "Late Afternoon (4:30 PM - 6:30 PM)",
    explanation: "A pedestrian-only artisan lane combining indie coffee culture, handmade stationery, and live acoustic music.",
    evidenceSignal: "Correlated via: urn:entity:music:genre:indie-rock (Affinity: 0.89)",
    sourceMode: "demo_fixture"
  },
  {
    id: "rec_delhi_4",
    entityId: "urn:entity:place:piano-man-jazz-club",
    name: "The Piano Man Jazz Club",
    category: "Live Music & Nightlife",
    location: "Safdarjung Enclave, New Delhi",
    affinityScore: 0.88,
    tags: ["live-jazz", "indie-acoustic", "speakeasy", "vibrant"],
    estimatedCost: "₹1,500 - ₹2,200",
    recommendedSlot: "Evening (7:30 PM - 10:30 PM)",
    explanation: "Premier venue for live independent jazz and experimental music artists, highly aligned with your indie music affinities.",
    evidenceSignal: "Correlated via: urn:entity:artist:peter-cat-recording-co (Affinity: 0.88)",
    sourceMode: "demo_fixture"
  }
];

export const DEMO_PRESET_PROMPTS = [
  {
    id: "delhi-indie-korean",
    title: "Delhi Cultural Weekend (Indie & Korean)",
    prompt: "I love indie music, Korean food, artistic cafés, and creative neighbourhoods. Plan a weekend in Delhi within ₹5,000. I prefer less crowded places and want experiences that match my personality.",
    destination: "Delhi",
    budget: 5000,
    duration: "2 Days (Weekend)",
    atmosphere: "Artistic & Relaxed",
    interests: ["Indie Rock / Folk", "Korean Cuisine", "Art Galleries", "Artisan Cafés"]
  },
  {
    id: "tokyo-minimalist-jazz",
    title: "Tokyo Jazz & Minimalist Architecture",
    prompt: "I love Haruki Murakami, vinyl jazz bars, minimalist design, and ramen. Plan a 24-hour day in Tokyo under ¥15,000.",
    destination: "Tokyo",
    budget: 15000,
    duration: "1 Day",
    atmosphere: "Reflective & Sophisticated",
    interests: ["Jazz Kishaten", "Japanese Literature", "Minimalist Architecture", "Ramen"]
  },
  {
    id: "london-vinyl-gastropub",
    title: "London Vinyl & Independent Cinema",
    prompt: "I love independent cinema, vintage record stores, craft beer, and street markets in London within £80.",
    destination: "London",
    budget: 80,
    duration: "1 Day",
    atmosphere: "Eclectic & Creative",
    interests: ["Indie Film", "Vinyl Records", "Historic Gastropubs", "Independent Bookstores"]
  }
];
