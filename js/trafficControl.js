/* Rail Nexus - Real-Time Traffic Control & Anti-Collision Safety Shield Module */

export class TrafficControlModule {
  constructor(app) {
    this.app = app;

    // State for customizable trains & automated emergency reroute switch
    this.calcInputs = {
      isAutoRerouteEnabled: true,
      t1: { id: 'T12', line: 'line1', km: 4.2, speed: 65, enabled: true },
      t2: { id: 'T09', line: 'line1', km: 11.5, speed: 55, enabled: true },
      t3: { id: 'T04', line: 'line2', km: 3.8, speed: 70, enabled: true },
      t4: { id: 'T18', line: 'line2', km: 12.2, speed: 60, enabled: true },
      t5: { id: 'T21', line: 'line3', km: 5.1, speed: 62, enabled: true },
      t6: { id: 'T27', line: 'line4', km: 9.6, speed: 58, enabled: true },
      isSimulating: false
    };

    this.simAnimFrame = null;
    this.inspectionAnimFrame = null;
    this.lastFrameTime = 0;
    this.hasConflict = false;
    this.advisoryResult = null;

    // Advanced Multi-Sensor Inspection Trolley System State
    this.inspection = {
      line: 'line1',
      checkpointKm: 0.0,
      targetKm: 0.0,
      isScanning: false,
      isAutoPatrol: false,
      lastSignal: 'verified', // 'verified' | 'caution' | 'blocked'
      blocked: false,
      blockedLine: null,
      defectType: 'crack', // 'crack' | 'gauge' | 'catenary' | 'debris'
      defectAtNextCheckpoint: false,
      defectCoordinate: null,
      inspectedCheckpoints: [],
      telemetry: {
        ultrasoundFlaws: 0,
        gaugeVariance: '+0.1 mm',
        catenaryVoltage: '25.2 kV',
        vibrationIndex: '1.1 G',
        trackIntegrity: 100,
        batteryLevel: 98,
        cameraStatus: 'HD OPTICAL STREAM OK'
      }
    };

    // Live Event & Diagnostic Audit Ticker Stream
    this.speedGovernorState = 'FULL'; // 'FULL' | 'CAUTION' | 'WEATHER' | 'HOLD'
    this.auditLog = [
      { timestamp: this.getNowTime(), type: 'info', text: 'ATP Network Safety Shield initialized across 4 rail sections.' },
      { timestamp: this.getNowTime(), type: 'inspection', text: 'Inspection Trolley (IT-01) system online on Line 1.' },
      { timestamp: this.getNowTime(), type: 'info', text: 'Movement authorities verified for 6 active fleet units.' }
    ];
  }

  getNowTime() {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  }

  addAuditLog(type, text) {
    this.auditLog.unshift({ timestamp: this.getNowTime(), type, text });
    if (this.auditLog.length > 25) this.auditLog.pop();
    this.updateAuditLogDOM();
  }

  getLineName(line) {
    return {
      line1: 'Line 1 (North)',
      line2: 'Line 2 (South)',
      line3: 'Line 3 (Inspection Standby)',
      line4: 'Line 4 (Goods Carrier Standby)'
    }[line] || line;
  }

  getLineTopClass(line) {
    return `pin-on-${line}`;
  }

  getLineTopOffset(line) {
    return { line1: '22px', line2: '142px', line3: '262px', line4: '382px' }[line] || '22px';
  }

  moveTrainToLine(key, line) {
    const standbyOwner = { line3: 't5', line4: 't6' }[line];
    if (standbyOwner && standbyOwner !== key) {
      this.app.render();
      this.app.showNotification(`${this.getLineName(line)} is reserved for ${line === 'line3' ? 'the inspection train' : 'the goods carrier train'}.`, 'warning');
      return;
    }

    this.calcInputs[key].line = line;
    this.calcInputs[key].km = 0.0;
    this.addAuditLog('info', `Train ${this.calcInputs[key].id} assigned to ${this.getLineName(line)} at 0.0 km.`);
    this.updateLiveDOM();
  }

