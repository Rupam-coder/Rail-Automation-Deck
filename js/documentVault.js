/* Rail Nexus - Document Overload Management (Centralized Vault Module) */

export class DocumentVaultModule {
  constructor(app) {
    this.app = app;
    this.currentFilter = 'all';
    this.searchTerm = '';
    this.selectedTrainForEdit = null;
  }

  render() {
    const fleet = this.app.fleet;
    const filteredFleet = this.getFilteredFleet(fleet);

    // Compute summary stats
    const totalCount = fleet.length;
    const validCount = fleet.filter(t => t.overallDocTag === 'valid').length;
    const warningCount = fleet.filter(t => t.overallDocTag === 'warning' || t.overallDocTag === 'expired').length;
    const missingCount = fleet.filter(t => t.overallDocTag === 'missing').length;

    return `
      <!-- Document Vault Summary Grid with Distinct KPI Card Styling -->
      <div class="summary-grid">
        <div class="summary-card kpi-total">
          <div class="summary-info">
            <div class="label">Total Fleet Tracked</div>
            <div class="value">${totalCount} <span style="font-size:0.82rem; font-weight:500; color:var(--text-muted);">Trains</span></div>
          </div>
          <div class="summary-icon blue"><i data-lucide="shield"></i></div>
        </div>

        <div class="summary-card kpi-compliant">
          <div class="summary-info">
            <div class="label">100% Fully Compliant</div>
            <div class="value" style="color:var(--status-service);">${validCount}</div>
          </div>
          <div class="summary-icon green"><i data-lucide="check-circle-2"></i></div>
        </div>

        <div class="summary-card kpi-warning">
          <div class="summary-info">
            <div class="label">Expired / Warning Docs</div>
            <div class="value" style="color:var(--status-standby);">${warningCount}</div>
          </div>
          <div class="summary-icon amber"><i data-lucide="alert-triangle"></i></div>
        </div>

        <div class="summary-card kpi-missing">
          <div class="summary-info">
            <div class="label">Missing Documentation</div>
            <div class="value" style="color:var(--status-critical);">${missingCount}</div>
          </div>
          <div class="summary-icon red"><i data-lucide="file-warning"></i></div>
        </div>
      </div>

      <!-- Vault Main Table Card -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">
              <i data-lucide="folder-lock" style="color:var(--accent-terracotta);"></i>
              Centralized Railway Document Vault
            </div>
            <div class="card-subtitle">Automated validation mapping for Train IDs T01 through T40</div>
          </div>

          <div class="filter-group">
            <button class="filter-btn ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">All (40)</button>
            <button class="filter-btn ${this.currentFilter === 'valid' ? 'active' : ''}" data-filter="valid">Valid (${validCount})</button>
            <button class="filter-btn ${this.currentFilter === 'warning' ? 'active' : ''}" data-filter="warning">Expired/Warning (${warningCount})</button>
            <button class="filter-btn ${this.currentFilter === 'missing' ? 'active' : ''}" data-filter="missing">Missing (${missingCount})</button>
          </div>
        </div>

        <div class="table-toolbar">
          <div class="search-box">
            <i data-lucide="search" class="search-icon"></i>
            <input type="text" id="vault-search-input" class="search-input" placeholder="Search Train ID (e.g. T04) or Sponsor..." value="${this.searchTerm}">
          </div>
          <div style="font-size:0.8rem; color:var(--text-muted);">
            Showing <strong>${filteredFleet.length}</strong> of ${totalCount} trains
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Train ID</th>
                <th>Fitness Certificate</th>
                <th>Maximo Job Card</th>
                <th>Cleaning Record</th>
                <th>Branding Contract</th>
                <th>Overall Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${filteredFleet.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align:center; padding: 2rem; color:var(--text-muted);">
                    No trains match the search criteria.
                  </td>
                </tr>
              ` : filteredFleet.map(t => this.renderTableRow(t)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderTableRow(train) {
    const docs = train.documents;
    const dotColor = train.induction === 'revenue' ? 'var(--status-service)' : train.induction === 'standby' ? 'var(--status-standby)' : 'var(--status-critical)';

    const fitText = docs.fitness.status === 'missing' ? 'UNAVAILABLE' : docs.fitness.certNo;
    const maxText = docs.maximo.status === 'missing' ? 'UNAVAILABLE' : docs.maximo.jobId;
    const cleanText = docs.cleaning.status === 'missing' ? 'UNAVAILABLE' : docs.cleaning.status.toUpperCase();
    const brandText = docs.branding.status === 'missing' ? 'UNAVAILABLE' : docs.branding.sponsor;
    const overallText = train.overallDocTag === 'missing' ? 'UNAVAILABLE' : train.overallDocTag.toUpperCase();

    return `
      <tr>
        <td class="train-id-cell">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${dotColor};"></span>
          ${train.id}
        </td>

        <td>
          <span class="doc-status-badge ${docs.fitness.status}">
            <i data-lucide="${docs.fitness.status === 'valid' ? 'check' : docs.fitness.status === 'expired' ? 'x-circle' : 'alert-circle'}"></i>
            ${fitText}
          </span>
        </td>

        <td>
          <span class="doc-status-badge ${docs.maximo.status}">
            <i data-lucide="${docs.maximo.status === 'valid' ? 'wrench' : docs.maximo.status === 'warning' ? 'clock' : 'alert-circle'}"></i>
            ${maxText}
          </span>
        </td>

        <td>
          <span class="doc-status-badge ${docs.cleaning.status}">
            <i data-lucide="${docs.cleaning.status === 'valid' ? 'sparkles' : 'alert-triangle'}"></i>
            ${cleanText}
          </span>
        </td>

        <td>
          <span class="doc-status-badge ${docs.branding.status}">
            <i data-lucide="${docs.branding.status === 'missing' ? 'alert-circle' : 'award'}"></i>
            ${brandText}
          </span>
        </td>

        <td>
          <span class="doc-status-badge ${train.overallDocTag}" style="font-weight:700;">
            ${overallText}
          </span>
        </td>

        <td>
          ${train.overallDocTag === 'missing' ? `
            <button class="action-btn-sm edit-doc-btn" data-train="${train.id}" style="background:var(--status-critical-bg); color:var(--status-critical); border-color:var(--status-critical-border); font-weight:700;">
              <i data-lucide="alert-circle" style="width:12px; height:12px; vertical-align:middle;"></i> Unavailable
            </button>
          ` : `
            <button class="action-btn-sm edit-doc-btn" data-train="${train.id}">
              <i data-lucide="edit-3" style="width:12px; height:12px; vertical-align:middle;"></i> Manage
            </button>
          `}
        </td>
      </tr>
    `;
  }

  attachEvents(container) {
    // Search input event
    const searchInput = container.querySelector('#vault-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        this.app.render();
      });
    }

    // Filter button events
    const filterBtns = container.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentFilter = btn.getAttribute('data-filter');
        this.app.render();
      });
    });

    // Edit Document click event
    const editBtns = container.querySelectorAll('.edit-doc-btn');
    editBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const trainId = btn.getAttribute('data-train');
        this.openDocModal(trainId);
      });
    });
  }

  getFilteredFleet(fleet) {
    return fleet.filter(train => {
      // Search term matching
      const matchesSearch = train.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                            train.documents.branding.sponsor.toLowerCase().includes(this.searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Filter matching
      if (this.currentFilter === 'valid') return train.overallDocTag === 'valid';
      if (this.currentFilter === 'warning') return train.overallDocTag === 'warning' || train.overallDocTag === 'expired';
      if (this.currentFilter === 'missing') return train.overallDocTag === 'missing';
      return true;
    });
  }

  openDocModal(trainId) {
    const train = this.app.fleet.find(t => t.id === trainId);
    if (!train) return;

    this.selectedTrainForEdit = train;
    const modalOverlay = document.querySelector('#doc-modal-overlay');
    const modalBody = document.querySelector('#doc-modal-body');

    modalBody.innerHTML = `
      <div style="margin-bottom:1rem;">
        <h4 style="font-weight:700; color:var(--text-main); margin-bottom:0.25rem;">Train ${train.id} - ${train.name}</h4>
        <p style="font-size:0.82rem; color:var(--text-muted);">Update compliance verification status for Train ${train.id}</p>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
        <div class="form-group">
          <label class="form-label">Fitness Certificate</label>
          <select id="edit-fitness-status" class="form-select">
            <option value="valid" ${train.documents.fitness.status === 'valid' ? 'selected' : ''}>Valid</option>
            <option value="expired" ${train.documents.fitness.status === 'expired' ? 'selected' : ''}>Expired</option>
            <option value="missing" ${train.documents.fitness.status === 'missing' ? 'selected' : ''}>Missing (Unavailable)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Maximo Maintenance Card</label>
          <select id="edit-maximo-status" class="form-select">
            <option value="valid" ${train.documents.maximo.status === 'valid' ? 'selected' : ''}>Valid (Complete)</option>
            <option value="warning" ${train.documents.maximo.status === 'warning' ? 'selected' : ''}>Warning (Due)</option>
            <option value="missing" ${train.documents.maximo.status === 'missing' ? 'selected' : ''}>Missing (Unavailable)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Sanitization & Cleaning</label>
          <select id="edit-cleaning-status" class="form-select">
            <option value="valid" ${train.documents.cleaning.status === 'valid' ? 'selected' : ''}>Valid</option>
            <option value="expired" ${train.documents.cleaning.status === 'expired' ? 'selected' : ''}>Expired</option>
            <option value="missing" ${train.documents.cleaning.status === 'missing' ? 'selected' : ''}>Missing (Unavailable)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Branding Contract</label>
          <select id="edit-branding-status" class="form-select">
            <option value="valid" ${train.documents.branding.status === 'valid' ? 'selected' : ''}>Valid</option>
            <option value="expired" ${train.documents.branding.status === 'expired' ? 'selected' : ''}>Expired</option>
            <option value="missing" ${train.documents.branding.status === 'missing' ? 'selected' : ''}>Missing (Unavailable)</option>
          </select>
        </div>
      </div>
    `;

    modalOverlay.classList.add('active');

    // Save button event
    const saveBtn = document.querySelector('#save-doc-btn');
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

    newSaveBtn.addEventListener('click', () => {
      const fit = document.querySelector('#edit-fitness-status').value;
      const max = document.querySelector('#edit-maximo-status').value;
      const cln = document.querySelector('#edit-cleaning-status').value;
      const brn = document.querySelector('#edit-branding-status').value;

      train.documents.fitness.status = fit;
      train.documents.maximo.status = max;
      train.documents.cleaning.status = cln;
      train.documents.branding.status = brn;

      // Recalculate compliance and AI induction
      this.app.reevaluateFleetCompliance(train);

      modalOverlay.classList.remove('active');
      this.app.render();
      this.app.showNotification(`Updated document compliance status for Train ${train.id}`, 'success');
    });
  }
}
