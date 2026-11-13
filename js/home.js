/* ==========================================================================
   NAIN — home
   hero "LEVANTA-TE" guiado por scroll, foco de luz no cursor, marquee,
   coleção em destaque, scroll horizontal dos versículos, manifesto e carrossel.
   Um único listener de scroll + requestAnimationFrame alimenta tudo.
   ========================================================================== */
(function () {
  const N = window.NAIN;
  const { qs, qsa, clamp, brl, esc } = N.util;
  const reduced = N.util.reducedMotion();
  const map = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const reveal = (html, i, step) => html.replace('<article class="card"', `<article data-reveal style="--d:${(i * (step || 0.08)).toFixed(2)}s" class="card"`);

  const updaters = [];

  /* ------------------------------------------------------------------ */
  /* 1. HERO                                                             */
  /* ------------------------------------------------------------------ */
  function initHero() {
    const hero = qs('#hero');
    if (!hero) return;
    const sticky = qs('.hero__sticky', hero);
    const lit = qs('.hero__lit', hero);
    const disc = qs('.hero__disc', hero);
    const halo = qs('.hero__halo', hero);
    const garment = qs('.hero__garment-inner', hero);
    const end = qs('.hero__end', hero);
    const fades = qsa('.hero__hint, .hero__meta', hero);
    const spot = qs('.hero__spot', hero);
    const spotInner = qs('.hero__spot-inner', hero);
    const titles = qsa('.hero__title', hero);
    const piece = N.catalog.get(N.images.hero.product) || N.products[0];

    /* peça principal: foto configurada ou silhueta SVG */
    garment.innerHTML = `<img src="${esc(N.images.hero.garment || N.media.src(piece, piece.colors[0], 'front'))}" alt="">`;
    const info = qs('[data-hero-piece]', hero);
    if (info) info.innerHTML = `<a class="link" href="${N.util.productUrl(piece)}">${esc(N.catalog.fullName(piece))}</a> — ${brl(piece.price)}`;

    /* título letra por letra (duas cópias: uma no escuro, outra na luz) */
    titles.forEach(t => {
      const lines = (t.dataset.text || 'LEVANTA-|TE').split('|');
      t.innerHTML = lines.map(l => `<span class="hero__line" aria-hidden="true">${l.split('').map(c => `<span class="hero__char">${c}</span>`).join('')}</span>`).join('');
    });
    const charSets = titles.map(t => qsa('.hero__char', t));
    const count = charSets[0].length;

    function fitTitle() {
      const mobile = window.innerWidth < 900;
      titles.forEach(t => { t.style.fontSize = ''; });
      const ref = titles[0];
      const fs = parseFloat(getComputedStyle(ref).fontSize);
      const lines = qsa('.hero__line', ref);
      const widthOf = l => Array.from(l.children).reduce((s, c) => s + c.getBoundingClientRect().width, 0);
      const w = mobile ? Math.max.apply(null, lines.map(widthOf)) : lines.reduce((s, l) => s + widthOf(l), 0);
      if (!w) return;
      const gutter = parseFloat(getComputedStyle(end).paddingLeft) || 20;
      const target = window.innerWidth - gutter * 2;
      const size = Math.min(fs * target / w, sticky.clientHeight * (mobile ? 0.17 : 0.3));
      titles.forEach(t => { t.style.fontSize = size.toFixed(1) + 'px'; });
    }
    fitTitle();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);

    if (reduced) {
      // versão estática: tudo já iluminado
      N.ui.setHeader({ ghost: false, dark: false });
      window.addEventListener('resize', fitTitle);
      window.addEventListener('load', fitTitle);
      return;
    }

    let vw, vh, ox, oy, maxR, headerR, start, range, last = -1, headerDark = null, headerGhost = null, spotOk = true;

    function measure() {
      vw = sticky.clientWidth;
      vh = sticky.clientHeight;
      const cs = getComputedStyle(sticky);
      ox = vw * (parseFloat(cs.getPropertyValue('--ox')) || 50) / 100;
      oy = vh * (parseFloat(cs.getPropertyValue('--oy')) || 66) / 100;
      maxR = Math.hypot(Math.max(ox, vw - ox), Math.max(oy, vh - oy)) + 24;
      headerR = Math.hypot(ox, oy - 40) * 0.95;
      start = hero.getBoundingClientRect().top + window.scrollY;
      range = hero.offsetHeight - vh;
      last = -1;
    }

    function frame(y) {
      const p = clamp((y - start) / range, 0, 1);
      const past = y > start + hero.offsetHeight - 80;
      if (past !== !headerGhost) { headerGhost = !past; N.ui.setHeader({ ghost: headerGhost }); }
      if (p === last) return;
      last = p;

      // a luz cresce a partir do ponto
      const t = map(p, 0.02, 0.68);
      const r = 6 + (maxR - 6) * t * t;
      lit.style.clipPath = `circle(${r.toFixed(1)}px at ${ox}px ${oy}px)`;
      disc.style.opacity = (1 - map(p, 0.1, 0.36)).toFixed(3); // o ponto vermelho se dissolve na luz
      halo.style.opacity = (1 - map(p, 0, 0.14)).toFixed(3);

      // "LEVANTA-TE" letra por letra
      for (let i = 0; i < count; i++) {
        const s = 0.07 + i * 0.034;
        const yy = (1 - easeOut(map(p, s, s + 0.13))) * 108;
        const tr = `translate3d(0,${yy.toFixed(2)}%,0)`;
        charSets[0][i].style.transform = tr;
        charSets[1][i].style.transform = tr;
      }

      // a peça se levanta
      garment.style.transform = `translate3d(0,${lerp(118, 0, easeOut(map(p, 0.16, 0.84))).toFixed(2)}%,0)`;

      // textos de apoio
      const out = (1 - map(p, 0, 0.07)).toFixed(3);
      fades.forEach(el => { el.style.opacity = out; });
      const e = map(p, 0.8, 0.93);
      end.style.opacity = e.toFixed(3);
      end.style.transform = `translate3d(0,${((1 - easeOut(e)) * 24).toFixed(1)}px,0)`;
      end.classList.toggle('is-on', e > 0.5);

      // header: claro sobre o escuro, escuro quando a luz chega nele
      const dark = r < headerR;
      if (dark !== headerDark) { headerDark = dark; N.ui.setHeader({ dark }); }
      spotOk = t < 0.85;
      if (!spotOk) spot.classList.remove('is-on');
    }

    /* cursor como foco de luz (apenas ponteiro fino / desktop) */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const HALF = 310;
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = null, on = false;
      const loop = () => {
        cx += (tx - cx) * 0.14;
        cy += (ty - cy) * 0.14;
        const x = cx - HALF, y = cy - HALF;
        spot.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
        spotInner.style.transform = `translate3d(${(-x).toFixed(1)}px,${(-y).toFixed(1)}px,0)`;
        raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3 ? requestAnimationFrame(loop) : null;
      };
      sticky.addEventListener('pointermove', e => {
        if (!spotOk) return;
        const rect = sticky.getBoundingClientRect();
        tx = e.clientX - rect.left;
        ty = e.clientY - rect.top;
        if (!on) { on = true; cx = tx; cy = ty; spot.classList.add('is-on'); }
        if (!raf) raf = requestAnimationFrame(loop);
      });
      sticky.addEventListener('pointerleave', () => { on = false; spot.classList.remove('is-on'); });
    }

    measure();
    updaters.push({ measure: () => { fitTitle(); measure(); }, update: frame });
  }

  /* ------------------------------------------------------------------ */
  /* 2. MARQUEE                                                          */
  /* ------------------------------------------------------------------ */
  function initMarquee() {
    const track = qs('[data-marquee]');
    if (!track) return;
    const items = [['Jovem, eu te digo: levanta-te', 'Lc 7:14']].concat(N.products.map(p => [p.verse.text.split(/[;,.]/)[0], p.verse.short]))
      .filter((v, i, a) => a.findIndex(x => x[1] === v[1]) === i);
    const group = hidden => `<div class="marquee__group"${hidden ? ' aria-hidden="true"' : ''}>${items.map(i =>
      `<span class="marquee__item">${i[0]} <cite>${i[1]}</cite></span><span class="marquee__sep" aria-hidden="true"></span>`).join('')}</div>`;
    track.innerHTML = group(false) + group(true);
  }

  /* ------------------------------------------------------------------ */
  /* 3. COLEÇÃO EM DESTAQUE                                              */
  /* ------------------------------------------------------------------ */
  function initFeatured() {
    const box = qs('[data-featured]');
    if (!box) return;
    box.innerHTML = N.catalog.featured().slice(0, 4).map((p, i) => reveal(N.tpl.card(p), i % 2, 0.12)).join('');
  }

  /* ------------------------------------------------------------------ */
  /* 4. O VERSÍCULO POR TRÁS DA PEÇA (scroll horizontal)                 */
  /* ------------------------------------------------------------------ */
  function initVerses() {
    const sec = qs('.verses');
    if (!sec) return;
    const track = qs('.verses__track', sec);
    const bar = qs('.verses__progress span', sec);
    const items = (N.images.verses || []).map(v => Object.assign({ p: N.catalog.get(v.product) }, v)).filter(v => v.p);
    track.insertAdjacentHTML('beforeend', items.map((it, i) => {
      const p = it.p;
      const quote = it.highlight ? esc(p.verse.text).replace(it.highlight, `<em>${it.highlight}</em>`) : esc(p.verse.text);
      return `<article class="vpanel" aria-label="${esc(p.verse.ref)}">
        <a class="vpanel__art" href="${N.util.productUrl(p)}" aria-label="Ver ${esc(N.catalog.fullName(p))}">${N.media.visual(p, { view: 'back', color: it.color, label: null })}</a>
        <div class="vpanel__text">
          <p class="vpanel__num caps">${String(i + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}</p>
          <blockquote class="vpanel__quote">“${quote}”</blockquote>
          <p class="vpanel__ref caps">${esc(p.verse.ref)}</p>
          <p class="vpanel__note"><strong>${esc(N.catalog.fullName(p))}.</strong> ${esc(p.story)}</p>
          <a class="link-arrow" href="${N.util.productUrl(p)}">Ver a peça ${N.icons.arrow}</a>
        </div>
      </article>`;
    }).join(''));

    const mq = window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)');
    let pinned = false, dist = 0, start = 0, last = -1;
    function measure() {
      pinned = mq.matches && !reduced;
      sec.classList.toggle('verses--pinned', pinned);
      sec.style.height = '';
      track.style.transform = '';
      last = -1;
      if (!pinned) return;
      dist = Math.max(0, track.offsetWidth - document.documentElement.clientWidth);
      sec.style.height = (window.innerHeight + dist) + 'px';
      start = sec.getBoundingClientRect().top + window.scrollY;
    }
    function update(y) {
      if (!pinned) return;
      const p = dist ? clamp((y - start) / dist, 0, 1) : 0;
      if (p === last) return;
      last = p;
      track.style.transform = `translate3d(${(-p * dist).toFixed(1)}px,0,0)`;
      bar.style.transform = `scaleX(${p.toFixed(4)})`;
    }
    measure();
    updaters.push({ measure, update });
  }

  /* ------------------------------------------------------------------ */
  /* 5. CATEGORIAS                                                       */
  /* ------------------------------------------------------------------ */
  function initCats() {
    qsa('[data-cat]').forEach(el => {
      const key = el.dataset.cat;
      const cfg = N.images.categories[key] || {};
      const list = N.catalog.byCategory(key);
      const cover = N.catalog.get(cfg.product) || list[0];
      const min = Math.min.apply(null, list.map(p => p.price));
      qs('.cat__img', el).innerHTML = N.media.visual(cover, { view: cfg.view || 'front', color: cfg.color, label: null });
      qs('[data-cat-meta]', el).textContent = `${list.length} peças · a partir de ${brl(min)}`;
    });
  }

  /* ------------------------------------------------------------------ */
  /* 6. MANIFESTO — palavras se preenchem no scroll                      */
  /* ------------------------------------------------------------------ */
  function initManifesto() {
    const el = qs('[data-fill]');
    if (!el) return;
    const wrap = node => {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) wrap(child);
      });
    };
    wrap(el);
    const words = qsa('.w', el);
    if (reduced) { words.forEach(w => w.classList.add('is-on')); return; }
    let shown = 0;
    function update() {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.top > vh || rect.bottom < -vh) return;
      const p = map(vh * 0.86 - rect.top, 0, rect.height + vh * 0.42);
      const n = Math.round(p * words.length);
      if (n === shown) return;
      const lo = Math.min(n, shown), hi = Math.max(n, shown);
      for (let i = lo; i < hi; i++) words[i].classList.toggle('is-on', i < n);
      shown = n;
    }
    updaters.push({ measure() {}, update });
  }

  /* ------------------------------------------------------------------ */
  /* 7. MAIS VENDIDOS — carrossel arrastável                             */
  /* ------------------------------------------------------------------ */
  function initCarousel() {
    const el = qs('[data-carousel]');
    if (!el) return;
    const track = qs('.carousel__track', el);
    track.innerHTML = N.catalog.bestSellers(8).map((p, i) => reveal(N.tpl.card(p, { rank: i + 1 }), Math.min(i, 4), 0.07)).join('');
    const prev = qs('[data-carousel-prev]'), next = qs('[data-carousel-next]');

    const step = () => { const c = qs('.card', track); return c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 16) : 320; };
    const sync = () => {
      if (!prev) return;
      prev.disabled = el.scrollLeft < 8;
      next.disabled = el.scrollLeft > el.scrollWidth - el.clientWidth - 8;
    };
    if (prev) prev.addEventListener('click', () => el.scrollBy({ left: -step(), behavior: reduced ? 'auto' : 'smooth' }));
    if (next) next.addEventListener('click', () => el.scrollBy({ left: step(), behavior: reduced ? 'auto' : 'smooth' }));
    el.addEventListener('scroll', sync, { passive: true });
    sync();

    /* arrastar com o mouse (no toque o scroll nativo já resolve) */
    let down = false, moved = false, startX = 0, startLeft = 0, lastX = 0, v = 0, raf = null;
    el.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = lastX = e.clientX; startLeft = el.scrollLeft; v = 0;
      cancelAnimationFrame(raf);
    });
    window.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) { moved = true; el.classList.add('is-dragging'); }
      if (!moved) return;
      el.scrollLeft = startLeft - dx;
      v = e.clientX - lastX;
      lastX = e.clientX;
    });
    const release = () => {
      if (!down) return;
      down = false;
      if (!moved) return;
      const glide = () => {
        v *= 0.93;
        el.scrollLeft -= v;
        if (Math.abs(v) > 0.6) raf = requestAnimationFrame(glide);
        else el.classList.remove('is-dragging');
      };
      glide();
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    el.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    el.addEventListener('dragstart', e => e.preventDefault());
  }

  /* ------------------------------------------------------------------ */
  /* LOOP DE SCROLL                                                      */
  /* ------------------------------------------------------------------ */
  initHero();
  initMarquee();
  initFeatured();
  initVerses();
  initCats();
  initManifesto();
  initCarousel();

  let ticking = false;
  const tick = () => { ticking = false; const y = window.scrollY; updaters.forEach(u => u.update(y)); };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } };
  const remeasure = () => { updaters.forEach(u => u.measure()); request(); };
  window.addEventListener('scroll', request, { passive: true });
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(remeasure, 120); });
  window.addEventListener('load', remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  tick();
})();