  render() {
    const fleet = this.app.fleet;
    const calcResult = this.computeHeadwayAdvisory();
    this.hasConflict = calcResult.isConflict;
    this.advisoryResult = calcResult;

    this.app.updateSafetyShieldStatus(this.getDirectiveState(calcResult));

    return `
      <!-- Four-Line Interconnected Track Map & Section Visualizer -->
      <div class="track-map-container">
        <div class="track-map-header">
          <div class="track-title">
            <i data-lucide="git-merge" style="color:var(--accent-terracotta);"></i> Interconnected Network Map (4 Lines | 6 Active Trains + Inspection Trolley)
          </div>

          <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
            <!-- Connect Lines & Emergency Reroute Button -->
            <button id="toggle-reroute-btn" class="action-btn-sm" style="background:${this.calcInputs.isAutoRerouteEnabled ? 'var(--accent-terracotta-tint)' : 'var(--bg-secondary)'}; color:${this.calcInputs.isAutoRerouteEnabled ? 'var(--accent-terracotta)' : 'var(--text-muted)'}; font-weight:700; border-color:${this.calcInputs.isAutoRerouteEnabled ? 'var(--accent-terracotta)' : 'var(--border-color)'};">
              <i data-lucide="git-branch" style="width:12px; height:12px; vertical-align:middle;"></i>
              Line Reroute: <strong id="reroute-btn-text">${this.calcInputs.isAutoRerouteEnabled ? 'AUTO REROUTE ON' : 'MANUAL'}</strong>
            </button>

            <!-- Simulate Movement Button -->
            <button id="toggle-sim-btn" class="action-btn-sm" style="background:${this.calcInputs.isSimulating ? 'var(--accent-terracotta)' : 'var(--bg-surface)'}; color:${this.calcInputs.isSimulating ? '#FFFFFF' : 'var(--text-main)'}; font-weight:600; border-color:${this.calcInputs.isSimulating ? 'var(--accent-terracotta)' : 'var(--border-color)'};">
              <i data-lucide="${this.calcInputs.isSimulating ? 'pause' : 'play'}" style="width:12px; height:12px; vertical-align:middle;"></i>
              <span id="sim-btn-text">${this.calcInputs.isSimulating ? 'Pause Live Movement' : 'Simulate Trains Live'}</span>
            </button>

            <div style="font-size:0.78rem; background:var(--bg-secondary); padding:4px 12px; border-radius:12px; border:1px solid var(--border-color); font-weight:600;">
              <i data-lucide="radio" style="width:12px; height:12px; color:var(--status-service);"></i> ATP Protection Live
            </div>
          </div>
        </div>

        <!-- Four Railway Line Map Container -->
        <div class="dual-stations-container four-line-map">
          <!-- Line 1 Title Tag -->
          <div class="line-title-tag tag-line1">Line 1: North Line (Station A ➔ Station B Junction) - 15 km</div>

          <!-- Line 1 Track Line -->
          <div class="line1-track">
            <div class="line1-progress" style="width: 100%;"></div>
          </div>

          <!-- Line 1 Station Nodes -->
          <div class="station-node node-line1" style="left: 0%; transform: translateX(0%);">
            <div class="station-marker"></div>
            <div class="station-label">Station A</div>
            <div class="station-distance">0.0 km</div>
          </div>
          <div class="station-node node-line1" style="left: 100%; transform: translateX(-100%);">
            <div class="station-marker" style="border-color:var(--accent-terracotta);"></div>
            <div class="station-label" style="text-align:right;">Station B (Junction)</div>
            <div class="station-distance" style="text-align:right;">15.0 km</div>
          </div>

          <!-- Interactive Interchange Junction Switch Connection -->
          <div id="junction-switch-line" class="interchange-junction-switch ${this.calcInputs.isAutoRerouteEnabled ? 'connected' : 'disconnected'}"></div>
          <div id="junction-switch-badge" class="interchange-badge-tag ${this.calcInputs.isAutoRerouteEnabled ? '' : 'disconnected'}">
            <i data-lucide="repeat" style="width:10px; height:10px; inline-size:10px;"></i>
            <span id="junction-badge-text">Interchange: ${this.calcInputs.isAutoRerouteEnabled ? 'REROUTE CONNECTED' : 'MANUAL'}</span>
          </div>

          <!-- Line 2 Title Tag -->
          <div class="line-title-tag tag-line2">Line 2: South Line (Station C Junction ➔ Station D) - 15 km</div>
          <div class="line2-track"><div class="line2-progress" style="width: 100%;"></div></div>

          <div class="station-node node-line2" style="left: 0%; transform: translateX(0%);">
            <div class="station-marker" style="border-color:var(--dark-primary);"></div>
            <div class="station-label">Station C (Junction)</div>
            <div class="station-distance">0.0 km</div>
          </div>
          <div class="station-node node-line2" style="left: 100%; transform: translateX(-100%);">
            <div class="station-marker" style="border-color:var(--status-service);"></div>
            <div class="station-label" style="text-align:right;">Station D</div>
            <div class="station-distance" style="text-align:right;">15.0 km</div>
          </div>

          <!-- Line 3 Title Tag -->
          <div class="line-title-tag tag-line3">Line 3: Inspection Standby Track (15 km)</div>
          <div class="line3-track"><div class="line3-progress" style="width: 100%;"></div></div>

          <!-- Line 4 Title Tag -->
          <div class="line-title-tag tag-line4">Line 4: Goods Carrier Standby Track (15 km)</div>
          <div class="line4-track"><div class="line4-progress" style="width: 100%;"></div></div>

          <!-- Train Pins on Map -->
          ${this.renderTrainPin('t1', 'Terracotta')}
          ${this.renderTrainPin('t2', 'Mustard')}
          ${this.renderTrainPin('t3', 'Plum')}
          ${this.renderTrainPin('t4', 'Teal')}
          ${this.renderTrainPin('t5', 'Mustard')}
          ${this.renderTrainPin('t6', 'Plum')}

          <!-- DYNAMIC INSPECTION TROLLEY MAP MARKER WITH LASER SCANNER -->
          ${this.renderInspectionTrolleyPin()}
        </div>

        <!-- Live Network Occupancy Status Bar -->
        <div class="line-status-grid" style="display:grid; gap:0.75rem; margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--border-color); font-size:0.8rem;">
          <div>
            <span style="color:var(--text-muted);">Line 1 (North):</span>
            <strong id="line1-status-text" style="color:${calcResult.line1Conflict ? 'var(--status-critical)' : 'var(--status-service)'};">
              ${calcResult.line1Conflict ? `BLOCKED (${calcResult.line1Trains.join(', ') || 'No active trains'})` : calcResult.line1Trains.length > 0 ? `Occupied (${calcResult.line1Trains.join(', ')})` : 'Clear / Unoccupied'}
            </strong>
          </div>
          <div>
            <span style="color:var(--text-muted);">Line 2 (South):</span>
            <strong id="line2-status-text" style="color:${calcResult.line2Conflict ? 'var(--status-critical)' : 'var(--status-service)'};">
              ${calcResult.line2Conflict ? `BLOCKED (${calcResult.line2Trains.join(', ') || 'No active trains'})` : calcResult.line2Trains.length > 0 ? `Occupied (${calcResult.line2Trains.join(', ')})` : 'Clear / Unoccupied'}
            </strong>
          </div>
          <div>
            <span style="color:var(--text-muted);">Line 3 (Inspection):</span>
            <strong id="line3-status-text" style="color:${calcResult.line3Conflict ? 'var(--status-critical)' : 'var(--status-service)'};">
              ${calcResult.line3Conflict ? `BLOCKED (${calcResult.line3Trains.join(', ') || 'No active trains'})` : calcResult.line3Trains.length > 0 ? `Occupied (${calcResult.line3Trains.join(', ')})` : 'Clear / Unoccupied'}
            </strong>
          </div>
          <div>
            <span style="color:var(--text-muted);">Line 4 (Goods):</span>
            <strong id="line4-status-text" style="color:${calcResult.line4Conflict ? 'var(--status-critical)' : 'var(--status-service)'};">
              ${calcResult.line4Conflict ? `BLOCKED (${calcResult.line4Trains.join(', ') || 'No active trains'})` : calcResult.line4Trains.length > 0 ? `Occupied (${calcResult.line4Trains.join(', ')})` : 'Clear / Unoccupied'}
            </strong>
          </div>
        </div>
      </div>

      <!-- Enhanced Multi-Sensor Inspection Trolley System Card -->
      ${this.renderInspectionCart()}

      <!-- Restructured 2-Column Balanced Dashboard Layout -->
      <div class="calc-grid">
        <!-- LEFT COLUMN: Train Customization & Fleet Toggles -->
        <div>
          <div class="dashboard-section-header">
            <i data-lucide="sliders" style="color:var(--accent-terracotta);"></i> Fleet Customization & Line Control
          </div>

          ${this.renderTrainControlCard('t1', 'Train 1 (North Line Lead)', 'var(--accent-terracotta)')}
          ${this.renderTrainControlCard('t2', 'Train 2 (North Line Follower)', 'var(--status-standby)')}
          ${this.renderTrainControlCard('t3', 'Train 3 (South Line Lead)', 'var(--dark-primary)')}
          ${this.renderTrainControlCard('t4', 'Train 4 (South Line Follower)', 'var(--status-service)')}
          ${this.renderTrainControlCard('t5', 'Train 5 (Inspection Train)', 'var(--status-standby)')}
          ${this.renderTrainControlCard('t6', 'Train 6 (Goods Carrier)', 'var(--dark-primary)')}
        </div>

        <!-- RIGHT COLUMN: Safety Directives + Interlock Matrix + Audit Ticker + Master Speed Governor -->
        <div style="display:flex; flex-direction:column; gap:1.25rem;">
          <div>
            <div class="dashboard-section-header">
              <i data-lucide="shield-alert" style="color:var(--status-service);"></i> Active Safety Directives (Lines 1–4)
            </div>

            <!-- Line 1 Safety Directives -->
            <div id="line1-advisory-box" class="advisory-box ${calcResult.line1Conflict ? 'conflict' : 'verified'}" style="margin-bottom:0.85rem;">
              <div id="line1-advisory-title" class="advisory-title" style="color:${calcResult.line1Conflict ? 'var(--status-critical)' : 'var(--status-service)'};">
                <i data-lucide="${calcResult.line1Conflict ? 'alert-triangle' : 'shield-check'}"></i>
                LINE 1 (NORTH LINE) DIRECTIVE
              </div>
              <div id="line1-advisory-body" class="advisory-text">${calcResult.line1Advisory}</div>
              <div style="margin-top:0.5rem; padding-top:0.4rem; border-top:1px dashed var(--border-color); display:flex; justify-content:space-between; font-size:0.75rem;">
                <span>Active Trains: <strong id="line1-active-names">${calcResult.line1Trains.length > 0 ? calcResult.line1Trains.join(', ') : 'None'}</strong></span>
                <span>Min Separation: <strong id="line1-sep-val">${calcResult.line1Sep < 50 ? calcResult.line1Sep.toFixed(1) + ' km' : 'Clear'}</strong></span>
              </div>
            </div>

            <!-- Line 2 Safety Directives -->
            <div id="line2-advisory-box" class="advisory-box ${calcResult.line2Conflict ? 'conflict' : 'verified'}" style="margin-bottom:0.85rem;">
              <div id="line2-advisory-title" class="advisory-title" style="color:${calcResult.line2Conflict ? 'var(--status-critical)' : 'var(--status-service)'};">
                <i data-lucide="${calcResult.line2Conflict ? 'alert-triangle' : 'shield-check'}"></i>
                LINE 2 (SOUTH LINE) DIRECTIVE
              </div>
              <div id="line2-advisory-body" class="advisory-text">${calcResult.line2Advisory}</div>
              <div style="margin-top:0.5rem; padding-top:0.4rem; border-top:1px dashed var(--border-color); display:flex; justify-content:space-between; font-size:0.75rem;">
                <span>Active Trains: <strong id="line2-active-names">${calcResult.line2Trains.length > 0 ? calcResult.line2Trains.join(', ') : 'None'}</strong></span>
                <span>Min Separation: <strong id="line2-sep-val">${calcResult.line2Sep < 50 ? calcResult.line2Sep.toFixed(1) + ' km' : 'Clear'}</strong></span>
              </div>
            </div>

            <!-- Line 3 Safety Directives -->
            <div id="line3-advisory-box" class="advisory-box ${calcResult.line3Conflict ? 'conflict' : 'verified'}" style="margin-bottom:0.85rem;">
              <div id="line3-advisory-title" class="advisory-title" style="color:${calcResult.line3Conflict ? 'var(--status-critical)' : 'var(--status-service)'};">
                <i data-lucide="${calcResult.line3Conflict ? 'alert-triangle' : 'shield-check'}"></i>
                LINE 3 (INSPECTION STANDBY) DIRECTIVE
              </div>
              <div id="line3-advisory-body" class="advisory-text">${calcResult.line3Advisory}</div>
            </div>

            <!-- Line 4 Safety Directives -->
            <div id="line4-advisory-box" class="advisory-box ${calcResult.line4Conflict ? 'conflict' : 'verified'}" style="margin-bottom:0.85rem;">
              <div id="line4-advisory-title" class="advisory-title" style="color:${calcResult.line4Conflict ? 'var(--status-critical)' : 'var(--status-service)'};">
                <i data-lucide="${calcResult.line4Conflict ? 'alert-triangle' : 'shield-check'}"></i>
                LINE 4 (GOODS STANDBY) DIRECTIVE
              </div>
              <div id="line4-advisory-body" class="advisory-text">${calcResult.line4Advisory}</div>
            </div>

            <!-- Interchange Reroute Box -->
            <div id="junction-advisory-box" class="advisory-box ${calcResult.junctionRerouted ? 'conflict' : 'verified'}">
              <div id="junction-advisory-title" class="advisory-title" style="color:${calcResult.junctionRerouted ? 'var(--accent-terracotta)' : 'var(--status-service)'};">
                <i data-lucide="git-branch"></i>
                INTERCHANGE EMERGENCY REROUTE DIRECTIVE
              </div>
              <div id="junction-advisory-body" class="advisory-text">${calcResult.junctionAdvisory}</div>
            </div>
          </div>

          <!-- NEW PANEL 1: Live Signal Interlock & ATP Matrix (Right Bottom) -->
          <div class="card signal-interlock-card">
            <div class="card-header" style="margin-bottom:0.75rem; padding-bottom:0.5rem;">
              <div class="card-title" style="font-size:0.95rem;">
                <i data-lucide="traffic-cone" style="color:var(--accent-mustard);"></i> ATP Signal Interlock Relay Matrix
              </div>
              <span class="brand-badge" style="font-size:0.65rem;">REAL-TIME SIGNAL STATUS</span>
            </div>

            <div class="signal-matrix-grid">
              ${this.renderSignalRelayLamp('S1', 'Line 1 Signal', calcResult.line1Conflict)}
              ${this.renderSignalRelayLamp('S2', 'Line 2 Signal', calcResult.line2Conflict)}
              ${this.renderSignalRelayLamp('S3', 'Line 3 Inspection', calcResult.line3Conflict)}
              ${this.renderSignalRelayLamp('S4', 'Line 4 Goods', calcResult.line4Conflict)}
            </div>

            <div class="signal-interlock-actions" style="margin-top:0.85rem; padding-top:0.65rem; border-top:1px dashed var(--border-color); display:flex; gap:0.5rem; justify-content:space-between; align-items:center;">
              <button id="reset-all-signals-btn" class="action-btn-sm" style="font-size:0.75rem; color:var(--status-service); font-weight:700;"><i data-lucide="rotate-ccw"></i> Reset ATP Interlocks</button>
              <span style="font-size:0.73rem; color:var(--text-muted);"><i data-lucide="radio" style="width:11px; height:11px; color:var(--status-service);"></i> Radio Telemetry: <strong>99.8% Signal Sync</strong></span>
            </div>
          </div>

          <!-- NEW PANEL 2: Real-Time Safety & Inspection Audit Log Stream (Right Bottom Ticker) -->
          <div class="card audit-log-card">
            <div class="card-header" style="margin-bottom:0.75rem; padding-bottom:0.5rem;">
              <div class="card-title" style="font-size:0.95rem;">
                <i data-lucide="terminal" style="color:var(--dark-primary);"></i> Safety & Inspection Telemetry Audit Log
              </div>
              <span class="tab-badge" style="background:var(--dark-primary); color:var(--bg-surface); font-size:0.65rem;">LIVE STREAM</span>
            </div>

            <div id="audit-log-stream" class="audit-log-stream">
              ${this.renderAuditLogStream()}
            </div>
          </div>

          <!-- NEW PANEL 3: Master Speed Governor & Traction Substation Console (Fills Bottom Right!) -->
          ${this.renderSpeedGovernorCard()}
        </div>
      </div>
    `;
  }

