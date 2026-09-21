/* Rail Nexus - Data Store & Dataset Generator for 40 Trains (T01-T40) */

export const INITIAL_FLEET = generateFleetData();

function generateFleetData() {
  const fleet = [];
  const sponsors = ['Apex Metro Ads', 'Nova Logistics', 'TechRail Global', 'EcoTransit Inc', 'Urban Mobility Co', 'Skyline Media'];

  for (let i = 1; i <= 40; i++) {
    const idNum = i < 10 ? `0${i}` : `${i}`;
    const trainId = `T${idNum}`;

    // Base document states to reflect realistic fleet scenarios
    let fitnessStatus = 'valid';
    let maximoStatus = 'valid';
    let cleaningStatus = 'valid';
    let brandingStatus = 'valid';

    // Inject realistic edge-case variations across T01-T40
    if (i === 4 || i === 18 || i === 31) {
      fitnessStatus = 'expired';
    } else if (i === 9 || i === 22) {
      fitnessStatus = 'missing';
    }

    if (i === 7 || i === 14 || i === 29) {
      maximoStatus = 'warning';
    } else if (i === 35) {
      maximoStatus = 'missing';
    }

    if (i === 11 || i === 26 || i === 38) {
      cleaningStatus = 'expired';
    }

    if (i === 15 || i === 33) {
      brandingStatus = 'expired';
    } else if (i === 40) {
      brandingStatus = 'missing';
    }

    // Determine default AI Induction Allocation
    let defaultInduction = 'revenue';
    let reasoningText = '';

    const hasCriticalFail = fitnessStatus === 'expired' || fitnessStatus === 'missing' || maximoStatus === 'missing';
    const hasMinorWarning = maximoStatus === 'warning' || cleaningStatus === 'expired';

    if (hasCriticalFail) {
      defaultInduction = 'maintenance';
      reasoningText = `Assigned to Depot Maintenance: Critical compliance flag (${fitnessStatus === 'expired' ? 'Expired Fitness Cert' : 'Missing Maintenance Job Card'}).`;
    } else if (hasMinorWarning || i % 6 === 0) {
      if (i > 30) {
        defaultInduction = 'maintenance';
        reasoningText = `Assigned to Depot Maintenance: Scheduled high-mileage inspection and Maximo job card servicing.`;
      } else {
        defaultInduction = 'standby';
        reasoningText = `Assigned to Standby: Minor document check required (${cleaningStatus === 'expired' ? 'Cleaning Log Renewal' : 'Maximo Servicing'}). Ready for quick deployment.`;
      }
    } else {
      defaultInduction = 'revenue';
      reasoningText = `Selected for Revenue Service: Fitness certified, Maximo job card active, sanitization complete, mileage balanced.`;
    }

    // Calculate overall document compliance score & tag
    let overallDocTag = 'valid';
    if (fitnessStatus === 'expired' || maximoStatus === 'expired' || cleaningStatus === 'expired' || brandingStatus === 'expired') {
      overallDocTag = 'expired';
    } else if (fitnessStatus === 'missing' || maximoStatus === 'missing' || cleaningStatus === 'missing' || brandingStatus === 'missing') {
      overallDocTag = 'missing';
    } else if (maximoStatus === 'warning') {
      overallDocTag = 'warning';
    }

    // Default station locations for traffic map visualization
    let station = 'Station A';
    let offsetKm = 0;
    if (i === 1 || i === 5) { station = 'Station A'; offsetKm = 3.5; }
    else if (i === 2 || i === 8) { station = 'Station B'; offsetKm = 14.2; }
    else if (i === 3 || i === 12) { station = 'Station C'; offsetKm = 28.0; }
    else if (i === 9 || i === 10) { station = 'Station A'; offsetKm = 8.0; }

    fleet.push({
      id: trainId,
      name: `Rapid Transit Unit ${trainId}`,
      documents: {
        fitness: {
          status: fitnessStatus,
          certNo: `FC-2026-${8000 + i}`,
          validUntil: fitnessStatus === 'expired' ? '2026-08-15' : '2026-12-31'
        },
        maximo: {
          status: maximoStatus,
          jobId: `MX-JOB-${45000 + i}`,
          lastServiced: '2026-08-10'
        },
        cleaning: {
          status: cleaningStatus,
          sanitizedAt: '2026-08-21 04:30 AM'
        },
        branding: {
          status: brandingStatus,
          sponsor: sponsors[i % sponsors.length],
          contractId: `BC-${1000 + i}`
        }
      },
      overallDocTag: overallDocTag,
      induction: defaultInduction,
      aiReasoning: reasoningText,
      isOverridden: false,
      overrideReason: '',
      mileageKm: 12400 + (i * 380),
      currentLocation: {
        station: station,
        offsetKm: offsetKm,
        speedKmh: defaultInduction === 'revenue' ? 65 : 0
      }
    });
  }

  return fleet;
}
