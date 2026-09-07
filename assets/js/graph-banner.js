(() => {
  const canvas = document.getElementById("graph-banner-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Petersen graph: outer 5-cycle, inner pentagram, and spokes.
  const edges = [
    [0,1],[1,2],[2,3],[3,4],[4,0],
    [5,7],[7,9],[9,6],[6,8],[8,5],
    [0,5],[1,6],[2,7],[3,8],[4,9]
  ];

  const base = [
    [ 0, -1.00], [ 0.95, -0.31], [ 0.59,  0.81],
    [-0.59,  0.81], [-0.95, -0.31],
    [ 0, -0.48], [ 0.46, -0.15], [ 0.29, 0.39],
    [-0.29,  0.39], [-0.46, -0.15]
  ];

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0, height = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  new ResizeObserver(resize).observe(canvas);
  resize();

  function easeInOut(t) {
    return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;
  }

  function draw(ms) {
    const t = reducedMotion ? 0 : ms * 0.00016;

    ctx.clearRect(0, 0, width, height);

    // One complete back-and-forth journey.
    let travel = (t*0.3) % 2;
    if (travel > 1) travel = 2 - travel;

    // Keep the graph compact rather than stretching it across the banner.
    const radius = Math.min(height * 0.36, 62);
    const graphW = radius * 2.05;

    // Move between just inside the two edges.
    const margin = graphW / 2 + 18;
    const cx = margin + travel * Math.max(0, width - 2 * margin);
    const cy = height * 0.52;

    // Gentle overall rotation
    const angle = t * 0.8;

    // Slow, smooth deformations - each vertex gets its own gentle movement
    const pts = base.map(([x, y], i) => {
      // Vertex-specific phase for smooth, staggered movement
      const vertexPhase = i * (Math.PI * 2 / 10);

      // Gentle vertical displacement - vertices move up and down slowly
      const verticalShift = 0.25 * Math.sin(t * 3 + vertexPhase);

      // Gentle horizontal displacement - creates swirling motion
      const horizontalShift = 0.22 * Math.cos(t * 2 + vertexPhase);

      // Radial pulsing - vertices move closer and farther from center
      const distFromCenter = Math.sqrt(x*x + y*y);
      const radialPulse = 1 + 0.18 * Math.sin(t * 4 + vertexPhase) * distFromCenter;

      // Gentle stretching that shifts the whole shape
      const stretchX = 1 + 0.12 * Math.sin(t * 3);
      const stretchY = 1 + 0.10 * Math.cos(t * 2);

      // Apply stretching first
      let xx = x * stretchX;
      let yy = y * stretchY;

      // Apply radial pulsing
      xx *= radialPulse;
      yy *= radialPulse;

      // Add smooth displacements
      xx += horizontalShift;
      yy += verticalShift;

      // Apply rotation
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const rotatedX = xx * c - yy * s;
      const rotatedY = xx * s + yy * c;

      return [
        cx + radius * rotatedX,
        cy + radius * rotatedY
      ];
    });

    // Soft glow behind the graph
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.55);
    glow.addColorStop(0, "rgba(120, 170, 230, 0.12)");
    glow.addColorStop(1, "rgba(120, 170, 230, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.55, 0, Math.PI * 2);
    ctx.fill();

    // Edges - drawn first so vertices appear on top
    ctx.lineWidth = 1.15;
    ctx.strokeStyle = "rgba(130, 170, 215, 0.48)";
    edges.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(pts[a][0], pts[a][1]);
      ctx.lineTo(pts[b][0], pts[b][1]);
      ctx.stroke();
    });

    // Vertices on top
    pts.forEach(([x, y], i) => {
      const r = 3.2 + 0.45 * Math.sin(t * 2.4 + i);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(205, 225, 248, 0.92)";
      ctx.fill();
    });

    if (!reducedMotion) {
      requestAnimationFrame(draw);
    }
  }

  requestAnimationFrame(draw);
})();