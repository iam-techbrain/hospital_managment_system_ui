// CarePulse HMS - Universal Mobile Navigation & Touch Interaction Engine
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  const topbar = document.querySelector('.topbar');
  if (!sidebar) return;

  // 1. Create or ensure mobile toggle button in topbar
  if (topbar && !document.querySelector('.btn-mobile-toggle')) {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn-mobile-toggle me-2';
    toggleBtn.innerHTML = '<i class="bi bi-list"></i>';
    toggleBtn.title = 'Open Menu';

    const firstElem = topbar.querySelector('.d-flex') || topbar.firstChild;
    if (firstElem) {
      firstElem.prepend(toggleBtn);
    } else {
      topbar.prepend(toggleBtn);
    }

    toggleBtn.addEventListener('click', toggleMobileSidebar);
  }

  // 2. Ensure close button inside sidebar header
  const sidebarBrand = document.querySelector('.sidebar-brand');
  if (sidebarBrand && !document.querySelector('.sidebar-close-btn')) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'sidebar-close-btn';
    closeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
    closeBtn.title = 'Close Menu';
    sidebarBrand.appendChild(closeBtn);

    closeBtn.addEventListener('click', closeMobileSidebar);
  }

  // 3. Ensure backdrop overlay
  let backdrop = document.querySelector('.sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', closeMobileSidebar);
  }

  // 4. Inject Mobile Bottom Navigation Bar if not present
  if (!document.querySelector('.mobile-bottom-nav') && !window.location.pathname.includes('landing.html')) {
    const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
    const bottomNav = document.createElement('nav');
    bottomNav.className = 'mobile-bottom-nav';
    bottomNav.innerHTML = `
      <a href="dashboard.html" class="mobile-nav-tab ${currentPath === 'dashboard.html' ? 'active' : ''}">
        <i class="bi bi-speedometer2"></i>
        <span>Home</span>
      </a>
      <a href="reception.html" class="mobile-nav-tab ${currentPath === 'reception.html' ? 'active' : ''}">
        <i class="bi bi-person-badge"></i>
        <span>OPD</span>
      </a>
      <a href="doctor_emr.html" class="mobile-nav-tab ${currentPath === 'doctor_emr.html' ? 'active' : ''}">
        <i class="bi bi-clipboard2-pulse"></i>
        <span>EMR</span>
      </a>
      <a href="ipd_beds.html" class="mobile-nav-tab ${currentPath === 'ipd_beds.html' ? 'active' : ''}">
        <i class="bi bi-hospital-fill"></i>
        <span>Beds</span>
      </a>
      <button class="mobile-nav-tab border-0 bg-transparent" id="mobileBottomMoreBtn">
        <i class="bi bi-grid-fill"></i>
        <span>Menu</span>
      </button>
    `;
    document.body.appendChild(bottomNav);

    const moreBtn = document.getElementById('mobileBottomMoreBtn');
    if (moreBtn) {
      moreBtn.addEventListener('click', toggleMobileSidebar);
    }
  }

  function toggleMobileSidebar() {
    sidebar.classList.toggle('show-mobile');
    backdrop.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('show-mobile') ? 'hidden' : '';
  }

  function closeMobileSidebar() {
    sidebar.classList.remove('show-mobile');
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Close when tapping on nav items on mobile
  document.querySelectorAll('.sidebar-menu .nav-link-item').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 992) {
        closeMobileSidebar();
      }
    });
  });

  // Swipe-to-close touch gesture on mobile
  let touchStartX = 0;
  sidebar.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  sidebar.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    if (touchStartX - touchEndX > 60) {
      // Swiped left
      closeMobileSidebar();
    }
  }, { passive: true });
});

// Auto-load CarePulse System Navigator
(function() {
  if (!document.querySelector('script[src*="navigator.js"]')) {
    const s = document.createElement('script');
    s.src = 'js/navigator.js';
    document.head.appendChild(s);
  }
})();

