/* ==========================================================================
   SITE SETTINGS — edit these
   ========================================================================== */
var SITE_CONFIG = {
  // Free, privacy-friendly analytics: sign up at https://www.goatcounter.com
  // and put your site code here (e.g. 'tapkuol' for tapkuol.goatcounter.com). Leave '' to disable.
  goatcounter: ''
};

(function () {
  var root = document.documentElement;
  root.classList.remove('no-js');

  /* Analytics (only when configured) */
  if (SITE_CONFIG.goatcounter) {
    var gc = document.createElement('script');
    gc.async = true;
    gc.src = 'https://gc.zgo.at/count.js';
    gc.setAttribute('data-goatcounter', 'https://' + SITE_CONFIG.goatcounter + '.goatcounter.com/count');
    document.head.appendChild(gc);
  }

  function currentTheme() {
    return root.getAttribute('data-theme') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  /* Theme toggle (remembers choice when storage is available) */
  function storedTheme() { try { return localStorage.getItem('theme'); } catch (e) { return null; } }
  function saveTheme(t) { try { localStorage.setItem('theme', t); } catch (e) {} }
  var t = storedTheme();
  if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t);

  document.querySelectorAll('.theme-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      saveTheme(next);
      document.dispatchEvent(new CustomEvent('themechange', { detail: next }));
    });
  });

  /* Mobile menu */
  var menuBtn = document.querySelector('.menu-toggle');
  var links = document.querySelector('.nav-links');
  if (menuBtn && links) {
    menuBtn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* Header border on scroll */
  var header = document.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Footer year */
  document.querySelectorAll('[data-current-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* Reveal on scroll */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* Tour stats, counted from the tour cards */
  var tourGrid = document.getElementById('tour-grid');
  if (tourGrid) {
    var cards = tourGrid.querySelectorAll('[data-category]');
    var countries = {}, types = {}, years = [];
    cards.forEach(function (c) {
      if (c.dataset.country) countries[c.dataset.country] = 1;
      c.dataset.category.split(' ').forEach(function (k) { if (k) types[k] = 1; });
      var y = parseInt(c.dataset.year, 10); if (!isNaN(y)) years.push(y);
    });
    var singular = { 'Tours': 'Tour', 'Countries': 'Country', 'Kinds of tour': 'Kind of tour', 'Years on the road': 'Year on the road' };
    var set = function (k, v) {
      var el = document.querySelector('[data-stat="' + k + '"]');
      if (!el) return;
      el.textContent = v;
      var label = el.parentNode.querySelector('.stat-label');
      if (label && v === 1 && singular[label.textContent]) label.textContent = singular[label.textContent];
    };
    set('tours', cards.length);
    set('countries', Object.keys(countries).length);
    set('types', Object.keys(types).length);
    if (years.length) set('span', Math.max.apply(null, years) - Math.min.apply(null, years) + 1);
  }

  /* Filters (tours / projects) */
  document.querySelectorAll('[data-filter-group]').forEach(function (group) {
    var target = document.getElementById(group.getAttribute('data-filter-group'));
    if (!target) return;
    group.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (!btn) return;
      var value = btn.getAttribute('data-filter');
      group.querySelectorAll('.filter').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      target.querySelectorAll('[data-category]').forEach(function (card) {
        var cats = card.getAttribute('data-category').split(' ');
        card.hidden = !(value === 'all' || cats.indexOf(value) !== -1);
      });
      document.dispatchEvent(new CustomEvent('filterchange', { detail: target.id }));
    });
  });

  /* Tours map (Leaflet) — pins from data-lat / data-lng on tour cards */
  var mapEl = document.getElementById('tour-map');
  if (mapEl && tourGrid) {
    if (!window.L) {
      mapEl.innerHTML = '<div class="map-fallback">The map could not load. Check your connection and refresh.</div>';
    } else {
      var map = L.map(mapEl, { scrollWheelZoom: false, worldCopyJump: true, attributionControl: true });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      var icon = L.divIcon({ className: '', html: '<div class="map-pin"></div>', iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -10] });
      var pins = [];
      tourGrid.querySelectorAll('[data-lat]').forEach(function (card) {
        var lat = parseFloat(card.dataset.lat), lng = parseFloat(card.dataset.lng);
        if (isNaN(lat) || isNaN(lng)) return;
        var place = card.querySelector('.tour-place strong');
        var sub = card.querySelector('.tour-place span');
        var title = card.querySelector('h3');
        var div = document.createElement('div');
        var s = document.createElement('strong'); s.textContent = place ? place.textContent : '';
        div.appendChild(s);
        div.appendChild(document.createTextNode((title ? title.textContent : '') + (sub ? ' · ' + sub.textContent : '')));
        var m = L.marker([lat, lng], { icon: icon, title: s.textContent }).bindPopup(div);
        pins.push({ card: card, marker: m });
      });
      var showPins = function () {
        var visible = [];
        pins.forEach(function (p) {
          if (p.card.hidden) { map.removeLayer(p.marker); }
          else { p.marker.addTo(map); visible.push(p.marker.getLatLng()); }
        });
        if (visible.length > 1) map.fitBounds(L.latLngBounds(visible), { padding: [50, 50], maxZoom: 5 });
        else if (visible.length === 1) map.setView(visible[0], 5);
        else map.setView([15, 10], 2);
      };
      showPins();
      document.addEventListener('filterchange', function (e) { if (e.detail === 'tour-grid') showPins(); });
    }
  }

  /* Tour photos: give each card a blurred backdrop of its own photo so the full photo fits without cropping */
  document.querySelectorAll('.tour-media img').forEach(function (img) {
    var media = img.parentNode;
    media.style.setProperty('--photo', 'url("' + img.getAttribute('src') + '")');
    media.classList.add('has-photo');
  });

  /* Lightbox for photos and videos */
  var ytId = function (url) {
    var m = (url || '').match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{6,})/);
    return m ? m[1] : null;
  };
  var lightbox, currentNav = null;
  function openLightbox(kind, src, caption) {
    currentNav = null;
    if (!lightbox) {
      lightbox = document.createElement('dialog');
      lightbox.className = 'lightbox';
      lightbox.innerHTML = '<button class="lightbox-close" type="button" aria-label="Close">×</button><div class="lightbox-inner"></div><p class="lightbox-caption"></p>';
      document.body.appendChild(lightbox);
      lightbox.querySelector('.lightbox-close').addEventListener('click', function () { lightbox.close(); });
      lightbox.addEventListener('click', function (e) { if (e.target === lightbox) lightbox.close(); });
      lightbox.addEventListener('close', function () { lightbox.querySelector('.lightbox-inner').innerHTML = ''; currentNav = null; });
      lightbox.addEventListener('keydown', function (e) {
        if (!currentNav) return;
        if (e.key === 'ArrowLeft') { e.preventDefault(); currentNav(-1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); currentNav(1); }
      });
    }
    var inner = lightbox.querySelector('.lightbox-inner');
    inner.innerHTML = '';
    var id = kind === 'video' ? ytId(src) : null;
    if (kind === 'image') {
      var img = document.createElement('img'); img.src = src; img.alt = caption || ''; inner.appendChild(img);
    } else if (id) {
      var wrap = document.createElement('div'); wrap.className = 'yt';
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      f.title = caption || 'Video'; f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true;
      wrap.appendChild(f); inner.appendChild(wrap);
    } else {
      var v = document.createElement('video'); v.src = src; v.controls = true; v.autoplay = true; v.playsInline = true; inner.appendChild(v);
    }
    lightbox.querySelector('.lightbox-caption').textContent = caption || '';
    if (!lightbox.open) { if (lightbox.showModal) lightbox.showModal(); else lightbox.setAttribute('open', ''); }
  }

  /* Photo galleries: <div data-gallery="a.jpg, b.jpg" data-alt="Caption"> */
  function openGallery(list, start, caption) {
    var idx = start;
    var show = function (i) {
      idx = (i + list.length) % list.length;
      openLightbox('image', list[idx], list.length > 1 ? caption + ' — photo ' + (idx + 1) + ' of ' + list.length : caption);
      if (list.length > 1) {
        var inner = lightbox.querySelector('.lightbox-inner');
        [['prev', -1, '‹', 'Previous photo'], ['next', 1, '›', 'Next photo']].forEach(function (d) {
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'lightbox-nav ' + d[0]; b.textContent = d[2]; b.setAttribute('aria-label', d[3]);
          b.addEventListener('click', function (e) { e.stopPropagation(); show(idx + d[1]); });
          inner.appendChild(b);
        });
        currentNav = function (step) { show(idx + step); };
      }
    };
    show(start);
  }
  document.querySelectorAll('[data-gallery]').forEach(function (el) {
    var list = el.getAttribute('data-gallery').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!list.length) return;
    var caption = el.getAttribute('data-alt') || '';
    var badge = document.createElement('span');
    badge.className = 'gallery-badge';
    badge.textContent = list.length + (list.length === 1 ? ' photo' : ' photos');
    if (list.length > 1) el.appendChild(badge);
    el.classList.add('has-gallery');
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Open photo gallery: ' + caption);
    var open = function () { openGallery(list, 0, caption); };
    el.addEventListener('click', open);
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });

  /* Project photo + video: shown automatically once the files exist */
  document.querySelectorAll('.project-media[data-photo], .project-media[data-video]').forEach(function (media) {
    var alt = media.getAttribute('data-alt') || '';
    var photo = (media.getAttribute('data-photo') || '').trim();
    var video = (media.getAttribute('data-video') || '').trim();

    if (photo) {
      var probe = new Image();
      probe.onload = function () {
        var img = document.createElement('img');
        img.alt = alt; img.decoding = 'async';
        img.width = probe.naturalWidth || 800; img.height = probe.naturalHeight || 450;
        img.style.aspectRatio = img.width + ' / ' + img.height;
        var extras = (media.getAttribute('data-gallery-extra') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        img.addEventListener('click', function () {
          if (extras.length) openGallery([photo].concat(extras), 0, alt);
          else openLightbox('image', photo, alt);
        });
        if (extras.length) {
          var badge = document.createElement('span');
          badge.className = 'gallery-badge';
          badge.textContent = (extras.length + 1) + ' images';
          media.appendChild(badge);
        }
        media.insertBefore(img, media.firstChild);
        media.classList.add('has-photo');
        if (media.getAttribute('data-fit') === 'contain') media.classList.add('fit-contain');
        // Animated illustrations start playing when the card scrolls into view
        var isSvg = /\.svg(\?|$)/i.test(photo);
        if (isSvg && 'IntersectionObserver' in window) {
          img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
          img.style.background = 'linear-gradient(135deg, var(--c1, #0f172a), var(--c2, #334155))';
          var io2 = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
              if (en.isIntersecting) { img.src = photo; img.style.background = ''; io2.disconnect(); }
            });
          }, { threshold: 0.1 });
          io2.observe(media);
        } else {
          img.loading = 'lazy'; img.src = photo;
        }
      };
      probe.src = photo;
    }

    if (video) {
      var addPlay = function () {
        var btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'media-play';
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="11" opacity=".15"/><path d="M10 8.5v7l6-3.5z"/></svg>Watch video';
        btn.addEventListener('click', function () { openLightbox('video', video, alt); });
        media.appendChild(btn);
      };
      if (ytId(video)) { addPlay(); }
      else {
        var test = document.createElement('video');
        test.preload = 'metadata'; test.muted = true;
        test.addEventListener('loadedmetadata', addPlay, { once: true });
        test.src = video;
      }
    }
  });

  /* 3D tilt + light glare on project and tour cards (mouse/trackpad only, respects reduced motion) */
  if (window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.project-card, .tour-card').forEach(function (card) {
      card.classList.add('tilt');
      var frame = null;
      card.addEventListener('pointermove', function (e) {
        if (frame) return;
        frame = requestAnimationFrame(function () {
          frame = null;
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          var rx = (0.5 - py) * 6, ry = (px - 0.5) * 8;
          card.style.transition = 'transform .08s ease-out, box-shadow .25s';
          card.style.transform = 'perspective(1000px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-4px)';
          var m = card.querySelector('.project-media, .tour-media');
          if (m) { m.style.setProperty('--gx', (px * 100).toFixed(1) + '%'); m.style.setProperty('--gy', (py * 100).toFixed(1) + '%'); }
        });
      });
      card.addEventListener('pointerleave', function () {
        card.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1), box-shadow .25s';
        card.style.transform = '';
      });
    });
  }

  /* Intro video — only shown once data-video-src is set */
  document.querySelectorAll('[data-video-section]').forEach(function (section) {
    var frame = section.querySelector('[data-video-src]');
    var src = frame ? frame.getAttribute('data-video-src').trim() : '';
    if (!src) { section.remove(); return; }
    var yt = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
    if (yt) {
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + yt[1];
      iframe.title = 'Introduction video';
      iframe.loading = 'lazy';
      iframe.allow = 'accelerometer; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      frame.appendChild(iframe);
    } else {
      var v = document.createElement('video');
      v.src = src; v.controls = true; v.preload = 'metadata'; v.playsInline = true;
      frame.appendChild(v);
    }
  });

  /* Contact form — Formspree when configured, otherwise opens the visitor's email app */
  document.querySelectorAll('[data-contact-form]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var say = function (msg, cls) { if (status) { status.textContent = msg; status.className = 'form-status ' + (cls || ''); } };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form._gotcha && form._gotcha.value) return;
      var data = new FormData(form);
      if (form.action.indexOf('YOUR_FORM_ID') !== -1) {
        var to = form.getAttribute('data-fallback-email');
        var subject = (data.get('topic') || 'Hello') + ' — from ' + (data.get('name') || 'your website');
        var body = (data.get('message') || '') + '\n\n' + (data.get('name') || '') + '\n' + (data.get('email') || '');
        window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        say('Opening your email app…', 'ok');
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      say('Sending…');
      fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('bad status');
          form.reset();
          say('Thanks! Your message has been sent — I’ll get back to you soon.', 'ok');
        })
        .catch(function () { say('Sorry, something went wrong. Please email me directly instead.', 'err'); })
        .then(function () { if (btn) btn.disabled = false; });
    });
  });

  /* CV print button */
  document.querySelectorAll('[data-print]').forEach(function (b) {
    b.addEventListener('click', function () { window.print(); });
  });
})();
