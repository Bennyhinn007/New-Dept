/**
 * Round Carousel — Originkit (Vanilla JS Port)
 * 3D circular carousel with drag, tilt, perspective and auto-spin.
 */
(function () {
  "use strict";

  const DEFAULT_OPTIONS = {
    imageWidth: 160,
    imageHeight: 200,
    spacing: 40,
    speed: 0.4,
    direction: "right",
    drag: true,
    sensitivity: 1.2,
    tilt: 8,
    perspective: 900,
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
      this.activeIndex = 0;
      this._build();
      this._attachEvents();
      this._tick();
    }

    get count() { return this.items.length; }
    get stepAngle() { return 360 / this.count; }

    _initials(name) {
      return name.split(" ").filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join("");
    }

    _build() {
      var opts = this.opts;
      this.container.style.cssText += "position:relative;overflow:visible;display:flex;flex-direction:column;align-items:center;";

      this.stage = document.createElement("div");
      this.stage.className = "rc-stage";
      this.stage.style.cssText = "position:relative;perspective:" + opts.perspective + "px;transform-style:preserve-3d;cursor:grab;user-select:none;margin:0 auto;";

      this.rig = document.createElement("div");
      this.rig.style.cssText = "width:100%;height:100%;position:relative;transform-style:preserve-3d;";
      this.stage.appendChild(this.rig);
      this.container.appendChild(this.stage);

      this.cardEls = this.items.map((item, i) => {
        var el = document.createElement("div");
        el.className = "rc-card";
        el.dataset.index = i;
        el.style.cssText = "position:absolute;width:" + opts.imageWidth + "px;height:" + opts.imageHeight + "px;top:50%;left:50%;margin-top:-" + (opts.imageHeight / 2) + "px;margin-left:-" + (opts.imageWidth / 2) + "px;border-radius:" + opts.cornerRadius + "px;overflow:hidden;backface-visibility:hidden;transition:box-shadow .3s ease,filter .3s ease;cursor:pointer;";
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
          span.style.cssText = "font-size:3rem;font-weight:800;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.5);font-family:Inter,Outfit,sans-serif;pointer-events:none;";
          el.appendChild(span);
        }
        el.addEventListener("click", (function(idx){ return function(){ self._focusIndex(idx); }; })(i));
        this.rig.appendChild(el);
        return el;
      });

      // store ref for closure
      var self = this;

      this.infoPanel = document.createElement("div");
      this.infoPanel.className = "rc-info-panel";
      this.infoPanel.style.cssText = "margin-top:28px;text-align:center;min-height:80px;transition:opacity .3s ease;";
      this.container.appendChild(this.infoPanel);

      this._layoutCards();
      this._updateInfo(0);
    }

    _layoutCards() {
      var n = this.count;
      var opts = this.opts;
      var chord = opts.imageWidth + opts.spacing;
      var r = n === 1 ? 0 : chord / (2 * Math.sin(Math.PI / n));
      this.radius = r;
      var diam = r * 2 + opts.imageWidth + 60;
      var stageW = Math.max(diam, opts.innerDim);
      var stageH = opts.imageHeight + 60;
      this.stage.style.width = stageW + "px";
      this.stage.style.height = stageH + "px";
      this.stage.style.marginTop = "20px";
      this.cardEls.forEach((el, i) => {
        el.dataset.baseAngle = (360 / n) * i;
      });
    }

    _tick() {
      var self = this;
      this.rafId = requestAnimationFrame(function(){ self._tick(); });
      if (!this.isDragging) {
        var dir = this.opts.direction === "right" ? -1 : 1;
        this.targetAngle += dir * this.opts.speed * 0.015;
      }
      var diff = this.targetAngle - this.angle;
      this.angle += diff * 0.1;
      this._renderFrame();
    }

    _renderFrame() {
      var n = this.count;
      var r = this.radius;
      var closestIdx = 0;
      var closestDist = Infinity;
      this.cardEls.forEach((el, i) => {
        var base = parseFloat(el.dataset.baseAngle);
        var deg = ((base + this.angle) % 360 + 360) % 360;
        var rad = (deg * Math.PI) / 180;
        var x = Math.sin(rad) * r;
        var z = Math.cos(rad) * r;
        var depthFactor = (z + r) / (2 * r);
        var scale = 0.6 + 0.4 * depthFactor;
        var brightness = 0.4 + 0.6 * depthFactor;
        var zIndex = Math.round(depthFactor * 100);
        el.style.transform = "translateX(" + x + "px) translateZ(" + z + "px) scale(" + scale + ")";
        el.style.zIndex = zIndex;
        el.style.filter = "brightness(" + brightness + ")";
        var distToFront = deg > 180 ? 360 - deg : deg;
        if (distToFront < closestDist) { closestDist = distToFront; closestIdx = i; }
        el.style.boxShadow = distToFront < 35
          ? "0 0 32px 8px rgba(13,148,136,.55),0 8px 32px rgba(0,0,0,.6)"
          : "0 4px 16px rgba(0,0,0,.4)";
      });
      if (closestIdx !== this.activeIndex) {
        this.activeIndex = closestIdx;
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
      }, 150);
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
      this.stage.addEventListener("touchstart", function(e){ onStart(e.touches[0].clientX); e.preventDefault(); }, {passive:false});
      window.addEventListener("touchmove",  function(e){ onMove(e.touches[0].clientX); e.preventDefault(); }, {passive:false});
      window.addEventListener("touchend", onEnd);
    }

    destroy() { cancelAnimationFrame(this.rafId); }
  }

  window.RoundCarousel = RoundCarousel;
})();
