/**
 * Round Carousel — Originkit (Vanilla JS Port) - Performance Optimized
 * 3D circular carousel with drag, tilt, perspective, auto-spin, and IntersectionObserver.
 */
(function () {
  "use strict";

  const DEFAULT_OPTIONS = {
    imageWidth: 150,
    imageHeight: 190,
    spacing: 30,
    speed: 0.35,
    direction: "right",
    drag: true,
    sensitivity: 1.0,
    tilt: 8,
    perspective: 800,
    cornerRadius: 18,
    innerDim: 160,
    background: "transparent",
  };

  class RoundCarousel {
    constructor(container, items, options) {
      this.container = container;
      this.items = items;
      this.opts = Object.assign({}, DEFAULT_OPTIONS, options || {});
      this.angle = 0;
      this.targetAngle = 0;
      this.velocity = 0;
      this.isDragging = false;
      this.lastX = 0;
      this.rafId = null;
      this.activeIndex = -1;
      this.isVisible = true;
      this.isScrolling = false;
      this.scrollTimer = null;

      this._build();
      this._observeIntersection();
      this._observeScroll();
      this._attachEvents();
      this._startLoop();
    }

    get count() { return this.items.length; }
    get stepAngle() { return 360 / this.count; }

    _initials(name) {
      return name.split(" ").filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join("");
    }

    _build() {
      var opts = this.opts;
      var self = this;
      this.container.style.cssText += "position:relative;overflow:visible;display:flex;flex-direction:column;align-items:center;";

      this.stage = document.createElement("div");
      this.stage.className = "rc-stage";
      this.stage.style.cssText = "position:relative;perspective:" + opts.perspective + "px;transform-style:preserve-3d;cursor:grab;user-select:none;margin:0 auto;transform:translateZ(0);";

      this.rig = document.createElement("div");
      this.rig.style.cssText = "width:100%;height:100%;position:relative;transform-style:preserve-3d;transform:translateZ(0);will-change:transform;";
      this.stage.appendChild(this.rig);
      this.container.appendChild(this.stage);

      this.cardEls = this.items.map((item, i) => {
        var el = document.createElement("div");
        el.className = "rc-card";
        el.dataset.index = i;
        el.style.cssText = "position:absolute;width:" + opts.imageWidth + "px;height:" + opts.imageHeight + "px;top:50%;left:50%;margin-top:-" + (opts.imageHeight / 2) + "px;margin-left:-" + (opts.imageWidth / 2) + "px;border-radius:" + opts.cornerRadius + "px;overflow:hidden;backface-visibility:hidden;will-change:transform;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4);transition:box-shadow .2s ease;";
        if (item.src) {
          var img = document.createElement("img");
          img.src = item.src;
          img.alt = item.name || "";
          img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;";
          el.appendChild(img);
        } else {
          el.style.background = "linear-gradient(135deg,#0d9488,#ff6b6b)";
          el.style.display = "flex";
          el.style.alignItems = "center";
          el.style.justifyContent = "center";
          var span = document.createElement("span");
          span.textContent = this._initials(item.name || "?");
          span.style.cssText = "font-size:2.8rem;font-weight:800;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.5);font-family:Inter,Outfit,sans-serif;pointer-events:none;";
          el.appendChild(span);
        }
        el.addEventListener("click", function(){ self._focusIndex(i); });
        this.rig.appendChild(el);
        return el;
      });

      this.infoPanel = document.createElement("div");
      this.infoPanel.className = "rc-info-panel";
      this.infoPanel.style.cssText = "margin-top:24px;text-align:center;min-height:76px;transition:opacity .2s ease;";
      this.container.appendChild(this.infoPanel);

      this._layoutCards();
      this._updateInfo(0);
    }

    _observeIntersection() {
      if (typeof IntersectionObserver !== "undefined") {
        this.io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const wasVisible = this.isVisible;
            this.isVisible = entry.isIntersecting;
            if (this.isVisible && !wasVisible && !this.rafId) {
              this._startLoop();
            }
          });
        }, { threshold: 0.05 });
        this.io.observe(this.container);
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

    _layoutCards() {
      var n = this.count;
      var opts = this.opts;
      var chord = opts.imageWidth + opts.spacing;
      var r = n === 1 ? 0 : chord / (2 * Math.sin(Math.PI / n));
      this.radius = r;
      var diam = r * 2 + opts.imageWidth + 40;
      var stageW = Math.max(diam, opts.innerDim);
      var stageH = opts.imageHeight + 40;
      this.stage.style.width = stageW + "px";
      this.stage.style.height = stageH + "px";
      this.stage.style.marginTop = "14px";
      this.cardEls.forEach((el, i) => {
        el.dataset.baseAngle = (360 / n) * i;
      });
    }

    _startLoop() {
      var self = this;
      function tick() {
        if (!self.isVisible) {
          self.rafId = null;
          return;
        }

        // Defer during rapid scroll bursts to keep 60/120fps scrolling fluid
        if (self.isScrolling && !self.isDragging) {
          self.rafId = requestAnimationFrame(tick);
          return;
        }

        if (!self.isDragging) {
          var dir = self.opts.direction === "right" ? -1 : 1;
          self.targetAngle += dir * self.opts.speed * 0.015;
        }
        var diff = self.targetAngle - self.angle;
        self.angle += diff * 0.1;
        self._renderFrame();

        self.rafId = requestAnimationFrame(tick);
      }

      this.rafId = requestAnimationFrame(tick);
    }

    _renderFrame() {
      var n = this.count;
      var r = this.radius;
      var closestIdx = 0;
      var closestDist = Infinity;
      var self = this;

      this.cardEls.forEach((el, i) => {
        var base = parseFloat(el.dataset.baseAngle);
        var deg = ((base + self.angle) % 360 + 360) % 360;
        var rad = (deg * Math.PI) / 180;
        var x = Math.sin(rad) * r;
        var z = Math.cos(rad) * r;
        var depthFactor = (z + r) / (2 * r);
        var scale = 0.65 + 0.35 * depthFactor;
        var zIndex = Math.round(depthFactor * 100);

        el.style.transform = "translateX(" + x.toFixed(1) + "px) translateZ(" + z.toFixed(1) + "px) scale(" + scale.toFixed(2) + ")";
        el.style.zIndex = zIndex;

        var distToFront = deg > 180 ? 360 - deg : deg;
        if (distToFront < closestDist) {
          closestDist = distToFront;
          closestIdx = i;
        }
      });

      if (closestIdx !== this.activeIndex) {
        if (this.activeIndex >= 0 && this.cardEls[this.activeIndex]) {
          this.cardEls[this.activeIndex].style.boxShadow = "0 4px 16px rgba(0,0,0,.4)";
        }
        this.activeIndex = closestIdx;
        if (this.cardEls[closestIdx]) {
          this.cardEls[closestIdx].style.boxShadow = "0 0 28px 6px rgba(13,148,136,.5), 0 8px 32px rgba(0,0,0,.6)";
        }
        this._updateInfo(closestIdx);
      }
    }

    _updateInfo(idx) {
      var item = this.items[idx];
      if (!item) return;
      var panel = this.infoPanel;
      panel.style.opacity = "0";
      setTimeout(function(){
        var qual = item.qualification ? "<div class=\"rc-qualification\">" + item.qualification + (item.experience ? " &bull; " + item.experience : "") + "</div>" : "";
        panel.innerHTML = "<div class=\"rc-name\">" + (item.name||"") + "</div><div class=\"rc-designation\">" + (item.designation||"") + "</div>" + qual;
        panel.style.opacity = "1";
      }, 120);
    }

    _focusIndex(idx) {
      var base = parseFloat(this.cardEls[idx].dataset.baseAngle);
      var delta = -base - this.angle;
      delta = ((delta % 360) + 540) % 360 - 180;
      this.targetAngle += delta;
    }

    _attachEvents() {
      if (!this.opts.drag) return;
      var self = this;
      var onStart = function(x){ self.isDragging=true; self.lastX=x; self.stage.style.cursor="grabbing"; };
      var onMove  = function(x){ if(!self.isDragging) return; var dx=x-self.lastX; self.lastX=x; self.targetAngle -= dx*self.opts.sensitivity*0.4; };
      var onEnd   = function(){ self.isDragging=false; self.stage.style.cursor="grab"; };
      this.stage.addEventListener("mousedown", function(e){ onStart(e.clientX); });
      window.addEventListener("mousemove",  function(e){ onMove(e.clientX); });
      window.addEventListener("mouseup", onEnd);
      this.stage.addEventListener("touchstart", function(e){ onStart(e.touches[0].clientX); }, {passive:true});
      window.addEventListener("touchmove",  function(e){ onMove(e.touches[0].clientX); }, {passive:true});
      window.addEventListener("touchend", onEnd);
    }

    destroy() {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      if (this.io) this.io.disconnect();
    }
  }

  window.RoundCarousel = RoundCarousel;
})();
