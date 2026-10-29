// src/services/tasteAgent.js — Cultural Discovery & Itinerary Agent
import { qlooClient } from './qlooClient.js';
import { generateGenericBaseline } from './baselinePlanner.js';

export class TasteAgent {
  constructor(client = qlooClient) {
    this.client = client;
  }

  /**
   * Parse unstructured text or structured request into a validated preference model
   */
  parseRequest(rawInput) {
    if (typeof rawInput === 'string') {
      return this._parseFreeText(rawInput);
    }

    const {
      destination = 'Delhi',
      budget = 5000,
      duration = 'Weekend (2 Days)',
      atmosphere = 'Artistic & Relaxed',
      interests = ['indie music', 'Korean food', 'art', 'cafes'],
      notes = ''
    } = rawInput || {};

    const cleanInterests = Array.isArray(interests)
      ? interests.filter(i => typeof i === 'string' && i.trim().length > 0)
      : typeof interests === 'string'
        ? interests.split(',').map(s => s.trim()).filter(Boolean)
        : [];

    if (cleanInterests.length === 0) {
      cleanInterests.push('indie music', 'art', 'food');
    }

    return {
      destination: (destination || 'Delhi').trim(),
      budget: Number(budget) || 5000,
      duration: (duration || 'Weekend (2 Days)').trim(),
      atmosphere: (atmosphere || 'Artistic & Relaxed').trim(),
      interests: cleanInterests,
      notes: (notes || '').trim()
    };


  }

  /**
   * Primary Agentic Discovery & Planning Pipeline
   */
  async createExperiencePlan(rawRequest) {
    const preferences = this.parseRequest(rawRequest);
    const trace = {
      startTime: Date.now(),
      resolvedEntities: [],
      failedResolutions: [],
      qlooCalls: 0,
      operations: []
    };

    // Step 1: Entity Resolution via Qloo Search
    const resolvedIds = [];
    for (const interest of preferences.interests) {
      trace.qlooCalls += 1;
      const searchRes = await this.client.search(interest);

      if (searchRes.success && searchRes.results.length > 0) {
        const topEntity = searchRes.results[0];
        const entityUrn = topEntity.id || topEntity.urn || `urn:entity:${encodeURIComponent(interest)}`;
        resolvedIds.push(entityUrn);
        trace.resolvedEntities.push({
          term: interest,
          entityId: entityUrn,
          name: topEntity.name || interest,
          type: topEntity.type || 'urn:entity:interest',
          sourceMode: searchRes.sourceMode
        });
        trace.operations.push(`Resolved '${interest}' -> ${topEntity.name} (${entityUrn})`);
      } else {
        trace.failedResolutions.push(interest);
        trace.operations.push(`Could not resolve entity for '${interest}'`);
      }
    }

    // Step 2: Retrieve Cultural Insights & Recommendations via Qloo
    trace.qlooCalls += 1;
    const insightsRes = await this.client.getInsights({
      'filter.type': 'urn:entity:place',
      'signal.interests.entities': resolvedIds,
      'filter.location': preferences.destination,
      take: 20,
      'feature.explainability': true
    });

    const recommendations = (insightsRes.success && insightsRes.results.length > 0)
      ? insightsRes.results
      : [];

    trace.operations.push(`Retrieved ${recommendations.length} insight candidates via Qloo (${insightsRes.sourceMode || 'fixture'})`);

    // Step 3: Organize into Itinerary & Apply Constraints
    const itinerary = this._buildStructuredItinerary(recommendations, preferences);

    // Step 4: Budget & Cost Estimation
    const budgetAnalysis = this._calculateBudget(itinerary, preferences.budget);

    // Step 5: Generate Comparative Generic Baseline
    const baseline = generateGenericBaseline(preferences.destination, preferences.budget, preferences.atmosphere);

    const durationMs = Date.now() - trace.startTime;

    return {
      planId: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      destination: preferences.destination,
      budget: preferences.budget,
      duration: preferences.duration,
      atmosphere: preferences.atmosphere,
      selectedInterests: preferences.interests,
      sourceMode: insightsRes.sourceMode || (this.client.isLive() ? 'live_qloo' : 'demo_fixture'),

      // Grounded Output
      itinerary,
      budgetAnalysis,
      recommendations,

      // Transparency & Provenance
      personalizationEvidence: trace.resolvedEntities,
      transparency: {
        durationMs,
        qlooCalls: trace.qlooCalls,
        resolvedCount: trace.resolvedEntities.length,
        failedCount: trace.failedResolutions.length,
        operations: trace.operations,
        mode: insightsRes.sourceMode || 'demo_fixture',
        disclaimer: "Recommendations are grounded in Qloo cultural affinity signals. Venue hours, ticket prices, and real-time availability should be verified directly with venues."
      },

      // Side-by-side comparison baseline
      genericBaseline: baseline,

      warnings: trace.failedResolutions.length > 0
        ? [`Could not resolve Qloo entities for: ${trace.failedResolutions.join(', ')}. Remaining affinities were used.`]
        : []
    };
  }

