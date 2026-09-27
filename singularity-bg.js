/**
 * Singularity WebGL Background Controller
 * Inspira UI Singularity Background (bg-singularity)
 * Shader by @XorDev (ShaderToy: 3csSWB)
 * WebGL2 engine with DPR scaling, mouse damping, HSV color tuning, and interactive controls.
 */

(function () {
  'use strict';

  // --- Configuration ---
  const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent));
  const CONFIG = {
    speed: 0.75,            // Animation speed
    mouseSensitivity: 0.4,  // Mouse response
    mouseDamping: 0.88,     // Smooth mouse trailing
    fps: 60,                // Target framerate
    maxDpr: isMobile ? 0.75 : 1.0, // Optimized DPR: silky smooth 60/120fps without GPU throttling
    mode: 'cosmic',         // Deep cosmic background
    hsv: {
      hue: 195,             // Deep Teal / Navy cosmic accretion glow matching #244855
      saturation: 1.35,     // Rich vivid accretion disc
      brightness: 1.25      // Luminous event horizon contrast
    }
  };

  const vertexShaderSource = `#version 300 es
    #ifdef GL_ES
    precision mediump float;
    #endif
    in vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentShaderSource = `#version 300 es
    #ifdef GL_ES
    precision mediump float;
    precision mediump int;
    #endif

    uniform vec3      iResolution;     // viewport resolution (in pixels)
    uniform float     iTime;           // shader playback time (in seconds)
    uniform float     iTimeDelta;      // render time (in seconds)
    uniform float     iFrameRate;      // shader frame rate
    uniform int       iFrame;          // shader playback frame
    uniform vec4      iMouse;          // mouse pixel coords. xy: current, zw: click
    uniform vec3      iHSV;            // HSV controls (hue, saturation, brightness)
    uniform float     iSpeed;          // speed multiplier

    out vec4 fragColor;

    // HSV to RGB conversion
    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    // RGB to HSV conversion
    vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    // Apply HSV adjustments
    vec3 applyHSV(vec3 color, vec3 hsvAdjust) {
        vec3 hsv = rgb2hsv(color);
        hsv.x = fract(hsv.x + hsvAdjust.x / 360.0);
        hsv.y = clamp(hsv.y * hsvAdjust.y, 0.0, 1.0);
        hsv.z = clamp(hsv.z * hsvAdjust.z, 0.0, 1.0);
        return hsv2rgb(hsv);
    }

    // "Singularity" by @XorDev (ShaderToy: 3csSWB) - Optimized
    void mainImage(out vec4 O, in vec2 F)
    {
      float i = 0.2, a;
      vec2 r = iResolution.xy;
      vec2 p = (F + F - r) / r.y / 0.7;

      // Subtle mouse perspective tilt
      if (iMouse.x > 0.0 || iMouse.y > 0.0) {
        vec2 m = (iMouse.xy - r * 0.5) / r.y * 0.35;
        p += m * 0.3;
      }

      vec2 d = vec2(-1.0, 1.0);
      vec2 b = p - i * d;
      vec2 c = p * mat2(1.0, 1.0, d / (0.1 + i / max(dot(b, b), 0.0001)));
      a = max(dot(c, c), 0.0001);
      
      vec4 rot = vec4(0.0, 33.0, 11.0, 0.0);
      vec2 v = c * mat2(cos(0.5 * log(a) + iTime * i + rot)) / i;
      vec2 w = vec2(0.0);

      // Optimized 5.5 iterations for flawless 60/120fps performance
      for (; i < 5.5; i += 1.0) {
        w += 1.0 + sin(v);
        v += 0.7 * sin(v.yx * i + iTime) / i + 0.5;
      }

      i = length(sin(v / 0.3) * 0.4 + c * (3.0 + d));
      
      vec4 grad = exp(c.x * vec4(0.6, -0.4, -1.0, 0.0));
      vec4 denom = max(
        w.xyyx * (2.0 + i * i / 4.0 - i) * (0.5 + 1.0 / a) * (0.03 + abs(length(p) - 0.7)),
        vec4(0.0001)
      );

      O = 1.0 - exp(-grad / denom);
      O.a = 1.0;
    }

    void main() {
        vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
        mainImage(color, gl_FragCoord.xy);

        // Apply HSV adjustments to tune towards Deep Charcoal & Accent Gold
        if (iHSV.x != 0.0 || iHSV.y != 1.0 || iHSV.z != 1.0) {
            color.rgb = applyHSV(color.rgb, iHSV);
        }

        fragColor = color;
    }
  `;

  class SingularityBackground {
    constructor() {
      // 1. Ensure canvas exists
      this.canvas = document.getElementById('singularity-canvas');
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'singularity-canvas';
        document.body.prepend(this.canvas);
      }

      // 2. Ensure ambient backdrop overlay exists
      this.overlay = document.getElementById('singularity-overlay');
      if (!this.overlay) {
        this.overlay = document.createElement('div');
        this.overlay.id = 'singularity-overlay';
        this.overlay.className = 'singularity-overlay';
        document.body.prepend(this.overlay);
      }

      // 3. Initialize WebGL 2 Context
      this.gl = this.canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance'
      });

      if (!this.gl) {
        console.warn('WebGL 2 not supported, falling back gracefully');
        this.canvas.style.display = 'none';
        return;
      }

      this.program = null;
      this.uniforms = {};
      this.startTime = performance.now();
      this.prevTime = this.startTime;
      this.frameCount = 0;
      this.isPlaying = true;
      this.isScrolling = false;
      this.scrollTimer = null;
      this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
      this.animId = null;

      this.init();
      this.buildUIControls();
    }

    init() {
      if (!this.createProgram()) return;
      this.createQuadBuffer();
      this.bindEvents();
      this.handleResize();

      this.canvas.style.opacity = '1';
      this.animate();
    }

    createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    createProgram() {
      const gl = this.gl;
      const vs = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
      const fs = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
      if (!vs || !fs) return false;

      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return false;
      }

      this.program = program;
      gl.useProgram(program);

      const uniformNames = [
        'iResolution', 'iTime', 'iTimeDelta', 'iFrameRate',
        'iFrame', 'iMouse', 'iHSV', 'iSpeed'
      ];
      uniformNames.forEach(name => {
        this.uniforms[name] = gl.getUniformLocation(program, name);
      });

      return true;
    }

    createQuadBuffer() {
      const gl = this.gl;
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      const positions = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

      const posAttrib = gl.getAttribLocation(this.program, 'position');
      gl.enableVertexAttribArray(posAttrib);
      gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);
    }

    handleResize() {
      const isMob = window.innerWidth <= 768;
      const dpr = isMob ? 0.75 : Math.min(window.devicePixelRatio || 1, 1.0);
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.canvas.width = Math.floor(width * dpr);
      this.canvas.height = Math.floor(height * dpr);

      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

      if (this.uniforms.iResolution) {
        this.gl.uniform3f(this.uniforms.iResolution, this.canvas.width, this.canvas.height, dpr);
      }
    }

    bindEvents() {
      window.addEventListener('resize', () => this.handleResize(), { passive: true });

      // Track scrolling to prioritize 60/120fps scrolling smoothness
      window.addEventListener('scroll', () => {
        this.isScrolling = true;
        if (this.scrollTimer) clearTimeout(this.scrollTimer);
        this.scrollTimer = setTimeout(() => {
          this.isScrolling = false;
        }, 100);
      }, { passive: true });

      const updateMouse = (clientX, clientY) => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.0);
        this.mouse.targetX = clientX * dpr * CONFIG.mouseSensitivity;
        this.mouse.targetY = (window.innerHeight - clientY) * dpr * CONFIG.mouseSensitivity;
      };

      window.addEventListener('mousemove', (e) => {
        updateMouse(e.clientX, e.clientY);
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches[0]) {
          updateMouse(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.isPlaying = false;
          if (this.animId) cancelAnimationFrame(this.animId);
        } else {
          this.isPlaying = true;
          this.prevTime = performance.now();
          this.animate();
        }
      });
    }

    animate = () => {
      if (!this.isPlaying) return;

      // When user is actively scrolling, defer heavy fragment shader passes
      if (this.isScrolling) {
        this.animId = requestAnimationFrame(this.animate);
        return;
      }

      const now = performance.now();
      const elapsed = (now - this.startTime) * 0.001 * CONFIG.speed;
      const delta = (now - this.prevTime) * 0.001 * CONFIG.speed;
      this.prevTime = now;

      // Mouse smoothing damping
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * (1.0 - CONFIG.mouseDamping);
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * (1.0 - CONFIG.mouseDamping);

      const gl = this.gl;
      gl.useProgram(this.program);

      if (this.uniforms.iTime) gl.uniform1f(this.uniforms.iTime, elapsed);
      if (this.uniforms.iTimeDelta) gl.uniform1f(this.uniforms.iTimeDelta, delta);
      if (this.uniforms.iFrameRate) gl.uniform1f(this.uniforms.iFrameRate, CONFIG.fps);
      if (this.uniforms.iFrame) gl.uniform1i(this.uniforms.iFrame, this.frameCount);
      if (this.uniforms.iMouse) gl.uniform4f(this.uniforms.iMouse, this.mouse.x, this.mouse.y, this.mouse.targetX, this.mouse.targetY);
      if (this.uniforms.iHSV) gl.uniform3f(this.uniforms.iHSV, CONFIG.hsv.hue, CONFIG.hsv.saturation, CONFIG.hsv.brightness);
      if (this.uniforms.iSpeed) gl.uniform1f(this.uniforms.iSpeed, CONFIG.speed);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      this.frameCount++;

      this.animId = requestAnimationFrame(this.animate);
    };

    setMode(mode) {
      CONFIG.mode = mode;
      if (this.overlay) {
        if (mode === 'cosmic') {
          this.overlay.classList.add('cosmic-mode');
        } else {
          this.overlay.classList.remove('cosmic-mode');
        }
      }
    }

    togglePlay() {
      this.isPlaying = !this.isPlaying;
      if (this.isPlaying) {
        this.prevTime = performance.now();
        this.animate();
      } else if (this.animId) {
        cancelAnimationFrame(this.animId);
      }
      return this.isPlaying;
    }

    buildUIControls() {
      if (document.getElementById('singularity-dock')) return;

      const dock = document.createElement('div');
      dock.id = 'singularity-dock';
      dock.className = 'singularity-dock';
      dock.innerHTML = `
        <div class="singularity-dock-panel" id="singularity-panel">
          <div class="dock-header">
            <strong>🌌 Singularity Background</strong>
            <span class="dock-sub">Inspira UI &bull; ShaderToy @XorDev</span>
          </div>
          <div class="dock-controls">
            <button id="btn-toggle-play" class="dock-btn">⏸️ Pause</button>
            <button id="btn-toggle-mode" class="dock-btn">🌟 Toggle Immersion</button>
            <button id="btn-speed" class="dock-btn">⚡ Speed: Normal</button>
          </div>
        </div>
        <button class="singularity-dock-trigger" id="singularity-trigger" title="Background Controls" aria-label="Background Controls">
          <span class="dock-icon">🌌</span>
          <span class="dock-text">Cosmic BG</span>
          <span class="dock-pulse"></span>
        </button>
      `;

      document.body.appendChild(dock);

      const trigger = document.getElementById('singularity-trigger');
      const panel = document.getElementById('singularity-panel');
      const btnPlay = document.getElementById('btn-toggle-play');
      const btnMode = document.getElementById('btn-toggle-mode');
      const btnSpeed = document.getElementById('btn-speed');

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('active');
      });

      document.addEventListener('click', (e) => {
        if (!dock.contains(e.target)) {
          panel.classList.remove('active');
        }
      });

      btnPlay.addEventListener('click', () => {
        const isRunning = this.togglePlay();
        btnPlay.textContent = isRunning ? '⏸️ Pause' : '▶️ Resume';
      });

      let isVivid = false;
      btnMode.textContent = '✨ Cosmic Brightness';
      btnMode.addEventListener('click', () => {
        isVivid = !isVivid;
        this.setMode(isVivid ? 'vivid' : 'cosmic');
        btnMode.textContent = isVivid ? '🌌 Deep Cosmic' : '✨ Bright Cosmic';
      });

      let speedIndex = 1;
      const speeds = [
        { label: '0.4x Slow', val: 0.4 },
        { label: '0.8x Normal', val: 0.8 },
        { label: '1.4x Fast', val: 1.4 }
      ];
      btnSpeed.addEventListener('click', () => {
        speedIndex = (speedIndex + 1) % speeds.length;
        CONFIG.speed = speeds[speedIndex].val;
        btnSpeed.textContent = `⚡ Speed: ${speeds[speedIndex].label}`;
      });
    }
  }

  let instance = null;
  function startSingularity() {
    if (!instance) {
      instance = new SingularityBackground();
      window.SingularityBG = instance;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startSingularity);
  } else {
    startSingularity();
  }
})();
