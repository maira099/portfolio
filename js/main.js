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
// Hero eye tracking
//
// The iris follows the pointer inside its eyelid. The mark sets its own two
// custom properties rather than being redrawn. Eyes hold still and then cross
// to a new target quickly, so the rate rises with how far there is left to go.
// ─────────────────────────────────────────────────────────────────────────
(function eyeTracking() {
  const eyes = [...document.querySelectorAll('.eye')];
  const sym = document.getElementById('eyeMark');
  if (!eyes.length || !sym) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (matchMedia('(hover: none), (pointer: coarse)').matches) return;

  // Every placement references one symbol, so the geometry is read once from
  // it. The circles themselves live in the shadow tree each <use> builds and
  // cannot be reached from here — but custom properties set on the host do
  // cross into it, which is what carries the aim.
  const irisEl = sym.querySelector('.mark__iris');
  const pupEl = sym.querySelector('.mark__pupil');
  const RIM = +irisEl.getAttribute('r') - +pupEl.getAttribute('r') - 3;
  const REST_X = +pupEl.getAttribute('cx') - +irisEl.getAttribute('cx');
  const REST_Y = +pupEl.getAttribute('cy') - +irisEl.getAttribute('cy');

  // How far the iris travels, in the mark's own coordinates. Past this it
  // would ride out over the bands behind it.
  const REACH_X = 26, REACH_Y = 8;
  // How far the pupil crosses the iris. The artwork parks it up and to the
  // right; carried at a fixed offset it stays in that corner however the eye
  // turns, which is what made the eye look dead.
  const ROAM_X = 26, ROAM_Y = 14;

  let px = innerWidth / 2, py = innerHeight / 2;
  const at = eyes.map(() => ({ x: 0, y: 0 }));
  window.addEventListener('mousemove', e => { px = e.clientX; py = e.clientY; });

  (function frame() {
    eyes.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.width) {
        const tx = clamp((px - (r.left + r.width / 2)) / (innerWidth * 0.5), -1, 1) * REACH_X;
        const ty = clamp((py - (r.top + r.height / 2)) / (innerHeight * 0.5), -1, 1) * REACH_Y;
        const a = at[i];
        const rate = Math.hypot(tx - a.x, ty - a.y) > 1.5 ? 0.2 : 0.07;
        a.x += (tx - a.x) * rate;
        a.y += (ty - a.y) * rate;
        el.style.setProperty('--eye-x', a.x.toFixed(2) + 'px');
        el.style.setProperty('--eye-y', a.y.toFixed(2) + 'px');
        // Narrowing by the cosine of how far it has turned is what separates
        // a ball rotating from a disc sliding across the opening.
        el.style.setProperty('--eye-sx', (1 - 0.11 * Math.abs(a.x) / REACH_X).toFixed(3));
        el.style.setProperty('--eye-sy', (1 - 0.06 * Math.abs(a.y) / REACH_Y).toFixed(3));

        // Where the pupil sits on the iris, held inside the rim so it can
        // never wander off the ball it belongs to.
        let ox = REST_X + (a.x / REACH_X) * ROAM_X;
        let oy = REST_Y + (a.y / REACH_Y) * ROAM_Y;
        const d = Math.hypot(ox, oy);
        if (d > RIM) { ox *= RIM / d; oy *= RIM / d; }
        el.style.setProperty('--pupil-x', (ox - REST_X).toFixed(2) + 'px');
        el.style.setProperty('--pupil-y', (oy - REST_Y).toFixed(2) + 'px');
      }
    });
    requestAnimationFrame(frame);
  })();

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
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
