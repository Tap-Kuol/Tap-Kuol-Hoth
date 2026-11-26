/* Binary rain: slow, faint 0/1 columns in the site colours.
   <canvas data-binary="full">  whole area (404 page)
   <canvas data-binary="edges"> only in the empty space left and right of the content (Home code section)
   <canvas data-binary="band">  thin strip above the footer */
(function () {
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('canvas[data-binary]').forEach(function (cv) {
    if (!cv.getContext) return;
    var mode = cv.getAttribute('data-binary'), ctx = cv.getContext('2d'), box = cv.parentNode;
    var W = 0, H = 0, cols = [], visible = true, raf = 0, last = 0, SIZE = mode === 'band' ? 13 : 15, ROW = SIZE * 1.2;
    // full mode: no digits over the text block, fading in gently around it (works at any screen width)
    var zone = null;
    var measureZone = function () {
      var t = mode === 'full' && box.querySelector(':scope > div');
      if (!t) { zone = null; return; }
      var r = t.getBoundingClientRect(), c = cv.getBoundingClientRect(), pad = 24;
      zone = { l: r.left - c.left - pad, r: r.right - c.left + pad, t: r.top - c.top - pad, b: r.bottom - c.top + pad };
    };
    var clearCentre = function (x, y) {
      if (!zone) return 1;
      var dx = Math.max(zone.l - x, 0, x - zone.r), dy = Math.max(zone.t - y, 0, y - zone.b);
      return Math.min(1, Math.sqrt(dx * dx + dy * dy) / 70);
    };
    var speed = function () { return (mode === 'band' ? 10 : 26) + Math.random() * (mode === 'band' ? 14 : 34); };

    var colour = function () {
      var dark = document.documentElement.getAttribute('data-theme') !== 'light';
      return dark ? { a: '34,211,238', b: '139,92,246', head: '241,246,253', k: 1 } : { a: '14,116,144', b: '109,40,217', head: '10,19,36', k: .8 };
    };
    var setup = function () {
      var r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height; if (!W || !H) return;
      cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      measureZone();
      var gap = SIZE * 1.6, xs = [], x;
      if (mode === 'edges') {
        var inner = box.querySelector('.container'), ir = inner.getBoundingClientRect(), L = ir.left - r.left + 12, R = ir.right - r.left - 12;
        for (x = gap / 2; x < L - gap / 2; x += gap) xs.push(x);
        for (x = W - gap / 2; x > R + gap / 2; x -= gap) xs.push(x);
      } else {
        var step = mode === 'band' ? gap * 1.4 : gap * 1.15;
        for (x = step / 2; x < W; x += step) xs.push(x);
      }
      var maxLen = mode === 'band' ? 6 : 22;
      cols = xs.map(function (cx) {
        var len = Math.max(4, Math.floor(maxLen * (.45 + Math.random() * .55))), chars = [];
        for (var i = 0; i < len; i++) chars.push(glyph());
        return { x: cx, y: Math.random() * (H + len * ROW), v: speed(), tint: Math.random() < .3 ? 'b' : 'a', len: len, chars: chars, red: Math.floor(Math.random() * len * 3) };
      });
      ctx.clearRect(0, 0, W, H);
      if (still) paintStill();
    };
    var glyph = function () { return Math.random() < .5 ? '0' : '1'; };
    var paintStill = function () {
      var c = colour(); ctx.font = '500 ' + SIZE + 'px "JetBrains Mono", Consolas, monospace'; ctx.textAlign = 'center';
      cols.forEach(function (col) {
        for (var i = 0; i < col.len; i++) {
          var a = .5 * (1 - i / col.len) * c.k * clearCentre(col.x, col.y - i * ROW); if (a <= .01) continue;
          ctx.fillStyle = 'rgba(' + c[col.tint] + ',' + a + ')'; ctx.fillText(col.chars[i], col.x, col.y - i * ROW);
        }
      });
    };
    var draw = function (dt) {
      var c = colour();
      ctx.clearRect(0, 0, W, H);
      ctx.font = '500 ' + SIZE + 'px "JetBrains Mono", Consolas, monospace'; ctx.textAlign = 'center';
      cols.forEach(function (col) {
        col.y += col.v * dt;
        if (Math.random() < dt * 1.5) col.chars[Math.floor(Math.random() * col.len)] = glyph(); // digits flicker now and then
        // each column is a trail: bright head at the bottom, fading towards the top
        for (var i = 0; i < col.len; i++) {
          var y = col.y - i * ROW; if (y < -ROW || y > H + ROW) continue;
          var fade = (1 - i / col.len) * clearCentre(col.x, y);
          if (fade <= 0.01) continue;
          if (i === 0) ctx.fillStyle = 'rgba(' + c.head + ',' + .75 * c.k + ')';
          else if (i === col.red) ctx.fillStyle = 'rgba(190,40,46,' + .85 * fade + ')';
          else ctx.fillStyle = 'rgba(' + c[col.tint] + ',' + (.62 * fade * c.k) + ')';
          ctx.fillText(col.chars[i], col.x, y);
        }
        if (col.y - col.len * ROW > H) { col.y = -Math.random() * H * .4; col.v = speed(); col.red = Math.floor(Math.random() * col.len * 3); }
      });
    };
    var frame = function (now) {
      raf = 0;
      if (now - last > 50) { draw(Math.min((now - last) / 1000, .1)); last = now; } // about 20 frames a second: slow and light
      start();
    };
    var start = function () { if (!still && visible && !document.hidden && !raf && W) raf = requestAnimationFrame(frame); };
    setup();
    if (window.ResizeObserver) new ResizeObserver(function () { setup(); start(); }).observe(box); else addEventListener('resize', setup);
    if (window.IntersectionObserver) new IntersectionObserver(function (e) { visible = e[e.length - 1].isIntersecting; start(); }).observe(cv);
    document.addEventListener('visibilitychange', start);
    document.addEventListener('themechange', function () { ctx.clearRect(0, 0, W, H); if (still) paintStill(); });
    start();
  });
})();