  renderTrainPin(key, themeColor) {
    const t = this.calcInputs[key];
    const percent = Math.min(100, Math.max(0, (t.km / 15.0) * 100));
    const topClass = this.getLineTopClass(t.line);
    const isDanger = this.inspection.blocked && this.inspection.blockedLine === t.line;

    let bgStyle = 'background:var(--accent-terracotta);';
    if (themeColor === 'Mustard') bgStyle = 'background:var(--status-standby); color:var(--dark-primary);';
    if (themeColor === 'Plum') bgStyle = 'background:var(--dark-primary); color:var(--bg-surface);';
    if (themeColor === 'Teal') bgStyle = 'background:var(--status-service); color:var(--bg-surface);';

    return `
      <div id="${key}-map-pin" class="train-map-pin ${topClass}" style="left: ${percent}%; display: ${t.enabled ? 'flex' : 'none'};">
        <div id="${key}-pin-pill" class="pin-badge-pill${isDanger ? ' conflict' : ''}" style="${isDanger ? '' : bgStyle}">
          <i data-lucide="train" style="width:12px; height:12px;"></i>
          <span id="${key}-pin-label">${isDanger ? '⚠ DANGER ' : '📍 '}${t.id}: ${t.km.toFixed(1)} km</span>
        </div>
        <div class="pin-rail-pointer"></div>
      </div>
    `;
  }

  renderInspectionTrolleyPin() {
    const inspection = this.inspection;
    const percent = Math.min(100, Math.max(0, (inspection.checkpointKm / 15.0) * 100));
    const topClass = this.getLineTopClass(inspection.line);
    const isScanning = inspection.isScanning;
    const isBlocked = inspection.blocked;

    return `
      <div id="trolley-map-pin" class="train-map-pin ${topClass} inspection-trolley-pin" style="left: ${percent}%; z-index:10;">
        <div id="trolley-pin-pill" class="pin-badge-pill trolley-pill ${isBlocked ? 'conflict' : isScanning ? 'scanning' : ''}">
          <i data-lucide="scan-line" class="${isScanning ? 'spin-icon' : ''}" style="width:13px; height:13px; color:#FFF;"></i>
          <span id="trolley-pin-label">TROLLEY IT-01: ${inspection.checkpointKm.toFixed(1)} km</span>
          ${isScanning ? '<span class="scan-radar-wave"></span>' : ''}
        </div>
        <div class="pin-rail-pointer trolley-pointer"></div>
      </div>
    `;
  }

  renderSignalRelayLamp(id, label, isBlocked) {
    const lampColor = isBlocked ? 'var(--status-critical)' : 'var(--status-service)';
    const lampState = isBlocked ? 'STOP / RED' : 'PROCEED / GREEN';

    return `
      <div class="signal-lamp-item">
        <div class="signal-lamp-head">
          <span class="signal-bulb ${isBlocked ? 'red' : 'green'}"></span>
          <span class="signal-id">${id}</span>
        </div>
        <div class="signal-info">
          <div class="signal-label">${label}</div>
          <div class="signal-state" style="color:${lampColor};">${lampState}</div>
        </div>
      </div>
    `;
  }

