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

// ─── Footer eye ─── illustrated eye (shared #eye-illustration symbol),
// eyelid covers slide closed as you scroll toward the end of the page,
// and peek open again on hover.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────
(function footerEye() {
  const stage = document.getElementById('footerEyeStage');
  if (!stage) return;
  let hovering = false, displayClose = 0;

  function scrollCloseTarget() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return 0;
    const raw = window.scrollY / max;
    return Math.max(0, Math.min(1, (raw - 0.72) / 0.28));
  }

  stage.addEventListener('mouseenter', () => { hovering = true; });
  stage.addEventListener('mouseleave', () => { hovering = false; });

  function loop() {
    const target = hovering ? 0 : scrollCloseTarget();
    displayClose += (target - displayClose) * 0.12;
    stage.style.setProperty('--close', displayClose.toFixed(4));
    requestAnimationFrame(loop);
  }
  loop();
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
