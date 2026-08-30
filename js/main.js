if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

// ─────────────────────────────────────────────────────────────────────────
// Custom cursor
// ─────────────────────────────────────────────────────────────────────────
(function cursor() {
  const el = document.getElementById('cursor');
  if (!el || matchMedia('(hover: none), (pointer: coarse)').matches) return;
  let x = 0, y = 0, cx = 0, cy = 0;
  window.addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; });
  document.querySelectorAll('[data-hover], a, button').forEach(node => {
    node.addEventListener('mouseenter', () => el.classList.add('hover'));
    node.addEventListener('mouseleave', () => el.classList.remove('hover'));
  });
  (function raf() {
    cx += (x - cx) * 0.25;
    cy += (y - cy) * 0.25;
    el.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
    requestAnimationFrame(raf);
  })();
})();

// ─────────────────────────────────────────────────────────────────────────
// Cursor trail — adapted from the quadratic-curve, banded-fade trail
// technique studied on seanjklassen.com (soft line following the mouse).
// ─────────────────────────────────────────────────────────────────────────
(function cursorTrail() {
  const canvas = document.getElementById('trail');
  if (!canvas || matchMedia('(hover: none), (pointer: coarse)').matches) return;
  const ctx = canvas.getContext('2d');
  const HOLD = 700, OUT = 450, LIFE = HOLD + OUT, BANDS = 5;
  const trail = [];

  function size() {
    canvas.width = window.innerWidth;
    canvas.height = Math.max(document.documentElement.scrollHeight, window.innerHeight);
  }
  size();
  window.addEventListener('resize', size);

  window.addEventListener('mousemove', e => {
    trail.push({
      x: e.clientX, y: e.clientY + window.scrollY, t: performance.now(),
      jx: (Math.random() - 0.5) * 1.4, jy: (Math.random() - 0.5) * 1.4
    });
  });

  function alpha(age) {
    if (age < HOLD) return 1;
    const f = (age - HOLD) / OUT;
    return f >= 1 ? 0 : 1 - f;
  }

  function draw() {
    const now = performance.now();
    while (trail.length && now - trail[0].t > LIFE) trail.shift();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (trail.length > 1) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let b = 0; b < BANDS; b++) {
        const lo = b / BANDS, hi = (b + 1) / BANDS;
        const bAlpha = alpha((lo + hi) * 0.5 * LIFE);
        if (bAlpha <= 0) continue;
        ctx.beginPath();
        let drawing = false;
        for (let i = 1; i < trail.length; i++) {
          const p0 = trail[i - 1], p1 = trail[i];
          const frac = (now - p1.t) / LIFE;
          if (frac < lo || frac >= hi) { drawing = false; continue; }
          const dx = p1.x - p0.x, dy = p1.y - p0.y;
          if (dx * dx + dy * dy > 40000) { drawing = false; continue; }
          const x0 = p0.x + p0.jx, y0 = p0.y + p0.jy;
          const x1 = p1.x + p1.jx, y1 = p1.y + p1.jy;
          if (!drawing) { ctx.moveTo(x0, y0); drawing = true; }
          ctx.quadraticCurveTo(x0, y0, (x0 + x1) * 0.5, (y0 + y1) * 0.5);
        }
        ctx.lineWidth = 1.6 + (b % 3) * 0.3;
        ctx.strokeStyle = `rgba(244,242,238,${bAlpha.toFixed(3)})`;
        ctx.stroke();
      }
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();

// ─────────────────────────────────────────────────────────────────────────
// Eye system — a shared halftone-dot eye renderer used by both the hero
// (elegant eye with long lashes, drag-to-tilt like deeo.studio's 3D letters)
// and the footer (eye that closes its lid as you scroll toward the end,
// peeks open on hover). The eye artwork is drawn procedurally to a small
// offscreen canvas, then sampled on a regular grid and redrawn as circles
// whose radius follows local brightness — a true halftone screen, matching
// the reference image.
// ─────────────────────────────────────────────────────────────────────────
(function eyeSystem() {
  const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Draws one eye (lid, iris, pupil, optional lashes) into ctx at WxH.
  // closeAmount: 0 = fully open, 1 = fully closed (thin lid line).
  function drawEyeArt(ctx, W, H, opts) {
    const closeAmount = opts.closeAmount || 0;
    ctx.clearRect(0, 0, W, H);
    const cx = W * 0.5, cy = opts.lashes ? H * 0.62 : H * 0.5;
    const halfW = W * 0.37;
    const openness = 1 - closeAmount;
    const upperBulge = H * 0.26 * openness + H * 0.014;
    const lowerBulge = H * 0.20 * openness + H * 0.014;

    function lidPath() {
      ctx.beginPath();
      ctx.moveTo(cx - halfW, cy);
      ctx.quadraticCurveTo(cx, cy - upperBulge, cx + halfW, cy);
      ctx.quadraticCurveTo(cx, cy + lowerBulge, cx - halfW, cy);
      ctx.closePath();
    }

    // Sclera — faint fill across the whole lid shape
    lidPath();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();

    // Iris + pupil, clipped to the lid opening
    ctx.save();
    lidPath();
    ctx.clip();
    const irisR = H * 0.46;
    const limbus = ctx.createRadialGradient(cx, cy, irisR * 0.15, cx, cy, irisR);
    limbus.addColorStop(0, 'rgba(255,255,255,0.06)');
    limbus.addColorStop(0.55, 'rgba(255,255,255,0.24)');
    limbus.addColorStop(0.82, 'rgba(255,255,255,0.58)');
    limbus.addColorStop(0.93, 'rgba(255,255,255,0.95)');
    limbus.addColorStop(1, 'rgba(255,255,255,0.18)');
    ctx.fillStyle = limbus;
    ctx.beginPath();
    ctx.arc(cx, cy, irisR, 0, Math.PI * 2);
    ctx.fill();

    // Iris texture rays
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = Math.max(1, H * 0.006);
    const rays = 22;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * irisR * 0.3, cy + Math.sin(a) * irisR * 0.3);
      ctx.lineTo(cx + Math.cos(a) * irisR * 0.86, cy + Math.sin(a) * irisR * 0.86);
      ctx.stroke();
    }

    // Pupil — cut out as a void so the halftone leaves it empty
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, irisR * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();

    // Lid outline
    lidPath();
    ctx.lineWidth = H * 0.032;
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.stroke();

    // Long elegant lashes fanning up from the upper lid
    if (opts.lashes) {
      const lashCount = 9;
      for (let i = 0; i < lashCount; i++) {
        const t = i / (lashCount - 1);
        const lx = cx - halfW * 0.8 + halfW * 1.6 * t;
        const ly = cy - upperBulge * (1 - Math.pow((t - 0.5) * 2, 2));
        const lenFactor = 1 - Math.abs(t - 0.5) * 1.05;
        const len = (H * (0.14 + 0.09 * lenFactor)) * openness + H * 0.025;
        const ang = -Math.PI / 2 + (t - 0.5) * 1.05;
        const ex = lx + Math.cos(ang) * len;
        const ey = ly + Math.sin(ang) * len;
        const midx = lx + Math.cos(ang) * len * 0.6 + Math.cos(ang + Math.PI / 2) * len * 0.16;
        const midy = ly + Math.sin(ang) * len * 0.6 + Math.sin(ang + Math.PI / 2) * len * 0.16;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.quadraticCurveTo(midx, midy, ex, ey);
        ctx.lineWidth = H * 0.016 * lenFactor + H * 0.006;
        ctx.strokeStyle = 'rgba(255,255,255,0.92)';
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }
  }

  // Samples srcCanvas on a regular grid and redraws it as halftone dots
  // (radius ~ local brightness) into the display canvas at dispW x dispH.
  function halftoneDraw(displayCtx, srcCanvas, dispW, dispH, step) {
    displayCtx.clearRect(0, 0, dispW, dispH);
    const sctx = srcCanvas.getContext('2d');
    const sw = srcCanvas.width, sh = srcCanvas.height;
    const data = sctx.getImageData(0, 0, sw, sh).data;
    const scaleX = dispW / sw, scaleY = dispH / sh;
    const maxRadius = step * Math.max(scaleX, scaleY) * 0.62;
    displayCtx.fillStyle = '#f4f2ee';
    for (let sy = (step / 2) | 0; sy < sh; sy += step) {
      for (let sx = (step / 2) | 0; sx < sw; sx += step) {
        const i = (sy * sw + sx) * 4;
        const a = data[i + 3] / 255;
        if (a <= 0.03) continue;
        const r = maxRadius * a;
        if (r < 0.5) continue;
        displayCtx.beginPath();
        displayCtx.arc(sx * scaleX, sy * scaleY, r, 0, Math.PI * 2);
        displayCtx.fill();
      }
    }
  }

  // ── Hero: elegant eye, drag-to-tilt, "Drag me" cursor ────────────────
  function setupHeroEye() {
    const stage = document.getElementById('heroEyeStage');
    const canvas = document.getElementById('eye-hero-canvas');
    const hint = document.getElementById('dragHint');
    const cursorDot = document.getElementById('cursor');
    if (!stage || !canvas) return;
    const ctx = canvas.getContext('2d');
    const SRC_W = 340, SRC_H = 210;
    const src = document.createElement('canvas');
    src.width = SRC_W; src.height = SRC_H;
    const sctx = src.getContext('2d');

    let dispW = 0, dispH = 0;

    function render(closeAmount) {
      drawEyeArt(sctx, SRC_W, SRC_H, { closeAmount, lashes: true });
      halftoneDraw(ctx, src, dispW, dispH, 6);
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dispW = Math.round(rect.width);
      dispH = Math.round(rect.height);
      canvas.width = dispW;
      canvas.height = dispH;
      render(0);
      canvas.style.opacity = '1';
    }
    resize();
    window.addEventListener('resize', () => { clearTimeout(resize._t); resize._t = setTimeout(resize, 200); });

    // Idle blink
    if (!REDUCED_MOTION) {
      (function scheduleBlink() {
        setTimeout(() => {
          const start = performance.now();
          const DUR = 260;
          function tick(t) {
            const p = Math.min(1, (t - start) / DUR);
            const closeAmount = p < 0.5 ? p * 2 : (1 - p) * 2;
            render(Math.pow(closeAmount, 0.7));
            if (p < 1) requestAnimationFrame(tick);
            else render(0);
          }
          requestAnimationFrame(tick);
          scheduleBlink();
        }, 3800 + Math.random() * 4200);
      })();
    }

    // Drag-to-tilt (3D rotation via CSS transform), matching deeo.studio's letters
    let rx = 0, ry = 0, vx = 0, vy = 0;
    let dragging = false, lastX = 0, lastY = 0, lastT = 0;

    function applyTransform() {
      canvas.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    }

    function springLoop() {
      if (!dragging) {
        vx *= 0.94; vy *= 0.94;
        rx += vx; ry += vy;
        rx += (0 - rx) * 0.06;
        ry += (0 - ry) * 0.06;
        applyTransform();
      }
      requestAnimationFrame(springLoop);
    }
    springLoop();

    function pointerDown(e) {
      dragging = true;
      stage.classList.add('dragging');
      hint.classList.add('dragging');
      lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
      vx = vy = 0;
    }
    function pointerMove(e) {
      if (!dragging) return;
      const t = performance.now();
      const dt = Math.max(8, t - lastT);
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      const addRy = dx * 0.35, addRx = -dy * 0.35;
      ry += addRy;
      rx = Math.max(-28, Math.min(28, rx + addRx));
      vx = addRx * (16 / dt);
      vy = addRy * (16 / dt);
      lastX = e.clientX; lastY = e.clientY; lastT = t;
      applyTransform();
    }
    function pointerUp() {
      dragging = false;
      stage.classList.remove('dragging');
      hint.classList.remove('dragging');
    }
    stage.addEventListener('pointerdown', pointerDown);
    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('pointerup', pointerUp);

    // "Drag me" cursor hint
    if (hint && !matchMedia('(hover: none), (pointer: coarse)').matches) {
      let hx = 0, hy = 0, hcx = 0, hcy = 0, hintActive = false;
      stage.addEventListener('mouseenter', () => {
        hintActive = true;
        hint.classList.add('visible');
        if (cursorDot) cursorDot.style.opacity = '0';
      });
      stage.addEventListener('mouseleave', () => {
        hintActive = false;
        hint.classList.remove('visible');
        if (cursorDot) cursorDot.style.opacity = '';
      });
      window.addEventListener('mousemove', e => { hx = e.clientX; hy = e.clientY; });
      (function hintLoop() {
        if (hintActive) {
          hcx += (hx - hcx) * 0.22;
          hcy += (hy - hcy) * 0.22;
          hint.style.left = hcx + 'px';
          hint.style.top = hcy + 'px';
        }
        requestAnimationFrame(hintLoop);
      })();
    }
  }

  // ── Footer: eye closes on scroll toward page end, peeks open on hover ──
  function setupFooterEye() {
    const stage = document.getElementById('footerEyeStage');
    const canvas = document.getElementById('eye-footer-canvas');
    if (!stage || !canvas) return;
    const ctx = canvas.getContext('2d');
    const SRC_W = 300, SRC_H = 180;
    const src = document.createElement('canvas');
    src.width = SRC_W; src.height = SRC_H;
    const sctx = src.getContext('2d');

    let dispW = 0, dispH = 0;
    let displayClose = 0, hovering = false;

    function render(closeAmount) {
      drawEyeArt(sctx, SRC_W, SRC_H, { closeAmount, lashes: false });
      halftoneDraw(ctx, src, dispW, dispH, 5);
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dispW = Math.round(rect.width) || 1;
      dispH = Math.round(rect.height) || 1;
      canvas.width = dispW;
      canvas.height = dispH;
      render(displayClose);
    }
    resize();
    window.addEventListener('resize', () => { clearTimeout(resize._t); resize._t = setTimeout(resize, 200); });

    function scrollCloseTarget() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return 0;
      const raw = window.scrollY / max;
      return Math.max(0, Math.min(1, (raw - 0.72) / 0.28));
    }

    stage.addEventListener('mouseenter', () => { hovering = true; });
    stage.addEventListener('mouseleave', () => { hovering = false; });

    let lastRendered = -1;
    function loop() {
      const target = hovering ? 0 : scrollCloseTarget();
      displayClose += (target - displayClose) * 0.12;
      if (Math.abs(displayClose - lastRendered) > 0.003) {
        render(displayClose);
        lastRendered = displayClose;
      }
      requestAnimationFrame(loop);
    }
    loop();
  }

  setupHeroEye();
  setupFooterEye();
})();

// ─────────────────────────────────────────────────────────────────────────
// Scroll reveals
// ─────────────────────────────────────────────────────────────────────────
(function reveals() {
  const items = document.querySelectorAll('.reveal, .split-text');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  items.forEach(item => io.observe(item));
})();

// ─────────────────────────────────────────────────────────────────────────
// Footer kinetic split text
// ─────────────────────────────────────────────────────────────────────────
(function splitText() {
  document.querySelectorAll('[data-split]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(word => {
      const chars = word.split('').map((ch, i) =>
        `<span class="char" style="transition-delay:${i * 22}ms">${ch}</span>`
      ).join('');
      return `<span class="word" style="display:inline-block;white-space:nowrap;">${chars}</span>`;
    }).join(' ');
  });
})();

// ─────────────────────────────────────────────────────────────────────────
// Magnetic hover
// ─────────────────────────────────────────────────────────────────────────
(function magnetic() {
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.4}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
})();

// ─────────────────────────────────────────────────────────────────────────
// Mobile nav toggle
// ─────────────────────────────────────────────────────────────────────────
(function mobileNav() {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => menu.classList.toggle('open'));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
})();
