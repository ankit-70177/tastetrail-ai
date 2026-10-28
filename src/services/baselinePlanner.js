// src/services/baselinePlanner.js — Illustrative Generic Baseline Planner
// Provides a standard, popularity-only recommendation baseline without Qloo cultural grounding.
// Used for transparent side-by-side comparison to demonstrate Qloo's value.

export function generateGenericBaseline(destination = 'Delhi', budget = 5000, atmosphere = 'Generic') {
  const city = destination.toLowerCase().includes('delhi') ? 'Delhi' : destination;

  const baselinePlaces = [
    {
      id: "baseline_1",
      name: "India Gate & Rajpath Promenade",
      category: "Tourist Landmark",
      reason: "Ranked #1 most visited tourist attraction by broad tourist search volume.",
      affinityExplanation: "None (Selected by generic citywide tourist footfall, not personal taste affinities).",
      estimatedCost: "Free",
      slot: "Morning",
      groundingType: "unpersonalized_popularity"
    },
    {
      id: "baseline_2",
      name: "Connaught Place (CP) Commercial Market",
      category: "Commercial Shopping & Dining",
      reason: "Popular central commercial shopping district with international fast-food chains.",
      affinityExplanation: "None (Selected for geographical centrality rather than cultural vibe or culinary preference).",
      estimatedCost: "₹1,500 - ₹2,500",
      slot: "Afternoon",
      groundingType: "unpersonalized_popularity"
    },
    {
      id: "baseline_3",
      name: "Red Fort (Lal Qila) Sound & Light Show",
      category: "Heritage Monument",
      reason: "Standard historical tourist itinerary staple.",
      affinityExplanation: "None (Standard mass-tourism destination without alignment with indie music or art preferences).",
      estimatedCost: "₹500",
      slot: "Evening",
      groundingType: "unpersonalized_popularity"
    }
  ];

  return {
    destination: city,
    budget,
    atmosphere,
    methodology: "Standard Popularity Heuristic (Generic Search Volume)",
    description: "This baseline plan uses conventional citywide popularity rankings. Notice that while it satisfies basic geography, it completely ignores subtle cultural tastes such as indie music, niche cuisines, or intimate atmospheres.",
    recommendations: baselinePlaces,
    sourceMode: "unpersonalized_baseline"
  };
}
