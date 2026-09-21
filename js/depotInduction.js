/* Rail Nexus - Depot Induction Planning (AI Optimization Engine Module) */

export class DepotInductionModule {
  constructor(app) {
    this.app = app;
    this.overrideLog = [];
  }

  render() {
    const fleet = this.app.fleet;

    const revenueFleet = fleet.filter(t => t.induction === 'revenue');
    const standbyFleet = fleet.filter(t => t.induction === 'standby');
    const maintenanceFleet = fleet.filter(t => t.induction === 'maintenance');

    return `
      <!-- AI Optimization & Connected Nodes Pipeline Banner (Deep Plum Console) -->
      <div class="optimization-flow-panel">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
          <div>
            <div style="display:flex; align-items:center; gap:0.5rem; color:var(--accent-terracotta); font-weight:700; font-size:1.05rem;">
              <i data-lucide="cpu"></i> AI Depot Induction Optimization Console
            </div>
            <div style="color:var(--dark-text-muted); font-size:0.82rem; margin-top:3px;">
              Autonomous fleet sorting based on document compliance, mileage balancing, and maintenance cycles.
            </div>
          </div>

          <div style="display:flex; gap:1.25rem; align-items:center;">
            <div style="text-align:right;">
              <div style="font-size:0.72rem; color:var(--dark-text-muted); text-transform:uppercase; font-weight:600;">Readiness Score</div>
              <div style="font-size:1.4rem; font-weight:700; color:var(--status-service);">92.5%</div>
            </div>
            <button id="reoptimize-ai-btn" class="btn-primary">
              <i data-lucide="rotate-cw"></i> RE-OPTIMIZE FLEET
            </button>
          </div>
        </div>

        <!-- Connected Nodes Pipeline -->
        <div class="nodes-pipeline">
          <div class="pipeline-track">
            <div class="pipeline-progress-line"></div>
          </div>

          <div class="pipeline-node active">
            <i data-lucide="database" style="width:12px; height:12px;"></i> DATA INGESTION
          </div>

          <div class="pipeline-node active">
            <i data-lucide="shield-check" style="width:12px; height:12px;"></i> CONSTRAINT CHECK
          </div>

          <div class="pipeline-node active">
            <i data-lucide="sparkles" style="width:12px; height:12px;"></i> OPTIMIZATION
          </div>

          <div class="pipeline-node active">
            <i data-lucide="layout-grid" style="width:12px; height:12px;"></i> INDUCTION PLAN
          </div>
        </div>
      </div>

      <!-- 3 Category Boards Grid -->
      <div class="induction-board-grid">
        <!-- Revenue Service Pool -->
        <div class="induction-column revenue-col">
          <div class="column-header">
            <div class="column-title" style="color:var(--status-service);">
              <span class="status-dot-indicator service"></span> Revenue Service
            </div>
            <div class="column-count">${revenueFleet.length} Trains</div>
          </div>
          <div class="train-cards-scroll">
            ${revenueFleet.map(t => this.renderTrainCard(t)).join('')}
          </div>
        </div>

        <!-- Standby Pool -->
        <div class="induction-column standby-col">
          <div class="column-header">
            <div class="column-title" style="color:var(--status-standby);">
              <span class="status-dot-indicator standby"></span> Standby Fleet
            </div>
            <div class="column-count">${standbyFleet.length} Trains</div>
          </div>
          <div class="train-cards-scroll">
            ${standbyFleet.map(t => this.renderTrainCard(t)).join('')}
          </div>
        </div>

        <!-- Depot Maintenance Pool -->
        <div class="induction-column maintenance-col">
          <div class="column-header">
            <div class="column-title" style="color:var(--status-critical);">
              <span class="status-dot-indicator critical"></span> Depot Maintenance
            </div>
            <div class="column-count">${maintenanceFleet.length} Trains</div>
          </div>
          <div class="train-cards-scroll">
            ${maintenanceFleet.map(t => this.renderTrainCard(t)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderTrainCard(train) {
    const statusDotClass = train.induction === 'revenue' ? 'service' : train.induction === 'standby' ? 'standby' : 'critical';

    return `
      <div class="induction-card ${train.isOverridden ? 'selected' : ''}">
        <div class="induction-card-header">
          <span class="induction-train-name">
            <span class="status-dot-indicator ${statusDotClass}"></span>
            ${train.id}
          </span>
          ${train.isOverridden ? '<span class="override-badge"><i data-lucide="user-check" style="width:10px; height:10px;"></i> Override</span>' : ''}
        </div>

        <div class="ai-reasoning-box">
          <span class="reasoning-tag"><i data-lucide="sparkles" style="width:10px; height:10px; inline-size:10px;"></i> AI Reasoning Tag:</span><br>
          ${train.aiReasoning}
        </div>

        <div class="induction-metrics">
          <span><i data-lucide="gauge" style="width:11px; height:11px;"></i> ${train.mileageKm.toLocaleString()} km</span>
          <span>•</span>
          <span>Compliance: <strong style="color:${train.overallDocTag === 'valid' ? 'var(--status-service)' : 'var(--status-critical)'};">${train.overallDocTag.toUpperCase()}</strong></span>
        </div>

        <div class="induction-actions">
          <span style="font-size:0.7rem; color:var(--text-muted); align-self:center; font-weight:600;">Move to:</span>
          ${train.induction !== 'revenue' ? `
            <button class="override-btn" data-train="${train.id}" data-target="revenue">Revenue</button>
          ` : ''}
          ${train.induction !== 'standby' ? `
            <button class="override-btn" data-train="${train.id}" data-target="standby">Standby</button>
          ` : ''}
          ${train.induction !== 'maintenance' ? `
            <button class="override-btn" data-train="${train.id}" data-target="maintenance">Maintenance</button>
          ` : ''}
        </div>
      </div>
    `;
  }

  attachEvents(container) {
    // Re-run AI Optimization button
    const reoptBtn = container.querySelector('#reoptimize-ai-btn');
    if (reoptBtn) {
      reoptBtn.addEventListener('click', () => {
        this.app.fleet.forEach(train => {
          if (!train.isOverridden) {
            this.app.reevaluateFleetCompliance(train);
          }
        });
        this.app.render();
        this.app.showNotification('AI Depot Optimization plan generated across 40 trains', 'info');
      });
    }

    // Manual Override button clicks
    const overrideBtns = container.querySelectorAll('.override-btn');
    overrideBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const trainId = btn.getAttribute('data-train');
        const targetCategory = btn.getAttribute('data-target');
        this.executeManualOverride(trainId, targetCategory);
      });
    });
  }

  executeManualOverride(trainId, targetCategory) {
    const train = this.app.fleet.find(t => t.id === trainId);
    if (!train) return;

    const previousCategory = train.induction;
    train.induction = targetCategory;
    train.isOverridden = true;
    train.aiReasoning = `Manual Supervisor Override: Relocated from ${previousCategory.toUpperCase()} to ${targetCategory.toUpperCase()}.`;

    this.overrideLog.unshift({
      timestamp: new Date().toLocaleTimeString(),
      trainId: trainId,
      from: previousCategory,
      to: targetCategory
    });

    this.app.render();
    this.app.showNotification(`Manual override applied: Train ${trainId} moved to ${targetCategory.toUpperCase()}`, 'warning');
  }
}
