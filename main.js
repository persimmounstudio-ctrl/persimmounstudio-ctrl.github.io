/* Persimmon Studio — motion
   1. Pixel trail: the mouse leaves little white squares that dissolve (like the logo)
   2. Custom cursor
   3. Text scramble on [data-scramble]
   4. Scroll reveal for .reveal
   5. Spotlight on app cards
   6. Word-by-word highlight on .statement
   7. Logo pixels breaking away (.mark-stage) */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Header state ---------- */
  function onScroll() { document.body.classList.toggle('scrolled', window.scrollY > 20); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- 1. Pixel trail canvas ---------- */
  var canvas = document.getElementById('pixels');
  if (canvas && !reduce) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, cells = [], GRID = 22;
    function resize() {
      W = canvas.width = window.innerWidth * dpr;
      H = canvas.height = window.innerHeight * dpr;
    }
    resize(); window.addEventListener('resize', resize);

    function spawn(x, y, life) {
      var g = GRID * dpr;
      cells.push({
        x: Math.floor(x * dpr / g) * g + g * 0.25,
        y: Math.floor(y * dpr / g) * g + g * 0.25,
        s: g * (0.25 + Math.random() * 0.35),
        a: 1, life: life || (0.012 + Math.random() * 0.02)
      });
    }
    var last = 0;
    window.addEventListener('mousemove', function (e) {
      var now = performance.now();
      if (now - last < 16) return; last = now;
      spawn(e.clientX + (Math.random() - .5) * 30, e.clientY + (Math.random() - .5) * 30);
    }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      var t = e.touches[0]; spawn(t.clientX, t.clientY);
    }, { passive: true });

    // ambient twinkles
    setInterval(function () {
      if (document.hidden) return;
      spawn(Math.random() * window.innerWidth, Math.random() * window.innerHeight, 0.006);
    }, 380);

    (function loop() {
      ctx.clearRect(0, 0, W, H);
      for (var i = cells.length - 1; i >= 0; i--) {
        var c = cells[i];
        c.a -= c.life;
        if (c.a <= 0) { cells.splice(i, 1); continue; }
        ctx.globalAlpha = c.a * 0.85;
        ctx.fillStyle = '#fff';
        var r = c.s * 0.22;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(c.x, c.y, c.s, c.s, r); else ctx.rect(c.x, c.y, c.s, c.s);
        ctx.fill();
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- 2. Custom cursor ---------- */
  if (finePointer && !reduce) {
    var ring = document.createElement('div'); ring.className = 'cursor';
    var dot = document.createElement('div'); dot.className = 'cursor-dot';
    document.body.appendChild(ring); document.body.appendChild(dot);
    var mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      document.body.classList.add('has-cursor');
    });
    document.addEventListener('mouseleave', function () { document.body.classList.remove('has-cursor'); });
    (function follow() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(follow);
    })();
    document.querySelectorAll('a, button').forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('cursor-hover'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-hover'); });
    });
  }

  /* ---------- 3. Text scramble ---------- */
  var GLYPHS = '■□▪▫▓▒░/\\<>[]{}01#';
  function scramble(el) {
    var final = el.getAttribute('data-text') || el.textContent;
    el.setAttribute('data-text', final);
    var frame = 0, total = final.length * 2 + 12;
    (function tick() {
      var out = '';
      for (var i = 0; i < final.length; i++) {
        var ch = final[i];
        if (ch === ' ') { out += ' '; continue; }
        out += frame >= i * 2 + 10 ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      if (++frame <= total) requestAnimationFrame(tick);
      else el.textContent = final;
    })();
  }
  document.querySelectorAll('[data-scramble]').forEach(function (el) {
    if (reduce) return;
    scramble(el);
    if (el.closest('a, .app-card')) {
      el.closest('a, .app-card').addEventListener('mouseenter', function () { scramble(el); });
    }
  });

  /* ---------- 4. Scroll reveal ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- 5. Spotlight on cards ---------- */
  document.querySelectorAll('.app-card, .feature').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- 6. Statement word highlight on scroll ---------- */
  document.querySelectorAll('.statement').forEach(function (st) {
    var html = st.innerHTML.replace(/(<b>)?([^\s<]+)(<\/b>)?/g, function (m, a, w, b) {
      return (a || '') + '<span class="w">' + w + '</span>' + (b || '');
    });
    st.innerHTML = html;
    var words = st.querySelectorAll('.w');
    function update() {
      var r = st.getBoundingClientRect();
      var p = (window.innerHeight * 0.85 - r.top) / (r.height + window.innerHeight * 0.35);
      p = Math.max(0, Math.min(1, p));
      var n = Math.round(p * words.length);
      words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    }
    if (reduce) { words.forEach(function (w) { w.classList.add('on'); }); return; }
    window.addEventListener('scroll', update, { passive: true }); update();
  });

  /* ---------- 7. Logo pixels breaking away ---------- */
  document.querySelectorAll('.mark-stage').forEach(function (stage) {
    if (reduce) return;
    for (var i = 0; i < 14; i++) {
      var p = document.createElement('i');
      p.className = 'px';
      var size = 5 + Math.random() * 11;
      p.style.width = p.style.height = size + 'px';
      // start around the lower-right edge of the fruit, like in the logo
      p.style.left = (64 + Math.random() * 14) + '%';
      p.style.top = (55 + Math.random() * 22) + '%';
      p.style.setProperty('--dx', (30 + Math.random() * 90) + 'px');
      p.style.setProperty('--dy', (-30 + Math.random() * 70) + 'px');
      p.style.animationDelay = (Math.random() * 3.6) + 's';
      p.style.animationDuration = (2.6 + Math.random() * 2.4) + 's';
      stage.appendChild(p);
    }
  });
})();
