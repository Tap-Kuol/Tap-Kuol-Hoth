/* Site-wide: moving backgrounds, card glow, command menu (Ctrl+K) */
(function () {
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Neural network ---------- */
  var cv = document.querySelector('[data-neural]');
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d'), hero = cv.parentNode, W = 0, H = 0, nodes = [], pulses = [];
    var mouse = null, raf = 0, visible = true, last = 0, LINK = 150, small = false;

    /* Inner-page backgrounds: "chip" (Projects), "circuit" (spare) and "code" (About, Education, Notes) */
    var mode = cv.getAttribute('data-neural') || 'net', traces = [], glyphs = [];
    var build = function () {
      traces = []; glyphs = [];
      var i;
      if (mode === 'circuit') {
        var S = 30, count = Math.min(26, Math.round(W * H / 20000) + 5);
        for (i = 0; i < count; i++) {
          var x = Math.round(Math.random() * W / S) * S, y = Math.round(Math.random() * H / S) * S, pts = [[x, y]], dir = Math.random() < .5 ? 1 : -1;
          for (var s = 0; s < 4; s++) {
            var len = S * (1 + Math.floor(Math.random() * 4));
            if (s % 2 === 0) x += len * dir; else { x += S * dir; y += S * (Math.random() < .5 ? 1 : -1); }
            pts.push([x, y]);
          }
          traces.push({ p: pts, t: Math.random() * 6, v: Math.random() < .3 });
        }
      }
      if (mode === 'chip') {
        // Processor core: traces from four sides run into a chip on the right; pulses flow into it
        var s = small ? 40 : 68, reach = Math.min(small ? 70 : 165, W * .12), cx = W - Math.max(reach + s / 2 + 20, W * .14), cy = H * .5, step = small ? 13 : 21;
        chip = { x: cx, y: cy, s: s, t: 0 };
        for (var side = 0; side < 4; side++) for (var k = -2; k <= 2; k++) {
          var off = k * step, h = s / 2, p;
          if (side === 0) p = [[cx - h - reach, cy + off * 1.6], [cx - h - reach * .36, cy + off * 1.6], [cx - h - reach * .14, cy + off], [cx - h, cy + off]];
          if (side === 1) p = [[cx + h + reach, cy + off * 1.6], [cx + h + reach * .36, cy + off * 1.6], [cx + h + reach * .14, cy + off], [cx + h, cy + off]];
          if (side === 2) p = [[cx + off * 1.8, cy - h - reach * .86], [cx + off * 1.8, cy - h - reach * .3], [cx + off, cy - h - reach * .12], [cx + off, cy - h]];
          if (side === 3) p = [[cx + off * 1.8, cy + h + reach * .86], [cx + off * 1.8, cy + h + reach * .3], [cx + off, cy + h + reach * .12], [cx + off, cy + h]];
          var L = 0; for (var q = 0; q < p.length - 1; q++) L += Math.hypot(p[q + 1][0] - p[q][0], p[q + 1][1] - p[q][1]);
          traces.push({ p: p, L: L, d: Math.random() * L * 2 - L, sp: 50 + Math.random() * 40, red: Math.random() < .2 });
        }
        // Memory bank on the left (wide screens only): two modules with blinking lights, sending data towards the chip
        mems = [];
        if (!small) {
          for (var m = 0; m < 2; m++) {
            var mod = { x: W * .07 + m * 46, y: cy - 72, w: 30, h: 144, leds: [] };
            for (var l = 0; l < 6; l++) mod.leds.push(Math.random() * 6);
            mems.push(mod);
          }
          for (var r = 0; r < 5; r++) {
            var yy = cy - 48 + r * 24, sx = W * .07 + 76, mp = [[sx, yy], [W * .26, yy], [W * .26 + 20, yy + (r - 2) * 6], [W * .4, yy + (r - 2) * 6]];
            var ML = 0; for (var mq = 0; mq < mp.length - 1; mq++) ML += Math.hypot(mp[mq + 1][0] - mp[mq][0], mp[mq + 1][1] - mp[mq][1]);
            traces.push({ p: mp, L: ML, d: Math.random() * ML * 2 - ML, sp: 50 + Math.random() * 40, red: Math.random() < .2 });
          }
        }
      }
      if (mode === 'code') {
        var words = ['{ }', '</>', '=>', 'if', '01', '10', 'return', '[ ]', 'SELECT', 'class', '++', '&&', 'def', 'const', ';'];
        var n = Math.min(small ? 22 : 60, Math.round(W * H / 9000));
        for (i = 0; i < n; i++) glyphs.push({ x: Math.random() * W, y: Math.random() * H, s: 5 + Math.random() * 13, w: words[i % words.length], v: Math.random() < .3, z: 11 + Math.random() * 6 });
      }
    };
    var chip = null, mems = [];
    var along = function (p, d) {
      for (var i = 0; i < p.length - 1; i++) { var a = p[i], b = p[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d <= l) return [a[0] + (b[0] - a[0]) * d / l, a[1] + (b[1] - a[1]) * d / l]; d -= l; }
      return p[p.length - 1];
    };
    var drawChip = function (dt, cyan, violet, dark) {
      var red = '192,52,58';
      ctx.lineCap = 'round';
      traces.forEach(function (o) {
        ctx.strokeStyle = 'rgba(' + cyan + ',' + (dark ? .2 : .26) + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(o.p[0][0], o.p[0][1]); for (var i = 1; i < o.p.length; i++) ctx.lineTo(o.p[i][0], o.p[i][1]); ctx.stroke();
        ctx.fillStyle = 'rgba(' + cyan + ',.45)'; ctx.beginPath(); ctx.arc(o.p[0][0], o.p[0][1], 2.2, 0, 7); ctx.fill();
        o.d += o.sp * dt; if (o.d > o.L + 160) { o.d = -Math.random() * 200; o.red = Math.random() < .2; }
        if (o.d > 0) { // pulse with a fading tail
          var head = Math.min(o.d, o.L), rgb = o.red ? red : cyan;
          for (var k = 0; k < 12; k++) {
            var d1 = head - 50 * k / 12, d2 = head - 50 * (k + 1) / 12; if (d2 < 0) break;
            var p1 = along(o.p, d1), p2 = along(o.p, d2);
            ctx.strokeStyle = 'rgba(' + rgb + ',' + (.9 * (1 - k / 12)) + ')'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
          }
          var hp = along(o.p, head); ctx.fillStyle = 'rgba(' + rgb + ',1)'; ctx.beginPath(); ctx.arc(hp[0], hp[1], 2.2, 0, 7); ctx.fill();
        }
      });
      chip.t += dt;
      var g = .5 + .5 * Math.sin(chip.t * 1.6), s = chip.s, x = chip.x - s / 2, y = chip.y - s / 2;
      ctx.shadowColor = 'rgba(' + violet + ',' + (.5 + .4 * g) + ')'; ctx.shadowBlur = 30 + 20 * g;
      ctx.fillStyle = dark ? '#0d1426' : '#ffffff'; ctx.strokeStyle = 'rgba(' + violet + ',.9)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, s, s, 8); else ctx.rect(x, y, s, s); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(' + cyan + ',' + (.35 + .4 * g) + ')'; ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x + s * .21, y + s * .21, s * .58, s * .58, 4); else ctx.rect(x + s * .21, y + s * .21, s * .58, s * .58); ctx.stroke();
      ctx.fillStyle = 'rgba(' + red + ',' + (.6 + .4 * g) + ')'; ctx.beginPath(); ctx.arc(chip.x, chip.y, 3, 0, 7); ctx.fill();
      mems.forEach(function (md, i) {
        ctx.fillStyle = dark ? '#0d1426' : '#ffffff'; ctx.strokeStyle = 'rgba(' + violet + ',.75)'; ctx.lineWidth = 1.3;
        ctx.shadowColor = 'rgba(' + violet + ',.5)'; ctx.shadowBlur = 18;
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(md.x, md.y, md.w, md.h, 4); else ctx.rect(md.x, md.y, md.w, md.h); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(' + cyan + ',.35)';
        for (var p = 0; p < 9; p++) ctx.fillRect(md.x + md.w, md.y + 10 + p * 14, 5, 3);
        md.leds.forEach(function (ph, k) {
          var on = (Math.sin(chip.t * 3 + ph) + 1) / 2;
          ctx.fillStyle = 'rgba(' + (k === 2 && i === 0 ? red : cyan) + ',' + (.25 + .7 * on) + ')';
          ctx.beginPath(); ctx.arc(md.x + md.w / 2, md.y + 18 + k * 22, 3, 0, 7); ctx.fill();
        });
      });
    };
    var drawMode = function (dt, cyan, violet, dark) {
      if (mode === 'chip') { drawChip(dt, cyan, violet, dark); return; }
      traces.forEach(function (tr) {
        var c = tr.v ? violet : cyan, p = tr.p, end = p[p.length - 1];
        ctx.strokeStyle = 'rgba(' + c + ',' + (dark ? .34 : .28) + ')'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); p.slice(1).forEach(function (q) { ctx.lineTo(q[0], q[1]); }); ctx.stroke();
        ctx.fillStyle = 'rgba(' + c + ',.6)';
        [p[0], end].forEach(function (q) { ctx.beginPath(); ctx.arc(q[0], q[1], 3, 0, 7); ctx.fill(); });
        tr.t = (tr.t + dt * 1.4) % 7; // travel along the trace, then rest
        var seg = Math.floor(tr.t);
        if (seg < p.length - 1) {
          var f = tr.t - seg, a = p[seg], b = p[seg + 1];
          ctx.fillStyle = 'rgba(251,146,60,.95)';
          ctx.beginPath(); ctx.arc(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, 2.6, 0, 7); ctx.fill();
        }
      });
      glyphs.forEach(function (g) {
        g.y -= g.s * dt; if (g.y < -20) { g.y = H + 20; g.x = Math.random() * W; }
        ctx.font = '500 ' + g.z + 'px "JetBrains Mono", Consolas, monospace';
        ctx.fillStyle = 'rgba(' + (g.v ? violet : cyan) + ',' + (dark ? .42 : .36) + ')';
        ctx.fillText(g.w, g.x, g.y);
      });
    };

    var resize = function () {
      var r = hero.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      if (Math.abs(r.width - W) < 1 && Math.abs(r.height - H) < 1) return;
      W = r.width; H = r.height; small = W < 700;
      cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      var n = Math.min(small ? 38 : 115, Math.round(W * H / 8000));
      if (mode !== 'net') n = 0;
      nodes = []; pulses = [];
      for (var i = 0; i < n; i++) nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * 16, vy: (Math.random() - .5) * 16, v: Math.random() < .25 });
      build(); draw(0);
    };
    var draw = function (dt) {
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      var cyan = dark ? '34,211,238' : '14,116,144', violet = dark ? '139,92,246' : '109,40,217', k = dark ? .38 : .28;
      var links = [], i, j;
      ctx.clearRect(0, 0, W, H);
      if (mode !== 'net') { drawMode(dt, cyan, violet, dark); return; }
      nodes.forEach(function (p) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 0 || p.x > W) { p.vx = -p.vx; p.x = Math.max(0, Math.min(W, p.x)); }
        if (p.y < 0 || p.y > H) { p.vy = -p.vy; p.y = Math.max(0, Math.min(H, p.y)); }
      });
      for (i = 0; i < nodes.length; i++) for (j = i + 1; j < nodes.length; j++) {
        var a = nodes[i], b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, l = Math.sqrt(dx * dx + dy * dy);
        if (l > LINK) continue;
        links.push([a, b]);
        ctx.strokeStyle = 'rgba(' + (a.v ? violet : cyan) + ',' + ((1 - l / LINK) * k) + ')';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      if (mouse) nodes.forEach(function (p) {
        var l = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (l > 190) return;
        ctx.strokeStyle = 'rgba(' + cyan + ',' + ((1 - l / 190) * .6) + ')';
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      });
      nodes.forEach(function (p) {
        ctx.fillStyle = 'rgba(' + (p.v ? violet : cyan) + ',.5)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.v ? 2.6 : 1.8, 0, 7); ctx.fill();
      });
      if (dt && links.length && pulses.length < (small ? 3 : 8) && Math.random() < .05) {
        var e = links[Math.floor(Math.random() * links.length)]; pulses.push({ a: e[0], b: e[1], t: 0 });
      }
      pulses = pulses.filter(function (p) {
        p.t += dt * .9; if (p.t > 1) return false;
        ctx.fillStyle = 'rgba(251,146,60,.95)';
        ctx.beginPath(); ctx.arc(p.a.x + (p.b.x - p.a.x) * p.t, p.a.y + (p.b.y - p.a.y) * p.t, 2.2, 0, 7); ctx.fill();
        return true;
      });
    };
    var frame = function (now) {
      raf = 0;
      // phones draw at about half the frame rate
      if (!small || now - last > 30) { draw(Math.min((now - last) / 1000, .05)); last = now; }
      start();
    };
    var start = function () { if (!still && visible && !document.hidden && !raf) raf = requestAnimationFrame(frame); };
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(hero); else addEventListener('resize', resize);
    if (window.IntersectionObserver) new IntersectionObserver(function (e) { visible = e[e.length - 1].isIntersecting; start(); }).observe(hero);
    document.addEventListener('visibilitychange', start);
    document.addEventListener('themechange', function () { draw(0); });
    if (!still) {
      hero.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; var r = hero.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
      hero.addEventListener('pointerleave', function () { mouse = null; });
    }
    start();
  }

  /* ---------- Card glow ---------- */
  document.querySelectorAll('.glow').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- Command menu ---------- */
  var go = function (u) { return function () { location.href = u; }; };
  var demo = function (n) { return function () { var b = document.querySelector('.demo-btn[data-demo="' + n + '"]'); if (b) b.click(); else if (location.hash !== '#demo=' + n) location.href = 'projects.html#demo=' + n; }; };
  var items = [
    ['About', 'page', go('about.html')], ['Education', 'page', go('education.html')], ['Projects', 'page', go('projects.html')],
    ['Tours', 'page', go('tours.html')], ['Community', 'page', go('community.html')], ['CV', 'page', go('cv.html')],
    ['Home', 'page', go('index.html')], ['Contact', 'section', go('index.html#contact')],
    ['Try the football analysis', 'demo', demo('football')], ['Try the Rover-1 simulator', 'demo', demo('rover')], ['Try the currency converter', 'demo', demo('currency')],
    ['Switch light / dark theme', 'action', function () { document.querySelector('.theme-toggle').click(); }],
    ['Send an email', 'action', go('mailto:tapkuol34@gmail.com')],
    ['GitHub profile', 'link', go('https://github.com/Tap-Kuol')], ['LinkedIn profile', 'link', go('https://www.linkedin.com/in/tap-kuol-73ba93175/')]
  ];
  var wanted = /^#demo=(\w+)$/.exec(location.hash);
  if (wanted) setTimeout(demo(wanted[1]), 300);
  var dlg, input, list, shown = [], sel = 0;
  var render = function () {
    var q = input.value.trim().toLowerCase();
    shown = items.filter(function (it) { return (it[0] + ' ' + it[1]).toLowerCase().indexOf(q) !== -1; });
    sel = Math.max(0, Math.min(sel, shown.length - 1));
    list.textContent = '';
    shown.forEach(function (it, i) {
      var li = document.createElement('li'), k = document.createElement('small');
      li.id = 'cmd-' + i; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', i === sel);
      li.textContent = it[0]; k.textContent = it[1]; li.appendChild(k);
      li.addEventListener('click', function () { run(i); });
      list.appendChild(li);
      if (i === sel && dlg.open) li.scrollIntoView({ block: 'nearest' });
    });
    if (!shown.length) { var none = document.createElement('li'); none.textContent = 'No matches'; list.appendChild(none); }
    if (shown.length) input.setAttribute('aria-activedescendant', 'cmd-' + sel); else input.removeAttribute('aria-activedescendant');
  };
  var run = function (i) { var it = shown[i]; if (!it) return; dlg.close(); setTimeout(it[2], 0); };
  var open = function () {
    if (!window.HTMLDialogElement || document.querySelector('dialog[open]')) return;
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.className = 'cmd'; dlg.setAttribute('aria-label', 'Command menu');
      dlg.innerHTML = '<input type="text" role="combobox" aria-expanded="true" aria-controls="cmd-list" aria-label="Search pages, projects and actions" placeholder="Type a command or search…" autocomplete="off"><ul id="cmd-list" role="listbox" aria-label="Results"></ul><p>↑ ↓ to move · Enter to open · Esc to close</p>';
      document.body.appendChild(dlg);
      input = dlg.querySelector('input'); list = dlg.querySelector('ul');
      input.addEventListener('input', function () { sel = 0; render(); });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (shown.length) { sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length; render(); } }
        if (e.key === 'Enter') { e.preventDefault(); run(sel); }
      });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    }
    input.value = ''; sel = 0; render(); dlg.showModal(); input.focus();
  };
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') { e.preventDefault(); if (dlg && dlg.open) dlg.close(); else open(); }
  });
  document.querySelectorAll('[data-cmd]').forEach(function (b) { b.addEventListener('click', open); });
})();
