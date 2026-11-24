/* ==========================================================================
   Interactive project demos: Currency converter, Rover-1 simulator, AI football
   Buttons:  <button class="demo-btn" data-demo="currency|rover|football">
   ========================================================================== */
(function () {
  var dialog, body, titleEl, cleanup = null;

  function ensureDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.className = 'demo-dialog';
    dialog.innerHTML =
      '<div class="demo-head"><div><span class="demo-kicker">Interactive demo</span><h3 class="demo-title"></h3></div>' +
      '<button class="icon-btn demo-close" type="button" aria-label="Close demo">×</button></div>' +
      '<div class="demo-body"></div>';
    document.body.appendChild(dialog);
    body = dialog.querySelector('.demo-body');
    titleEl = dialog.querySelector('.demo-title');
    dialog.querySelector('.demo-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', function () {
      if (dialog.open) return; // a new demo was opened straight away — keep it
      if (cleanup) { cleanup(); cleanup = null; }
      body.innerHTML = '';
    });
  }

  function open(kind) {
    ensureDialog();
    if (cleanup) { cleanup(); cleanup = null; }
    body.innerHTML = '';
    var b = builders[kind];
    if (!b) return;
    titleEl.textContent = b.title;
    cleanup = b.build(body) || null;
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
  }

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* ---------------- Currency converter ---------------- */
  var RATES = { // units per 1 USD — fixed EXAMPLE rates for the demo, not live data
    USD: 1, EUR: 0.92, GBP: 0.79, EGP: 48.5, SSP: 1300, SDG: 600, AED: 3.67, SAR: 3.75, JPY: 150, INR: 83, KES: 129, CNY: 7.2
  };
  var NAMES = {
    USD: 'US dollar', EUR: 'Euro', GBP: 'British pound', EGP: 'Egyptian pound', SSP: 'South Sudanese pound', SDG: 'Sudanese pound',
    AED: 'UAE dirham', SAR: 'Saudi riyal', JPY: 'Japanese yen', INR: 'Indian rupee', KES: 'Kenyan shilling', CNY: 'Chinese yuan'
  };
  function fmt(n) {
    var d = n >= 1000 ? 2 : n >= 1 ? 2 : 4;
    return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function currencyBuild(root) {
    var opts = Object.keys(RATES).map(function (c) { return '<option value="' + c + '">' + c + ' — ' + NAMES[c] + '</option>'; }).join('');
    root.innerHTML =
      '<div class="cx">' +
      '  <label class="cx-field"><span>Amount</span><input class="cx-amount" type="number" min="0" step="any" value="100" inputmode="decimal"></label>' +
      '  <div class="cx-row">' +
      '    <label class="cx-field"><span>From</span><select class="cx-from">' + opts + '</select></label>' +
      '    <button class="cx-swap" type="button" aria-label="Swap currencies">⇄</button>' +
      '    <label class="cx-field"><span>To</span><select class="cx-to">' + opts + '</select></label>' +
      '  </div>' +
      '  <div class="cx-result" aria-live="polite"><div class="cx-big"></div><div class="cx-rate"></div></div>' +
      '  <div class="cx-chips"></div>' +
      '  <p class="demo-note">Example rates for demonstration only — not live exchange rates.</p>' +
      '</div>';
    var amount = root.querySelector('.cx-amount'), from = root.querySelector('.cx-from'), to = root.querySelector('.cx-to');
    var big = root.querySelector('.cx-big'), rate = root.querySelector('.cx-rate'), chips = root.querySelector('.cx-chips');
    from.value = 'USD'; to.value = 'EGP';
    function calc() {
      var a = parseFloat(amount.value) || 0, r = RATES[to.value] / RATES[from.value];
      big.innerHTML = fmt(a) + ' ' + from.value + ' = <strong>' + fmt(a * r) + ' ' + to.value + '</strong>';
      rate.textContent = '1 ' + from.value + ' = ' + fmt(r) + ' ' + to.value + '   ·   1 ' + to.value + ' = ' + fmt(1 / r) + ' ' + from.value;
    }
    [['USD', 'EGP'], ['EUR', 'USD'], ['GBP', 'EGP'], ['USD', 'SSP'], ['EGP', 'SDG']].forEach(function (p) {
      var b = el('button', { type: 'button', 'class': 'filter' }, p[0] + ' → ' + p[1]);
      b.addEventListener('click', function () { from.value = p[0]; to.value = p[1]; calc(); });
      chips.appendChild(b);
    });
    root.querySelector('.cx-swap').addEventListener('click', function () { var t = from.value; from.value = to.value; to.value = t; calc(); });
    [amount, from, to].forEach(function (n) { n.addEventListener('input', calc); n.addEventListener('change', calc); });
    calc();
    setTimeout(function () { amount.focus(); amount.select(); }, 50);
  }

  /* ---------------- Rover-1 simulator ---------------- */
  function roverBuild(root) {
    root.innerHTML =
      '<div class="rv">' +
      '  <div class="rv-hud"><span class="rv-state">Driving</span><span class="rv-dist">— cm</span></div>' +
      '  <canvas class="rv-canvas" width="720" height="420" aria-label="Rover-1 simulator: click to place or remove boxes"></canvas>' +
      '  <div class="rv-actions">' +
      '    <button class="btn btn-primary btn-sm rv-pause" type="button">Pause</button>' +
      '    <button class="btn btn-ghost btn-sm rv-random" type="button">Random boxes</button>' +
      '    <button class="btn btn-ghost btn-sm rv-clear" type="button">Clear boxes</button>' +
      '    <button class="btn btn-ghost btn-sm rv-reset" type="button">Reset car</button>' +
      '  </div>' +
      '  <p class="demo-note"><strong>Click the arena</strong> to drop a box (click a box to remove it). Like the real Rover-1, the car drives until its ultrasonic sensor sees something close, stops, scans left and right, then turns toward the clearer side — or reverses if both are blocked.</p>' +
      '</div>';
    var cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
    var W = cv.width, H = cv.height, M = 14, BOX = 34, CAR = 13;
    var stateEl = root.querySelector('.rv-state'), distEl = root.querySelector('.rv-dist');
    var boxes = [], car, raf, paused = false;
    var DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // E, S, W, N (screen coords)

    function resetCar() { car = { x: 70, y: H / 2, dir: 0, ang: 0, sensor: 0, state: 'drive', t: 0, plan: null, rev: 0 }; }
    function randomBoxes() {
      boxes = [];
      var tries = 0;
      while (boxes.length < 9 && tries++ < 200) {
        var b = { x: M + 40 + Math.random() * (W - 2 * M - 80 - BOX), y: M + 20 + Math.random() * (H - 2 * M - 40 - BOX) };
        if (Math.hypot(b.x + BOX / 2 - car.x, b.y + BOX / 2 - car.y) < 90) continue;
        if (boxes.some(function (o) { return Math.abs(o.x - b.x) < BOX + 6 && Math.abs(o.y - b.y) < BOX + 6; })) continue;
        boxes.push(b);
      }
    }
    function blocked(px, py) {
      if (px < M + CAR || py < M + CAR || px > W - M - CAR || py > H - M - CAR) return true;
      return boxes.some(function (b) { return px > b.x - CAR && px < b.x + BOX + CAR && py > b.y - CAR && py < b.y + BOX + CAR; });
    }
    function ray(dir, max) {
      var d = DIRS[(dir + 4) % 4], dist = 0;
      while (dist < (max || 320)) { dist += 3; if (blocked(car.x + d[0] * dist, car.y + d[1] * dist)) return dist; }
      return max || 320;
    }
    function setState(s, label) { car.state = s; car.t = 0; stateEl.textContent = label; stateEl.dataset.s = s; }

    function step() {
      var ahead = ray(car.dir, 320);
      distEl.textContent = Math.round(ahead / 3) + ' cm';
      if (car.state === 'drive') {
        if (ahead < 42) { setState('stop', 'Obstacle! Stopping'); }
        else { var d = DIRS[car.dir]; car.x += d[0] * 1.8; car.y += d[1] * 1.8; }
      } else if (car.state === 'stop') {
        if (++car.t > 22) setState('scan', 'Scanning left ↔ right');
      } else if (car.state === 'scan') {
        car.t++;
        car.sensor = car.t < 35 ? -Math.min(1, car.t / 25) * 90 : Math.max(-90, -90 + (car.t - 35) / 25 * 180);
        if (car.sensor > 90) car.sensor = 90;
        if (car.t > 95) {
          car.sensor = 0;
          var l = ray(car.dir - 1, 320), r = ray(car.dir + 1, 320);
          if (Math.max(l, r) < 50) { car.rev = 0; setState('reverse', 'Both sides blocked — reversing'); }
          else { car.plan = l >= r ? -1 : 1; setState('turn', car.plan < 0 ? 'Left is clear — turning ↰' : 'Right is clear — turning ↱'); }
        }
      } else if (car.state === 'turn') {
        car.t++; car.ang = car.plan * Math.min(1, car.t / 28) * 90;
        if (car.t >= 28) { car.dir = (car.dir + car.plan + 4) % 4; car.ang = 0; setState('drive', 'Path clear — driving'); }
      } else if (car.state === 'reverse') {
        var bd = DIRS[car.dir], nx = car.x - bd[0] * 1.4, ny = car.y - bd[1] * 1.4;
        if (!blocked(nx, ny) && car.rev < 40) { car.x = nx; car.y = ny; car.rev += 1.4; }
        else { car.plan = 2; car.t = 0; setState('uturn', 'Turning around'); }
      } else if (car.state === 'uturn') {
        car.t++; car.ang = Math.min(1, car.t / 40) * 180;
        if (car.t >= 40) { car.dir = (car.dir + 2) % 4; car.ang = 0; setState('drive', 'Path clear — driving'); }
      }
    }

    function draw() {
      var dark = matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.getAttribute('data-theme') !== 'light' || document.documentElement.getAttribute('data-theme') === 'dark';
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = dark ? '#0f1724' : '#eef2f7'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = dark ? 'rgba(255,255,255,.05)' : 'rgba(15,23,42,.06)'; ctx.lineWidth = 1;
      for (var gx = M; gx < W; gx += 30) { ctx.beginPath(); ctx.moveTo(gx, M); ctx.lineTo(gx, H - M); ctx.stroke(); }
      for (var gy = M; gy < H; gy += 30) { ctx.beginPath(); ctx.moveTo(M, gy); ctx.lineTo(W - M, gy); ctx.stroke(); }
      ctx.strokeStyle = dark ? '#334155' : '#94a3b8'; ctx.lineWidth = 3; ctx.strokeRect(M, M, W - 2 * M, H - 2 * M);
      boxes.forEach(function (b) {
        ctx.fillStyle = '#b07a43'; ctx.fillRect(b.x, b.y, BOX, BOX);
        ctx.fillStyle = '#d9a466'; ctx.fillRect(b.x, b.y, BOX, 7);
        ctx.fillStyle = 'rgba(232,196,140,.55)'; ctx.fillRect(b.x + BOX / 2 - 3, b.y, 6, BOX);
      });
      // sensor beam
      var heading = car.dir * 90 + car.ang, look = (heading + car.sensor) * Math.PI / 180;
      var beam = car.state === 'scan' ? 140 : Math.min(140, ray(car.dir, 320));
      var grad = ctx.createRadialGradient(car.x, car.y, 4, car.x, car.y, beam);
      var hot = car.state === 'stop' || car.state === 'reverse';
      grad.addColorStop(0, hot ? 'rgba(248,113,113,.55)' : 'rgba(34,211,238,.5)'); grad.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.moveTo(car.x, car.y);
      ctx.arc(car.x, car.y, beam, look - .32, look + .32); ctx.closePath(); ctx.fill();
      // car body
      ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(heading * Math.PI / 180);
      ctx.fillStyle = '#111827'; [[-11, -15], [5, -15], [-11, 11], [5, 11]].forEach(function (w) { ctx.fillRect(w[0], w[1], 9, 4); });
      ctx.fillStyle = '#f5c518'; [[-9, -15], [7, -15], [-9, 11], [7, 11]].forEach(function (w) { ctx.fillRect(w[0], w[1], 4, 4); });
      ctx.fillStyle = '#1f2937'; ctx.fillRect(-14, -11, 28, 22);
      ctx.fillStyle = '#f97316'; ctx.fillRect(-9, -4, 14, 8);
      ctx.rotate(car.sensor * Math.PI / 180);
      ctx.fillStyle = '#2563eb'; ctx.fillRect(10, -7, 6, 14);
      ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.arc(16, -3.5, 2.4, 0, 7); ctx.arc(16, 3.5, 2.4, 0, 7); ctx.fill();
      ctx.restore();
    }

    function loop() { if (!paused) step(); draw(); raf = requestAnimationFrame(loop); }

    cv.addEventListener('click', function (e) {
      var r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
      var hit = boxes.findIndex(function (b) { return x >= b.x && x <= b.x + BOX && y >= b.y && y <= b.y + BOX; });
      if (hit >= 0) { boxes.splice(hit, 1); return; }
      var nb = { x: Math.max(M, Math.min(W - M - BOX, x - BOX / 2)), y: Math.max(M, Math.min(H - M - BOX, y - BOX / 2)) };
      if (Math.hypot(nb.x + BOX / 2 - car.x, nb.y + BOX / 2 - car.y) < 34) return; // not on top of the car
      boxes.push(nb);
    });
    root.querySelector('.rv-pause').addEventListener('click', function (e) { paused = !paused; e.target.textContent = paused ? 'Resume' : 'Pause'; });
    root.querySelector('.rv-random').addEventListener('click', randomBoxes);
    root.querySelector('.rv-clear').addEventListener('click', function () { boxes = []; });
    root.querySelector('.rv-reset').addEventListener('click', function () { resetCar(); setState('drive', 'Driving'); });

    resetCar(); randomBoxes(); setState('drive', 'Driving'); loop();
    return function () { cancelAnimationFrame(raf); };
  }

  /* ---------------- AI football analytics ---------------- */
  var PLAYERS = [ // example data for the demo
    { n: 10, team: 'a', pos: 'Midfielder', x: 62, y: 50, score: 8.6, speed: 28.4, dist: 9.8, pass: 87, sk: [92, 88, 85, 80, 55, 84] },
    { n: 7, team: 'a', pos: 'Winger', x: 40, y: 24, score: 7.9, speed: 31.2, dist: 10.4, pass: 79, sk: [95, 72, 70, 82, 40, 90] },
    { n: 8, team: 'a', pos: 'Midfielder', x: 44, y: 52, score: 7.4, speed: 26.1, dist: 11.2, pass: 91, sk: [70, 92, 88, 90, 66, 72] },
    { n: 4, team: 'a', pos: 'Defender', x: 26, y: 74, score: 7.1, speed: 27.0, dist: 9.1, pass: 84, sk: [74, 70, 62, 86, 90, 58] },
    { n: 1, team: 'a', pos: 'Goalkeeper', x: 9, y: 50, score: 6.8, speed: 18.3, dist: 4.6, pass: 72, sk: [45, 64, 60, 70, 88, 35] },
    { n: 9, team: 'b', pos: 'Striker', x: 58, y: 20, score: 7.6, speed: 30.5, dist: 9.4, pass: 74, sk: [90, 68, 72, 78, 38, 86] },
    { n: 5, team: 'b', pos: 'Defender', x: 75, y: 33, score: 6.9, speed: 26.8, dist: 8.9, pass: 81, sk: [72, 66, 58, 84, 88, 54] },
    { n: 3, team: 'b', pos: 'Defender', x: 78, y: 72, score: 7.2, speed: 27.9, dist: 9.6, pass: 83, sk: [76, 70, 60, 85, 86, 60] },
    { n: 11, team: 'b', pos: 'Winger', x: 58, y: 84, score: 7.0, speed: 30.1, dist: 10.1, pass: 77, sk: [93, 70, 68, 80, 42, 88] },
    { n: 1, team: 'b', pos: 'Goalkeeper', x: 91, y: 50, score: 6.5, speed: 17.9, dist: 4.2, pass: 69, sk: [44, 60, 58, 68, 86, 30] }
  ];
  var SKILLS = ['Pace', 'Passing', 'Vision', 'Stamina', 'Defence', 'Dribbling'];
  function radarPoints(vals, r) {
    return vals.map(function (v, i) {
      var a = -Math.PI / 2 + i * Math.PI / 3, k = v / 100 * r;
      return (Math.cos(a) * k).toFixed(1) + ',' + (Math.sin(a) * k).toFixed(1);
    }).join(' ');
  }
  function footballBuild(root) {
    var grid = [0.33, 0.66, 1].map(function (f) { return '<polygon points="' + radarPoints([100, 100, 100, 100, 100, 100].map(function (x) { return x * f; }), 60) + '"/>'; }).join('');
    var labels = SKILLS.map(function (s, i) {
      var a = -Math.PI / 2 + i * Math.PI / 3; return '<text x="' + (Math.cos(a) * 78).toFixed(0) + '" y="' + (Math.sin(a) * 74 + 3).toFixed(0) + '">' + s + '</text>';
    }).join('');
    root.innerHTML =
      '<div class="fb">' +
      '  <div class="fb-pitch" role="group" aria-label="Pitch: select a player">' +
      '    <svg class="fb-lines" viewBox="0 0 100 62" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="#fff" stroke-opacity=".7" stroke-width=".4"><rect x="3" y="3" width="94" height="56"/><line x1="50" y1="3" x2="50" y2="59"/><circle cx="50" cy="31" r="8"/><rect x="3" y="17" width="13" height="28"/><rect x="84" y="17" width="13" height="28"/></g></svg>' +
      '  </div>' +
      '  <aside class="fb-panel">' +
      '    <div class="fb-who"><span class="fb-num"></span><div><strong class="fb-name"></strong><small class="fb-pos"></small></div></div>' +
      '    <div class="fb-score"><span>Performance score</span><b></b></div><div class="fb-bar"><i></i></div>' +
      '    <dl class="fb-stats"><dt>Top speed</dt><dd class="s1"></dd><dt>Distance</dt><dd class="s2"></dd><dt>Pass accuracy</dt><dd class="s3"></dd></dl>' +
      '    <svg class="fb-radar" viewBox="-100 -88 200 176" aria-hidden="true"><g class="grid">' + grid + '</g><polygon class="shape" points=""/><g class="lbl">' + labels + '</g></svg>' +
      '  </aside>' +
      '  <p class="demo-note">Click any player to see the AI’s analysis. Example data for demonstration.</p>' +
      '</div>';
    var pitch = root.querySelector('.fb-pitch'), btns = [];
    PLAYERS.forEach(function (p, i) {
      var b = el('button', { type: 'button', 'class': 'fb-player ' + p.team, style: 'left:' + p.x + '%;top:' + p.y + '%', 'aria-label': (p.team === 'a' ? 'White' : 'Red') + ' team #' + p.n + ' ' + p.pos }, '<span>' + (p.pos === 'Goalkeeper' ? 'GK' : '#' + p.n) + '</span>');
      b.addEventListener('click', function () { select(i); });
      pitch.appendChild(b); btns.push(b);
    });
    function select(i) {
      var p = PLAYERS[i];
      btns.forEach(function (b, j) { b.classList.toggle('on', i === j); b.setAttribute('aria-pressed', i === j ? 'true' : 'false'); });
      root.querySelector('.fb-num').textContent = p.pos === 'Goalkeeper' ? 'GK' : p.n;
      root.querySelector('.fb-num').className = 'fb-num ' + p.team;
      root.querySelector('.fb-name').textContent = (p.team === 'a' ? 'White' : 'Red') + ' team · #' + p.n;
      root.querySelector('.fb-pos').textContent = p.pos + ' · tracked';
      root.querySelector('.fb-score b').textContent = p.score.toFixed(1);
      root.querySelector('.fb-bar i').style.width = (p.score * 10) + '%';
      root.querySelector('.s1').textContent = p.speed.toFixed(1) + ' km/h';
      root.querySelector('.s2').textContent = p.dist.toFixed(1) + ' km';
      root.querySelector('.s3').textContent = p.pass + '%';
      var shape = root.querySelector('.shape');
      shape.setAttribute('points', radarPoints(p.sk, 60));
      shape.classList.remove('pop'); void shape.getBoundingClientRect(); shape.classList.add('pop');
    }
    select(0);
  }

  var builders = {
    currency: { title: 'Currency Exchange App', build: currencyBuild },
    rover: { title: 'Rover-1 obstacle-avoidance simulator', build: roverBuild },
    football: { title: 'AI football analysis — select a player', build: footballBuild }
  };

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-demo]');
    if (!b) return;
    e.preventDefault();
    open(b.getAttribute('data-demo'));
  });

  // "Try it" badge on the media of any card that has a demo
  document.querySelectorAll('.project-card').forEach(function (card) {
    var btn = card.querySelector('.demo-btn');
    var media = card.querySelector('.project-media');
    if (!btn || !media) return;
    var chip = el('button', { type: 'button', 'class': 'try-chip', 'data-demo': btn.getAttribute('data-demo') }, '▶ Try it');
    media.appendChild(chip);
  });
})();
