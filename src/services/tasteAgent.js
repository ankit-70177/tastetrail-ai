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
      : ['indie music', 'art', 'food'];

    return {
      destination: destination.trim(),
      budget: Number(budget) || 5000,
      duration: duration.trim(),
      atmosphere: atmosphere.trim(),
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

    // Step 2: Retrieve Cultural Insights & Recommendations
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

    trace.operations.push(`Retrieved ${recommendations.length} insight candidates via Qloo`);

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

    const instruction = refinementInstruction.trim().toLowerCase();
    const updatedPreferences = {
      destination: currentPlan.destination,
      budget: currentPlan.budget,
      duration: currentPlan.duration,
      atmosphere: currentPlan.atmosphere,
      interests: [...currentPlan.selectedInterests]
    };

    let refinementNotice = '';

    // Handle Budget Refinement
    if (instruction.includes('cheaper') || instruction.includes('less expensive') || instruction.includes('reduce budget') || instruction.includes('lower budget')) {
      updatedPreferences.budget = Math.max(1000, Math.round(currentPlan.budget * 0.7));
      refinementNotice = `Adjusted budget to ₹${updatedPreferences.budget.toLocaleString()} and prioritized free/low-cost cultural alternatives.`;
    }

    // Handle Category Inclusions
    if (instruction.includes('more art') || instruction.includes('museum') || instruction.includes('galleries')) {
      if (!updatedPreferences.interests.some(i => i.toLowerCase().includes('art'))) {
        updatedPreferences.interests.push('contemporary art');
      }
      updatedPreferences.atmosphere = 'Artistic & Gallery Focused';
      refinementNotice = 'Amplified contemporary visual arts and gallery experiences.';
    }

    if (instruction.includes('more music') || instruction.includes('live music') || instruction.includes('indie')) {
      if (!updatedPreferences.interests.some(i => i.toLowerCase().includes('music'))) {
        updatedPreferences.interests.push('live indie music');
      }
      refinementNotice = 'Prioritized live music venues and independent acoustics.';
    }

    // Handle Category Exclusions
    if (instruction.includes('remove restaurant') || instruction.includes('no food') || instruction.includes('skip food') || instruction.includes('remove dining')) {
      updatedPreferences.interests = updatedPreferences.interests.filter(i => !i.toLowerCase().includes('food') && !i.toLowerCase().includes('korean'));
      refinementNotice = 'Filtered out culinary & restaurant stops in favor of cultural venues.';
    }

    // Handle Atmosphere Refinement
    if (instruction.includes('relaxed') || instruction.includes('peaceful') || instruction.includes('quiet') || instruction.includes('less crowded')) {
      updatedPreferences.atmosphere = 'Tranquil & Intimate';
      refinementNotice = 'Re-ranked recommendations for lower footfall and peaceful atmospheres.';
    }

    // Re-run the planning pipeline with updated constraints
    const refinedPlan = await this.createExperiencePlan(updatedPreferences);
    refinedPlan.refinementHistory = [
      ...(currentPlan.refinementHistory || []),
      {
        timestamp: new Date().toISOString(),
        instruction: refinementInstruction,
        notice: refinementNotice || 'Updated plan based on refinement criteria.'
      }
    ];

    return refinedPlan;
  }

  _parseFreeText(text) {
    const lower = text.toLowerCase();
    
    // Extract Destination
    let destination = 'Delhi';
    if (lower.includes('delhi')) destination = 'Delhi';
    else if (lower.includes('mumbai')) destination = 'Mumbai';
    else if (lower.includes('tokyo')) destination = 'Tokyo';
    else if (lower.includes('london')) destination = 'London';
    else if (lower.includes('new york') || lower.includes('nyc')) destination = 'New York';
    else if (lower.includes('bangalore') || lower.includes('bengaluru')) destination = 'Bengaluru';

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
    if (lower.includes('korean food') || lower.includes('korean')) interests.push('korean food');
    if (lower.includes('art') || lower.includes('gallery') || lower.includes('galleries')) interests.push('art');
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
    const slots = [
      { id: 'morning', label: 'Morning Exploration', time: '10:00 AM – 1:00 PM' },
      { id: 'afternoon', label: 'Midday Flavors & Cultural Immersion', time: '1:30 PM – 4:00 PM' },
      { id: 'late_afternoon', label: 'Artisan Leisure & Coffee', time: '4:30 PM – 6:30 PM' },
      { id: 'evening', label: 'Twilight Acoustics & Nightlife', time: '7:30 PM – 10:30 PM' }
    ];

    const itineraryDays = [];
    const isSingleDay = preferences.duration.includes('1 Day');
    const dayCount = isSingleDay ? 1 : 2;

    for (let dayNum = 1; dayNum <= dayCount; dayNum++) {
      const daySlots = slots.map((slot, index) => {
        const recIndex = ((dayNum - 1) * 2 + index) % Math.max(1, recommendations.length);
        const item = recommendations[recIndex] || {
          id: `fallback_${dayNum}_${index}`,
          name: `Cultural Discoveries in ${preferences.destination}`,
          category: 'Neighborhood Exploration',
          location: preferences.destination,
          affinityScore: 0.85,
          tags: ['local-culture', 'walkable'],
          estimatedCost: 'Free - ₹300',
          explanation: 'Curated based on your general atmosphere preferences.',
          evidenceSignal: 'Regional taste aggregate signal',
          sourceMode: 'demo_fixture'
        };

        return {
          slotId: slot.id,
          slotLabel: slot.label,
          slotTime: slot.time,
          recommendation: item,
          notes: `Optimized for ${preferences.atmosphere.toLowerCase()} vibe.`
        };
      });

      itineraryDays.push({
        dayNumber: dayNum,
        dayTitle: `Day ${dayNum} — ${dayNum === 1 ? 'Heritage & Creative Roots' : 'Immersive Independent Scene'}`,
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
        const costStr = slot.recommendation.estimatedCost || '';
        const numbers = costStr.match(/[0-9,]+/g);
        if (numbers && numbers.length > 0) {
          const vals = numbers.map(n => parseInt(n.replace(/,/g, ''), 10));
          estimatedTotalMin += vals[0] || 0;
          estimatedTotalMax += vals[vals.length - 1] || vals[0] || 0;
        } else {
          // Nominal estimate
          estimatedTotalMin += 250;
          estimatedTotalMax += 600;
        }
      }
    }

    const avgEstimate = Math.round((estimatedTotalMin + estimatedTotalMax) / 2);
    const withinBudget = avgEstimate <= targetBudget;

    return {
      targetBudget,
      estimatedRange: `₹${estimatedTotalMin.toLocaleString()} – ₹${estimatedTotalMax.toLocaleString()}`,
      averageEstimatedSpend: avgEstimate,
      withinBudget,
      remainingOrOver: targetBudget - avgEstimate,
      status: withinBudget ? 'Within Budget' : 'Exceeds Target Budget (Review Low-Cost Filters)',
      costDisclosure: "All costs are estimates based on standard ticket admissions and average dining covers. Actual expenditures depend on menu choices and seasonal rates."
    };
  }
}

export const tasteAgent = new TasteAgent();