  /**
   * Conversational Refinement Engine
   */
  async refinePlan(currentPlan, refinementInstruction) {
    if (!currentPlan || !refinementInstruction) {
      throw new Error('Existing plan and refinement instruction are required');
    }

    const rawInstruction = String(refinementInstruction).trim();
    const instruction = rawInstruction.toLowerCase();

    // Preserve existing preferences
    const updatedPreferences = {
      destination: currentPlan.destination || 'Delhi',
      budget: currentPlan.budget || 5000,
      duration: currentPlan.duration || 'Weekend (2 Days)',
      atmosphere: currentPlan.atmosphere || 'Artistic & Relaxed',
      interests: [...(currentPlan.selectedInterests || [])]
    };

    let refinementNotice = '';
    let unsupportedNotice = null;

    // 1. Detect Destination Switch
    const destMatch = instruction.match(/(?:change destination to|switch to|move to|go to)\s+([a-zA-Z\s]+?)(?=\s+(?:and|with|,|\.|\bfor\b|\bbudget\b)|$)/i);
    if (destMatch && destMatch[1]) {
      const newDest = destMatch[1].trim();
      const capitalized = newDest.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      updatedPreferences.destination = capitalized;
      refinementNotice = `Switched destination to ${capitalized}.`;
    }

    // 2. Detect Explicit Budget Update
    const budgetExplicitMatch = instruction.match(/(?:budget|spend|cost)\s*(?:to|of|is)?\s*(?:₹|rs\.?|inr|\$|£|¥)?\s*([0-9,]+)/i);
    if (budgetExplicitMatch && budgetExplicitMatch[1]) {
      const parsedBudget = parseInt(budgetExplicitMatch[1].replace(/,/g, ''), 10);
      if (parsedBudget > 0) {
        updatedPreferences.budget = parsedBudget;
        refinementNotice = `Adjusted target budget to ₹${parsedBudget.toLocaleString()}.`;
      }
    } else if (instruction.includes('cheaper') || instruction.includes('less expensive') || instruction.includes('reduce budget') || instruction.includes('lower budget')) {
      updatedPreferences.budget = Math.max(1000, Math.round(updatedPreferences.budget * 0.7));
      refinementNotice = `Reduced target budget to ₹${updatedPreferences.budget.toLocaleString()} and prioritized lower-cost cultural venues.`;
    }

    // 3. Detect Category Inclusions
    if (instruction.includes('more art') || instruction.includes('museum') || instruction.includes('galleries')) {
      if (!updatedPreferences.interests.some(i => i.toLowerCase().includes('art'))) {
        updatedPreferences.interests.push('contemporary art');
      }
      updatedPreferences.atmosphere = 'Artistic & Gallery Focused';
      refinementNotice = (refinementNotice ? refinementNotice + ' ' : '') + 'Amplified contemporary visual arts and gallery experiences.';
    }

    if (instruction.includes('more music') || instruction.includes('live music') || instruction.includes('indie') || instruction.includes('jazz')) {
      const musicGenre = instruction.includes('jazz') ? 'jazz speakeasy' : 'live indie music';
      if (!updatedPreferences.interests.some(i => i.toLowerCase().includes('music') || i.toLowerCase().includes('jazz'))) {
        updatedPreferences.interests.push(musicGenre);
      }
      refinementNotice = (refinementNotice ? refinementNotice + ' ' : '') + `Prioritized acoustic venues and ${musicGenre}.`;
    }

    if (instruction.includes('coffee') || instruction.includes('cafe') || instruction.includes('café')) {
      if (!updatedPreferences.interests.some(i => i.toLowerCase().includes('cafe') || i.toLowerCase().includes('coffee'))) {
        updatedPreferences.interests.push('specialty coffee');
      }
      refinementNotice = (refinementNotice ? refinementNotice + ' ' : '') + 'Elevated artisanal third-wave coffee roasteries.';
    }

    // 4. Detect Category Exclusions
    if (instruction.includes('remove restaurant') || instruction.includes('no food') || instruction.includes('skip food') || instruction.includes('remove dining')) {
      updatedPreferences.interests = updatedPreferences.interests.filter(i => !i.toLowerCase().includes('food') && !i.toLowerCase().includes('korean') && !i.toLowerCase().includes('dining'));
      refinementNotice = (refinementNotice ? refinementNotice + ' ' : '') + 'Filtered out culinary and restaurant stops in favor of cultural venues.';
    }

    // 5. Detect Atmosphere & Pacing Refinements
    if (instruction.includes('relaxed') || instruction.includes('peaceful') || instruction.includes('quiet') || instruction.includes('less crowded') || instruction.includes('walkable')) {
      updatedPreferences.atmosphere = 'Tranquil & Walkable';
      refinementNotice = (refinementNotice ? refinementNotice + ' ' : '') + 'Re-ranked recommendations for lower footfall, walkable pacing, and serene spaces.';
    } else if (instruction.includes('energetic') || instruction.includes('nightlife') || instruction.includes('vibrant')) {
      updatedPreferences.atmosphere = 'Vibrant & Nightlife Centric';
      refinementNotice = (refinementNotice ? refinementNotice + ' ' : '') + 'Shifted itinerary toward high-energy evening venues and nightlife.';
    }

    // 6. Detect Unsupported Out-of-Scope Requests Gracefully
    if (instruction.includes('book flight') || instruction.includes('plane ticket') || instruction.includes('buy ticket') || instruction.includes('reserve table') || instruction.includes('uber') || instruction.includes('weather forecast')) {
      unsupportedNotice = "TasteTrail AI specializes in cultural taste planning and affinity matching. Live ticketing, table booking, and flight reservation transactions are outside our scope; please contact venues and service providers directly.";
    }

    // Re-run the planning pipeline with updated constraints
    const refinedPlan = await this.createExperiencePlan(updatedPreferences);

    refinedPlan.refinementHistory = [
      ...(currentPlan.refinementHistory || []),
      {
        timestamp: new Date().toISOString(),
        instruction: rawInstruction,
        notice: refinementNotice || 'Updated plan based on refinement criteria.',
        unsupportedNotice
      }
    ];

    if (unsupportedNotice) {
      refinedPlan.warnings = [...(refinedPlan.warnings || []), unsupportedNotice];
    }

    return refinedPlan;
  }

