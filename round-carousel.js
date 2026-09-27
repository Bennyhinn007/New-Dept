/**
 * Round Carousel — Originkit (Vanilla JS Port)
 * High-Performance 3D Circular Carousel with Inertia, Auto-spin, Adaptive Responsive Sizing,
 * Mobile Touch-Scroll Passthrough, and Active Faculty Info Synchronization.
 */
(function () {
  "use strict";

  const DEFAULTS = {
    speed: 3.5,
    direction: "right",
    drag: true,
    sensitivity: 3.5,
    tilt: -7,
    innerDim: 3.5,
    cornerRadius: 18,
  };

  class RoundCarousel {
    constructor(container, items, options) {
      if (!container) return;
      this.container = container;
      this.items = items || [];
      this.opts = Object.assign({}, DEFAULTS, options || {});
      this.count = this.items.length;
      if (this.count === 0) return;

      this.angle = 360 / this.count;
      this.rotY = 0;
      this.targetRotY = null;
      this.vel = 0;
      this.lastTime = 0;
      this.rafId = null;
      this.activeIndex = -1;
      this.isVisible = true;

      // Pointer / Drag State
      this.drag = {
        active: false,
        startX: 0,
        startY: 0,
        lastX: 0,
        moved: false,
        directionDecided: false,
        isHorizontal: false,
      };

      this._build();
      this._recalc();
      this._observe();
      this._attachEvents();
      this._updateInfo(0, true);
      this._startLoop();
    }

    _initials(name) {
      if (!name) return "?";
      const parts = name.replace(/^(Dr\.|Mr\.|Mrs\.|Miss\.?)\s+/i, "").split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return (parts[0] ? parts[0].slice(0, 2) : "?").toUpperCase();
    }

    _build() {
      const self = this;
      this.container.innerHTML = "";
      this.container.style.cssText = "position:relative;width:100%;max-width:100%;display:flex;flex-direction:column;align-items:center;user-select:none;-webkit-user-select:none;";

      // 3D Viewport
      this.viewport = document.createElement("div");
      this.viewport.className = "rc-viewport";
      this.viewport.style.cssText = "position:relative;width:100%;max-width:100%;display:flex;align-items:center;justify-content:center;overflow:visible;touch-action:pan-y;cursor:grab;";

      // Tilt Wrapper (Applies subtle forward angle so cylinder is viewed in perspective)
      this.tiltWrapper = document.createElement("div");
      this.tiltWrapper.className = "rc-tilt-wrapper";
      this.tiltWrapper.style.cssText = "transform-style:preserve-3d;transform:rotateX(" + this.opts.tilt + "deg);display:flex;align-items:center;justify-content:center;position:relative;";
      this.viewport.appendChild(this.tiltWrapper);

      // 3D Rotating Ring
      this.ring = document.createElement("div");
      this.ring.className = "rc-ring";
      this.ring.style.cssText = "position:relative;transform-style:preserve-3d;will-change:transform;";
      this.tiltWrapper.appendChild(this.ring);

      // Create Cards
      this.cards = this.items.map((item, i) => {
        const card = document.createElement("div");
        card.className = "rc-card";
        card.dataset.index = i;
        card.style.cssText = "position:absolute;inset:0;transform-style:preserve-3d;cursor:pointer;border-radius:" + self.opts.cornerRadius + "px;";

        // Front Face
        const front = document.createElement("div");
        front.className = "rc-card-face rc-card-front";
        front.style.cssText = "position:absolute;inset:0;border-radius:" + self.opts.cornerRadius + "px;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 10px;text-align:center;background:linear-gradient(145deg,rgba(22,42,50,0.96) 0%,rgba(10,18,24,0.98) 100%);border:1px solid rgba(144,174,173,0.3);box-shadow:0 10px 28px rgba(0,0,0,0.55);transition:border-color .25s ease,box-shadow .25s ease;";

        if (item.src) {
          const img = document.createElement("img");
          img.src = item.src;
          img.alt = item.name || "";
          img.style.cssText = "width:100%;height:100%;object-fit:cover;object-position:center 20%;position:absolute;inset:0;pointer-events:none;border-radius:" + self.opts.cornerRadius + "px;";
          front.appendChild(img);

          // Dark gradient vignette overlay with name & designation
          const overlay = document.createElement("div");
          overlay.style.cssText = "position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(5,8,10,0.65) 70%,rgba(5,8,10,0.95) 100%);display:flex;flex-direction:column;justify-content:flex-end;padding:8px 6px;text-align:center;pointer-events:none;border-radius:" + self.opts.cornerRadius + "px;";

          const nameEl = document.createElement("div");
          nameEl.className = "rc-card-name";
          nameEl.textContent = item.name;
          nameEl.style.cssText = "font-size:0.82rem;font-weight:700;color:#FBE9D0;line-height:1.2;margin-bottom:2px;font-family:Plus Jakarta Sans,Inter,sans-serif;pointer-events:none;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 1px 4px rgba(0,0,0,0.8);";
          overlay.appendChild(nameEl);

          const roleEl = document.createElement("div");
          roleEl.className = "rc-card-role";
          roleEl.textContent = item.designation || "";
          roleEl.style.cssText = "font-size:0.7rem;color:#00dfa2;font-weight:600;line-height:1.2;font-family:Inter,sans-serif;pointer-events:none;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,0.8);";
          overlay.appendChild(roleEl);

          front.appendChild(overlay);
        } else {
          // Initials Avatar Circle
          const avatar = document.createElement("div");
          avatar.className = "rc-card-avatar";
          avatar.textContent = self._initials(item.name);
          avatar.style.cssText = "width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#0d9488,#E64833);display:flex;align-items:center;justify-content:center;font-size:1.15rem;font-weight:800;color:#fff;margin-bottom:8px;box-shadow:0 4px 12px rgba(0,0,0,0.4);font-family:Inter,Outfit,sans-serif;flex-shrink:0;pointer-events:none;";
          front.appendChild(avatar);

          // Name
          const nameEl = document.createElement("div");
          nameEl.className = "rc-card-name";
          nameEl.textContent = item.name;
          nameEl.style.cssText = "font-size:0.86rem;font-weight:700;color:#FBE9D0;line-height:1.25;margin-bottom:3px;font-family:Plus Jakarta Sans,Inter,sans-serif;pointer-events:none;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
          front.appendChild(nameEl);

          // Role
          const roleEl = document.createElement("div");
          roleEl.className = "rc-card-role";
          roleEl.textContent = item.designation || "";
          roleEl.style.cssText = "font-size:0.72rem;color:#0d9488;font-weight:600;line-height:1.2;margin-bottom:4px;font-family:Inter,sans-serif;pointer-events:none;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
          front.appendChild(roleEl);

          // Qualification pill
          if (item.qualification) {
            const qual = document.createElement("span");
            qual.className = "rc-card-qual";
            qual.textContent = item.qualification;
            qual.style.cssText = "font-size:0.65rem;font-weight:600;color:#90AEAD;background:rgba(144,174,173,0.14);border:1px solid rgba(144,174,173,0.25);border-radius:999px;padding:2px 8px;pointer-events:none;white-space:nowrap;";
            front.appendChild(qual);
          }
        }

        // Back Face (Interior of Cylinder)
        const back = document.createElement("div");
        back.className = "rc-card-face rc-card-back";
        back.style.cssText = "position:absolute;inset:0;border-radius:" + self.opts.cornerRadius + "px;overflow:hidden;transform:rotateY(180deg);backface-visibility:hidden;-webkit-backface-visibility:hidden;background:#0d1820;border:1px solid rgba(144,174,173,0.12);box-shadow:0 8px 24px rgba(0,0,0,0.5);filter:brightness(" + (self.opts.innerDim / 10) + ");pointer-events:none;";
        const backEmblem = document.createElement("div");
        backEmblem.style.cssText = "width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(144,174,173,0.2);font-size:1.8rem;font-weight:900;font-family:Inter,sans-serif;";
        backEmblem.textContent = "CSE";
        back.appendChild(backEmblem);

        card.appendChild(front);
        card.appendChild(back);

        card.addEventListener("click", function (e) {
          if (!self.drag.moved) {
            self.focusIndex(i);
          }
        });

        self.ring.appendChild(card);
        return { card, front };
      });

      this.container.appendChild(this.viewport);

      // Info Panel below Carousel
      this.infoPanel = document.createElement("div");
      this.infoPanel.className = "rc-info-panel";
      this.infoPanel.style.cssText = "margin-top:18px;text-align:center;min-height:76px;transition:opacity .2s ease;width:100%;max-width:540px;padding:0 12px;";
      this.container.appendChild(this.infoPanel);
    }

    _recalc() {
      const containerW = this.container.clientWidth || window.innerWidth;
      let cardW, cardH, spacing, perspective, stageH;

      if (containerW < 480) {
        cardW = Math.max(74, Math.floor(containerW * 0.23));
        cardH = Math.round(cardW * 1.34);
        spacing = 1.0;
        perspective = 850;
        stageH = cardH + 70;
      } else if (containerW < 768) {
        cardW = Math.max(100, Math.floor(containerW * 0.21));
        cardH = Math.round(cardW * 1.34);
        spacing = 1.2;
        perspective = 1100;
        stageH = cardH + 85;
      } else {
        cardW = 150;
        cardH = 200;
        spacing = 1.45;
        perspective = 1350;
        stageH = 310;
      }

      const factor = 1 + spacing * 0.12;
      const radius = Math.round((cardW * factor) / (2 * Math.tan(Math.PI / this.count)));

      this.cardW = cardW;
      this.cardH = cardH;
      this.radius = radius;
      this.perspective = perspective;

      this.viewport.style.height = stageH + "px";
      this.viewport.style.perspective = perspective + "px";

      this.ring.style.width = cardW + "px";
      this.ring.style.height = cardH + "px";

      // Position Cards on 3D Ring
      const self = this;
      this.cards.forEach((item, i) => {
        const cardAngle = i * self.angle;
        item.card.style.transform = "rotateY(" + cardAngle + "deg) translateZ(" + radius + "px)";
      });

      this._applyTransform();
    }

    _applyTransform() {
      this.ring.style.transform = "translateZ(" + (-this.radius) + "px) rotateY(" + this.rotY.toFixed(2) + "deg)";
    }

    _observe() {
      const self = this;
      // Intersection Observer to suspend loop when off-screen
      if (typeof IntersectionObserver !== "undefined") {
        this.io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const wasVisible = self.isVisible;
            self.isVisible = entry.isIntersecting;
            if (self.isVisible && !wasVisible && !self.rafId) {
              self.lastTime = 0;
              self._startLoop();
            }
          });
        }, { threshold: 0.05 });
        this.io.observe(this.container);
      }

      // Responsive Resize
      if (typeof ResizeObserver !== "undefined") {
        this.ro = new ResizeObserver(() => {
          self._recalc();
        });
        this.ro.observe(this.container);
      } else {
        window.addEventListener("resize", () => self._recalc(), { passive: true });
      }
    }

    _attachEvents() {
      if (!this.opts.drag) return;
      const self = this;
      const vp = this.viewport;

      const onPointerDown = function (e) {
        if (e.button !== undefined && e.button !== 0) return;
        try {
          vp.setPointerCapture(e.pointerId);
        } catch (_) {}

        self.drag.active = true;
        self.drag.startX = e.clientX;
        self.drag.startY = e.clientY;
        self.drag.lastX = e.clientX;
        self.drag.moved = false;
        self.drag.directionDecided = false;
        self.drag.isHorizontal = false;
        self.vel = 0;
        self.targetRotY = null;
        vp.style.cursor = "grabbing";
      };

      const onPointerMove = function (e) {
        if (!self.drag.active) return;
        const dx = e.clientX - self.drag.lastX;
        const totalDx = e.clientX - self.drag.startX;
        const totalDy = e.clientY - self.drag.startY;

        // Intent detection: if vertical movement dominates early on mobile, release to native page scroll
        if (!self.drag.directionDecided) {
          if (Math.abs(totalDx) > 5 || Math.abs(totalDy) > 5) {
            self.drag.directionDecided = true;
            if (Math.abs(totalDy) > Math.abs(totalDx) * 1.2) {
              // User is scrolling the page vertically! Release capture
              self.drag.active = false;
              vp.style.cursor = "grab";
              try {
                vp.releasePointerCapture(e.pointerId);
              } catch (_) {}
              return;
            } else {
              self.drag.isHorizontal = true;
            }
          } else {
            return;
          }
        }

        if (self.drag.isHorizontal) {
          self.drag.moved = true;
          self.drag.lastX = e.clientX;
          const k = 0.28 * (self.opts.sensitivity / 5);
          self.rotY += dx * k;
          self.vel = dx * k * 50;
          self._applyTransform();
        }
      };

      const onPointerUp = function (e) {
        if (!self.drag.active) return;
        self.drag.active = false;
        vp.style.cursor = "grab";
        try {
          vp.releasePointerCapture(e.pointerId);
        } catch (_) {}
      };

      vp.addEventListener("pointerdown", onPointerDown);
      vp.addEventListener("pointermove", onPointerMove);
      vp.addEventListener("pointerup", onPointerUp);
      vp.addEventListener("pointercancel", onPointerUp);
    }

    _startLoop() {
      const self = this;
      const degPerSec = this.opts.speed * 6 * (this.opts.direction === "left" ? -1 : 1);

      function tick(now) {
        if (!self.isVisible) {
          self.rafId = null;
          return;
        }

        const dt = self.lastTime ? Math.min((now - self.lastTime) / 1000, 0.1) : 0.016;
        self.lastTime = now;

        if (!self.drag.active) {
          if (self.targetRotY !== null) {
            // Smoothly lerp towards clicked target card
            const diff = self.targetRotY - self.rotY;
            if (Math.abs(diff) < 0.1) {
              self.rotY = self.targetRotY;
              self.targetRotY = null;
              self.vel = 0;
            } else {
              self.rotY += diff * 0.12;
            }
          } else if (Math.abs(self.vel) > 0.04) {
            self.rotY += self.vel * dt;
            self.vel *= 0.94;
          } else {
            self.rotY += degPerSec * dt;
          }
          self._applyTransform();
        }

        // Active front card detection
        const norm = ((-self.rotY % 360) + 360) % 360;
        const frontIdx = Math.round(norm / self.angle) % self.count;
        if (frontIdx !== self.activeIndex) {
          self._highlightActive(frontIdx);
          self._updateInfo(frontIdx);
        }

        self.rafId = requestAnimationFrame(tick);
      }

      this.rafId = requestAnimationFrame(tick);
    }

    _highlightActive(idx) {
      if (this.activeIndex >= 0 && this.cards[this.activeIndex]) {
        const prevFront = this.cards[this.activeIndex].front;
        prevFront.style.borderColor = "rgba(144,174,173,0.3)";
        prevFront.style.boxShadow = "0 10px 28px rgba(0,0,0,0.55)";
      }
      this.activeIndex = idx;
      if (this.cards[idx]) {
        const curFront = this.cards[idx].front;
        curFront.style.borderColor = "#00dfa2";
        curFront.style.boxShadow = "0 0 28px rgba(0,223,162,0.45), 0 12px 32px rgba(0,0,0,0.7)";
      }
    }

    _updateInfo(idx, immediate) {
      const item = this.items[idx];
      if (!item) return;
      const panel = this.infoPanel;

      const render = () => {
        let qualHtml = "";
        if (item.qualification || item.experience) {
          const qualText = item.qualification ? item.qualification : "";
          const expText = item.experience ? item.experience + " Experience" : "";
          const parts = [qualText, expText].filter(Boolean).join(" &bull; ");
          qualHtml = "<div class=\"rc-info-meta\">" + parts + "</div>";
        }

        panel.innerHTML =
          "<div class=\"rc-info-name\">" + (item.name || "") + "</div>" +
          "<div class=\"rc-info-role\">" + (item.designation || "") + "</div>" +
          qualHtml;
        panel.style.opacity = "1";
      };

      if (immediate) {
        render();
      } else {
        panel.style.opacity = "0";
        setTimeout(render, 110);
      }
    }

    focusIndex(idx) {
      const targetBase = -idx * this.angle;
      let delta = targetBase - (this.rotY % 360);
      delta = ((delta % 360) + 540) % 360 - 180;
      this.targetRotY = this.rotY + delta;
      this.vel = 0;
    }

    destroy() {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      if (this.io) this.io.disconnect();
      if (this.ro) this.ro.disconnect();
    }
  }

  window.RoundCarousel = RoundCarousel;
})();
