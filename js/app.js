/* Rail Nexus - Main Application Coordinator & State Controller */

import { INITIAL_FLEET } from './data.js';
import { DocumentVaultModule } from './documentVault.js';
import { DepotInductionModule } from './depotInduction.js';
import { TrafficControlModule } from './trafficControl.js';
import { WhatIfSimulatorModule } from './whatIfSimulator.js';

class RailNexusApp {
  constructor() {
    this.fleet = INITIAL_FLEET;
    this.activeTab = 'vault'; // 'vault' | 'induction' | 'traffic'
    this.safetyShieldStatus = 'verified'; // 'verified' | 'warning' | 'conflict'

    // Instantiate Modules
    this.vaultModule = new DocumentVaultModule(this);
    this.inductionModule = new DepotInductionModule(this);
    this.trafficModule = new TrafficControlModule(this);
    this.whatIfModule = new WhatIfSimulatorModule(this);

    this.init();
  }

  init() {
    this.render();
    this.startClock();
  }

  render() {
    const root = document.querySelector('#app-root');
    if (!root) return;

    root.innerHTML = `
      <!-- App Header -->
      <header class="app-header">
        <div class="brand-section">
          <div class="brand-icon">
            <i data-lucide="subway"></i>
          </div>
          <div>
            <div class="brand-title">
              Rail Nexus
              <span class="brand-badge">RAIL CONTROL v2.4</span>
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Unified Railway Optimization & Safety Shield</div>
          </div>
        </div>

        <div class="header-actions">
          <!-- Persistent Safety Shield Badge -->
          <div id="header-safety-badge" class="safety-shield-badge ${this.safetyShieldStatus}">
            <span class="pulse-dot"></span>
            <span id="safety-badge-text">
              ${this.safetyShieldStatus === 'verified' 
                ? 'All Movement Authorities Verified - No Conflicts Detected' 
                : 'Safety Directive: Block Conflict Alert'}
            </span>
          </div>

          <button id="open-whatif-btn" class="simulator-btn">
            <i data-lucide="zap"></i> WHAT-IF SIMULATOR
          </button>

          <div class="date-time-display" style="display:flex; align-items:center; gap:0.5rem; background:var(--bg-secondary); padding:5px 12px; border-radius:var(--radius-md); border:1px solid var(--border-color); font-weight:600; font-size:0.8rem; color:var(--text-main);">
            <i data-lucide="calendar" style="width:13px; height:13px; color:var(--accent-terracotta);"></i>
            <span id="live-date">-- --- ----</span>
            <span style="color:var(--border-color);">|</span>
            <i data-lucide="clock" style="width:13px; height:13px; color:var(--status-service);"></i>
            <span id="live-clock" style="font-family:monospace; font-size:0.85rem;">--:--:--</span>
          </div>
        </div>
      </header>

      <!-- Navigation Bar (Deep Plum #35243A Background) -->
      <nav class="app-nav">
        <button class="nav-tab ${this.activeTab === 'vault' ? 'active' : ''}" data-tab="vault">
          <i data-lucide="folder-lock"></i> Centralized Document Vault
          <span class="tab-badge">40 Trains</span>
        </button>

        <button class="nav-tab ${this.activeTab === 'induction' ? 'active' : ''}" data-tab="induction">
          <i data-lucide="cpu"></i> AI Depot Induction Planning
          <span class="tab-badge">Optimization Engine</span>
        </button>

        <button class="nav-tab ${this.activeTab === 'traffic' ? 'active' : ''}" data-tab="traffic">
          <i data-lucide="activity"></i> Real-Time Traffic & Safety Shield
          <span class="tab-badge">Section Control</span>
        </button>
      </nav>

      <!-- Main Content Panes -->
      <main class="main-content">
        <div class="tab-pane ${this.activeTab === 'vault' ? 'active' : ''}" id="pane-vault">
          ${this.vaultModule.render()}
        </div>

        <div class="tab-pane ${this.activeTab === 'induction' ? 'active' : ''}" id="pane-induction">
          ${this.inductionModule.render()}
        </div>

        <div class="tab-pane ${this.activeTab === 'traffic' ? 'active' : ''}" id="pane-traffic">
          ${this.trafficModule.render()}
        </div>
      </main>

      <!-- Global Document Edit Modal Container -->
      <div id="doc-modal-overlay" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-title">
              <i data-lucide="file-check" style="color:var(--accent-terracotta);"></i> Manage Document Compliance
            </div>
            <button class="modal-close" onclick="document.querySelector('#doc-modal-overlay').classList.remove('active');"><i data-lucide="x"></i></button>
          </div>
          <div id="doc-modal-body" class="modal-body"></div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="document.querySelector('#doc-modal-overlay').classList.remove('active');">Cancel</button>
            <button id="save-doc-btn" class="btn-primary">SAVE & RE-EVALUATE COMPLIANCE</button>
          </div>
        </div>
      </div>

      <!-- What-If Simulator Modal Container -->
      <div id="whatif-modal-container">
        ${this.whatIfModule.renderModal()}
      </div>

      <!-- Toast Notification Box -->
      <div id="toast-container" style="position:fixed; bottom:20px; right:20px; z-index:300;"></div>
    `;

    // Initialize icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Attach event listeners
    this.attachGlobalEvents(root);
  }