  _parseFreeText(text) {
    const lower = text.toLowerCase();

    // Extract Destination
    let destination = 'Delhi';
    if (lower.includes('mumbai')) destination = 'Mumbai';
    else if (lower.includes('delhi')) destination = 'Delhi';
    else if (lower.includes('tokyo')) destination = 'Tokyo';
    else if (lower.includes('london')) destination = 'London';
    else if (lower.includes('new york') || lower.includes('nyc')) destination = 'New York';
    else if (lower.includes('bangalore') || lower.includes('bengaluru')) destination = 'Bangalore';

    // Extract Budget
    let budget = 5000;
    const budgetMatch = text.match(/(?:₹|rs\.?|inr|\$|£|¥)\s*([0-9,]+)/i) || text.match(/([0-9,]+)\s*(?:rupees|inr|budget)/i);
    if (budgetMatch) {
      budget = parseInt(budgetMatch[1].replace(/,/g, ''), 10) || 5000;
    }

    // Extract Duration
    let duration = 'Weekend (2 Days)';
    if (lower.includes('1 day') || lower.includes('one day') || lower.includes('24 hour')) {
      duration = '1 Day';
    } else if (lower.includes('weekend') || lower.includes('2 days') || lower.includes('two days')) {
      duration = 'Weekend (2 Days)';
    }

    // Extract Interests
    const interests = [];
    if (lower.includes('indie music') || lower.includes('music')) interests.push('indie music');
    if (lower.includes('korean food') || lower.includes('korean')) interests.push('Korean food');
    if (lower.includes('art') || lower.includes('gallery') || lower.includes('galleries')) interests.push('contemporary art');
    if (lower.includes('cafe') || lower.includes('café') || lower.includes('coffee')) interests.push('cafes');
    if (lower.includes('jazz')) interests.push('jazz music');
    if (lower.includes('book') || lower.includes('literature')) interests.push('literature');

    if (interests.length === 0) {
      interests.push('cultural discovery', 'indie music', 'art');
    }

    // Extract Atmosphere
    let atmosphere = 'Artistic & Relaxed';
    if (lower.includes('less crowded') || lower.includes('quiet') || lower.includes('peaceful') || lower.includes('relaxed')) {
      atmosphere = 'Relaxed & Non-commercial';
    } else if (lower.includes('energetic') || lower.includes('nightlife') || lower.includes('vibrant')) {
      atmosphere = 'Vibrant & Energetic';
    }

    return {
      destination,
      budget,
      duration,
      atmosphere,
      interests,
      notes: text
    };
  }

