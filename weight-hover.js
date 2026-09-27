/**
 * Weight Hover — Originkit
 * Interactive Variable Font Weight Hover by Letter with Spring Stagger Physics
 * Specification: Originkit VariableFontHoverByLetter
 * 
 * Animates variable font weights ('wght' axis) letter-by-letter on hover/touch
 * with randomized Fisher-Yates stagger delays and debounced trailing timers.
 */

(function () {
  'use strict';

  const INTER_VARIABLE_FONT_STACK = '"InterVariableFramer", "Inter Variable", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  class VariableFontHoverByLetter {
    constructor(element, customOptions = {}) {
      this.el = element;
      if (this.el._weightHoverInitialized) return;
      this.el._weightHoverInitialized = true;

      // Extract raw text
      const rawText = customOptions.label ||
        this.el.getAttribute('data-weight-label') ||
        this.el.textContent.trim();

      if (!rawText) return;

      this.label = rawText;
      this.fromWeight = parseInt(this.el.getAttribute('data-from-weight') || customOptions.fromWeight || 500, 10);
      this.toWeight = parseInt(this.el.getAttribute('data-to-weight') || customOptions.toWeight || 900, 10);
      this.staggerDuration = parseInt(this.el.getAttribute('data-stagger-duration') || customOptions.staggerDuration || 25, 10);
      this.staggerFrom = this.el.getAttribute('data-stagger-from') || customOptions.staggerFrom || 'random';
      this.duration = customOptions.duration || 0.7; // 700ms spring transition

      // Debounce and timer state matching Originkit specifications
      this.wait = 100;
      this.startTimer = null;
      this.startTrailing = false;
      this.endTimer = null;
      this.endTrailing = false;

      this.letters = [];
      this.shuffledIndices = [];

      this.setupDOM();
      this.bindEvents();
    }

    setupDOM() {
      this.el.classList.add('weight-hover-active');
      this.el.style.fontFamily = INTER_VARIABLE_FONT_STACK;

      // Screen-reader full label for SEO, accessibility, and clipboard copying
      const srOnly = document.createElement('span');
      srOnly.className = 'sr-only';
      srOnly.textContent = this.label;
      srOnly.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';

      // Visual container for letter spans
      const visualContainer = document.createElement('span');
      visualContainer.className = 'weight-hover-content';
      visualContainer.setAttribute('aria-hidden', 'true');
      visualContainer.style.display = 'inline';

      // Split words to maintain clean, natural word wrapping across screen widths
      const words = this.label.split(' ');
      this.letters = [];

      words.forEach((word, wIdx) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'weight-hover-word';
        wordSpan.style.display = 'inline-block';
        wordSpan.style.whiteSpace = 'nowrap';

        for (let i = 0; i < word.length; i++) {
          const char = word[i];
          const letterSpan = document.createElement('span');
          letterSpan.className = 'weight-hover-letter';
          letterSpan.textContent = char;
          letterSpan.style.display = 'inline-block';
          letterSpan.style.whiteSpace = 'pre';
          letterSpan.style.fontVariationSettings = `'wght' ${this.fromWeight}`;
          letterSpan.style.fontWeight = this.fromWeight;
          letterSpan.style.transition = `font-variation-settings ${this.duration}s cubic-bezier(0.2, 0.9, 0.3, 1), font-weight ${this.duration}s cubic-bezier(0.2, 0.9, 0.3, 1), text-shadow 0.4s ease, color 0.4s ease`;
          wordSpan.appendChild(letterSpan);
          this.letters.push(letterSpan);
        }

        visualContainer.appendChild(wordSpan);

        if (wIdx < words.length - 1) {
          const spaceSpan = document.createElement('span');
          spaceSpan.className = 'weight-hover-space';
          spaceSpan.textContent = ' ';
          spaceSpan.style.display = 'inline-block';
          spaceSpan.style.whiteSpace = 'pre';
          visualContainer.appendChild(spaceSpan);
        }
      });

      this.el.innerHTML = '';
      this.el.appendChild(srOnly);
      this.el.appendChild(visualContainer);

      this.computeShuffledIndices();
    }

    computeShuffledIndices() {
      const len = this.letters.length;
      this.shuffledIndices = Array.from({ length: len }, (_, i) => i);

      if (this.staggerFrom === 'random') {
        // Fisher-Yates shuffle
        for (let i = len - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const temp = this.shuffledIndices[i];
          this.shuffledIndices[i] = this.shuffledIndices[j];
          this.shuffledIndices[j] = temp;
        }
      } else if (this.staggerFrom === 'last') {
        this.shuffledIndices.reverse();
      } else if (this.staggerFrom === 'center') {
        const center = len / 2;
        this.shuffledIndices.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
      }
    }

    runStart() {
      const staggerSec = Math.max(0, this.staggerDuration) / 1000;
      this.letters.forEach((letter, i) => {
        const delay = (this.shuffledIndices[i] || 0) * staggerSec;
        letter.style.transitionDelay = `${delay}s`;
        letter.style.fontVariationSettings = `'wght' ${this.toWeight}`;
        letter.style.fontWeight = this.toWeight;
      });
    }

    runEnd() {
      const staggerSec = Math.max(0, this.staggerDuration) / 1000;
      this.letters.forEach((letter, i) => {
        const delay = (this.shuffledIndices[i] || 0) * staggerSec;
        letter.style.transitionDelay = `${delay}s`;
        letter.style.fontVariationSettings = `'wght' ${this.fromWeight}`;
        letter.style.fontWeight = this.fromWeight;
      });
    }

    handleHoverStart() {
      if (!this.startTimer) {
        this.runStart();
        this.startTimer = setTimeout(() => {
          if (this.startTrailing) this.runStart();
          this.startTrailing = false;
          this.startTimer = null;
        }, this.wait);
      } else {
        this.startTrailing = true;
      }
    }

    handleHoverEnd() {
      if (!this.endTimer) {
        this.runEnd();
        this.endTimer = setTimeout(() => {
          if (this.endTrailing) this.runEnd();
          this.endTrailing = false;
          this.endTimer = null;
        }, this.wait);
      } else {
        this.endTrailing = true;
      }
    }

    bindEvents() {
      this.el.addEventListener('mouseenter', () => this.handleHoverStart());
      this.el.addEventListener('mouseleave', () => this.handleHoverEnd());

      // Mobile Touch Interaction
      this.el.addEventListener('touchstart', () => {
        this.handleHoverStart();
      }, { passive: true });

      this.el.addEventListener('touchend', () => {
        setTimeout(() => this.handleHoverEnd(), 800);
      }, { passive: true });
    }
  }

  // Auto-initialize Weight Hover on targeted elements across pages
  function initWeightHover() {
    // 1. Explicitly targeted elements with data-weight-hover or .weight-hover
    const explicitElements = document.querySelectorAll('[data-weight-hover], .weight-hover, .weight-hover-title, .weight-hover-subtitle');
    explicitElements.forEach(el => new VariableFontHoverByLetter(el));

    // 2. Main Hero Banner Headings on Home Page
    const heroH2 = document.querySelector('.hero-inner h2');
    if (heroH2 && !heroH2._weightHoverInitialized) {
      new VariableFontHoverByLetter(heroH2, {
        fromWeight: 600,
        toWeight: 900,
        staggerDuration: 25,
        staggerFrom: 'random'
      });
    }

    const heroP = document.querySelector('.hero-inner p');
    if (heroP && !heroP._weightHoverInitialized && heroP.textContent.includes('Guru Nanak Dev Engineering College')) {
      new VariableFontHoverByLetter(heroP, {
        fromWeight: 400,
        toWeight: 800,
        staggerDuration: 18,
        staggerFrom: 'random'
      });
    }

    // 3. Top Header Brand Headings (On all pages)
    const brandH1 = document.querySelector('.header-brand h1');
    if (brandH1 && !brandH1._weightHoverInitialized) {
      new VariableFontHoverByLetter(brandH1, {
        fromWeight: 750,
        toWeight: 900,
        staggerDuration: 20,
        staggerFrom: 'random'
      });
    }

    const brandH2 = document.querySelector('.header-brand h2');
    if (brandH2 && !brandH2._weightHoverInitialized) {
      new VariableFontHoverByLetter(brandH2, {
        fromWeight: 550,
        toWeight: 850,
        staggerDuration: 16,
        staggerFrom: 'random'
      });
    }
  }

  // Expose global constructor
  window.VariableFontHoverByLetter = VariableFontHoverByLetter;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWeightHover);
  } else {
    initWeightHover();
  }
})();