  renderInspectionCart() {
    const inspection = this.inspection;
    const isBlocked = inspection.blocked;
    const isScanning = inspection.isScanning;
    const signalColor = isBlocked ? 'var(--status-critical)' : 'var(--status-service)';
    const signalText = isBlocked ? 'TRACK DEFECT BLOCK' : isScanning ? 'PATROL SCAN IN PROGRESS' : 'TRACK CERTIFIED OK';
    const lineName = this.getLineName(inspection.line);
    const defectCoordinate = isBlocked ? `${lineName} / chainage ${inspection.checkpointKm.toFixed(1)} km` : 'No defect recorded';
    const checkpoints = inspection.inspectedCheckpoints.length > 0
      ? inspection.inspectedCheckpoints.map(km => `${km.toFixed(1)} km`).join(', ')
      : 'None yet';

    return `
      <div class="card inspection-cart-card ${isScanning ? 'scanning-card' : ''}">
        <div class="card-header">
          <div>
            <div class="card-title">
              <i data-lucide="rail-symbol" style="color:var(--accent-terracotta);"></i> Autonomous Track Inspection Trolley (IT-01)
            </div>
            <div class="card-subtitle">Multi-sensor ultrasound, track gauge, & overhead line scanning every 2 km checkpoint.</div>
          </div>

          <div id="inspection-signal" class="inspection-signal" style="color:${signalColor}; border-color:${signalColor}; background:${isBlocked ? 'var(--status-critical-bg)' : 'var(--status-service-bg)'};">
            <span class="pulse-dot" style="background:${signalColor};"></span>
            <strong id="inspection-signal-text">${signalText}</strong>
          </div>
        </div>

        <!-- 4 Multi-Sensor Telemetry HUD Cards -->
        <div class="inspection-telemetry-hud">
          <div class="telemetry-card">
            <span class="telemetry-label"><i data-lucide="activity" style="width:12px; height:12px; color:var(--accent-terracotta);"></i> Ultrasound Flaws</span>
            <strong id="hud-flaws" class="telemetry-value" style="color:${inspection.telemetry.ultrasoundFlaws > 0 ? 'var(--status-critical)' : 'var(--status-service)'};">
              ${inspection.telemetry.ultrasoundFlaws} detected
            </strong>
            <span class="telemetry-sub">Crack & Rail Defect Radar</span>
          </div>

          <div class="telemetry-card">
            <span class="telemetry-label"><i data-lucide="ruler" style="width:12px; height:12px; color:var(--accent-mustard);"></i> Track Gauge Variance</span>
            <strong id="hud-gauge" class="telemetry-value">${inspection.telemetry.gaugeVariance}</strong>
            <span class="telemetry-sub">Std: 1435 mm Alignment</span>
          </div>

          <div class="telemetry-card">
            <span class="telemetry-label"><i data-lucide="zap" style="width:12px; height:12px; color:var(--accent-teal);"></i> Catenary Line Voltage</span>
            <strong id="hud-catenary" class="telemetry-value">${inspection.telemetry.catenaryVoltage}</strong>
            <span class="telemetry-sub">Overhead Power Feed</span>
          </div>

          <div class="telemetry-card">
            <span class="telemetry-label"><i data-lucide="shield-check" style="width:12px; height:12px; color:var(--status-service);"></i> Track Structural Integrity</span>
            <strong id="hud-integrity" class="telemetry-value" style="color:${inspection.telemetry.trackIntegrity < 80 ? 'var(--status-critical)' : 'var(--status-service)'};">
              ${inspection.telemetry.trackIntegrity}%
            </strong>
            <span class="telemetry-sub">Safety Clearance Status</span>
          </div>
        </div>

        <!-- Inspection Controls Grid -->
        <div class="inspection-cart-grid" style="margin-top:1rem;">
          <div>
            <label class="form-label" for="inspection-line">Target Inspection Track</label>
            <select id="inspection-line" class="form-select" ${isBlocked || isScanning ? 'disabled' : ''}>
              <option value="line1" ${inspection.line === 'line1' ? 'selected' : ''}>Line 1 (North)</option>
              <option value="line2" ${inspection.line === 'line2' ? 'selected' : ''}>Line 2 (South)</option>
              <option value="line3" ${inspection.line === 'line3' ? 'selected' : ''}>Line 3 (Inspection Standby)</option>
              <option value="line4" ${inspection.line === 'line4' ? 'selected' : ''}>Line 4 (Goods Carrier Standby)</option>
            </select>
          </div>

          <div>
            <label class="form-label" for="sim-defect-type">Defect Simulation Type</label>
            <select id="sim-defect-type" class="form-select" ${isBlocked || isScanning ? 'disabled' : ''}>
              <option value="crack" ${inspection.defectType === 'crack' ? 'selected' : ''}>Ultrasound Micro-Crack Flaw</option>
              <option value="gauge" ${inspection.defectType === 'gauge' ? 'selected' : ''}>Track Gauge Shift (+4.8 mm)</option>
              <option value="catenary" ${inspection.defectType === 'catenary' ? 'selected' : ''}>Catenary Voltage Sag (18.2 kV)</option>
              <option value="debris" ${inspection.defectType === 'debris' ? 'selected' : ''}>Track Obstruction / Debris</option>
            </select>
          </div>

          <div class="inspection-readout">
            <span class="form-label">Target Checkpoint</span>
            <strong id="inspection-next-checkpoint">
              ${inspection.checkpointKm >= 14 ? 'Terminal at 15.0 km' : `${(inspection.checkpointKm + 2).toFixed(1)} km Checkpoint`}
            </strong>
          </div>
        </div>

        <!-- Progress Track Bar -->
        <div class="inspection-track" aria-label="Inspection checkpoint progress">
          <div class="inspection-track-progress" id="inspection-progress" style="width:${Math.min(100, (inspection.checkpointKm / 15) * 100)}%;"></div>
          ${[2, 4, 6, 8, 10, 12, 14].map(km => `
            <span class="inspection-marker ${inspection.inspectedCheckpoints.includes(km) ? 'checked' : ''}" style="left:${(km / 15) * 100}%;" title="${km} km checkpoint"></span>
          `).join('')}
        </div>

        <div class="inspection-meta">
          <span>Active Track: <strong id="inspection-line-name">${lineName}</strong></span>
          <span>Inspected Sections: <strong id="inspection-checked-list">${checkpoints}</strong></span>
          <span>Defect Location: <strong id="inspection-defect-coordinate" style="color:${isBlocked ? 'var(--status-critical)' : 'var(--text-muted)'};">${defectCoordinate}</strong></span>
        </div>

        <!-- Action Buttons -->
        <div class="inspection-actions">
          <!-- Run 2 km step -->
          <button id="run-inspection-btn" class="btn-primary" ${isBlocked || isScanning ? 'disabled' : ''}>
            <i data-lucide="scan-line"></i> Inspect Next 2 km
          </button>

          <!-- Run Full Automated Patrol Scan -->
          <button id="auto-patrol-btn" class="action-btn-sm" style="background:var(--dark-primary); color:var(--bg-surface); font-weight:600; border-color:var(--dark-primary);" ${isBlocked || isScanning ? 'disabled' : ''}>
            <i data-lucide="play-circle"></i> Full Auto-Patrol Sweep (0➔15km)
          </button>

          <!-- Arm Defect Toggle -->
          <button id="simulate-defect-btn" class="action-btn-sm" style="color:${inspection.defectAtNextCheckpoint ? 'var(--status-critical)' : 'var(--text-main)'}; border-color:${inspection.defectAtNextCheckpoint ? 'var(--status-critical)' : 'var(--border-color)'};" ${isBlocked || isScanning ? 'disabled' : ''}>
            <i data-lucide="triangle-alert"></i> ${inspection.defectAtNextCheckpoint ? 'Defect Armed at Next Checkpoint' : 'Arm Defect on Next Checkpoint'}
          </button>

          <!-- Repair & Re-Certify -->
          <button id="repair-track-btn" class="action-btn-sm" style="color:${isBlocked ? 'var(--status-service)' : 'var(--text-muted)'}; border-color:${isBlocked ? 'var(--status-service)' : 'var(--border-color)'}; font-weight:700;" ${!isBlocked ? 'disabled' : ''}>
            <i data-lucide="wrench"></i> Repair & Re-Certify Track
          </button>

          <!-- Reset Cart -->
          <button id="reset-inspection-btn" class="action-btn-sm">
            <i data-lucide="rotate-ccw"></i> Reset Trolley
          </button>
        </div>
      </div>
    `;
  }

  renderSpeedGovernorCard() {
    const state = this.speedGovernorState || 'FULL';

    return `
      <div class="card speed-governor-card">
        <div class="card-header" style="margin-bottom:0.75rem; padding-bottom:0.5rem;">
          <div class="card-title" style="font-size:0.95rem;">
            <i data-lucide="gauge" style="color:var(--accent-terracotta);"></i> Master Speed Governor & Traction Grid
          </div>
          <span class="brand-badge" style="font-size:0.65rem;">NETWORK GOVERNOR</span>
        </div>

        <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.75rem;">
          Broadcast global speed limits & traction power commands across all 4 operational lines.
        </div>

        <div class="speed-preset-grid">
          <button class="speed-preset-btn ${state === 'FULL' ? 'active' : ''}" data-speed="110" data-state="FULL">
            <i data-lucide="zap" style="width:13px; height:13px;"></i>
            <span>FULL (110 km/h)</span>
          </button>
          <button class="speed-preset-btn ${state === 'CAUTION' ? 'active' : ''}" data-speed="40" data-state="CAUTION">
            <i data-lucide="shield-alert" style="width:13px; height:13px;"></i>
            <span>CAUTION (40 km/h)</span>
          </button>
          <button class="speed-preset-btn ${state === 'WEATHER' ? 'active' : ''}" data-speed="25" data-state="WEATHER">
            <i data-lucide="cloud-rain" style="width:13px; height:13px;"></i>
            <span>WEATHER (25 km/h)</span>
          </button>
          <button class="speed-preset-btn ${state === 'HOLD' ? 'active' : ''}" data-speed="0" data-state="HOLD">
            <i data-lucide="octagon" style="width:13px; height:13px;"></i>
            <span>HOLD (0 km/h)</span>
          </button>
        </div>

        <div class="substation-grid">
          <div class="substation-item">
            <div class="substation-title"><i data-lucide="zap" style="width:12px; height:12px; color:var(--status-service);"></i> Substation Alpha (L1/L2)</div>
            <div class="substation-val">25.1 kV AC <span class="pulse-dot" style="background:var(--status-service); display:inline-block; margin-left:4px;"></span></div>
          </div>
          <div class="substation-item">
            <div class="substation-title"><i data-lucide="zap" style="width:12px; height:12px; color:var(--status-service);"></i> Substation Beta (L3/L4)</div>
            <div class="substation-val">25.3 kV AC <span class="pulse-dot" style="background:var(--status-service); display:inline-block; margin-left:4px;"></span></div>
          </div>
        </div>

        <div style="margin-top:0.75rem; display:flex; gap:0.5rem; justify-content:space-between; align-items:center; flex-wrap:wrap;">
          <button id="balance-fleet-btn" class="action-btn-sm" style="font-size:0.75rem; font-weight:700; color:var(--dark-primary);"><i data-lucide="shuffle"></i> Auto-Balance Fleet Positions</button>
          <span style="font-size:0.72rem; color:var(--text-muted);">Grid Load: <strong>84 MW</strong></span>
        </div>
      </div>
    `;
  }

