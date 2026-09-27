/**
 * Neon Border — Originkit (Vanilla JS Port) - Performance Optimized
 * High-performance animated neon perimeter border with conic-gradient arcs,
 * multi-tier glow diffusion, and step/continuous easing.
 * Optimized with IntersectionObserver, scroll-pause, and lightweight GPU layer blending.
 */
(function () {
  "use strict";

  const isMobile = typeof window !== "undefined" && (window.innerWidth <= 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent));

  const DEFAULTS = {
    color: "#00dfa2",
    rounded: 24,
    thickness: 4,
    borderSize: 45,
    glow: 100,
    movement: "continuous",
    speed: 15,
  };

  const EDGE_COPIES = isMobile ? 1 : 2;
  const GLOW_LAYERS = isMobile
    ? [{ blur: 10, opacity: 0.55, reach: 0.4 }]
    : [
        { blur: 8, opacity: 0.6, reach: 0.3 },
        { blur: 18, opacity: 0.38, reach: 0.65 },
      ];
  const MAX_GLOW_BLUR = Math.max(...GLOW_LAYERS.map((l) => l.blur));
  const MAX_GLOW_REACH = 28;

  function withAlpha(input, alpha) {
    const a = Math.max(0, Math.min(1, alpha));
    if (typeof input !== "string") return `rgba(0,0,0,${a})`;
    const s = input.trim();

    const hex = s.match(/^#([0-9a-f]{3,8})$/i);
    if (hex) {
      let h = hex[1];
      if (h.length === 3 || h.length === 4) {
        h = h
          .split("")
          .map((c) => c + c)
          .join("");
      }
      const n = parseInt(h.slice(0, 6), 16);
      if (!Number.isFinite(n)) return `rgba(0,0,0,${a})`;
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    }

    const rgb = s.match(/^rgba?\(([^)]+)\)/i);
    if (rgb) {
      const parts = rgb[1].split(",").map((v) => parseFloat(v));
      if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
        return `rgba(${parts[0]},${parts[1]},${parts[2]},${a})`;
      }
    }
    return `rgba(0,0,0,${a})`;
  }

  function perimeterPoint(u, w, h) {
    const d = (((u % 1) + 1) % 1) * 2 * (w + h);
    if (d < w) return [d, 0];
    if (d < w + h) return [w, d - w];
    if (d < w * 2 + h) return [w - (d - w - h), h];
    return [0, h - (d - w * 2 - h)];
  }

  function cornerLap(k, w, h) {
    const p = 2 * (w + h);
    const at = [0, w / p, (w + h) / p, (w * 2 + h) / p];
    return Math.floor(k / 4) + at[((k % 4) + 4) % 4];
  }

  function perimeterAngle(u, w, h) {
    const [x, y] = perimeterPoint(u, w, h);
    return (Math.atan2(x - w / 2, h / 2 - y) * 180) / Math.PI;
  }

  const ARC_SAMPLES = 14; // Optimized from 24 for lightning-fast gradient compilation
  const MIN_ARC = 0.015;

  function buildArc(lap, lengthPct, w, h, color) {
    const fw = w > 0 ? w : 100;
    const fh = h > 0 ? h : 100;

    const len = Math.max(0, Math.min(100, lengthPct));
    const span = Math.max(MIN_ARC, (len / 100) * 0.5);
    const solidT = len / 100;

    const stops = [];
    let base = 0;
    let prev = 0;
    let acc = 0;

    for (let i = 0; i <= ARC_SAMPLES; i++) {
      const f = i / ARC_SAMPLES;
      const angle = perimeterAngle(lap + (f - 0.5) * span, fw, fh);
      if (i === 0) {
        base = angle;
      } else {
        let d = angle - prev;
        while (d > 180) d -= 360;
        while (d < -180) d += 360;
        acc += d;
      }
      prev = angle;

      const t = Math.abs(f - 0.5) * 2;
      const k =
        solidT >= 1 ? 1 : t <= solidT ? 1 : 1 - (t - solidT) / (1 - solidT);
      stops.push(
        `${withAlpha(color, k * k * (3 - 2 * k))} ${acc.toFixed(1)}deg`
      );
    }

    const end = acc.toFixed(1);
    stops.push(`${withAlpha(color, 0)} ${end}deg`);
    stops.push(`${withAlpha(color, 0)} 360deg`);

    return `conic-gradient(from ${base.toFixed(1)}deg at 50% 50%, ${stops.join(
      ", "
    )})`;
  }

  const SLOWEST_CYCLE = 30;
  const FASTEST_CYCLE = 4;
  const SLOWEST_STEP = 3;
  const FASTEST_STEP = 0.35;
  const STEP_EASE = [0.72, 0.16, 0.18, 1.05];
  const GLIDE_EASE = [0.65, 0, 0.35, 1];

  function makeEaseFn(pts) {
    const [x1, y1, x2, y2] = pts;
    if (x1 === y1 && x2 === y2) return (t) => t;
    const bez = (a, b, t) => {
      const u = 1 - t;
      return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t;
    };
    return (t) => {
      const x = Math.max(0, Math.min(1, t));
      let s = x;
      for (let i = 0; i < 8; i++) {
        const cx = bez(x1, x2, s) - x;
        const u = 1 - s;
        const dx =
          3 * u * u * x1 + 6 * u * s * (x2 - x1) + 3 * s * s * (1 - x2);
        if (Math.abs(dx) < 1e-6) break;
        s -= cx / dx;
        s = Math.max(0, Math.min(1, s));
      }
      return bez(y1, y2, s);
    };
  }

  const stepEase = makeEaseFn(STEP_EASE);
  const glideEase = makeEaseFn(GLIDE_EASE);

  const BAND_MASK_CSS = `
    -webkit-mask-image: linear-gradient(#fff 0 0), linear-gradient(#fff 0 0);
    -webkit-mask-clip: content-box, border-box;
    -webkit-mask-composite: xor;
    mask-image: linear-gradient(#fff 0 0), linear-gradient(#fff 0 0);
    mask-clip: content-box, border-box;
    mask-composite: exclude;
  `;

  class NeonBorderInstance {
    constructor(element, options = {}) {
      this.root = element;
      this.opts = Object.assign({}, DEFAULTS, options);

      // Parse data attributes if present on element
      if (this.root.dataset.neonColor) this.opts.color = this.root.dataset.neonColor;
      if (this.root.dataset.neonRounded) this.opts.rounded = parseFloat(this.root.dataset.neonRounded);
      if (this.root.dataset.neonThickness) this.opts.thickness = parseFloat(this.root.dataset.neonThickness);
      if (this.root.dataset.neonBorderSize) this.opts.borderSize = parseFloat(this.root.dataset.neonBorderSize);
      if (this.root.dataset.neonGlow) this.opts.glow = parseFloat(this.root.dataset.neonGlow);
      if (this.root.dataset.neonMovement) this.opts.movement = this.root.dataset.neonMovement;
      if (this.root.dataset.neonSpeed) this.opts.speed = parseFloat(this.root.dataset.neonSpeed);

      this.size = { w: 0, h: 0 };
      this.rafId = null;
      this.lastTime = performance.now();
      this.lap = 0;
      this.corner = 0;
      this.stepT = 0;
      this.isVisible = true;
      this.isScrolling = false;
      this.scrollTimer = null;

      this._init();
    }

    _init() {
      this.root.style.position = "relative";

      this.overlay = document.createElement("div");
      this.overlay.className = "neon-border-overlay";
      this.overlay.style.cssText = `
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: visible;
        z-index: 10;
        transform: translateZ(0);
        will-change: transform;
      `;

      this.groupA = document.createElement("div");
      this.groupA.className = "neon-group-a";
      this.groupA.style.cssText = "position:absolute;inset:0;overflow:visible;pointer-events:none;";

      this.groupB = document.createElement("div");
      this.groupB.className = "neon-group-b";
      this.groupB.style.cssText = "position:absolute;inset:0;overflow:visible;pointer-events:none;";

      this.overlay.appendChild(this.groupA);
      this.overlay.appendChild(this.groupB);
      this.root.appendChild(this.overlay);

      this._observeSize();
      this._observeIntersection();
      this._observeScroll();
      this._buildLayers();
      this._startLoop();
    }

    _observeIntersection() {
      if (typeof IntersectionObserver !== "undefined") {
        this.io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const wasVisible = this.isVisible;
            this.isVisible = entry.isIntersecting;
            if (this.isVisible && !wasVisible) {
              this.lastTime = performance.now();
              if (!this.rafId) this._startLoop();
            }
          });
        }, { threshold: 0.05 });
        this.io.observe(this.root);
      } else {
        this.isVisible = true;
      }
    }

    _observeScroll() {
      window.addEventListener("scroll", () => {
        this.isScrolling = true;
        if (this.scrollTimer) clearTimeout(this.scrollTimer);
        this.scrollTimer = setTimeout(() => {
          this.isScrolling = false;
        }, 100);
      }, { passive: true });
    }

    _observeSize() {
      const updateSize = () => {
        const rect = this.root.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width !== this.size.w || rect.height !== this.size.h)) {
          this.size = { w: rect.width, h: rect.height };
          this._buildLayers();
        }
      };

      updateSize();

      if (typeof ResizeObserver !== "undefined") {
        this.ro = new ResizeObserver(() => updateSize());
        this.ro.observe(this.root);
      } else {
        window.addEventListener("resize", updateSize);
      }

      const img = this.root.querySelector("img");
      if (img) {
        if (!img.complete) {
          img.addEventListener("load", () => updateSize(), { once: true });
        } else {
          setTimeout(updateSize, 60);
        }
      }
      window.addEventListener("load", () => updateSize(), { once: true });
    }

    _buildLayers() {
      const { rounded, thickness, glow, color, borderSize } = this.opts;
      const { w, h } = this.size;
      if (w <= 0 || h <= 0) return;

      const thick = Math.max(1, Math.min(8, thickness));
      const radius = (Math.max(0, Math.min(100, rounded)) / 100) * (Math.min(w, h) / 2);
      this.root.style.borderRadius = `${radius}px`;

      const amount = Math.max(0, Math.min(100, glow)) / 100;
      const ringAt = (share) => thick + amount * MAX_GLOW_REACH * share;
      const glowOuter = 8 + MAX_GLOW_REACH + MAX_GLOW_BLUR * 2;

      const buildBandHtml = (r, offset = 0) => {
        const bandRadius = radius > 0 ? radius + r : 0;
        return `
          <div class="neon-band" style="
            position: absolute;
            inset: ${offset - r}px;
            box-sizing: border-box;
            padding: ${r}px;
            border-radius: ${bandRadius}px;
            background: var(--arc);
            ${BAND_MASK_CSS}
          "></div>
        `;
      };

      const buildGlowLayerHtml = (r, blurPx, opacity) => {
        const layerRadius = radius > 0 ? radius + glowOuter : 0;
        return `
          <div class="neon-glow-layer" style="
            position: absolute;
            inset: -${glowOuter}px;
            box-sizing: border-box;
            padding: ${glowOuter}px;
            border-radius: ${layerRadius}px;
            opacity: ${opacity};
            mix-blend-mode: plus-lighter;
            filter: ${blurPx ? `blur(${blurPx.toFixed(1)}px)` : "none"};
            -webkit-filter: ${blurPx ? `blur(${blurPx.toFixed(1)}px)` : "none"};
            ${BAND_MASK_CSS}
          ">
            ${buildBandHtml(r, glowOuter)}
          </div>
        `;
      };

      const buildGroupInner = (startLap) => {
        let html = "";
        if (amount > 0) {
          GLOW_LAYERS.forEach((l) => {
            html += buildGlowLayerHtml(ringAt(l.reach), l.blur, l.opacity);
          });
        }
        for (let i = 0; i < EDGE_COPIES; i++) {
          html += `
            <div style="position:absolute;inset:0;mix-blend-mode:plus-lighter;">
              ${buildBandHtml(thick, 0)}
            </div>
          `;
        }
        return html;
      };

      this.groupA.innerHTML = buildGroupInner(0);
      this.groupB.innerHTML = buildGroupInner(0.5);

      this.groupA.style.setProperty("--arc", buildArc(0, borderSize, w, h, color));
      this.groupB.style.setProperty("--arc", buildArc(0.5, borderSize, w, h, color));
    }

    _startLoop() {
      const frame = (now) => {
        if (!this.isVisible) {
          this.rafId = null;
          return;
        }

        // Defer gradient string recalculation during scroll swipes
        if (this.isScrolling) {
          this.rafId = requestAnimationFrame(frame);
          return;
        }

        const dt = Math.min(0.05, Math.max(0, (now - this.lastTime) / 1000));
        this.lastTime = now;

        const s = Math.max(0, Math.min(20, this.opts.speed));
        if (s > 0 && this.size.w > 0 && this.size.h > 0) {
          const step = this.opts.movement === "step";
          const beat = step
            ? SLOWEST_STEP + ((FASTEST_STEP - SLOWEST_STEP) * (s - 1)) / 19
            : (SLOWEST_CYCLE + ((FASTEST_CYCLE - SLOWEST_CYCLE) * (s - 1)) / 19) / 4;

          this.stepT += dt / beat;
          while (this.stepT >= 1) {
            this.stepT -= 1;
            this.corner += 1;
          }
          const eased = step ? stepEase(Math.min(1, this.stepT * 2)) : glideEase(this.stepT);

          const { w, h } = this.size;
          const fw = w > 0 ? w : 100;
          const fh = h > 0 ? h : 100;
          const from = cornerLap(this.corner, fw, fh);
          const to = cornerLap(this.corner + 1, fw, fh);
          this.lap = from + (to - from) * eased;

          this.groupA.style.setProperty(
            "--arc",
            buildArc(this.lap, this.opts.borderSize, w, h, this.opts.color)
          );
          this.groupB.style.setProperty(
            "--arc",
            buildArc(this.lap + 0.5, this.opts.borderSize, w, h, this.opts.color)
          );
        }

        this.rafId = requestAnimationFrame(frame);
      };

      this.rafId = requestAnimationFrame(frame);
    }

    destroy() {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      if (this.ro) this.ro.disconnect();
      if (this.io) this.io.disconnect();
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
    }
  }

  function initAllNeonBorders() {
    const targets = document.querySelectorAll("[data-neon-border]");
    targets.forEach((el) => {
      if (!el._neonBorderInstance) {
        el._neonBorderInstance = new NeonBorderInstance(el);
      }
    });
  }

  window.NeonBorderInstance = NeonBorderInstance;
  window.initAllNeonBorders = initAllNeonBorders;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAllNeonBorders);
  } else {
    initAllNeonBorders();
  }
})();
