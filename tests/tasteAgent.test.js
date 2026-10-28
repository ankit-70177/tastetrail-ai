// tests/tasteAgent.test.js — TasteAgent & Planning Pipeline Tests
import test from 'node:test';
import assert from 'node:assert';
import { TasteAgent } from '../src/services/tasteAgent.js';
import { QlooClient } from '../src/services/qlooClient.js';

test('TasteAgent: Free-text request parsing extracts destination, budget, and interests', () => {
  const agent = new TasteAgent();
  const rawText = "I love indie music, Korean food, artistic cafés, and creative neighbourhoods. Plan a weekend in Delhi within ₹5,000. I prefer less crowded places.";
  
  const parsed = agent.parseRequest(rawText);
  assert.strictEqual(parsed.destination, 'Delhi');
  assert.strictEqual(parsed.budget, 5000);
  assert.ok(parsed.duration.includes('Weekend'));
  assert.ok(parsed.interests.includes('indie music'));
  assert.ok(parsed.interests.includes('korean food'));
  assert.ok(parsed.atmosphere.toLowerCase().includes('relaxed'));
});

test('TasteAgent: Structured plan creation with Qloo evidence grounding', async () => {
  const mockClient = new QlooClient({ forceMock: true });
  const agent = new TasteAgent(mockClient);

  const plan = await agent.createExperiencePlan({
    destination: 'Delhi',
    budget: 5000,
    duration: 'Weekend (2 Days)',
    atmosphere: 'Artistic & Relaxed',
    interests: ['indie music', 'Korean food', 'art']
  });

  assert.ok(plan.planId.startsWith('plan_'));
  assert.strictEqual(plan.destination, 'Delhi');
  assert.strictEqual(plan.budget, 5000);
  assert.ok(plan.itinerary.length === 2, 'Weekend plan should produce 2 days');
  
  // Verify evidence grounding
  assert.ok(plan.personalizationEvidence.length > 0);
  assert.ok(plan.transparency.resolvedCount > 0);
  assert.strictEqual(plan.sourceMode, 'demo_fixture');

  // Verify each slot has evidence signal
  const firstSlot = plan.itinerary[0].slots[0];
  assert.ok(firstSlot.recommendation.name);
  assert.ok(firstSlot.recommendation.evidenceSignal);
  assert.ok(firstSlot.recommendation.estimatedCost);

  // Verify generic baseline was generated for comparison
  assert.ok(plan.genericBaseline);
  assert.strictEqual(plan.genericBaseline.methodology.includes('Popularity'), true);
});

test('TasteAgent: Conversational refinement for budget reduction', async () => {
  const mockClient = new QlooClient({ forceMock: true });
  const agent = new TasteAgent(mockClient);

  const initialPlan = await agent.createExperiencePlan({
    destination: 'Delhi',
    budget: 5000,
    interests: ['indie music', 'art']
  });

  const refined = await agent.refinePlan(initialPlan, 'Make it cheaper please');
  assert.ok(refined.budget < 5000, 'Budget should be reduced');
  assert.ok(refined.refinementHistory.length === 1);
  assert.ok(refined.refinementHistory[0].instruction.includes('cheaper'));
});

test('TasteAgent: Conversational refinement for category exclusion', async () => {
  const mockClient = new QlooClient({ forceMock: true });
  const agent = new TasteAgent(mockClient);

  const initialPlan = await agent.createExperiencePlan({
    destination: 'Delhi',
    budget: 5000,
    interests: ['indie music', 'Korean food', 'art']
  });

  const refined = await agent.refinePlan(initialPlan, 'Remove restaurant suggestions and food');
  const hasFood = refined.selectedInterests.some(i => i.toLowerCase().includes('food') || i.toLowerCase().includes('korean'));
  assert.strictEqual(hasFood, false, 'Food should be removed from selected interests');
});