  renderTrainControlCard(key, title, labelColor) {
    const t = this.calcInputs[key];
    const fleet = this.app.fleet;
    const isDanger = this.inspection.blocked && this.inspection.blockedLine === t.line;

    return `
      <div style="background:var(--bg-secondary); padding:0.85rem; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:1rem; opacity:${t.enabled ? '1' : '0.65'};">
        <div style="font-weight:700; font-size:0.85rem; color:${labelColor}; margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center;">
          <span><i data-lucide="train" style="width:13px; height:13px; inline-size:13px;"></i> ${title} ${!t.enabled ? '(REMOVED)' : ''}</span>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <strong id="${key}-safety-state" style="font-size:0.7rem; color:${isDanger ? 'var(--status-critical)' : 'var(--status-service)'};">${isDanger ? 'DANGER' : 'SAFE'}</strong>
            <span id="${key}-dist-val" style="font-size:0.78rem; color:var(--text-main); font-weight:700;">${t.km.toFixed(1)} km</span>
            
            <label class="switch-toggle" title="Toggle Train Active / Removed from Track">
              <input type="checkbox" id="${key}-enable-toggle" ${t.enabled ? 'checked' : ''}>
              <span class="slider-toggle"></span>
            </label>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:0.5rem; margin-bottom:0.5rem;">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Train ID</label>
            <select id="${key}-select" class="form-select" ${!t.enabled ? 'disabled' : ''}>
              ${fleet.map(item => `<option value="${item.id}" ${item.id === t.id ? 'selected' : ''}>${item.id}</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Line</label>
            <select id="${key}-line" class="form-select" ${!t.enabled ? 'disabled' : ''}>
              <option value="line1" ${t.line === 'line1' ? 'selected' : ''}>Line 1 (North)</option>
              <option value="line2" ${t.line === 'line2' ? 'selected' : ''}>Line 2 (South)</option>
              <option value="line3" ${t.line === 'line3' ? 'selected' : ''}>Line 3 (Inspection Standby)</option>
              <option value="line4" ${t.line === 'line4' ? 'selected' : ''}>Line 4 (Goods Carrier Standby)</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Speed (km/h)</label>
            <input type="number" id="${key}-speed" class="form-input" value="${t.speed}" min="20" max="110" ${!t.enabled ? 'disabled' : ''}>
          </div>
        </div>

        <div class="track-routing-actions">
          <span class="form-label">Go to track</span>
          <button class="action-btn-sm go-track-${key}" data-line="line1">1</button>
          <button class="action-btn-sm go-track-${key}" data-line="line2">2</button>
          <button class="action-btn-sm go-track-${key}" data-line="line3">3 (Inspection)</button>
          <button class="action-btn-sm go-track-${key}" data-line="line4">4 (Goods)</button>
        </div>

        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Position Slider (0.0 ➔ 15.0 km)</label>
          <input type="range" id="${key}-slider" min="0" max="15" step="0.1" value="${t.km}" style="width:100%;" ${!t.enabled ? 'disabled' : ''}>
        </div>

        <div style="display:flex; gap:0.35rem; margin-top:0.4rem;">
          <button class="action-btn-sm quick-jump-${key}" data-km="0.0" ${!t.enabled ? 'disabled' : ''}>Stn A/C (0km)</button>
          <button class="action-btn-sm quick-jump-${key}" data-km="7.5" ${!t.enabled ? 'disabled' : ''}>Mid Line (7.5km)</button>
          <button class="action-btn-sm quick-jump-${key}" data-km="15.0" ${!t.enabled ? 'disabled' : ''}>Stn B/D (15km)</button>
        </div>
      </div>
    `;
  }

  renderAuditLogStream() {
    return this.auditLog.map(log => `
      <div class="audit-item ${log.type}">
        <span class="audit-time">[${log.timestamp}]</span>
        <span class="audit-tag ${log.type}">${log.type.toUpperCase()}</span>
        <span class="audit-text">${log.text}</span>
      </div>
    `).join('');
  }

  getDirectiveState(calcResult) {
    return calcResult.isConflict || this.inspection.blocked ? 'conflict' : 'verified';
  }

  computeHeadwayAdvisory() {
    const lineKeys = ['line1', 'line2', 'line3', 'line4'];
    const trainsByLine = () => {
      const result = { line1: [], line2: [], line3: [], line4: [] };
      Object.keys(this.calcInputs)
        .filter(key => key.startsWith('t'))
        .forEach(key => {
          const train = this.calcInputs[key];
          if (train.enabled && result[train.line]) result[train.line].push(train);
        });
      lineKeys.forEach(line => result[line].sort((a, b) => a.km - b.km));
      return result;
    };

    const getSeparation = trains => {
      if (trains.length < 2) return { separation: 99.0, conflict: false };
      let separation = 99.0;
      for (let index = 1; index < trains.length; index++) {
        separation = Math.min(separation, Math.abs(trains[index].km - trains[index - 1].km));
      }
      return { separation, conflict: separation < 3.5 };
    };

    const blockedLine = this.inspection.blocked ? this.inspection.blockedLine : null;
    let trains = trainsByLine();
    let lineResults = {};
    lineKeys.forEach(line => {
      lineResults[line] = getSeparation(trains[line]);
    });

    let junctionRerouted = false;
    let junctionAdvisory = this.calcInputs.isAutoRerouteEnabled
      ? 'INTERCHANGE SWITCH REROUTE ACTIVE: Automated ATP crossover switch ready for the Line 1 and Line 2 junction.'
      : 'INTERCHANGE SWITCH MANUAL MODE: Direct line switching is controlled via manual controls.';

    if (this.calcInputs.isAutoRerouteEnabled && !blockedLine && lineResults.line1.conflict && trains.line1.length >= 2) {
      const follower = trains.line1[1];
      follower.line = 'line2';
      follower.km = 1.0;
      junctionRerouted = true;
      junctionAdvisory = `AUTOMATED EMERGENCY REROUTE EXECUTED: Train ${follower.id} moved from Line 1 to Line 2 after a ${lineResults.line1.separation.toFixed(1)} km separation conflict.`;
      trains = trainsByLine();
      lineKeys.forEach(line => { lineResults[line] = getSeparation(trains[line]); });
    } else if (this.calcInputs.isAutoRerouteEnabled && !blockedLine && lineResults.line2.conflict && trains.line2.length >= 2) {
      const follower = trains.line2[1];
      follower.line = 'line1';
      follower.km = 1.0;
      junctionRerouted = true;
      junctionAdvisory = `AUTOMATED EMERGENCY REROUTE EXECUTED: Train ${follower.id} moved from Line 2 to Line 1 after a ${lineResults.line2.separation.toFixed(1)} km separation conflict.`;
      trains = trainsByLine();
      lineKeys.forEach(line => { lineResults[line] = getSeparation(trains[line]); });
    }

    const makeAdvisory = line => {
      const lineResult = lineResults[line];
      const lineTrains = trains[line];
      const isBlocked = blockedLine === line;
      const trainNames = lineTrains.map(train => train.id).join(', ') || 'none';
      if (isBlocked) {
        return `TRACK BLOCK ACTIVE: Inspection trolley detected a critical defect at exact coordinate ${this.getLineName(line)} / chainage ${this.inspection.checkpointKm.toFixed(1)} km. All ${this.getLineName(line)} trains (${trainNames}) are held by mandatory ATP interlock.`;
      }
      if (lineResult.conflict) {
        return `CRITICAL BLOCK CONFLICT: ${this.getLineName(line)} has insufficient physical separation of ${lineResult.separation.toFixed(1)} km (< 3.5 km safe threshold). Trains must hold until ATP clears the section.`;
      }
      if (lineTrains.length > 0) {
        return `MOVEMENT AUTHORIZED: ${this.getLineName(line)} operating clear with ${lineTrains.length} active train(s). Safe minimum separation: ${lineResult.separation < 50 ? lineResult.separation.toFixed(1) + ' km' : 'Clear'}.`;
      }
      return `${this.getLineName(line).toUpperCase()} CLEAR: No active trains on ${this.getLineName(line)}.`;
    };

    const result = { isConflict: false, directiveState: 'verified', junctionRerouted, junctionAdvisory };
    lineKeys.forEach(line => {
      const lineBlocked = blockedLine === line;
      result[`${line}Trains`] = trains[line].map(train => train.id);
      result[`${line}Sep`] = lineResults[line].separation;
      result[`${line}InspectionBlocked`] = lineBlocked;
      result[`${line}Conflict`] = lineResults[line].conflict || lineBlocked;
      result[`${line}Advisory`] = makeAdvisory(line);
      result.isConflict = result.isConflict || result[`${line}Conflict`];
    });
    result.directiveState = result.isConflict ? 'conflict' : 'verified';
    return result;
  }

  attachEvents(container) {
    const keys = ['t1', 't2', 't3', 't4', 't5', 't6'];

    const inspectionLine = container.querySelector('#inspection-line');
    const simDefectType = container.querySelector('#sim-defect-type');
    const runInspectionBtn = container.querySelector('#run-inspection-btn');
    const autoPatrolBtn = container.querySelector('#auto-patrol-btn');
    const simulateDefectBtn = container.querySelector('#simulate-defect-btn');
    const repairTrackBtn = container.querySelector('#repair-track-btn');
    const resetInspectionBtn = container.querySelector('#reset-inspection-btn');
    const resetSignalsBtn = container.querySelector('#reset-all-signals-btn');

    if (inspectionLine) {
      inspectionLine.addEventListener('change', (e) => {
        this.inspection.line = e.target.value;
        this.resetInspection(true);
        this.addAuditLog('inspection', `Inspection Trolley relocated to ${this.getLineName(this.inspection.line)}.`);
      });
    }

    if (simDefectType) {
      simDefectType.addEventListener('change', (e) => {
        this.inspection.defectType = e.target.value;
      });
    }

    if (runInspectionBtn) {
      runInspectionBtn.addEventListener('click', () => this.runSingleInspectionStep());
    }

    if (autoPatrolBtn) {
      autoPatrolBtn.addEventListener('click', () => this.runAutoPatrolSweep());
    }

    if (simulateDefectBtn) {
      simulateDefectBtn.addEventListener('click', () => {
        this.inspection.defectAtNextCheckpoint = !this.inspection.defectAtNextCheckpoint;
        const msg = this.inspection.defectAtNextCheckpoint
          ? `Armed ${this.getDefectTypeName(this.inspection.defectType)} defect at next checkpoint.`
          : 'Defect simulation disarmed.';
        this.addAuditLog('warning', msg);
        this.app.render();
      });
    }

    if (repairTrackBtn) {
      repairTrackBtn.addEventListener('click', () => this.repairTrackAndClearDefect());
    }

    if (resetInspectionBtn) {
      resetInspectionBtn.addEventListener('click', () => this.resetInspection(true));
    }

    if (resetSignalsBtn) {
      resetSignalsBtn.addEventListener('click', () => {
        this.repairTrackAndClearDefect();
        this.addAuditLog('info', 'Manual ATP Interlock Reset executed by Operator.');
      });
    }

    // Speed Governor Presets
    const speedPresetBtns = container.querySelectorAll('.speed-preset-btn');
    speedPresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const speed = parseFloat(btn.getAttribute('data-speed'));
        const state = btn.getAttribute('data-state');
        this.speedGovernorState = state;

        keys.forEach(k => {
          if (this.calcInputs[k]) this.calcInputs[k].speed = speed;
        });

        this.addAuditLog('info', `Master Speed Governor set to ${state} (${speed} km/h).`);
        this.app.showNotification(`Master Speed Limit broadcasted: ${speed} km/h across all lines.`, 'info');
        this.app.render();
      });
    });

    // Auto-Balance Fleet Button
    const balanceFleetBtn = container.querySelector('#balance-fleet-btn');
    if (balanceFleetBtn) {
      balanceFleetBtn.addEventListener('click', () => {
        this.calcInputs.t1.line = 'line1'; this.calcInputs.t1.km = 2.0;
        this.calcInputs.t2.line = 'line1'; this.calcInputs.t2.km = 9.0;
        this.calcInputs.t3.line = 'line2'; this.calcInputs.t3.km = 3.0;
        this.calcInputs.t4.line = 'line2'; this.calcInputs.t4.km = 10.0;
        this.calcInputs.t5.line = 'line3'; this.calcInputs.t5.km = 5.0;
        this.calcInputs.t6.line = 'line4'; this.calcInputs.t6.km = 6.0;

        this.addAuditLog('info', 'Auto-Balancing: Fleet units evenly spaced across Lines 1–4.');
        this.app.showNotification('Fleet repositioned for optimal spacing across all lines.', 'success');
        this.app.render();
      });
    }

    keys.forEach(key => {
      const toggle = container.querySelector(`#${key}-enable-toggle`);
      const select = container.querySelector(`#${key}-select`);
      const lineSelect = container.querySelector(`#${key}-line`);
      const speedInput = container.querySelector(`#${key}-speed`);
      const slider = container.querySelector(`#${key}-slider`);
      const quickJumps = container.querySelectorAll(`.quick-jump-${key}`);
      const trackButtons = container.querySelectorAll(`.go-track-${key}`);

      if (toggle) {
        toggle.addEventListener('change', (e) => {
          this.calcInputs[key].enabled = e.target.checked;
          this.addAuditLog('info', `Train ${this.calcInputs[key].id} ${e.target.checked ? 'activated on track' : 'removed from track'}.`);
          this.app.render();
        });
      }

      if (select) {
        select.addEventListener('change', (e) => {
          this.calcInputs[key].id = e.target.value;
          this.updateLiveDOM();
        });
      }

      if (lineSelect) {
        lineSelect.addEventListener('change', (e) => {
          this.moveTrainToLine(key, e.target.value);
        });
      }

      trackButtons.forEach(button => {
        button.addEventListener('click', () => {
          this.moveTrainToLine(key, button.getAttribute('data-line'));
        });
      });

      if (speedInput) {
        speedInput.addEventListener('input', (e) => {
          this.calcInputs[key].speed = parseFloat(e.target.value) || 60;
          this.updateLiveDOM();
        });
      }

      if (slider) {
        slider.addEventListener('input', (e) => {
          this.calcInputs[key].km = parseFloat(e.target.value);
          this.updateLiveDOM();
        });
      }

      quickJumps.forEach(btn => {
        btn.addEventListener('click', () => {
          this.calcInputs[key].km = parseFloat(btn.getAttribute('data-km'));
          this.updateLiveDOM();
        });
      });
    });

    const rerouteBtn = container.querySelector('#toggle-reroute-btn');
    const junctionBadge = container.querySelector('#junction-switch-badge');

    const handleRerouteToggle = () => {
      this.calcInputs.isAutoRerouteEnabled = !this.calcInputs.isAutoRerouteEnabled;
      this.addAuditLog('info', `Emergency Auto Reroute set to ${this.calcInputs.isAutoRerouteEnabled ? 'ENABLED' : 'MANUAL'}.`);
      this.app.render();
    };

    if (rerouteBtn) rerouteBtn.addEventListener('click', handleRerouteToggle);
    if (junctionBadge) junctionBadge.addEventListener('click', handleRerouteToggle);

    const simBtn = container.querySelector('#toggle-sim-btn');
    if (simBtn) {
      simBtn.addEventListener('click', () => {
        this.calcInputs.isSimulating = !this.calcInputs.isSimulating;
        if (this.calcInputs.isSimulating) {
          this.addAuditLog('info', 'Real-time train movement simulation STARTED.');
          this.startSimulation();
        } else {
          this.addAuditLog('info', 'Real-time train movement simulation PAUSED.');
          this.stopSimulation();
        }
        this.updateLiveDOM();
      });
    }
  }

  getDefectTypeName(type) {
    return {
      crack: 'Ultrasound Micro-Crack',
      gauge: 'Track Gauge Shift',
      catenary: 'Catenary Voltage Sag',
      debris: 'Track Obstruction'
    }[type] || 'Track Defect';
  }

  runSingleInspectionStep() {
    if (this.inspection.blocked || this.inspection.checkpointKm >= 14.5 || this.inspection.isScanning) return;

    const startKm = this.inspection.checkpointKm;
    const targetKm = Math.min(15.0, startKm + 2.0);
    this.animateTrolleyMovement(startKm, targetKm, () => {
      this.evaluateCheckpointArrival(targetKm);
    });
  }

  runAutoPatrolSweep() {
    if (this.inspection.blocked || this.inspection.isScanning) return;

    this.inspection.isAutoPatrol = true;
    this.addAuditLog('inspection', `Auto-Patrol sweep launched on ${this.getLineName(this.inspection.line)} from 0.0 km to 15.0 km.`);

    const patrolStep = () => {
      if (this.inspection.blocked || this.inspection.checkpointKm >= 14.5 || !this.inspection.isAutoPatrol) {
        this.inspection.isAutoPatrol = false;
        this.app.render();
        return;
      }

      const startKm = this.inspection.checkpointKm;
      const targetKm = Math.min(15.0, startKm + 2.0);
      this.animateTrolleyMovement(startKm, targetKm, () => {
        const hasDefect = this.evaluateCheckpointArrival(targetKm);
        if (!hasDefect && targetKm < 14.5) {
          setTimeout(patrolStep, 600);
        } else {
          this.inspection.isAutoPatrol = false;
          this.app.render();
        }
      });
    };

    patrolStep();
  }

  animateTrolleyMovement(startKm, targetKm, onComplete) {
    this.inspection.isScanning = true;
    this.updateLiveDOM();

    let current = startKm;
    const durationMs = 1200;
    const startTime = performance.now();

    const animStep = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      this.inspection.checkpointKm = startKm + (targetKm - startKm) * progress;

      // Update telemetry readings dynamically during scan movement
      this.inspection.telemetry.gaugeVariance = `+${(Math.random() * 0.4).toFixed(1)} mm`;
      this.inspection.telemetry.catenaryVoltage = `${(25.0 + Math.random() * 0.4).toFixed(1)} kV`;
      this.inspection.telemetry.vibrationIndex = `${(1.0 + Math.random() * 0.5).toFixed(1)} G`;

      this.updateLiveDOM();

      if (progress < 1) {
        this.inspectionAnimFrame = requestAnimationFrame(animStep);
      } else {
        this.inspection.checkpointKm = targetKm;
        this.inspection.isScanning = false;
        if (onComplete) onComplete();
      }
    };

    this.inspectionAnimFrame = requestAnimationFrame(animStep);
  }

  evaluateCheckpointArrival(checkpointKm) {
    this.inspection.inspectedCheckpoints.push(checkpointKm);

    if (this.inspection.defectAtNextCheckpoint) {
      this.inspection.lastSignal = 'blocked';
      this.inspection.blocked = true;
      this.inspection.blockedLine = this.inspection.line;
      this.inspection.defectAtNextCheckpoint = false;
      this.inspection.defectCoordinate = checkpointKm;

      // Update defect specific telemetry
      if (this.inspection.defectType === 'crack') {
        this.inspection.telemetry.ultrasoundFlaws = 2;
        this.inspection.telemetry.trackIntegrity = 54;
      } else if (this.inspection.defectType === 'gauge') {
        this.inspection.telemetry.gaugeVariance = '+4.8 mm (OUT OF TOLERANCE)';
        this.inspection.telemetry.trackIntegrity = 62;
      } else if (this.inspection.defectType === 'catenary') {
        this.inspection.telemetry.catenaryVoltage = '18.2 kV (SEVERE DROPOUT)';
        this.inspection.telemetry.trackIntegrity = 68;
      } else {
        this.inspection.telemetry.trackIntegrity = 45;
      }

      const defectName = this.getDefectTypeName(this.inspection.defectType);
      this.addAuditLog('critical', `TRACK BLOCK: ${defectName} detected on ${this.getLineName(this.inspection.line)} at chainage ${checkpointKm.toFixed(1)} km! ATP Interlock tripped.`);
      this.app.showNotification(`CRITICAL DEFECT DETECTED: ${defectName} at ${this.getLineName(this.inspection.line)} / chainage ${checkpointKm.toFixed(1)} km. Mandatory ATP Block active.`, 'warning');
      this.app.render();
      return true;
    } else {
      this.inspection.lastSignal = 'verified';
      this.inspection.telemetry.ultrasoundFlaws = 0;
      this.inspection.telemetry.trackIntegrity = 100;

      this.addAuditLog('inspection', `Check sweep verified clear at ${this.getLineName(this.inspection.line)} / ${checkpointKm.toFixed(1)} km.`);
      this.app.showNotification(`Track verified clear at ${checkpointKm.toFixed(1)} km checkpoint.`, 'success');
      this.app.render();
      return false;
    }
  }

  repairTrackAndClearDefect() {
    this.inspection.blocked = false;
    this.inspection.blockedLine = null;
    this.inspection.lastSignal = 'verified';
    this.inspection.defectAtNextCheckpoint = false;
    this.inspection.defectCoordinate = null;

    this.inspection.telemetry = {
      ultrasoundFlaws: 0,
      gaugeVariance: '+0.1 mm',
      catenaryVoltage: '25.2 kV',
      vibrationIndex: '1.1 G',
      trackIntegrity: 100,
      batteryLevel: 98,
      cameraStatus: 'HD OPTICAL STREAM OK'
    };

    this.addAuditLog('info', `Track repair & re-certification completed for ${this.getLineName(this.inspection.line)}. ATP block lifted.`);
    this.app.showNotification(`Track repaired and re-certified! ATP movement authority restored.`, 'success');
    this.app.render();
  }

  resetInspection(renderApp = true) {
    if (this.inspectionAnimFrame) {
      cancelAnimationFrame(this.inspectionAnimFrame);
      this.inspectionAnimFrame = null;
    }

    this.inspection.checkpointKm = 0.0;
    this.inspection.targetKm = 0.0;
    this.inspection.isScanning = false;
    this.inspection.isAutoPatrol = false;
    this.inspection.lastSignal = 'verified';
    this.inspection.blocked = false;
    this.inspection.blockedLine = null;
    this.inspection.defectAtNextCheckpoint = false;
    this.inspection.defectCoordinate = null;
    this.inspection.inspectedCheckpoints = [];

    this.inspection.telemetry = {
      ultrasoundFlaws: 0,
      gaugeVariance: '+0.1 mm',
      catenaryVoltage: '25.2 kV',
      vibrationIndex: '1.1 G',
      trackIntegrity: 100,
      batteryLevel: 98,
      cameraStatus: 'HD OPTICAL STREAM OK'
    };

    if (renderApp) this.app.render();
  }

  updateLiveDOM() {
    const calcResult = this.computeHeadwayAdvisory();
    this.hasConflict = calcResult.isConflict;
    this.advisoryResult = calcResult;

    // 1. Update Header Safety Shield Status Badge
    this.app.updateSafetyShieldStatus(this.getDirectiveState(calcResult));

    // 2. Update Map Pin Markers for 6 Active Trains
    const keys = ['t1', 't2', 't3', 't4', 't5', 't6'];
    keys.forEach(key => {
      const t = this.calcInputs[key];
      const percent = Math.min(100, Math.max(0, (t.km / 15.0) * 100));

      const pinNode = document.querySelector(`#${key}-map-pin`);
      const pinLabel = document.querySelector(`#${key}-pin-label`);
      const slider = document.querySelector(`#${key}-slider`);
      const distVal = document.querySelector(`#${key}-dist-val`);
      const lineSelect = document.querySelector(`#${key}-line`);
      const safetyState = document.querySelector(`#${key}-safety-state`);
      const pinPill = document.querySelector(`#${key}-pin-pill`);
      const isDanger = this.inspection.blocked && t.line === this.inspection.blockedLine;

      if (pinNode) {
        pinNode.style.left = `${percent}%`;
        pinNode.style.top = this.getLineTopOffset(t.line);
        pinNode.className = `train-map-pin ${this.getLineTopClass(t.line)}`;
        pinNode.style.display = t.enabled ? 'flex' : 'none';
      }

      if (pinLabel) pinLabel.innerText = `${isDanger ? '⚠ DANGER ' : '📍 '}${t.id}: ${t.km.toFixed(1)} km`;
      if (pinPill) pinPill.className = `pin-badge-pill${isDanger ? ' conflict' : ''}`;
      if (safetyState) {
        safetyState.innerText = isDanger ? 'DANGER' : 'SAFE';
        safetyState.style.color = isDanger ? 'var(--status-critical)' : 'var(--status-service)';
      }
      if (slider) slider.value = t.km;
      if (distVal) distVal.innerText = `${t.km.toFixed(1)} km`;
      if (lineSelect) lineSelect.value = t.line;
    });

    // 3. Update Inspection Trolley Map Pin
    const trolleyPin = document.querySelector('#trolley-map-pin');
    const trolleyLabel = document.querySelector('#trolley-pin-label');
    const trolleyPill = document.querySelector('#trolley-pin-pill');
    if (trolleyPin) {
      const percent = Math.min(100, Math.max(0, (this.inspection.checkpointKm / 15.0) * 100));
      trolleyPin.style.left = `${percent}%`;
      trolleyPin.style.top = this.getLineTopOffset(this.inspection.line);
      trolleyPin.className = `train-map-pin ${this.getLineTopClass(this.inspection.line)} inspection-trolley-pin`;
    }
    if (trolleyLabel) trolleyLabel.innerText = `TROLLEY IT-01: ${this.inspection.checkpointKm.toFixed(1)} km`;
    if (trolleyPill) {
      trolleyPill.className = `pin-badge-pill trolley-pill ${this.inspection.blocked ? 'conflict' : this.inspection.isScanning ? 'scanning' : ''}`;
    }

    // 4. Update Line Status Text Chips
    const line1Status = document.querySelector('#line1-status-text');
    if (line1Status) {
      line1Status.style.color = calcResult.line1Conflict ? 'var(--status-critical)' : 'var(--status-service)';
      line1Status.innerText = calcResult.line1Conflict
        ? `BLOCKED (${calcResult.line1Trains.join(', ') || 'No active trains'})`
        : calcResult.line1Trains.length > 0 ? `Occupied (${calcResult.line1Trains.join(', ')})` : 'Clear / Unoccupied';
    }

    const line2Status = document.querySelector('#line2-status-text');
    if (line2Status) {
      line2Status.style.color = calcResult.line2Conflict ? 'var(--status-critical)' : 'var(--status-service)';
      line2Status.innerText = calcResult.line2Conflict
        ? `BLOCKED (${calcResult.line2Trains.join(', ') || 'No active trains'})`
        : calcResult.line2Trains.length > 0 ? `Occupied (${calcResult.line2Trains.join(', ')})` : 'Clear / Unoccupied';
    }

    ['line3', 'line4'].forEach(line => {
      const status = document.querySelector(`#${line}-status-text`);
      if (!status) return;
      const trains = calcResult[`${line}Trains`];
      const blocked = calcResult[`${line}Conflict`];
      status.style.color = blocked ? 'var(--status-critical)' : 'var(--status-service)';
      status.innerText = blocked
        ? `BLOCKED (${trains.join(', ') || 'No active trains'})`
        : trains.length > 0 ? `Occupied (${trains.join(', ')})` : 'Clear / Unoccupied';
    });

    // 5. Update Line Advisory Boxes
    ['line1', 'line2', 'line3', 'line4'].forEach(line => {
      const box = document.querySelector(`#${line}-advisory-box`);
      const title = document.querySelector(`#${line}-advisory-title`);
      const body = document.querySelector(`#${line}-advisory-body`);
      const active = document.querySelector(`#${line}-active-names`);
      const separation = document.querySelector(`#${line}-sep-val`);
      const conflict = calcResult[`${line}Conflict`];

      if (box) box.className = `advisory-box ${conflict ? 'conflict' : 'verified'}`;
      if (title) title.style.color = conflict ? 'var(--status-critical)' : 'var(--status-service)';
      if (body) body.innerText = calcResult[`${line}Advisory`];
      if (active) active.innerText = calcResult[`${line}Trains`].length > 0 ? calcResult[`${line}Trains`].join(', ') : 'None';
      if (separation) separation.innerText = calcResult[`${line}Sep`] < 50 ? `${calcResult[`${line}Sep`].toFixed(1)} km` : 'Clear';
    });

    // 6. Update Emergency Reroute Interchange Switch Safety Box
    const juncBox = document.querySelector('#junction-advisory-box');
    const juncTitle = document.querySelector('#junction-advisory-title');
    const juncBody = document.querySelector('#junction-advisory-body');
    if (juncBox) juncBox.className = `advisory-box ${calcResult.junctionRerouted ? 'conflict' : 'verified'}`;
    if (juncTitle) juncTitle.style.color = calcResult.junctionRerouted ? 'var(--accent-terracotta)' : 'var(--status-service)';
    if (juncBody) juncBody.innerText = calcResult.junctionAdvisory;

    // 7. Update Telemetry HUD Elements
    const hudFlaws = document.querySelector('#hud-flaws');
    const hudGauge = document.querySelector('#hud-gauge');
    const hudCatenary = document.querySelector('#hud-catenary');
    const hudIntegrity = document.querySelector('#hud-integrity');

    if (hudFlaws) {
      hudFlaws.innerText = `${this.inspection.telemetry.ultrasoundFlaws} detected`;
      hudFlaws.style.color = this.inspection.telemetry.ultrasoundFlaws > 0 ? 'var(--status-critical)' : 'var(--status-service)';
    }
    if (hudGauge) hudGauge.innerText = this.inspection.telemetry.gaugeVariance;
    if (hudCatenary) hudCatenary.innerText = this.inspection.telemetry.catenaryVoltage;
    if (hudIntegrity) {
      hudIntegrity.innerText = `${this.inspection.telemetry.trackIntegrity}%`;
      hudIntegrity.style.color = this.inspection.telemetry.trackIntegrity < 80 ? 'var(--status-critical)' : 'var(--status-service)';
    }

    // 8. Update Inspection Cart Checkpoint Progress DOM
    this.updateInspectionDOM();
  }

  updateInspectionDOM() {
    const inspection = this.inspection;
    const isBlocked = inspection.blocked;
    const isScanning = inspection.isScanning;
    const signalColor = isBlocked ? 'var(--status-critical)' : 'var(--status-service)';
    const signalText = isBlocked ? 'TRACK DEFECT BLOCK' : isScanning ? 'PATROL SCAN IN PROGRESS' : 'TRACK CERTIFIED OK';

    const signal = document.querySelector('#inspection-signal');
    const signalTextEl = document.querySelector('#inspection-signal-text');
    const nextCheckpoint = document.querySelector('#inspection-next-checkpoint');
    const progress = document.querySelector('#inspection-progress');
    const checkedList = document.querySelector('#inspection-checked-list');
    const defectCoordinate = document.querySelector('#inspection-defect-coordinate');

    const runButton = document.querySelector('#run-inspection-btn');
    const autoPatrolBtn = document.querySelector('#auto-patrol-btn');
    const repairTrackBtn = document.querySelector('#repair-track-btn');

    if (signal) {
      signal.style.color = signalColor;
      signal.style.borderColor = signalColor;
      signal.style.background = isBlocked ? 'var(--status-critical-bg)' : 'var(--status-service-bg)';
    }
    if (signalTextEl) signalTextEl.innerText = signalText;
    if (nextCheckpoint) nextCheckpoint.innerText = inspection.checkpointKm >= 14.5 ? 'Terminal at 15.0 km' : `${(inspection.checkpointKm + 2).toFixed(1)} km Checkpoint`;
    if (progress) progress.style.width = `${Math.min(100, (inspection.checkpointKm / 15.0) * 100)}%`;
    if (checkedList) {
      checkedList.innerText = inspection.inspectedCheckpoints.length > 0
        ? inspection.inspectedCheckpoints.map(km => `${km.toFixed(1)} km`).join(', ')
        : 'None yet';
    }
    if (defectCoordinate) {
      defectCoordinate.innerText = isBlocked
        ? `${this.getLineName(inspection.line)} / chainage ${inspection.checkpointKm.toFixed(1)} km`
        : 'No defect recorded';
      defectCoordinate.style.color = isBlocked ? 'var(--status-critical)' : 'var(--text-muted)';
    }

    if (runButton) runButton.disabled = isBlocked || isScanning || inspection.checkpointKm >= 14.5;
    if (autoPatrolBtn) autoPatrolBtn.disabled = isBlocked || isScanning || inspection.checkpointKm >= 14.5;
    if (repairTrackBtn) repairTrackBtn.disabled = !isBlocked;
  }

  updateAuditLogDOM() {
    const stream = document.querySelector('#audit-log-stream');
    if (stream) {
      stream.innerHTML = this.renderAuditLogStream();
    }
  }

  startSimulation() {
    this.stopSimulation();
    this.lastFrameTime = performance.now();

    const animate = (now) => {
      if (!this.calcInputs.isSimulating) return;

      const deltaSec = Math.min((now - this.lastFrameTime) / 1000.0, 0.1);
      this.lastFrameTime = now;

      const keys = ['t1', 't2', 't3', 't4', 't5', 't6'];
      keys.forEach(key => {
        const t = this.calcInputs[key];
        if (!t.enabled || (this.inspection.blocked && t.line === this.inspection.blockedLine)) return;

        t.km += (t.speed / 3600) * deltaSec * 80.0;

        if (t.km >= 15.0) {
          t.km = 0.0;
        }
      });

      this.updateLiveDOM();
      this.simAnimFrame = requestAnimationFrame(animate);
    };

    this.simAnimFrame = requestAnimationFrame(animate);
  }

  stopSimulation() {
    if (this.simAnimFrame) {
      cancelAnimationFrame(this.simAnimFrame);
      this.simAnimFrame = null;
    }
  }
}
