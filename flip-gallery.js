/**
 * Flip Gallery — Originkit (Vanilla JS Port)
 * 3D Interactive Card Flip with Mouse/Touch Tilt (Repel Effect), Perspective,
 * Double-Sided Rendering, Keyboard Accessibility, and Responsive Scaling.
 */
(function () {
  "use strict";

  const DEFAULTS = {
    tilt: true,
    tiltOptions: {
      effect: "repel",
      tiltLimit: 12,
      scale: 102, // 102% = 1.02
    },
    perspective: 1100,
  };

  class FlipGallery {
    constructor(container, options) {
      if (!container) return;
      this.container = container;
      this.opts = Object.assign({}, DEFAULTS, options || {});
      this.tiltEl = container.querySelector(".flip-tilt-wrapper");
      this.rotatorEl = container.querySelector(".flip-card-rotator");
      if (!this.tiltEl || !this.rotatorEl) return;

      this.angle = 0;
      this.isFlipped = false;
      this.isHovering = false;
      this.rafId = null;

      this._init();
    }

    _init() {
      const self = this;
      const opts = this.opts;
      const tiltOptions = opts.tiltOptions || DEFAULTS.tiltOptions;
      const effect = tiltOptions.effect || "repel";
      const tiltLimit = tiltOptions.tiltLimit || 12;
      const scale = (tiltOptions.scale || 102) / 100;

      // Mouse & Pointer Tilt
      if (opts.tilt) {
        this.container.addEventListener("pointermove", function (e) {
          // Disable tilt calculation during active touch scroll
          if (e.pointerType === "touch" && Math.abs(e.movementY) > Math.abs(e.movementX)) return;

          const rect = self.tiltEl.getBoundingClientRect();
          const mult = effect === "repel" ? -1 : 1;
          const tiltX = ((e.clientY - rect.top) / rect.height - 0.5) * (tiltLimit * 2) * mult;
          const tiltY = ((e.clientX - rect.left) / rect.width - 0.5) * -(tiltLimit * 2) * mult;

          self.tiltEl.style.transform =
            "rotateX(" + tiltX.toFixed(2) + "deg) rotateY(" + tiltY.toFixed(2) + "deg) scale3d(" + scale + "," + scale + "," + scale + ")";
        });

        this.container.addEventListener("pointerleave", function () {
          self.tiltEl.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
        });
      }

      // Flip on Click
      this.container.addEventListener("click", function (e) {
        // Prevent click if user selected text
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) return;

        const rect = self.container.getBoundingClientRect();
        const isLeft = (e.clientX - rect.left) < (rect.width / 2);
        self.flip(isLeft ? -1 : 1);
      });

      // Keyboard Accessibility
      this.container.setAttribute("tabindex", "0");
      this.container.setAttribute("role", "button");
      this.container.setAttribute("aria-label", "Flip HOD profile card to read welcome message");
      this.container.setAttribute("aria-expanded", "false");

      this.container.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          self.flip(1);
        }
      });
    }

    flip(dir) {
      const step = (dir === -1 ? -1 : 1) * 180;
      this.angle += step;
      this.isFlipped = Math.abs(Math.round(this.angle / 180)) % 2 === 1;

      this.rotatorEl.style.transform = "rotateY(" + this.angle + "deg)";
      this.container.setAttribute("aria-expanded", this.isFlipped ? "true" : "false");

      const label = this.isFlipped
        ? "Flip back to HOD photo"
        : "Flip HOD profile card to read welcome message";
      this.container.setAttribute("aria-label", label);
    }
  }

  // Auto-initialize on DOM ready
  document.addEventListener("DOMContentLoaded", function () {
    const galleries = document.querySelectorAll("[data-flip-gallery]");
    galleries.forEach(function (el) {
      new FlipGallery(el);
    });
  });

  window.FlipGallery = FlipGallery;
})();