  attachGlobalEvents(root) {
    // Navigation tab switching
    const navTabs = root.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.activeTab = tab.getAttribute('data-tab');
        this.render();
      });
    });

    // What-If Simulator button
    const openWhatIfBtn = root.querySelector('#open-whatif-btn');
    if (openWhatIfBtn) {
      openWhatIfBtn.addEventListener('click', () => {
        const modal = root.querySelector('#whatif-modal-overlay');
        if (modal) modal.classList.add('active');
      });
    }

    // Attach module events
    if (this.activeTab === 'vault') this.vaultModule.attachEvents(root);
    if (this.activeTab === 'induction') this.inductionModule.attachEvents(root);
    if (this.activeTab === 'traffic') this.trafficModule.attachEvents(root);

    this.whatIfModule.attachEvents();
  }

  renderModalContainer() {
    const container = document.querySelector('#whatif-modal-container');
    if (container) {
      container.innerHTML = this.whatIfModule.renderModal();
      if (window.lucide) window.lucide.createIcons();
      this.whatIfModule.attachEvents();
      document.querySelector('#whatif-modal-overlay').classList.add('active');
    }
  }

  reevaluateFleetCompliance(train) {
    const docs = train.documents;
    const isFitValid = docs.fitness.status === 'valid';
    const isMaxValid = docs.maximo.status === 'valid';
    const isCleanValid = docs.cleaning.status === 'valid';

    if (!isFitValid || docs.maximo.status === 'missing') {
      train.overallDocTag = 'expired';
      if (!train.isOverridden) {
        train.induction = 'maintenance';
        train.aiReasoning = `Assigned to Depot Maintenance: Document failure flagged (${docs.fitness.status.toUpperCase()} Fitness Cert).`;
      }
    } else if (docs.maximo.status === 'warning' || !isCleanValid) {
      train.overallDocTag = 'warning';
      if (!train.isOverridden) {
        train.induction = 'standby';
        train.aiReasoning = `Assigned to Standby: Minor document check required before service clearance.`;
      }
    } else {
      train.overallDocTag = 'valid';
      if (!train.isOverridden) {
        train.induction = 'revenue';
        train.aiReasoning = `Selected for Revenue Service: Fitness certified, Maximo job card active, cleaning complete.`;
      }
    }
  }

  applySimulationReplacement(simResult) {
    const affected = this.fleet.find(t => t.id === simResult.affectedTrain || simResult.affectedTrain.includes(t.id));
    const replacement = this.fleet.find(t => t.id === simResult.replacementTrain);

    if (affected) {
      affected.induction = 'maintenance';
      affected.aiReasoning = `Relocated to Maintenance: ${simResult.reason}.`;
    }

    if (replacement) {
      replacement.induction = 'revenue';
      replacement.aiReasoning = `Promoted to Revenue Service: Automated What-If replacement with ${simResult.shuntingMinutes} min shunting optimization.`;
    }

    this.render();
    this.showNotification(`Applied simulation: Swapped ${simResult.affectedTrain} with Standby Train ${simResult.replacementTrain}`, 'success');
  }

  updateSafetyShieldStatus(status) {
    this.safetyShieldStatus = status;
    const badge = document.querySelector('#header-safety-badge');
    const badgeText = document.querySelector('#safety-badge-text');

    if (badge && badgeText) {
      badge.className = `safety-shield-badge ${status}`;
      badgeText.innerText = status === 'verified'
        ? 'All Movement Authorities Verified - No Conflicts Detected'
        : 'Safety Directive: Block Conflict Alert';
    }
  }

  showNotification(message, type = 'info') {
    const container = document.querySelector('#toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.style.cssText = `
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-left: 4px solid ${type === 'success' ? 'var(--status-service)' : type === 'warning' ? 'var(--status-standby)' : 'var(--accent-terracotta)'};
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      font-size: 0.83rem;
      color: var(--text-main);
      font-weight: 600;
      margin-top: 0.5rem;
      animation: fadeIn 0.2s ease-in-out;
    `;
    toast.innerText = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  startClock() {
    const updateTime = () => {
      const clockEl = document.querySelector('#live-clock');
      const dateEl = document.querySelector('#live-date');
      const now = new Date();
      if (clockEl) {
        clockEl.innerText = now.toLocaleTimeString();
      }
      if (dateEl) {
        dateEl.innerText = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  }
}

// Instantiate on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  window.app = new RailNexusApp();
});
