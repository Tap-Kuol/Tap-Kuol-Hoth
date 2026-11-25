/* Tech layer: scroll progress, decoded labels, rotating role, count-up numbers, card edge light, interactive terminal */
(function () {
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var io = function (el, fn, threshold) {
    if (!window.IntersectionObserver) { fn(); return; }
    var o = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { o.disconnect(); fn(); } }, { threshold: threshold || 0.3 });
    o.observe(el);
  };

  /* Scroll progress line under the header */
  var header = document.querySelector('.site-header');
  if (header) {
    var bar = document.createElement('div'); bar.className = 'scroll-line'; bar.setAttribute('aria-hidden', 'true'); header.appendChild(bar);
    var queued = false;
    var paint = function () {
      queued = false;
      var max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')';
    };
    addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(paint); } }, { passive: true });
    addEventListener('resize', paint); paint();
  }

  /* Section labels "decode" once when they come into view */
  if (!still) document.querySelectorAll('.eyebrow').forEach(function (el) {
    if (el.children.length) return;
    var text = el.textContent, set = '01<>/{}[]#*+=';
    io(el, function () {
      var t0 = performance.now();
      var step = function (now) {
        var k = Math.min(1, (now - t0) / 700), n = Math.floor(k * text.length);
        el.textContent = text.slice(0, n) + text.slice(n).replace(/\S/g, function () { return set[Math.floor(Math.random() * set.length)]; });
        if (k < 1) requestAnimationFrame(step); else el.textContent = text;
      };
      requestAnimationFrame(step);
    });
  });

  /* Rotating role on Home: types two rounds, then rests on the first word */
  var role = document.querySelector('[data-rotate]');
  if (role && !still) {
    var words = role.getAttribute('data-rotate').split('|'), round = 0, w = 0;
    var type = function (word, i, done) { role.textContent = word.slice(0, i); if (i < word.length) setTimeout(type, 55, word, i + 1, done); else setTimeout(done, 1900); };
    var erase = function (done) { var s = role.textContent; if (!s) { done(); return; } role.textContent = s.slice(0, -1); setTimeout(erase, 28, done); };
    var next = function () {
      if (w === 0 && round === 2) { role.classList.add('rest'); return; }
      erase(function () { w = (w + 1) % words.length; if (w === 0) round++; type(words[w], 1, next); });
    };
    role.classList.add('typing'); setTimeout(next, 2600);
  }

  /* Count-up numbers (the real number is already in the page) */
  if (!still) document.querySelectorAll('[data-count]').forEach(function (el) {
    var end = parseInt(el.textContent, 10);
    io(el, function () {
      var t0 = performance.now();
      var step = function (now) { var k = Math.min(1, (now - t0) / 900); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  });

  /* Light that follows the mouse along card edges */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.card, .cta, .code-window').forEach(function (c) {
      c.classList.add('edge');
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* Interactive terminal. Every answer is prepared text: nothing is sent anywhere. */
  var term = document.querySelector('[data-terminal]');
  if (!term) return;
  term.innerHTML = '<div class="code-bar" aria-hidden="true"><i></i><i></i><i></i><span>terminal</span></div>' +
    '<div class="term-out" role="log" aria-live="polite" aria-label="Terminal output" tabindex="0"></div>' +
    '<form class="term-in" autocomplete="off"><label><span aria-hidden="true">visitor@tap:~$</span><input type="text" aria-label="Type a command, for example help" placeholder="type help" spellcheck="false" autocapitalize="none" maxlength="60"></label></form>' +
    '<div class="term-keys"></div>';
  term.hidden = false;
  var out = term.querySelector('.term-out'), form = term.querySelector('form'), input = term.querySelector('input'), keys = term.querySelector('.term-keys');
  var print = function (text, cls, href) {
    var p = document.createElement('p'); if (cls) p.className = cls;
    if (href) { var a = document.createElement('a'); a.href = href; a.textContent = text; p.appendChild(a); } else p.textContent = text;
    out.appendChild(p);
  };
  var pages = { home: 'index.html', about: 'about.html', education: 'education.html', projects: 'projects.html', tours: 'tours.html', community: 'community.html', cv: 'cv.html' };
  var demos = ['football', 'rover', 'currency'];
  var cmds = {
    help: function () {
      print('whoami        who I am'); print('skills        languages and tools'); print('projects      what I have built');
      print('experience    where I work'); print('education     where I studied'); print('contact       how to reach me');
      print('open <page>   ' + Object.keys(pages).join(', ')); print('demo <name>   ' + demos.join(', ')); print('theme         light / dark'); print('clear         empty the screen');
    },
    whoami: function () { print('Tap Kuol Hoth, Software Engineer at CardoO.'); print('From Bentiu, South Sudan. Based in Cairo, Egypt.'); },
    skills: function () { print('Languages  C++, C#, Java, Python, SQL, JavaScript'); print('ERP and AI Odoo ERP, n8n, AI automation'); print('Web, data  HTML5, CSS3, MySQL, SQL Server'); print('Tools      Git, GitHub, VS Code, Postman'); },
    projects: function () { print('1. AI Sports Performance Dashboard (2024, Excellent)'); print('2. Odoo ERP, website and AI automation at CardoO'); print('3. Rover-1 robotic car in C++ (2019)'); print('4. Currency Exchange App'); print('Open the Projects page', '', 'projects.html'); },
    experience: function () { print('Nov 2025 to now: Software Engineer, CardoO, Tech Department'); },
    education: function () { print('2019 to 2024: B.Sc. Computer and Information Sciences,'); print('Ain Shams University, Information Systems'); print('2025: CCNA and CCNP training, T-Plus'); },
    contact: function () { print('tapkuol34@gmail.com', '', 'mailto:tapkuol34@gmail.com'); print('linkedin.com/in/tap-kuol-73ba93175', '', 'https://www.linkedin.com/in/tap-kuol-73ba93175/'); },
    theme: function () { document.querySelector('.theme-toggle').click(); print('Theme switched.'); },
    clear: function () { out.textContent = ''; },
    open: function (a) { if (Object.prototype.hasOwnProperty.call(pages, a)) location.href = pages[a]; else print('Pages: ' + Object.keys(pages).join(', '), 'err'); },
    demo: function (a) { var b = demos.indexOf(a) !== -1 && document.querySelector('.demo-btn[data-demo="' + a + '"]'); if (b) b.click(); else print('Demos: ' + demos.join(', '), 'err'); }
  };
  var past = [], at = 0;
  var run = function (line) {
    line = line.trim(); if (!line) return;
    past.push(line); at = past.length;
    print('$ ' + line, 'cmdline');
    var parts = line.toLowerCase().split(/\s+/);
    if (Object.prototype.hasOwnProperty.call(cmds, parts[0])) cmds[parts[0]](parts[1] || '');
    else print('Command not found: ' + parts[0] + '. Type help.', 'err');
    out.scrollTop = out.scrollHeight;
  };
  form.addEventListener('submit', function (e) { e.preventDefault(); run(input.value); input.value = ''; });
  input.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault(); at = Math.max(0, Math.min(past.length, at + (e.key === 'ArrowUp' ? -1 : 1))); input.value = past[at] || '';
  });
  ['help', 'whoami', 'skills', 'projects', 'demo rover'].forEach(function (c) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.addEventListener('click', function () { run(c); }); keys.appendChild(b);
  });
  print('Welcome. Ask my website about me.'); print('Type help, or tap a command below.', 'dim');
})();