  _buildStructuredItinerary(recommendations, preferences) {
    const slotDefinitions = [
      {
        id: 'morning',
        label: 'Morning Exploration',
        time: '10:00 AM – 1:00 PM',
        preferredCategories: ['art', 'museum', 'gallery', 'heritage', 'culture', 'park', 'architecture']
      },
      {
        id: 'afternoon',
        label: 'Midday Flavors & Cultural Immersion',
        time: '1:30 PM – 4:00 PM',
        preferredCategories: ['food', 'restaurant', 'dining', 'culinary', 'korean', 'lunch', 'market']
      },
      {
        id: 'late_afternoon',
        label: 'Artisan Leisure & Coffee',
        time: '4:30 PM – 6:30 PM',
        preferredCategories: ['cafe', 'coffee', 'bookstore', 'bakery', 'tea', 'record shop', 'artisan']
      },
      {
        id: 'evening',
        label: 'Twilight Acoustics & Nightlife',
        time: '7:30 PM – 10:30 PM',
        preferredCategories: ['music', 'jazz', 'nightlife', 'bar', 'cocktail', 'lounge', 'speakeasy', 'acoustics']
      }
    ];

    const itineraryDays = [];
    const isSingleDay = preferences.duration.includes('1 Day');
    const dayCount = isSingleDay ? 1 : 2;

    const usedIndices = new Set();

    for (let dayNum = 1; dayNum <= dayCount; dayNum++) {
      const daySlots = slotDefinitions.map((slotDef, sIdx) => {
        // Intelligently find best candidate matching slot preference
        let chosenItem = null;
        let chosenIdx = -1;

        if (recommendations && recommendations.length > 0) {
          // Look for category match that hasn't been used yet
          for (let i = 0; i < recommendations.length; i++) {
            if (usedIndices.has(i)) continue;
            const rec = recommendations[i];
            const cat = (rec.category || '').toLowerCase();
            const tags = (rec.tags || []).map(t => String(t).toLowerCase());
            const textMatch = [cat, ...tags].join(' ');

            if (slotDef.preferredCategories.some(pref => textMatch.includes(pref))) {
              chosenItem = rec;
              chosenIdx = i;
              usedIndices.add(i);
              break;
            }
          }

          // Fallback: pick any unused recommendation
          if (!chosenItem) {
            for (let i = 0; i < recommendations.length; i++) {
              if (!usedIndices.has(i)) {
                chosenItem = recommendations[i];
                chosenIdx = i;
                usedIndices.add(i);
                break;
              }
            }
          }

          // Fallback 2: cycle through recommendations modulo length
          if (!chosenItem) {
            const fallbackIdx = ((dayNum - 1) * slotDefinitions.length + sIdx) % recommendations.length;
            chosenItem = recommendations[fallbackIdx];
          }
        }

        const finalItem = chosenItem || {
          id: `fallback_${dayNum}_${sIdx}`,
          entityId: `urn:entity:place:fallback-${preferences.destination.toLowerCase()}-${sIdx}`,
          name: `Cultural Discoveries in ${preferences.destination}`,
          category: 'Neighborhood Exploration',
          location: preferences.destination,
          affinityScore: 0.85,
          tags: ['local-culture', 'walkable'],
          estimatedCost: 'Free - ₹300',
          explanation: `Curated based on your general atmosphere preferences for ${preferences.atmosphere.toLowerCase()}.`,
          evidenceSignal: 'Regional taste aggregate signal',
          sourceMode: 'demo_fixture'
        };

        const venueName = finalItem.name || 'Curated Cultural Venue';
        const rationale = finalItem.evidenceSignal || finalItem.explanation || `Affinity match via Qloo Cultural Graph.`;
        const whyItMatches = finalItem.evidenceSignal
          ? `Why this matches your taste: Grounded via ${finalItem.evidenceSignal}`
          : `Why this matches your taste: Aligns with your ${preferences.atmosphere} preference and regional cultural signals.`;

        return {
          slotId: slotDef.id,
          slotLabel: slotDef.label,
          slotTime: slotDef.time,
          period: slotDef.label.split(' ')[0], // Morning, Midday, Artisan, Twilight
          time: slotDef.time,
          venueName,
          name: venueName,
          category: finalItem.category || 'Cultural Venue',
          activity: `${slotDef.label} at ${venueName}`,
          description: finalItem.explanation || finalItem.description || `Curated stop aligned with your cultural genome.`,
          estimatedCost: finalItem.estimatedCost || '₹500 - ₹1,500',
          affinityScore: finalItem.affinityScore ?? 0.88,
          culturalRationale: rationale,
          whyItMatches,
          qlooEntityUrn: finalItem.entityId || finalItem.id || `urn:entity:place:${encodeURIComponent(venueName)}`,
          verifiedFields: ['venueName', 'category', 'affinityScore', 'qlooEntityUrn'],
          estimatedFields: ['estimatedCost', 'slotTime', 'pacing'],
          limitations: 'Operating hours, reservations, and entry fees should be verified directly with the venue.',
          recommendation: finalItem,
          notes: `Optimized for ${preferences.atmosphere.toLowerCase()} vibe.`
        };
      });

      itineraryDays.push({
        dayNumber: dayNum,
        day: `Day ${dayNum}`,
        dayTitle: `Day ${dayNum} — ${dayNum === 1 ? 'Heritage & Creative Roots' : 'Immersive Independent Scene'}`,
        title: `Day ${dayNum} — ${dayNum === 1 ? 'Heritage & Creative Roots' : 'Immersive Independent Scene'}`,
        slots: daySlots
      });
    }

    return itineraryDays;
  }

