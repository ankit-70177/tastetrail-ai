// public/js/app.js — Client-Side Controller for TasteTrail AI

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    currentPlan: null,
    savedItems: JSON.parse(localStorage.getItem('tastetrail_saved') || '[]'),
    presets: {},
    systemConfig: null
  };

  // DOM Elements
  const elements = {
    plannerForm: document.getElementById('planner-form'),
    promptInput: document.getElementById('prompt-input'),
    inputDestination: document.getElementById('input-destination'),
    inputBudget: document.getElementById('input-budget'),
    inputDuration: document.getElementById('input-duration'),
    inputAtmosphere: document.getElementById('input-atmosphere'),
    btnGenerate: document.getElementById('btn-generate'),
    
    // Results
    resultsContainer: document.getElementById('results-container'),
    planDestinationTag: document.getElementById('plan-destination-tag'),
    planTitle: document.getElementById('plan-title'),
    planAtmosphere: document.getElementById('plan-atmosphere'),
    budgetRange: document.getElementById('budget-range'),
    budgetVerdict: document.getElementById('budget-verdict'),
    evidenceEntities: document.getElementById('evidence-entities'),
    itineraryTimeline: document.getElementById('itinerary-timeline'),
    
    // Refinement
    refinementForm: document.getElementById('refinement-form'),
    refinementInput: document.getElementById('refinement-input'),
    refinementHistory: document.getElementById('refinement-history'),
    
    // Overlays & Modals
    loadingState: document.getElementById('loading-state'),
    loadingStep: document.getElementById('loading-step'),
    
    modalInspector: document.getElementById('modal-inspector'),
    btnInspector: document.getElementById('btn-inspector'),
    closeInspector: document.getElementById('close-inspector'),
    inspMode: document.getElementById('insp-mode'),
    inspUrl: document.getElementById('insp-url'),
    inspLatency: document.getElementById('insp-latency'),
    inspOperations: document.getElementById('insp-operations'),
    
    modalCompare: document.getElementById('modal-compare'),
    btnCompareModal: document.getElementById('btn-compare-modal'),
    closeCompare: document.getElementById('close-compare'),
    compareBaselineContent: document.getElementById('compare-baseline-content'),
    compareQlooContent: document.getElementById('compare-qloo-content'),
    
    drawerSaved: document.getElementById('drawer-saved'),
    btnSavedDrawer: document.getElementById('btn-saved-drawer'),
    closeSaved: document.getElementById('close-saved'),
    savedCounter: document.getElementById('saved-counter'),
    savedItemsList: document.getElementById('saved-items-list'),
    btnExportSaved: document.getElementById('btn-export-saved'),
    btnClearSaved: document.getElementById('btn-clear-saved'),

    modeBadge: document.getElementById('mode-badge'),
    modeLabel: document.getElementById('mode-label')
  };

  // Initialize
  initApp();

  async function initApp() {
    updateSavedCounter();
    await fetchConfig();
    setupEventListeners();
  }

  async function fetchConfig() {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.success) {
        state.systemConfig = data.config;
        state.presets = (data.presets || []).reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {});

        // Update mode badge
        if (data.config.mode === 'live_qloo') {
          elements.modeBadge.className = 'badge-status badge-live';
          elements.modeLabel.textContent = 'Live Qloo API Connected';
        } else {
          elements.modeBadge.className = 'badge-status badge-demo';
          elements.modeLabel.textContent = 'Demo Mode (Authentic Qloo Fixtures)';
        }

        elements.inspMode.textContent = data.config.mode === 'live_qloo' ? 'Live Qloo API' : 'Demo Mode (Offline Fixtures)';
        elements.inspUrl.textContent = data.config.qlooBaseUrl;
      }
    } catch (err) {
      console.warn('Could not load system config:', err);
    }
  }

  function setupEventListeners() {
    // 1-Click Preset Buttons
    document.querySelectorAll('.preset-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const presetKey = btn.dataset.preset;
        const preset = state.presets[presetKey];
        if (preset) {
          elements.promptInput.value = preset.prompt;
          elements.inputDestination.value = preset.destination;
          elements.inputBudget.value = preset.budget;
          elements.inputDuration.value = preset.duration;
          elements.inputAtmosphere.value = preset.atmosphere;
        }
      });
    });

    // Primary Form Submission
    elements.plannerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await generatePlan();
    });

    // Conversational Refinement Chips
    document.querySelectorAll('.refine-chip').forEach(chip => {
      chip.addEventListener('click', async () => {
        const instruction = chip.dataset.instruction;
        elements.refinementInput.value = instruction;
        await applyRefinement(instruction);
      });
    });

    // Free-form Refinement Form
    elements.refinementForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const instruction = elements.refinementInput.value.trim();
      if (!instruction) return;
      await applyRefinement(instruction);
      elements.refinementInput.value = '';
    });

    // Modal Triggers
    elements.btnInspector.addEventListener('click', () => openModal(elements.modalInspector));
    elements.closeInspector.addEventListener('click', () => closeModal(elements.modalInspector));

    elements.btnCompareModal.addEventListener('click', () => {
      populateComparison();
      openModal(elements.modalCompare);
    });
    elements.closeCompare.addEventListener('click', () => closeModal(elements.modalCompare));

    elements.btnSavedDrawer.addEventListener('click', () => {
      renderSavedList();
      openModal(elements.drawerSaved);
    });
    elements.closeSaved.addEventListener('click', () => closeModal(elements.drawerSaved));

    // Export & Clear Saved
    elements.btnExportSaved.addEventListener('click', exportSavedToJson);
    elements.btnClearSaved.addEventListener('click', () => {
      if (confirm('Clear all saved discoveries?')) {
        state.savedItems = [];
        localStorage.setItem('tastetrail_saved', '[]');
        updateSavedCounter();
        renderSavedList();
        updateCardBookmarkButtons();
      }
    });

    // Close on background click
    [elements.modalInspector, elements.modalCompare, elements.drawerSaved].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });
  }

  async function generatePlan() {
    showLoading('Resolving Cultural Entities via Qloo...', 'Connecting to Qloo Search API to map your interests...');

    const payload = {
      destination: elements.inputDestination.value.trim() || 'Delhi',
      budget: parseInt(elements.inputBudget.value, 10) || 5000,
      duration: elements.inputDuration.value,
      atmosphere: elements.inputAtmosphere.value,
      notes: elements.promptInput.value.trim()
    };

    try {
      setTimeout(() => {
        elements.loadingStep.textContent = 'Querying Qloo Insights for cross-domain taste affinities...';
      }, 500);

      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      hideLoading();

      if (data.success && data.plan) {
        state.currentPlan = data.plan;
        renderPlan(data.plan);
      } else {
        alert('Could not generate plan: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      hideLoading();
      alert('Network error connecting to TasteTrail AI: ' + err.message);
    }
  }

  async function applyRefinement(instruction) {
    if (!state.currentPlan) {
      alert('Please generate an initial plan first.');
      return;
    }

    showLoading('Agentic Refinement in Progress...', `Re-ranking affinities: "${instruction}"`);

    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPlan: state.currentPlan,
          instruction
        })
      });

      const data = await res.json();
      hideLoading();

      if (data.success && data.plan) {
        state.currentPlan = data.plan;
        renderPlan(data.plan);
      } else {
        alert('Refinement failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      hideLoading();
      alert('Network error during refinement: ' + err.message);
    }
  }

  function renderPlan(plan) {
    elements.resultsContainer.classList.remove('hidden');

    // Header metadata
    elements.planDestinationTag.textContent = `Destination: ${plan.destination}`;
    elements.planTitle.textContent = `${plan.destination} Cultural Journey`;
    elements.planAtmosphere.textContent = `Atmosphere: ${plan.atmosphere} • Duration: ${plan.duration}`;

    // Budget overview
    const ba = plan.budgetAnalysis;
    elements.budgetRange.textContent = ba.estimatedRange;
    elements.budgetVerdict.textContent = ba.withinBudget 
      ? `✓ Within ₹${plan.budget.toLocaleString()} Budget`
      : `⚠️ Over Target Budget (Est. ₹${ba.averageEstimatedSpend.toLocaleString()})`;
    elements.budgetVerdict.style.color = ba.withinBudget ? 'var(--accent-emerald)' : 'var(--accent-amber)';

    // Evidence strip
    elements.evidenceEntities.innerHTML = '';
    (plan.personalizationEvidence || []).forEach(item => {
      const tag = document.createElement('span');
      tag.className = 'evidence-tag';
      tag.innerHTML = `<strong>${escapeHtml(item.name)}</strong> (${escapeHtml(item.entityId)})`;
      elements.evidenceEntities.appendChild(tag);
    });

    // Refinement History Note
    if (plan.refinementHistory && plan.refinementHistory.length > 0) {
      elements.refinementHistory.classList.remove('hidden');
      const latest = plan.refinementHistory[plan.refinementHistory.length - 1];
      elements.refinementHistory.innerHTML = `<strong>Latest Refinement:</strong> "${escapeHtml(latest.instruction)}" — <em>${escapeHtml(latest.notice)}</em>`;
    } else {
      elements.refinementHistory.classList.add('hidden');
    }

    // Render Itinerary Timeline
    renderItinerary(plan.itinerary);

    // Update Inspector Data
    updateInspector(plan.transparency);

    // Scroll to results
    elements.resultsContainer.scrollIntoView({ behavior: 'smooth' });
  }

  function renderItinerary(itineraryDays) {
    elements.itineraryTimeline.innerHTML = '';

    (itineraryDays || []).forEach(day => {
      const dayWrapper = document.createElement('div');
      dayWrapper.className = 'timeline-day';

      const dayHeader = document.createElement('div');
      dayHeader.className = 'day-header';
      dayHeader.innerHTML = `<h3>${escapeHtml(day.dayTitle)}</h3>`;
      dayWrapper.appendChild(dayHeader);

      const slotsGrid = document.createElement('div');
      slotsGrid.className = 'slots-grid';

      day.slots.forEach(slot => {
        const card = createRecommendationCard(slot);
        slotsGrid.appendChild(card);
      });

      dayWrapper.appendChild(slotsGrid);
      elements.itineraryTimeline.appendChild(dayWrapper);
    });
  }

  function createRecommendationCard(slot) {
    const rec = slot.recommendation;
    const isSaved = state.savedItems.some(i => i.name === rec.name);

    const card = document.createElement('div');
    card.className = 'recommendation-card';

    const affinityPercent = Math.round((rec.affinityScore || 0.85) * 100);

    card.innerHTML = `
      <div>
        <div class="card-top">
          <span class="slot-badge">${escapeHtml(slot.slotLabel)} • ${escapeHtml(slot.slotTime)}</span>
          <span class="affinity-badge">${affinityPercent}% Cultural Affinity</span>
        </div>
        <h4 class="rec-title">${escapeHtml(rec.name)}</h4>
        <div class="rec-category">${escapeHtml(rec.category)} • ${escapeHtml(rec.location || '')}</div>
        <p class="rec-desc">${escapeHtml(rec.explanation || '')}</p>
        <div class="rec-signal">
          <strong>Qloo Evidence:</strong> ${escapeHtml(rec.evidenceSignal || 'Grounded in affinity graph')}
        </div>
      </div>
      <div class="card-footer">
        <span class="rec-cost">${escapeHtml(rec.estimatedCost || 'Cost upon arrival')}</span>
        <button class="btn-bookmark ${isSaved ? 'bookmarked' : ''}" data-name="${escapeHtml(rec.name)}">
          ${isSaved ? '★ Saved' : '☆ Save'}
        </button>
      </div>
    `;

    // Bookmark handler
    const btnBookmark = card.querySelector('.btn-bookmark');
    btnBookmark.addEventListener('click', () => {
      toggleSaveItem(rec, btnBookmark);
    });

    return card;
  }

  function toggleSaveItem(item, button) {
    const idx = state.savedItems.findIndex(i => i.name === item.name);
    if (idx >= 0) {
      state.savedItems.splice(idx, 1);
      button.classList.remove('bookmarked');
      button.textContent = '☆ Save';
    } else {
      state.savedItems.push({
        ...item,
        savedAt: new Date().toISOString()
      });
      button.classList.add('bookmarked');
      button.textContent = '★ Saved';
    }

    localStorage.setItem('tastetrail_saved', JSON.stringify(state.savedItems));
    updateSavedCounter();
  }

  function updateSavedCounter() {
    elements.savedCounter.textContent = state.savedItems.length;
  }

  function updateCardBookmarkButtons() {
    document.querySelectorAll('.btn-bookmark').forEach(btn => {
      const name = btn.dataset.name;
      const isSaved = state.savedItems.some(i => i.name === name);
      btn.className = `btn-bookmark ${isSaved ? 'bookmarked' : ''}`;
      btn.textContent = isSaved ? '★ Saved' : '☆ Save';
    });
  }

  function renderSavedList() {
    elements.savedItemsList.innerHTML = '';
    if (state.savedItems.length === 0) {
      elements.savedItemsList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📂</span>
          <p>No saved discoveries yet. Bookmark items from your curated plans!</p>
        </div>
      `;
      return;
    }

    state.savedItems.forEach(item => {
      const row = document.createElement('div');
      row.className = 'saved-item-row';
      row.innerHTML = `
        <div class="saved-item-info">
          <h5>${escapeHtml(item.name)}</h5>
          <p>${escapeHtml(item.category)} • ${escapeHtml(item.location || '')}</p>
        </div>
        <button class="btn-remove-saved" title="Remove" data-name="${escapeHtml(item.name)}">&times;</button>
      `;

      row.querySelector('.btn-remove-saved').addEventListener('click', () => {
        state.savedItems = state.savedItems.filter(i => i.name !== item.name);
        localStorage.setItem('tastetrail_saved', JSON.stringify(state.savedItems));
        updateSavedCounter();
        renderSavedList();
        updateCardBookmarkButtons();
      });

      elements.savedItemsList.appendChild(row);
    });
  }

  function exportSavedToJson() {
    if (state.savedItems.length === 0) {
      alert('No saved items to export.');
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.savedItems, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tastetrail_saved_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  function updateInspector(transparency) {
    if (!transparency) return;
    elements.inspLatency.textContent = `${transparency.durationMs} ms`;
    elements.inspOperations.innerHTML = '';

    (transparency.operations || []).forEach(op => {
      const li = document.createElement('li');
      li.textContent = `[${new Date().toLocaleTimeString()}] ${op}`;
      elements.inspOperations.appendChild(li);
    });
  }

  function populateComparison() {
    if (!state.currentPlan || !state.currentPlan.genericBaseline) {
      elements.compareBaselineContent.innerHTML = `<p class="col-desc">Please generate an experience plan first to see side-by-side comparison.</p>`;
      elements.compareQlooContent.innerHTML = `<p class="col-desc">Awaiting plan generation...</p>`;
      return;
    }

    const baseline = state.currentPlan.genericBaseline;
    const qlooRecs = state.currentPlan.recommendations;

    // Render Baseline
    elements.compareBaselineContent.innerHTML = '';
    (baseline.recommendations || []).forEach(item => {
      const card = document.createElement('div');
      card.className = 'compare-item-card';
      card.innerHTML = `
        <h5>${escapeHtml(item.name)}</h5>
        <div class="rec-category">${escapeHtml(item.category)}</div>
        <div class="compare-reason"><strong>Selection Heuristic:</strong> ${escapeHtml(item.reason)}</div>
        <div class="compare-reason"><strong>Taste Match:</strong> ${escapeHtml(item.affinityExplanation)}</div>
      `;
      elements.compareBaselineContent.appendChild(card);
    });

    // Render Qloo Grounded
    elements.compareQlooContent.innerHTML = '';
    (qlooRecs || []).slice(0, 3).forEach(item => {
      const card = document.createElement('div');
      card.className = 'compare-item-card';
      card.innerHTML = `
        <h5>${escapeHtml(item.name)}</h5>
        <div class="rec-category" style="color: var(--accent-violet);">${escapeHtml(item.category)} • ${Math.round((item.affinityScore || 0.9) * 100)}% Affinity</div>
        <div class="compare-reason"><strong>Cultural Grounding:</strong> ${escapeHtml(item.explanation)}</div>
        <div class="compare-reason"><strong>Qloo Signal:</strong> ${escapeHtml(item.evidenceSignal || '')}</div>
      `;
      elements.compareQlooContent.appendChild(card);
    });
  }

  function openModal(modal) {
    modal.classList.remove('hidden');
  }

  function closeModal(modal) {
    modal.classList.add('hidden');
  }

  function showLoading(title, step) {
    elements.loadingState.querySelector('.loading-title').textContent = title;
    elements.loadingStep.textContent = step;
    elements.loadingState.classList.remove('hidden');
  }

  function hideLoading() {
    elements.loadingState.classList.add('hidden');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
