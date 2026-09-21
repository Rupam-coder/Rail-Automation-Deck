/* Rail Nexus - What-If Simulator Modal Module */

export class WhatIfSimulatorModule {
  constructor(app) {
    this.app = app;
    this.selectedScenario = 'breakdown';
    this.simulationResult = null;
  }

  renderModal() {
    return `
      <div id="whatif-modal-overlay" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-title" style="color:var(--accent-terracotta);">
              <i data-lucide="zap"></i> What-If Edge Case Simulator
            </div>
            <button id="close-whatif-modal" class="modal-close"><i data-lucide="x"></i></button>
          </div>

          <div class="modal-body">
            <div style="font-size:0.82rem; color:var(--dark-text-muted); margin-bottom:1rem;">
              Simulate high-impact railway disruption scenarios and evaluate AI automated replacement logic with minimum shunting penalty.
            </div>

            <!-- Scenario Selector Cards -->
            <div class="scenario-card ${this.selectedScenario === 'breakdown' ? 'selected' : ''}" data-scenario="breakdown">
              <div class="scenario-icon"><i data-lucide="alert-octagon"></i></div>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--bg-surface);">Pre-Service Train Breakdown</div>
                <div style="font-size:0.78rem; color:var(--dark-text-muted);">Revenue Train T04 suffers mechanical door fault 15 minutes before depot dispatch.</div>
              </div>
            </div>

            <div class="scenario-card ${this.selectedScenario === 'revocation' ? 'selected' : ''}" data-scenario="revocation">
              <div class="scenario-icon" style="color:var(--status-standby);"><i data-lucide="file-x"></i></div>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--bg-surface);">Emergency Document Revocation</div>
                <div style="font-size:0.78rem; color:var(--dark-text-muted);">Fitness Certificate for Train T18 flagged as expired mid-operation by authority audit.</div>
              </div>
            </div>

            <div class="scenario-card ${this.selectedScenario === 'congestion' ? 'selected' : ''}" data-scenario="congestion">
              <div class="scenario-icon" style="color:var(--status-critical);"><i data-lucide="navigation"></i></div>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--bg-surface);">Block Congestion & Track Delay</div>
                <div style="font-size:0.78rem; color:var(--dark-text-muted);">Signal malfunction between Station A & B delays dispatch queue by 18 minutes.</div>
              </div>
            </div>

            <!-- Simulation Output -->
            ${this.simulationResult ? this.renderResultBox() : ''}
          </div>

          <div class="modal-footer">
            <button id="run-simulation-btn" class="btn-primary">
              <i data-lucide="play"></i> SIMULATE SCENARIO & RE-OPTIMIZE
            </button>
            ${this.simulationResult ? `
              <button id="apply-simulation-btn" class="btn-primary" style="background:var(--accent-teal);">
                <i data-lucide="check"></i> APPLY REPLACEMENT TO FLEET
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  renderResultBox() {
    const res = this.simulationResult;

    return `
      <div class="simulation-result-box">
        <div style="font-weight:700; color:var(--status-service); margin-bottom:0.5rem; display:flex; align-items:center; gap:0.4rem; font-size:0.88rem;">
          <i data-lucide="sparkles"></i> AI Re-Optimization Complete - Standby Replacement Found
        </div>

        <!-- Scenario Flow Diagram: BEFORE -> EVENT -> AFTER -->
        <div class="scenario-flow-diagram">
          <div class="flow-step">
            <div class="title">BEFORE</div>
            <div class="val" style="color:var(--status-service);">${res.affectedTrain} ➔ SERVICE</div>
          </div>
          <div class="flow-arrow">➔</div>
          <div class="flow-step">
            <div class="title">DISRUPTION</div>
            <div class="val" style="color:var(--status-critical);">${res.affectedTrain} ➔ UNAVAILABLE</div>
          </div>
          <div class="flow-arrow">➔</div>
          <div class="flow-step">
            <div class="title">RE-OPTIMIZED AFTER</div>
            <div class="val" style="color:var(--status-service);">${res.replacementTrain} ➔ SERVICE</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; font-size:0.82rem; margin-bottom:0.75rem;">
          <div>
            <span style="color:var(--dark-text-muted);">Disrupted Train:</span><br>
            <strong style="color:var(--status-critical);">${res.affectedTrain}</strong> (${res.reason})
          </div>
          <div>
            <span style="color:var(--dark-text-muted);">Standby Replacement:</span><br>
            <strong style="color:var(--status-service);">${res.replacementTrain}</strong> (Promoted to Revenue)
          </div>
        </div>

        <div style="background:var(--dark-primary); padding:0.6rem 0.8rem; border-radius:var(--radius-sm); border:1px solid rgba(255, 253, 248, 0.15); font-size:0.78rem; color:var(--bg-surface);">
          <i data-lucide="git-commit" style="width:12px; height:12px; vertical-align:middle; color:var(--status-service);"></i>
          <strong>Shunting Path Optimization:</strong> ${res.trackNo} (Positioned adjacent to main line). Minimum depot movement delay: <strong>${res.shuntingMinutes} min</strong> (${res.shuntingDistance}m path).
        </div>
      </div>
    `;
  }

  attachEvents() {
    const modalOverlay = document.querySelector('#whatif-modal-overlay');
    if (!modalOverlay) return;

    // Close button
    const closeBtn = document.querySelector('#close-whatif-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('active');
      });
    }

    // Scenario selection click
    const scenarioCards = document.querySelectorAll('.scenario-card');
    scenarioCards.forEach(card => {
      card.addEventListener('click', () => {
        this.selectedScenario = card.getAttribute('data-scenario');
        this.simulationResult = null;
        this.app.renderModalContainer();
      });
    });

    // Run simulation button
    const runBtn = document.querySelector('#run-simulation-btn');
    if (runBtn) {
      runBtn.addEventListener('click', () => {
        this.runSimulation();
        this.app.renderModalContainer();
      });
    }

    // Apply simulation button
    const applyBtn = document.querySelector('#apply-simulation-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        if (this.simulationResult) {
          this.app.applySimulationReplacement(this.simulationResult);
          modalOverlay.classList.remove('active');
        }
      });
    }
  }

  runSimulation() {
    const standbyTrains = this.app.fleet.filter(t => t.induction === 'standby' && t.overallDocTag === 'valid');
    const bestReplacement = standbyTrains[0] || { id: 'T14', mileageKm: 14200 };

    if (this.selectedScenario === 'breakdown') {
      this.simulationResult = {
        affectedTrain: 'T04',
        reason: 'Mechanical door fault',
        replacementTrain: bestReplacement.id,
        trackNo: 'Depot Track 3',
        shuntingMinutes: 2.5,
        shuntingDistance: 140
      };
    } else if (this.selectedScenario === 'revocation') {
      this.simulationResult = {
        affectedTrain: 'T18',
        reason: 'Fitness certificate expired',
        replacementTrain: bestReplacement.id,
        trackNo: 'Standby Track 1',
        shuntingMinutes: 1.8,
        shuntingDistance: 95
      };
    } else {
      this.simulationResult = {
        affectedTrain: 'T12',
        reason: 'Signal delay hold',
        replacementTrain: bestReplacement.id,
        trackNo: 'Loop Track 2',
        shuntingMinutes: 3.0,
        shuntingDistance: 210
      };
    }
  }
}
