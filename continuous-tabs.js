/**
 * Watermelon Continuous Tabs Engine
 * Button-like tabs with a smooth sliding background pill.
 * Spring-based animation with exact color palette styling.
 * Supports: https://registry.watermelon.sh/r/continuous-tabs.json specification
 */

(function () {
  'use strict';

  class ContinuousTabs {
    constructor(container) {
      this.container = container;
      this.track = container.querySelector('.continuous-tabs-track') || container.querySelector('ul') || container;
      this.tabs = Array.from(this.track.querySelectorAll('button, a'));
      if (!this.tabs.length) return;

      this.pill = null;
      this.activeTab = this.tabs.find(t => t.classList.contains('active')) || this.tabs[0];
      this.hoveredTab = null;

      this.init();
    }

    init() {
      this.track.classList.add('continuous-tabs-track');

      // Create sliding pill
      this.pill = document.createElement('div');
      this.pill.className = 'continuous-tabs-pill';
      this.track.appendChild(this.pill);

      // Bind events
      this.tabs.forEach(tab => {
        tab.classList.add('continuous-tab-item');

        tab.addEventListener('mouseenter', () => {
          this.hoveredTab = tab;
          this.updatePill(tab);
        });

        tab.addEventListener('click', (e) => {
          const targetId = tab.getAttribute('data-tab-target');
          if (targetId) {
            e.preventDefault();
            this.setActiveTab(tab);
            this.switchPanel(targetId);
          } else {
            this.setActiveTab(tab);
          }
        });
      });

      this.track.addEventListener('mouseleave', () => {
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
          this.pill.classList.add('ready');
        }, 60);
      });
    }

    updatePill(targetTab, animate = true) {
      if (!targetTab || !this.pill) return;

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

    setActiveTab(tab) {
      this.activeTab = tab;
      this.tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      this.updatePill(tab);
    }

    switchPanel(panelId) {
      const main = document.querySelector('main');
      if (!main) return;
      const panels = main.querySelectorAll('[data-tab-panel]');
      panels.forEach(p => {
        if (panelId === 'tab-all' || p.getAttribute('data-tab-panel') === panelId) {
          p.classList.add('active');
          p.style.display = 'block';
          p.style.animation = 'fadeInUp 400ms ease forwards';
        } else {
          p.classList.remove('active');
          p.style.display = 'none';
        }
      });
      window.dispatchEvent(new Event('resize'));
    }
  }

  function initContinuousTabs() {
    const navs = document.querySelectorAll('header nav, .continuous-tabs-container');
    navs.forEach(nav => {
      new ContinuousTabs(nav);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContinuousTabs);
  } else {
    initContinuousTabs();
  }
})();

