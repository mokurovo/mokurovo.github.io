(() => {
  const trail = document.getElementById('star-cursor-trail');
  const glowPath = document.getElementById('cursor-trail-glow');
  const softGlowPath = document.getElementById('cursor-trail-soft-glow');
  const linePath = document.getElementById('cursor-trail-line');
  const corePath = document.getElementById('cursor-trail-core');
  const gradient = document.getElementById('cursor-trail-gradient');
  const cursor = document.getElementById('star-cursor');
  const cursorShape = cursor?.querySelector('svg');
  if (!trail || !glowPath || !softGlowPath || !linePath || !corePath || !gradient || !cursor || !cursorShape) return;

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!finePointer.matches || reducedMotion.matches) return;

  document.body.classList.add('has-star-cursor');

  let pointerActive = false;
  let pointerX = -100;
  let pointerY = -100;
  let lastPoint = null;
  let targetRotation = 0;
  let rafId = 0;
  const points = [];
  const MAX_TRAIL_AGE = 1400;
  const MAX_TRAIL_LENGTH = 760;
  const SAMPLE_SPACING = 7.5;
  const STOP_FADE = 1400;

  const clamp01 = value => Math.max(0, Math.min(1, value));

  function resize() {
    trail.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
  }

  function isNativeTarget(target) {
    return !!(target && target.closest && target.closest('input, textarea, select, [contenteditable="true"], iframe'));
  }

  function updateCursor() {
    cursor.style.transform = `translate3d(${pointerX}px,${pointerY}px,0) translate(-50%,-50%)`;
  }

  function scheduleRender() {
    if (!rafId) rafId = requestAnimationFrame(render);
  }

  function trimTrail(now) {
    while (points.length && now - points[0].time > MAX_TRAIL_AGE) points.shift();
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }
    while (length > MAX_TRAIL_LENGTH && points.length > 2) {
      length -= Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
      points.shift();
    }
  }

  function appendInterpolated(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.35) return;
    const steps = Math.max(1, Math.ceil(distance / SAMPLE_SPACING));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      points.push({
        x: from.x + dx * t,
        y: from.y + dy * t,
        time: from.time + (to.time - from.time) * t
      });
    }
  }

  function segmentControls(index) {
    const last = points.length - 1;
    const p0 = points[Math.max(0, index - 1)];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[Math.min(last, index + 2)];
    return {
      p1, p2,
      c1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      c2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    };
  }

  function buildPath() {
    if (points.length < 2) return '';
    let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const s = segmentControls(i);
      d += ` C ${s.c1.x.toFixed(2)} ${s.c1.y.toFixed(2)} ${s.c2.x.toFixed(2)} ${s.c2.y.toFixed(2)} ${s.p2.x.toFixed(2)} ${s.p2.y.toFixed(2)}`;
    }
    return d;
  }

  function setPath(d, opacity) {
    glowPath.setAttribute('d', d);
    softGlowPath.setAttribute('d', d);
    linePath.setAttribute('d', d);
    corePath.setAttribute('d', d);
    trail.style.opacity = String(opacity);
  }

  function render(now) {
    rafId = 0;
    trimTrail(now);

    if (points.length > 1) {
      const first = points[0];
      const last = points[points.length - 1];
      const idleFade = clamp01(1 - Math.max(0, now - last.time) / STOP_FADE);
      const d = buildPath();
      gradient.setAttribute('x1', first.x.toFixed(2));
      gradient.setAttribute('y1', first.y.toFixed(2));
      gradient.setAttribute('x2', last.x.toFixed(2));
      gradient.setAttribute('y2', last.y.toFixed(2));
      setPath(d, idleFade);
    } else {
      setPath('', 0);
    }

    if (points.length > 1) scheduleRender();
  }

  function clearCursor() {
    pointerActive = false;
    lastPoint = null;
    points.length = 0;
    cursor.classList.remove('is-visible');
    cursor.style.transform = 'translate3d(-100px,-100px,0) translate(-50%,-50%)';
    setPath('', 0);
  }

  function updateDirection(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.hypot(dx, dy) < 2.2) return;
    const desired = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    const delta = ((desired - targetRotation + 540) % 360) - 180;
    targetRotation += delta;
    cursorShape.style.transform = `rotate(${targetRotation.toFixed(2)}deg)`;
  }

  function onPointerMove(event) {
    if (event.pointerType === 'touch') return;
    if (isNativeTarget(event.target)) {
      pointerActive = false;
      lastPoint = null;
      points.length = 0;
      cursor.classList.remove('is-visible');
      setPath('', 0);
      return;
    }

    const now = performance.now();
    const current = { x: event.clientX, y: event.clientY, time: now };

    if (!pointerActive || !lastPoint) {
      pointerActive = true;
      pointerX = current.x;
      pointerY = current.y;
      lastPoint = current;
      cursor.classList.add('is-visible');
      updateCursor();
      return;
    }

    updateDirection(lastPoint, current);
    appendInterpolated(lastPoint, current);
    pointerX = current.x;
    pointerY = current.y;
    lastPoint = current;
    cursor.classList.add('is-visible');
    updateCursor();
    if (points.length > 1) scheduleRender();
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('blur', clearCursor);
  document.addEventListener('mouseleave', clearCursor, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearCursor();
  });
  finePointer.addEventListener?.('change', event => {
    if (!event.matches) {
      document.body.classList.remove('has-star-cursor');
      clearCursor();
    }
  });
  reducedMotion.addEventListener?.('change', event => {
    if (event.matches) {
      document.body.classList.remove('has-star-cursor');
      clearCursor();
    }
  });

  document.addEventListener('pointermove', onPointerMove, { passive: true });
})();