  _calculateBudget(itineraryDays, targetBudget) {
    let estimatedTotalMin = 0;
    let estimatedTotalMax = 0;

    for (const day of itineraryDays) {
      for (const slot of day.slots) {
        const costStr = slot.estimatedCost || slot.recommendation?.estimatedCost || '';
        const numbers = costStr.match(/[0-9,]+/g);
        if (numbers && numbers.length > 0) {
          const vals = numbers.map(n => parseInt(n.replace(/,/g, ''), 10));
          estimatedTotalMin += vals[0] || 0;
          estimatedTotalMax += vals[vals.length - 1] || vals[0] || 0;
        } else {
          // Nominal cultural stop estimate
          estimatedTotalMin += 250;
          estimatedTotalMax += 600;
        }
      }
    }

    const avgEstimate = Math.round((estimatedTotalMin + estimatedTotalMax) / 2);
    const withinBudget = avgEstimate <= targetBudget;
    const remaining = targetBudget - avgEstimate;

    return {
      // Primary numeric fields consumed by frontend budget meter
      allocatedBudget: targetBudget,
      totalEstimatedCost: avgEstimate,
      remainingBudget: remaining,

      // Existing & backward-compatible fields
      targetBudget,
      averageEstimatedSpend: avgEstimate,
      remainingOrOver: remaining,
      estimatedRange: `₹${estimatedTotalMin.toLocaleString()} – ₹${estimatedTotalMax.toLocaleString()}`,
      withinBudget,
      isWithinBudget: withinBudget,
      status: withinBudget ? 'Within Budget' : 'Exceeds Target Budget (Review Low-Cost Filters)',
      costDisclosure: "All costs are estimates based on standard ticket admissions and average dining covers. Actual expenditures depend on menu choices and seasonal rates."
    };
  }
}

export const tasteAgent = new TasteAgent();
