/**
 * Watermelon Continuous Tabs & Mobile Responsive Interactions Engine
 * 1. Single Main Tab Bar: Header navigation with smooth sliding background pill (Spring physics).
 * 2. Mobile Collapsible Navigation Drawer: Frosted-glass menu with animated hamburger toggle.
 * 3. Responsive Data Tables: Touch-friendly horizontal scrolling wrapper with swipe hints.
 * Specification: https://registry.watermelon.sh/r/continuous-tabs.json
 */

(function () {
  'use strict';

  class ContinuousNavTabs {
    constructor(navContainer) {
      this.nav = navContainer;
      this.track = navContainer.querySelector('.continuous-tabs-track') || navContainer.querySelector('ul') || navContainer;
      this.tabs = Array.from(this.track.querySelectorAll('a, button'));
      if (!this.tabs.length) return;

      this.pill = null;
      this.activeTab = this.tabs.find(t => t.classList.contains('active')) || this.tabs[0];
      this.hoveredTab = null;

      this.init();
    }

    init() {
      this.track.classList.add('continuous-tabs-track');

      // Create sliding pill for desktop navigation
      this.pill = document.createElement('div');
      this.pill.className = 'continuous-tabs-pill';
      this.track.appendChild(this.pill);

      // Bind events to each navigation tab item
      this.tabs.forEach(tab => {
        tab.classList.add('continuous-tab-item');

        tab.addEventListener('mouseenter', () => {
          if (window.innerWidth <= 768) return;
          this.hoveredTab = tab;
          this.updatePill(tab);
        });

        tab.addEventListener('click', () => {
          this.activeTab = tab;
          this.tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.updatePill(tab);
        });
      });

      this.track.addEventListener('mouseleave', () => {
        if (window.innerWidth <= 768) return;
        this.hoveredTab = null;
        this.updatePill(this.activeTab);
      });

      window.addEventListener('resize', () => {
        this.updatePill(this.hoveredTab || this.activeTab, false);
      }, { passive: true });

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          this.updatePill(this.activeTab, false);
        });
      }

      requestAnimationFrame(() => {
        this.updatePill(this.activeTab, false);
        setTimeout(() => {
          if (this.pill) this.pill.classList.add('ready');
        }, 60);
      });
    }

    updatePill(targetTab, animate = true) {
      if (!targetTab || !this.pill) return;

      // On mobile viewports (<= 768px), drawer styles apply without desktop sliding pill
      if (window.innerWidth <= 768) {
        this.pill.style.opacity = '0';
        return;
      }

      if (!animate) {
        this.pill.style.transition = 'none';
      } else {
        this.pill.style.transition = '';
      }

      const trackRect = this.track.getBoundingClientRect();
      const tabRect = targetTab.getBoundingClientRect();

      const left = tabRect.left - trackRect.left;
      const top = tabRect.top - trackRect.top;
      const width = tabRect.width;
      const height = tabRect.height;

      this.pill.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      this.pill.style.width = `${width}px`;
      this.pill.style.height = `${height}px`;
      this.pill.style.opacity = '1';
    }
  }

  /* --------------------------------------------------------------------------
     Mobile Navigation Toggle & Drawer Handler
     -------------------------------------------------------------------------- */
  function initMobileNavigation() {
    const header = document.querySelector('header');
    if (!header) return;

    let toggleBtn = document.getElementById('mobileNavToggle') || header.querySelector('.mobile-nav-toggle');

    // Create toggle dynamically if absent in HTML
    if (!toggleBtn) {
      const headerTop = header.querySelector('.header-top');
      if (headerTop) {
        let actions = headerTop.querySelector('.header-actions');
        if (!actions) {
          actions = document.createElement('div');
          actions.className = 'header-actions';
          const badge = headerTop.querySelector('.header-badge');
          if (badge) actions.appendChild(badge);
          headerTop.appendChild(actions);
        }
        toggleBtn = document.createElement('button');
        toggleBtn.className = 'mobile-nav-toggle';
        toggleBtn.id = 'mobileNavToggle';
        toggleBtn.setAttribute('aria-label', 'Toggle navigation menu');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.innerHTML = `
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        `;
        actions.appendChild(toggleBtn);
      }
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = header.classList.toggle('nav-open');
        toggleBtn.classList.toggle('active', isOpen);
        toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      // Close drawer on link click
      const navLinks = header.querySelectorAll('nav a');
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 768) {
            header.classList.remove('nav-open');
            toggleBtn.classList.remove('active');
            toggleBtn.setAttribute('aria-expanded', 'false');
          }
        });
      });

      // Close drawer when clicking outside
      document.addEventListener('click', (e) => {
        if (header.classList.contains('nav-open') && !header.contains(e.target)) {
          header.classList.remove('nav-open');
          toggleBtn.classList.remove('active');
          toggleBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Close drawer on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && header.classList.contains('nav-open')) {
          header.classList.remove('nav-open');
          toggleBtn.classList.remove('active');
          toggleBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Auto close on desktop resize
      window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && header.classList.contains('nav-open')) {
          header.classList.remove('nav-open');
          toggleBtn.classList.remove('active');
          toggleBtn.setAttribute('aria-expanded', 'false');
        }
      }, { passive: true });
    }
  }

  /* --------------------------------------------------------------------------
     Responsive Data Tables Auto-Wrapper
     Ensures no raw table ever breaks mobile viewport width
     -------------------------------------------------------------------------- */
  function initResponsiveTables() {
    const tables = document.querySelectorAll('table.data-table');
    tables.forEach(table => {
      if (!table.parentElement.classList.contains('table-responsive')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive';

        const hint = document.createElement('div');
        hint.className = 'table-scroll-hint';
        hint.innerHTML = '<span>Swipe horizontally to view full table &rarr;</span>';

        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(hint);
        wrapper.appendChild(table);
      }
    });
  }

  /* --------------------------------------------------------------------------
     Initialize Engine
     -------------------------------------------------------------------------- */
  function init() {
    initMobileNavigation();
    initResponsiveTables();

    // Ensure all section blocks are fully visible
    const sections = document.querySelectorAll('main .section-block');
    sections.forEach(sec => {
      sec.style.display = 'block';
    });

    // Initialize continuous sliding tabs strictly on the main header navigation
    const headerNav = document.querySelector('header nav');
    if (headerNav) {
      new ContinuousNavTabs(headerNav);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
