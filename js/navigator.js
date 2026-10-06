// CarePulse HMS - Universal System Navigator & Project Tracker
// Shows active page, switchable portals, and roadmap tracking ("kya bacha hua hai")

(function() {
  const PAGES_CONFIG = [
    {
      category: "Patient & Customer Portals",
      desc: "Public-facing website, appointment booking, and patient health locker",
      icon: "bi-person-heart",
      items: [
        { file: "landing.html", title: "Customer Landing Page", badge: "Public", desc: "Hero booking widget, 14 specialties, doctor roster, cashless insurance", status: "completed" },
        { file: "user_portal.html", title: "Patient Health Portal", badge: "Patient", desc: "ABHA Card, active E-Prescriptions, lab reports, pill tracker, bills", status: "completed" },
        { file: "patient_portal.html", title: "ABDM Health Locker", badge: "Patient", desc: "Ayushman Bharat digital locker & past consult history", status: "completed" }
      ]
    },
    {
      category: "Hospital Admin & Clinical Operations",
      desc: "Front desk, clinical EMR, wards, diagnostics, pharmacy, and billing",
      icon: "bi-hospital",
      items: [
        { file: "dashboard.html", title: "Executive Dashboard", badge: "Admin", desc: "500-bed campus metrics, live admissions, revenue analytics", status: "completed" },
        { file: "reception.html", title: "Reception & Registration", badge: "Admin", desc: "Patient intake, UHID issuance, doctor token queue", status: "completed" },
        { file: "emergency.html", title: "Emergency & Trauma Triage", badge: "Clinical", desc: "24x7 Manchester Triage (Red/Yellow/Green), resuscitation bays", status: "completed" },
        { file: "doctor_emr.html", title: "Doctor Clinical EMR", badge: "Clinical", desc: "ICD-10 diagnosis, vitals monitoring, digital E-Prescription (E-Rx)", status: "completed" },
        { file: "ipd_beds.html", title: "Inpatient Bed Matrix", badge: "Operations", desc: "ICU, General Ward, Deluxe Rooms with live occupancy", status: "completed" },
        { file: "operation_theatre.html", title: "Operation Theatre (OT)", badge: "Operations", desc: "Surgical roster, surgeon/anesthesia allocation, PAC clearance", status: "completed" },
        { file: "laboratory.html", title: "Laboratory & Diagnostics", badge: "Diagnostics", desc: "Specimen barcoding, NABL test processing, PDF reports", status: "completed" },
        { file: "blood_bank.html", title: "Blood Bank & Inventory", badge: "Diagnostics", desc: "ABO/Rh inventory, cross-match, temperature alarm logs", status: "completed" },
        { file: "pharmacy.html", title: "Pharmacy POS & Stocks", badge: "Operations", desc: "Prescription dispensing, batch expiry tracking, inventory re-order", status: "completed" },
        { file: "billing.html", title: "Billing & Cashless TPA", badge: "Finance", desc: "Consolidated ledger, Star Health cashless claim settlement", status: "completed" },
        { file: "discharge.html", title: "Discharge & Gate Pass", badge: "Operations", desc: "Multi-department clearance checklist, no-dues certificate", status: "completed" }
      ]
    },
    {
      category: "Presentation & Architecture Tools",
      desc: "Interactive demonstration flows and technical presentation decks",
      icon: "bi-easel",
      items: [
        { file: "requirements.html", title: "Requirements & Timeline UI", badge: "Explorer", desc: "Interactive hardware specs, roles RBAC, and 8-step patient timeline", status: "completed" },
        { file: "index.html", title: "Interactive Figma Flow", badge: "Overview", desc: "End-to-end architecture map, operational flows, database schemas", status: "completed" },
        { file: "slides.html", title: "Team Slide Deck", badge: "Slides", desc: "Fullscreen presentation slides for team and stakeholder meetings", status: "completed" },
        { file: "hms_app.html", title: "All-in-One Prototype", badge: "Prototype", desc: "Single-page application prototype uniting core departments", status: "completed" }
      ]
    }
  ];

  const ROADMAP = [
    { name: "Frontend UI Screens (14 Pages)", status: "Done (100%)", type: "success", detail: "Clean white design, Bootstrap 5.3, Plus Jakarta Sans, print styles" },
    { name: "Mobile Responsive Engine", status: "Done (100%)", type: "success", detail: "iPhone 16 (393px) tested, offcanvas drawer, touch bottom nav" },
    { name: "Universal Navigation & Cross-Linking", status: "Done (100%)", type: "success", detail: "All buttons route to working destination pages and user portal" },
    { name: "Backend REST API Endpoints", status: "Upcoming Phase 2", type: "warning", detail: "Node.js (Express) or Python (FastAPI) microservices" },
    { name: "PostgreSQL Database & Realtime Sync", status: "Upcoming Phase 2", type: "warning", detail: "Relational patient records, Redis live token queue counters" },
    { name: "SMS & WhatsApp Notification Gateway", status: "Upcoming Phase 2", type: "warning", detail: "Automated OTP, appointment reminder slips, PDF report links" },
    { name: "Biometric & Hospital Hardware Integration", status: "Upcoming Phase 3", type: "secondary", detail: "Barcode barcode scanners, thermal bill printers, ABHA ABDM M1/M2" }
  ];

  function getCurrentFile() {
    const raw = window.location.pathname.split('/').pop() || 'dashboard.html';
    return raw.split('?')[0].split('#')[0] || 'dashboard.html';
  }

  function getPageInfo(filename) {
    for (const cat of PAGES_CONFIG) {
      for (const item of cat.items) {
        if (item.file.toLowerCase() === filename.toLowerCase()) {
          return { item, cat };
        }
      }
    }
    return {
      item: { file: filename, title: "CarePulse Screen", badge: "Portal", desc: "Active Hospital Screen", status: "completed" },
      cat: { category: "Hospital Portal", icon: "bi-hospital" }
    };
  }

  function ensureFavicon() {
    if (!document.querySelector('link[rel="icon"]')) {
      const fav = document.createElement('link');
      fav.rel = 'icon';
      fav.type = 'image/svg+xml';
      fav.href = 'favicon.svg';
      document.head.appendChild(fav);
    }
  }

  function initNavigator() {
    ensureFavicon();
    const currentFile = getCurrentFile();
    const currentInfo = getPageInfo(currentFile);

    injectHeaderButton(currentInfo);
    injectModalHTML(currentFile, currentInfo);
  }

  function injectHeaderButton(currentInfo) {
    if (document.getElementById('carepulseNavigatorTrigger')) return;

    // Detect where to inject
    const topbar = document.querySelector('.topbar');
    const landingNav = document.querySelector('.landing-nav .container');
    const navBarCollapse = document.querySelector('.landing-nav .navbar-collapse');

    const triggerBtn = document.createElement('button');
    triggerBtn.id = 'carepulseNavigatorTrigger';
    triggerBtn.type = 'button';
    triggerBtn.className = 'btn btn-sm btn-outline-primary fw-semibold d-inline-flex align-items-center gap-1 shadow-sm';
    triggerBtn.style.borderRadius = '20px';
    triggerBtn.style.padding = '4px 10px';
    triggerBtn.style.fontSize = '12px';
    triggerBtn.title = 'CarePulse System Navigator (Click to view all pages & status)';

    triggerBtn.innerHTML = `
      <i class="bi bi-compass-fill text-primary" style="font-size: 13px;"></i>
      <span class="d-none d-lg-inline text-muted" style="font-size: 11px;">Current:</span>
      <span class="fw-bold text-dark text-truncate" style="max-width: 140px;">${currentInfo.item.title}</span>
      <span class="badge bg-primary text-white" style="font-size: 9.5px; padding: 2px 5px; border-radius: 10px;">${currentInfo.item.badge}</span>
      <i class="bi bi-chevron-down ms-1" style="font-size: 10px; color: #64748b;"></i>
    `;

    triggerBtn.addEventListener('click', openNavigatorModal);

    if (topbar) {
      // Find right button group or append
      const rightGroup = topbar.querySelector('div:last-child');
      if (rightGroup) {
        rightGroup.prepend(triggerBtn);
      } else {
        topbar.appendChild(triggerBtn);
      }
    } else if (landingNav) {
      const actionsGroup = landingNav.querySelector('.d-flex.align-items-center.gap-2') || navBarCollapse;
      if (actionsGroup) {
        actionsGroup.prepend(triggerBtn);
      } else {
        landingNav.appendChild(triggerBtn);
      }
    } else {
      // Floating button for slides.html or index.html
      triggerBtn.style.position = 'fixed';
      triggerBtn.style.top = '14px';
      triggerBtn.style.right = '14px';
      triggerBtn.style.zIndex = '9999';
      triggerBtn.style.background = '#ffffff';
      triggerBtn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
      document.body.appendChild(triggerBtn);
    }
  }

  function injectModalHTML(currentFile, currentInfo) {
    if (document.getElementById('carepulseNavigatorBackdrop')) return;

    // Build Backdrop & Modal
    const wrapper = document.createElement('div');
    wrapper.id = 'carepulseNavigatorBackdrop';
    wrapper.style.display = 'none';
    wrapper.style.position = 'fixed';
    wrapper.style.inset = '0';
    wrapper.style.backgroundColor = 'rgba(15, 23, 42, 0.65)';
    wrapper.style.backdropFilter = 'blur(4px)';
    wrapper.style.zIndex = '10000';
    wrapper.style.overflowY = 'auto';
    wrapper.style.padding = '16px';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';

    let categoriesHtml = '';
    for (const cat of PAGES_CONFIG) {
      let itemsHtml = '';
      for (const item of cat.items) {
        const isCurrent = item.file.toLowerCase() === currentFile.toLowerCase();
        itemsHtml += `
          <div class="col-md-6 col-lg-4">
            <a href="${item.file}" class="card h-100 text-decoration-none ${isCurrent ? 'border-primary shadow' : 'border'}" style="border-radius: 12px; transition: transform 0.15s, border-color 0.15s; background: ${isCurrent ? '#f0f9ff' : '#ffffff'};">
              <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start mb-1">
                  <span class="badge ${isCurrent ? 'bg-primary text-white' : 'bg-light text-dark border'}" style="font-size: 10px;">${item.badge}</span>
                  ${isCurrent ? '<span class="badge bg-success-subtle text-success border border-success-subtle" style="font-size: 10px;"><i class="bi bi-geo-alt-fill me-1"></i>Active Screen</span>' : '<span class="text-primary small fw-semibold" style="font-size: 11px;">Open ➔</span>'}
                </div>
                <h6 class="fw-bold ${isCurrent ? 'text-primary' : 'text-dark'} mb-1" style="font-size: 13.5px;">${item.title}</h6>
                <p class="text-muted mb-0" style="font-size: 11.5px; line-height: 1.4;">${item.desc}</p>
              </div>
            </a>
          </div>
        `;
      }

      categoriesHtml += `
        <div class="mb-4">
          <div class="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom">
            <i class="bi ${cat.icon} text-primary fs-5"></i>
            <h6 class="fw-bold text-dark m-0" style="font-size: 14.5px;">${cat.category}</h6>
            <span class="text-muted small ms-auto d-none d-sm-inline" style="font-size: 11.5px;">${cat.desc}</span>
          </div>
          <div class="row g-2">
            ${itemsHtml}
          </div>
        </div>
      `;
    }

    let roadmapHtml = '';
    for (const r of ROADMAP) {
      const isDone = r.status.includes('Done');
      roadmapHtml += `
        <div class="d-flex align-items-center justify-content-between p-2 rounded-2 mb-1 ${isDone ? 'bg-success-subtle' : 'bg-light border'}">
          <div class="d-flex align-items-center gap-2" style="min-width: 0;">
            <i class="bi ${isDone ? 'bi-check-circle-fill text-success' : 'bi-hourglass-split text-warning'} fs-6 flex-shrink-0"></i>
            <div class="text-truncate">
              <strong class="d-block text-dark text-truncate" style="font-size: 12.5px;">${r.name}</strong>
              <small class="text-muted text-truncate d-none d-sm-inline" style="font-size: 11px;">${r.detail}</small>
            </div>
          </div>
          <span class="badge ${isDone ? 'bg-success text-white' : 'bg-warning text-dark'} flex-shrink-0 ms-2" style="font-size: 10px;">${r.status}</span>
        </div>
      `;
    }

    wrapper.innerHTML = `
      <div class="modal-dialog modal-xl" style="max-width: 960px; margin: auto; pointer-events: auto;">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; overflow: hidden; background: #ffffff;">
          
          <!-- Modal Header -->
          <div class="modal-header px-4 py-3 border-bottom d-flex align-items-center justify-content-between bg-white sticky-top">
            <div>
              <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; font-size: 14px;">
                  <i class="bi bi-compass"></i>
                </div>
                <div>
                  <h5 class="fw-bold text-dark m-0" style="font-size: 16px;">CarePulse System Navigator & Page Tracker</h5>
                  <div class="text-muted small" style="font-size: 11.5px;">
                    Currently Viewing: <strong class="text-primary">${currentInfo.item.title}</strong> (${currentFile}) &bull; Category: <strong>${currentInfo.cat.category}</strong>
                  </div>
                </div>
              </div>
            </div>
            <button type="button" class="btn-close" id="carepulseNavigatorCloseBtn" aria-label="Close"></button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body p-4" style="max-height: 80vh; overflow-y: auto;">
            
            <!-- Executive Summary Card -->
            <div class="card border-0 mb-4" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; border-radius: 14px; padding: 20px;">
              <div class="row align-items-center g-3">
                <div class="col-md-7">
                  <span class="badge bg-white text-primary fw-bold mb-2">Frontend Sprint Status: Ready for Demo</span>
                  <h4 class="fw-bold mb-1" style="font-size: 20px;">CarePulse Hospital Management System</h4>
                  <p class="mb-0 text-white-50" style="font-size: 12.5px;">
                    All 14 core HTML screens are fully functional, linked, and tested across desktop and mobile (iPhone 16) screens.
                  </p>
                </div>
                <div class="col-md-5 text-md-end">
                  <div class="bg-white text-dark p-3 rounded-3 shadow-sm d-inline-block text-start w-100 w-md-auto">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="small fw-bold text-muted text-uppercase" style="font-size: 10.5px;">UI Development</span>
                      <strong class="text-success" style="font-size: 12px;">14 / 14 Complete (100%)</strong>
                    </div>
                    <div class="progress mb-2" style="height: 6px;">
                      <div class="progress-bar bg-success" role="progressbar" style="width: 100%"></div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="small text-muted" style="font-size: 11px;">Total Project (UI + APIs + DB):</span>
                      <strong class="text-primary" style="font-size: 11.5px;">Phase 1 Ready</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Page Switcher Grid -->
            ${categoriesHtml}

            <!-- Roadmap Section: Kya Kya Bacha Hua Hai -->
            <div class="mt-4 pt-3 border-top">
              <div class="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h6 class="fw-bold text-dark m-0" style="font-size: 14.5px;">
                    <i class="bi bi-kanban text-primary me-2"></i>System Progress & Roadmap (Kya Kya Bacha Hua Hai)
                  </h6>
                  <span class="text-muted small" style="font-size: 11.5px;">Status breakdown for technical team presentation</span>
                </div>
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle">Phase 1 Frontend Complete</span>
              </div>
              
              <div class="row g-2">
                <div class="col-12">
                  ${roadmapHtml}
                </div>
              </div>
            </div>

          </div>

          <!-- Modal Footer -->
          <div class="modal-footer px-4 py-2 border-top bg-light d-flex justify-content-between align-items-center">
            <span class="text-muted small" style="font-size: 11px;">
              Tip: Press <kbd class="bg-white text-dark border">Alt</kbd> + <kbd class="bg-white text-dark border">N</kbd> or click the compass button anytime to open this navigator.
            </span>
            <button type="button" class="btn btn-secondary btn-sm px-3 fw-semibold" id="carepulseNavigatorCloseBtnBottom">Close Navigator</button>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(wrapper);

    // Event listeners
    document.getElementById('carepulseNavigatorCloseBtn').addEventListener('click', closeNavigatorModal);
    document.getElementById('carepulseNavigatorCloseBtnBottom').addEventListener('click', closeNavigatorModal);
    wrapper.addEventListener('click', (e) => {
      if (e.target === wrapper) closeNavigatorModal();
    });

    // Keyboard shortcut Alt+N
    document.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        toggleNavigatorModal();
      }
      if (e.key === 'Escape' && wrapper.style.display === 'flex') {
        closeNavigatorModal();
      }
    });
  }

  function openNavigatorModal() {
    const backdrop = document.getElementById('carepulseNavigatorBackdrop');
    if (backdrop) {
      backdrop.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  function closeNavigatorModal() {
    const backdrop = document.getElementById('carepulseNavigatorBackdrop');
    if (backdrop) {
      backdrop.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  function toggleNavigatorModal() {
    const backdrop = document.getElementById('carepulseNavigatorBackdrop');
    if (backdrop) {
      if (backdrop.style.display === 'flex') {
        closeNavigatorModal();
      } else {
        openNavigatorModal();
      }
    }
  }

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigator);
  } else {
    initNavigator();
  }
})();
