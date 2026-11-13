/* ==========================================================================
   NAIN — interface compartilhada entre todas as páginas
   header, footer, menu mobile, busca, drawer do carrinho, modal, toasts,
   cookies, WhatsApp, loader, transições de página e animações de entrada.
   ========================================================================== */
(function () {
  const N = window.NAIN;
  const { qs, qsa, esc, brl } = N.util;
  const I = N.icons;
  const page = document.body.dataset.page || '';
  const reduced = N.util.reducedMotion();
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /* ------------------------------------------------------------------ */
  /* HEADER + FOOTER (componentes reutilizados)                          */
  /* ------------------------------------------------------------------ */
  const NAV = [
    { label: 'Camisetas', href: 'catalogo.html?categoria=camisetas', match: () => page === 'catalogo' && N.util.param('categoria') === 'camisetas' },
    { label: 'Moletons', href: 'catalogo.html?categoria=moletons', match: () => page === 'catalogo' && N.util.param('categoria') === 'moletons' },
    { label: 'Coleção', href: 'catalogo.html', match: () => page === 'catalogo' && !N.util.param('categoria') },
    { label: 'Sobre', href: 'sobre.html', match: () => page === 'sobre' }
  ];

  function renderHeader() {
    const mount = qs('#site-header');
    if (!mount) return;
    const home = page === 'home';
    mount.outerHTML = `
    <div class="site-top" data-site-top>
      <div class="topbar" role="region" aria-label="Avisos da loja">
        <p><span>Frete grátis acima de <b>${brl(N.config.freeShippingThreshold).replace(',00', '')}</b></span></p>
        <p><span>Primeira compra? Cupom <b>NAIN10</b> = 10% OFF</span></p>
        <p><span>Troca fácil em até 30 dias</span></p>
      </div>
      <header class="header${home ? ' header--ghost header--on-dark' : ''}" data-header>
        <div class="header__bg"></div>
        <div class="header__inner">
          <button type="button" class="icon-btn header__burger" data-open-menu aria-label="Abrir menu" aria-expanded="false" aria-controls="mobile-menu">${I.menu}</button>
          <a class="logo" href="index.html" aria-label="NAIN — página inicial">NAIN<span class="logo__dot" aria-hidden="true"></span></a>
          <nav class="nav" aria-label="Principal">
            ${NAV.map(n => `<a href="${n.href}"${n.match() ? ' aria-current="page"' : ''}>${n.label}</a>`).join('')}
          </nav>
          <div class="header__actions">
            <button type="button" class="icon-btn" data-open-search aria-label="Buscar">${I.search}</button>
            <a class="icon-btn only-desktop" href="conta.html" aria-label="Minha conta">${I.user}</a>
            <a class="icon-btn only-desktop" href="favoritos.html" aria-label="Favoritos">${I.heart}<span class="badge" data-fav-count aria-hidden="true"></span></a>
            <button type="button" class="icon-btn" data-open-cart aria-label="Abrir carrinho">${I.bag}<span class="badge" data-cart-count aria-hidden="true"></span></button>
          </div>
        </div>
      </header>
    </div>`;
  }

  function renderFooter() {
    const mount = qs('#site-footer');
    if (!mount) return;
    const col = (title, links) => `<nav class="footer__col" aria-label="${title}"><h3>${title}</h3><ul>${links.map(l => `<li><a href="${l[1]}">${l[0]}</a></li>`).join('')}</ul></nav>`;
    mount.outerHTML = `
    <footer class="footer on-dark" id="site-footer">
      <div class="footer__grid">
        <div class="footer__brand">
          <a class="logo" href="index.html" aria-label="NAIN — página inicial">NAIN<span class="logo__dot" aria-hidden="true"></span></a>
          <p>Streetwear cristão feito no Brasil, em pequenos lotes. Da morte para a vida, em algodão pesado.</p>
          <div class="footer__social">
            <a href="${N.config.instagram}" target="_blank" rel="noopener" aria-label="Instagram da NAIN">${I.instagram}</a>
            <a href="${N.config.tiktok}" target="_blank" rel="noopener" aria-label="TikTok da NAIN">${I.tiktok}</a>
            <a href="mailto:${N.config.email}" aria-label="Enviar e-mail para a NAIN">${I.mail}</a>
          </div>
        </div>
        ${col('Loja', [['Camisetas', 'catalogo.html?categoria=camisetas'], ['Moletons', 'catalogo.html?categoria=moletons'], ['Lançamentos', 'catalogo.html?ordem=novidades'], ['Mais vendidos', 'catalogo.html?ordem=vendidos'], ['Favoritos', 'favoritos.html']])}
        ${col('Ajuda', [['Dúvidas frequentes', 'faq.html'], ['Trocas e devoluções', 'trocas.html'], ['Contato', 'contato.html'], ['Minha conta', 'conta.html'], ['Meus pedidos', 'conta.html#pedidos']])}
        ${col('Marca', [['Sobre a NAIN', 'sobre.html'], ['Manifesto', 'sobre.html#manifesto'], ['Privacidade', 'faq.html#privacidade'], ['Termos de uso', 'faq.html#privacidade']])}
      </div>
      <div class="footer__word" aria-hidden="true"><span>NAIN</span></div>
      <div class="footer__bottom">
        <p>© ${new Date().getFullYear()} NAIN Vestuário Ltda. · CNPJ 00.000.000/0001-00 · Feito no Brasil</p>
        <div class="footer__pay" role="img" aria-label="Formas de pagamento: Pix, Visa, Mastercard, Elo e boleto"><span>Pix</span><span>Visa</span><span>Master</span><span>Elo</span><span>Boleto</span></div>
        <p class="serif-i">“Levanta-te.” — Lc 7:14</p>
      </div>
    </footer>`;
  }

  function setHeader(state) {
    const h = qs('[data-header]');
    if (!h) return;
    if ('ghost' in state) h.classList.toggle('header--ghost', !!state.ghost);
    if ('dark' in state) h.classList.toggle('header--on-dark', !!state.dark);
  }

  function initHeaderScroll() {
    const top = qs('[data-site-top]');
    if (!top) return;
    let shrunk = false, ticking = false;
    const update = () => {
      ticking = false;
      const s = window.scrollY > 60;
      if (s !== shrunk) { shrunk = s; top.classList.toggle('is-shrunk', s); }
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------ */
  /* CAMADAS: abre/fecha com trava de scroll, foco preso e Esc           */
  /* ------------------------------------------------------------------ */
  const stack = [];

  function openLayer(el, opts) {
    if (!el || el.classList.contains('is-open')) return;
    el._opts = opts || {};
    el._return = document.activeElement;
    el.hidden = false;
    document.documentElement.classList.add('is-locked');
    void el.offsetWidth; // força reflow para a transição disparar
    el.classList.add('is-open');
    stack.push(el);
    const target = el._opts.focus ? qs(el._opts.focus, el) : qsa(FOCUSABLE, el)[0];
    setTimeout(() => { if (target) target.focus({ preventScroll: true }); }, 80);
  }

  function closeLayer(el) {
    if (!el || !el.classList.contains('is-open')) return;
    el.classList.remove('is-open');
    const i = stack.indexOf(el);
    if (i >= 0) stack.splice(i, 1);
    if (!stack.length) document.documentElement.classList.remove('is-locked');
    const opts = el._opts || {};
    if (opts.trigger) opts.trigger.setAttribute('aria-expanded', 'false');
    setTimeout(() => {
      if (el.classList.contains('is-open')) return;
      el.hidden = true;
      if (opts.remove) el.remove();
    }, reduced ? 0 : 680);
    if (opts.onClose) opts.onClose();
    if (el._return && document.contains(el._return)) el._return.focus({ preventScroll: true });
  }

  document.addEventListener('keydown', e => {
    const top = stack[stack.length - 1];
    if (!top) return;
    if (e.key === 'Escape') { e.preventDefault(); closeLayer(top); return; }
    if (e.key !== 'Tab') return;
    const f = qsa(FOCUSABLE, top).filter(x => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!top.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  });

  /* ------------------------------------------------------------------ */
  /* MENU MOBILE                                                         */
  /* ------------------------------------------------------------------ */
  function buildMenu() {
    const links = [['Camisetas', 'catalogo.html?categoria=camisetas'], ['Moletons', 'catalogo.html?categoria=moletons'], ['Coleção', 'catalogo.html'], ['Sobre', 'sobre.html'], ['Contato', 'contato.html']];
    const el = document.createElement('div');
    el.className = 'mmenu';
    el.id = 'mobile-menu';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Menu');
    el.innerHTML = `
      <div class="mmenu__bg"></div>
      <div class="mmenu__inner">
        <div class="mmenu__head">
          <a class="logo" href="index.html" aria-label="NAIN — página inicial">NAIN<span class="logo__dot" aria-hidden="true"></span></a>
          <button type="button" class="icon-btn" data-close aria-label="Fechar menu">${I.close}</button>
        </div>
        <nav class="mmenu__nav" aria-label="Menu principal">
          ${links.map((l, i) => `<a href="${l[1]}" style="--i:${i}"><span><small>${String(i + 1).padStart(2, '0')}</small>${l[0]}</span></a>`).join('')}
        </nav>
        <div class="mmenu__foot">
          <div class="mmenu__links">
            <a href="conta.html">Minha conta</a><a href="favoritos.html">Favoritos</a><a href="faq.html">Dúvidas</a><a href="trocas.html">Trocas</a>
          </div>
          <p class="mmenu__verse">“Jovem, eu te digo: levanta-te.” — Lc 7:14</p>
        </div>
      </div>`;
    document.body.appendChild(el);
    return el;
  }

  /* ------------------------------------------------------------------ */
  /* BUSCA com sugestões em tempo real                                   */
  /* ------------------------------------------------------------------ */
  const POPULAR = ['Todavia', 'Moletom', 'Eis-me aqui', 'Promessa', 'Off-white'];

  function buildSearch() {
    const el = document.createElement('div');
    el.className = 'search';
    el.id = 'search';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Buscar');
    el.innerHTML = `
      <div class="search__backdrop" data-close></div>
      <div class="search__panel">
        <form class="search__form" action="catalogo.html" role="search">
          <label class="sr-only" for="search-input">Buscar peças, versículos ou cores</label>
          ${I.search}
          <input id="search-input" name="q" type="search" placeholder="Busque por peça, versículo ou cor" autocomplete="off" spellcheck="false" aria-controls="search-results">
          <button type="button" class="icon-btn" data-close aria-label="Fechar busca">${I.close}</button>
        </form>
        <div class="search__results" id="search-results" aria-live="polite"></div>
      </div>`;
    document.body.appendChild(el);
    const input = qs('input', el);
    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => renderSearch(input.value), 110);
    });
    el.addEventListener('click', e => {
      const term = e.target.closest('[data-term]');
      if (!term) return;
      input.value = term.dataset.term;
      renderSearch(input.value);
      input.focus();
    });
    renderSearch('');
    return el;
  }

  function highlight(text, q) {
    const safe = esc(text);
    const term = q.trim().split(/\s+/)[0];
    if (!term) return safe;
    const plain = N.util.norm(text);
    const idx = plain.indexOf(N.util.norm(term));
    if (idx < 0) return safe;
    return esc(text.slice(0, idx)) + '<mark>' + esc(text.slice(idx, idx + term.length)) + '</mark>' + esc(text.slice(idx + term.length));
  }

  function resultRow(p, q) {
    return `<a class="sresult" href="${N.util.productUrl(p)}">
      <span class="sresult__img">${N.media.visual(p, { label: null })}</span>
      <span><span class="sresult__name">${highlight(N.catalog.fullName(p), q)}</span><br><span class="sresult__meta">${esc(p.verse.ref)} · ${p.colors.map(c => N.COLORS[c].name).join(', ')}</span></span>
      <span class="sresult__price">${brl(p.price)}</span>
    </a>`;
  }

  function renderSearch(q) {
    const box = qs('#search-results');
    if (!box) return;
    q = q || '';
    const chips = terms => `<div class="chips">${terms.map(t => `<button type="button" class="chip chip--pill" data-term="${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
    if (!q.trim()) {
      box.innerHTML = `
        <div><p class="caps search__title">Buscas populares</p>${chips(POPULAR)}</div>
        <div><p class="caps search__title">Mais procuradas</p><div class="search__list">${N.catalog.bestSellers(4).map(p => resultRow(p, '')).join('')}</div></div>`;
      return;
    }
    const res = N.catalog.search(q);
    if (!res.length) {
      box.innerHTML = `
        <div><p class="caps search__title">Tente também</p>${chips(POPULAR)}</div>
        <div><p class="display display--md">Nada por aqui para “${esc(q)}”.</p><p class="muted" style="margin-top:.75rem">Confira a grafia ou busque por um versículo, como “Mateus 5”.</p></div>`;
      return;
    }
    const all = 'catalogo.html?q=' + encodeURIComponent(q.trim());
    box.innerHTML = `
      <div><p class="caps search__title">${res.length} ${res.length > 1 ? 'resultados' : 'resultado'}</p>
        <a class="link-arrow" href="${all}">Ver todos ${I.arrow}</a></div>
      <div><p class="caps search__title">Peças</p><div class="search__list">${res.slice(0, 6).map(p => resultRow(p, q)).join('')}</div></div>`;
  }

  /* ------------------------------------------------------------------ */
  /* DRAWER DO CARRINHO                                                  */
  /* ------------------------------------------------------------------ */
  function buildCartDrawer() {
    const el = document.createElement('aside');
    el.className = 'drawer';
    el.id = 'cart-drawer';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Carrinho');
    el.innerHTML = `
      <div class="drawer__backdrop" data-close></div>
      <div class="drawer__panel">
        <div class="drawer__head">
          <h2>Carrinho<sup data-drawer-count>0</sup></h2>
          <button type="button" class="icon-btn" data-close aria-label="Fechar carrinho">${I.close}</button>
        </div>
        <div class="drawer__ship" data-drawer-ship></div>
        <div class="drawer__body" data-drawer-body></div>
        <div class="drawer__foot" data-drawer-foot>
          <div class="drawer__total"><span class="caps">Subtotal</span><strong data-drawer-subtotal></strong></div>
          <p class="small muted" data-drawer-inst></p>
          <a class="btn btn--block" href="checkout.html">Finalizar compra ${I.arrow}</a>
          <a class="btn btn--ghost btn--block" href="carrinho.html">Ver carrinho</a>
        </div>
      </div>`;
    document.body.appendChild(el);
    return el;
  }

  /* atualiza linhas sem recriar tudo quando só a quantidade muda */
  function syncLines(box, lines) {
    const existing = qsa('.line', box);
    const same = existing.length === lines.length && lines.length > 0 && existing.every((el, i) => el.dataset.key === lines[i].key);
    if (!same) { box.innerHTML = lines.map(N.tpl.line).join(''); return; }
    existing.forEach((el, i) => {
      const l = lines[i];
      qs('output', el).textContent = l.qty;
      qs('.line__price', el).textContent = brl(l.total);
      qs('[data-qty="1"]', el).disabled = l.qty >= l.max;
    });
  }

  function renderDrawer() {
    const el = qs('#cart-drawer');
    if (!el) return;
    const t = N.cart.totals();
    const lines = N.cart.lines();
    qs('[data-drawer-count]', el).textContent = t.count;
    qs('[data-drawer-ship]', el).innerHTML = N.tpl.shipbar(t);
    const body = qs('[data-drawer-body]', el);
    if (lines.length) syncLines(body, lines);
    else body.innerHTML = N.tpl.empty({ title: 'Seu carrinho está vazio', text: 'Toda história de ressurreição começa com um primeiro passo. Escolha a sua peça.', cta: 'Ver coleção' });
    qs('[data-drawer-foot]', el).hidden = !lines.length;
    qs('[data-drawer-subtotal]', el).textContent = brl(t.subtotal - t.discount);
    const inst = N.util.installments(t.subtotal - t.discount);
    qs('[data-drawer-inst]', el).textContent = inst.n > 1 ? `ou ${inst.n}x de ${brl(inst.value)} sem juros. Frete e cupons no próximo passo.` : 'Frete e cupons calculados no próximo passo.';
  }

  let cartDrawer, searchLayer, menuLayer;
  const openCart = () => { if (page === 'carrinho' || page === 'checkout') return; renderDrawer(); openLayer(cartDrawer, { focus: '[data-close]' }); };

  /* ------------------------------------------------------------------ */
  /* TOAST, MODAL                                                        */
  /* ------------------------------------------------------------------ */
  function toast(message, opts) {
    opts = opts || {};
    let box = qs('.toasts');
    if (!box) {
      box = document.createElement('div');
      box.className = 'toasts';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    const el = document.createElement('div');
    el.className = 'toast' + (opts.type === 'error' ? ' toast--error' : '');
    el.innerHTML = `<span class="toast__dot" aria-hidden="true"></span><span class="toast__msg">${esc(message)}</span>` +
      (opts.action ? (opts.action.href
        ? `<a class="toast__action" href="${opts.action.href}">${esc(opts.action.label)}</a>`
        : `<button type="button" class="toast__action">${esc(opts.action.label)}</button>`) : '');
    box.appendChild(el);
    while (box.children.length > 3) box.firstElementChild.remove();
    const close = () => {
      if (!el.isConnected) return;
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 380);
    };
    const btn = qs('button.toast__action', el);
    if (btn) btn.addEventListener('click', () => { opts.action.onClick(); close(); });
    setTimeout(close, opts.duration || 3800);
    return el;
  }

  function modal(o) {
    const el = document.createElement('div');
    el.className = 'modal';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'modal-title');
    el.innerHTML = `
      <div class="modal__backdrop" data-close></div>
      <div class="modal__panel" style="--modal-w:${o.width || '44rem'}">
        <div class="modal__head"><h2 id="modal-title">${o.title}</h2><button type="button" class="icon-btn" data-close aria-label="Fechar">${I.close}</button></div>
        <div class="modal__body">${o.html}</div>
      </div>`;
    document.body.appendChild(el);
    openLayer(el, { remove: true, focus: o.focus || '[data-close]', onClose: o.onClose });
    return el;
  }

  /* ------------------------------------------------------------------ */
  /* CONTADORES NO HEADER                                                */
  /* ------------------------------------------------------------------ */
  function setBadge(sel, n, bump) {
    qsa(sel).forEach(b => {
      b.textContent = n > 99 ? '99+' : n;
      b.classList.toggle('is-on', n > 0);
      if (bump && n > 0) { b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump'); }
    });
  }
  function updateCounters(bump) {
    const c = N.cart.count(), f = N.wishlist.count();
    setBadge('[data-cart-count]', c, bump === 'cart');
    setBadge('[data-fav-count]', f, bump === 'fav');
    const cartBtn = qs('[data-open-cart]');
    if (cartBtn) cartBtn.setAttribute('aria-label', `Abrir carrinho (${c} ${c === 1 ? 'item' : 'itens'})`);
  }

  function syncFavButtons() {
    qsa('[data-fav]').forEach(btn => {
      const on = N.wishlist.has(btn.dataset.fav);
      if (btn.getAttribute('aria-pressed') !== String(on)) btn.setAttribute('aria-pressed', on);
    });
  }

  /* ------------------------------------------------------------------ */
  /* AÇÕES DELEGADAS (funcionam em qualquer página)                      */
  /* ------------------------------------------------------------------ */
  function closeQuicks(except) {
    qsa('.card__quick.is-open').forEach(q => {
      if (q === except) return;
      q.classList.remove('is-open');
      qs('[data-quick]', q).setAttribute('aria-expanded', 'false');
    });
  }

  document.addEventListener('click', e => {
    const t = e.target;
    let el;

    if ((el = t.closest('[data-close]'))) { closeLayer(el.closest('.mmenu, .search, .drawer, .modal')); return; }
    if ((el = t.closest('[data-open-cart]'))) { if (page === 'carrinho') return; e.preventDefault(); openCart(); return; }
    if ((el = t.closest('[data-open-search]'))) { openLayer(searchLayer, { focus: '#search-input' }); return; }
    if ((el = t.closest('[data-open-menu]'))) { el.setAttribute('aria-expanded', 'true'); openLayer(menuLayer, { trigger: el }); return; }

    /* favoritar */
    if ((el = t.closest('[data-fav]'))) {
      e.preventDefault();
      const p = N.catalog.get(el.dataset.fav);
      const on = N.wishlist.toggle(el.dataset.fav);
      toast(on ? `${N.catalog.fullName(p)} salvo nos favoritos.` : 'Removido dos favoritos.', on && page !== 'favoritos' ? { action: { label: 'Ver', href: 'favoritos.html' } } : {});
      return;
    }

    /* compra rápida */
    if ((el = t.closest('[data-quick]'))) {
      const box = el.closest('.card__quick');
      const open = !box.classList.contains('is-open');
      closeQuicks(box);
      box.classList.toggle('is-open', open);
      el.setAttribute('aria-expanded', open);
      if (open) { const first = qs('[data-quick-size]:not([disabled])', box); if (first) setTimeout(() => first.focus(), 60); }
      return;
    }
    if ((el = t.closest('[data-quick-size]'))) {
      const card = el.closest('.card');
      const res = N.cart.add(card.dataset.id, card.dataset.color, el.dataset.quickSize, 1);
      closeQuicks();
      if (res.ok) { toast(res.message); setTimeout(openCart, 350); }
      else toast(res.message, { type: 'error' });
      return;
    }
    if (!t.closest('.card__quick')) closeQuicks();

    /* trocar a cor exibida no card */
    if ((el = t.closest('[data-card-color]'))) {
      const card = el.closest('.card');
      const p = N.catalog.get(card.dataset.id);
      const color = el.dataset.cardColor;
      card.dataset.color = color;
      qs('.card__img--front', card).innerHTML = N.media.visual(p, { view: 'front', color, label: null });
      const flip = N.media.has(p, color, 'front') && N.media.has(p, color, 'back');
      qs('.card__img--back', card).innerHTML = flip ? N.media.visual(p, { view: 'back', color, label: null }) : '';
      card.toggleAttribute('data-flip', flip);
      qsa('[data-card-color]', card).forEach(s => { const on = s === el; s.classList.toggle('is-active', on); s.setAttribute('aria-pressed', on); });
      return;
    }

    /* linhas de carrinho */
    if ((el = t.closest('.line [data-qty]'))) {
      const line = el.closest('.line');
      const item = N.cart.state().items.find(i => i.key === line.dataset.key);
      if (item) N.cart.setQty(item.key, item.qty + +el.dataset.qty);
      return;
    }
    if ((el = t.closest('.line [data-remove]'))) {
      const removed = N.cart.remove(el.closest('.line').dataset.key);
      if (removed) toast('Peça removida do carrinho.', { action: { label: 'Desfazer', onClick: () => N.cart.restore(removed) } });
      return;
    }

    /* acordeão */
    if ((el = t.closest('.acc__btn'))) {
      const open = el.getAttribute('aria-expanded') !== 'true';
      const acc = el.closest('.acc');
      if (acc && acc.dataset.single !== undefined) {
        qsa('.acc__btn[aria-expanded="true"]', acc).forEach(b => { if (b !== el) toggleAcc(b, false); });
      }
      toggleAcc(el, open);
      return;
    }

    /* abas */
    if ((el = t.closest('[role="tab"]'))) { selectTab(el); return; }

    /* cookies */
    if ((el = t.closest('[data-cookie]'))) {
      N.store.set('cookies', { choice: el.dataset.cookie, at: Date.now() });
      const banner = el.closest('.cookie');
      banner.classList.add('is-out');
      setTimeout(() => banner.remove(), 380);
      if (el.dataset.cookie === 'all') toast('Preferências salvas. Obrigado!');
    }
  });

  function toggleAcc(btn, open) {
    btn.setAttribute('aria-expanded', open);
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (panel) panel.classList.toggle('is-open', open);
  }

  function selectTab(tab, silent) {
    const list = tab.closest('[role="tablist"]');
    qsa('[role="tab"]', list).forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    if (!silent) N.bus.emit('tab:change', { id: tab.id, panel: tab.getAttribute('aria-controls'), tab });
  }
  document.addEventListener('keydown', e => {
    const tab = e.target.closest && e.target.closest('[role="tab"]');
    if (!tab || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    const tabs = qsa('[role="tab"]', tab.closest('[role="tablist"]'));
    const next = tabs[(tabs.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    next.focus();
    selectTab(next);
  });

  /* newsletter (home) */
  document.addEventListener('submit', e => {
    const form = e.target.closest('[data-newsletter]');
    if (!form) return;
    e.preventDefault();
    if (!N.forms.validate(form)) return;
    const list = N.store.get('newsletter', []);
    list.push(form.email.value.trim().toLowerCase());
    N.store.set('newsletter', list);
    form.reset();
    toast('Pronto. Você vai receber a luz primeiro.');
  });

  /* ------------------------------------------------------------------ */
  /* ANIMAÇÕES DE ENTRADA                                                */
  /* ------------------------------------------------------------------ */
  let io = null;
  if ('IntersectionObserver' in window && !reduced) {
    io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.06 });
  }
  function observeReveals(root) {
    qsa('[data-reveal]:not(.is-in)', root).forEach(el => {
      if (el.dataset.reveal === 'lines') N.tpl.splitLines(el);
      if (io) io.observe(el); else el.classList.add('is-in');
    });
  }

  /* ------------------------------------------------------------------ */
  /* TRANSIÇÃO ENTRE PÁGINAS                                             */
  /* ------------------------------------------------------------------ */
  function initTransitions() {
    if (reduced) return;
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      let url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.protocol !== location.protocol || url.host !== location.host) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // âncora na mesma página
      e.preventDefault();
      document.body.classList.add('is-leaving');
      setTimeout(() => { location.href = a.href; }, 240);
    });
    window.addEventListener('pageshow', () => document.body.classList.remove('is-leaving'));
  }

  /* ------------------------------------------------------------------ */
  /* LOADER, COOKIES, WHATSAPP                                           */
  /* ------------------------------------------------------------------ */
  function initLoader() {
    const loader = qs('.loader');
    const root = document.documentElement;
    const done = () => { root.classList.add('is-ready'); N.ready = true; N.bus.emit('ready'); };
    if (!loader || root.classList.contains('no-loader') || reduced) { if (loader) loader.remove(); done(); return; }
    window.scrollTo(0, 0);
    const min = N.util.wait(1250);
    const fonts = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, N.util.wait(2500)]) : Promise.resolve();
    Promise.all([min, fonts]).then(() => {
      loader.classList.add('is-done');
      N.store.session.set('loaded', '1');
      done();
      setTimeout(() => loader.remove(), 1000);
    });
  }

  function initCookie() {
    if (N.store.get('cookies', null)) return;
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'cookie';
      el.setAttribute('role', 'region');
      el.setAttribute('aria-label', 'Aviso de cookies');
      el.innerHTML = `<p>Usamos cookies para lembrar do seu carrinho e melhorar a loja. Nada de rastrear você por aí. <a href="faq.html#privacidade">Saiba mais</a></p>
        <div class="cookie__actions"><button type="button" class="btn btn--sm" data-cookie="all">Aceitar</button><button type="button" class="btn btn--sm btn--ghost" data-cookie="essential">Só essenciais</button></div>`;
      document.body.appendChild(el);
    }, page === 'home' ? 3200 : 1200);
  }

  function initWhatsApp() {
    if (page === 'checkout') return;
    const a = document.createElement('a');
    a.className = 'wa';
    a.href = `https://wa.me/${N.config.whatsapp}?text=${encodeURIComponent('Olá, NAIN! Preciso de ajuda com um pedido.')}`;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', 'Falar com a NAIN no WhatsApp (abre em nova aba)');
    a.innerHTML = I.whatsapp;
    document.body.appendChild(a);
  }

  /* ------------------------------------------------------------------ */
  /* INIT                                                                */
  /* ------------------------------------------------------------------ */
  renderHeader();
  renderFooter();
  menuLayer = buildMenu();
  searchLayer = buildSearch();
  cartDrawer = buildCartDrawer();
  renderDrawer();
  updateCounters();
  initHeaderScroll();
  initTransitions();
  initWhatsApp();
  initCookie();

  N.bus.on('cart:change', meta => { renderDrawer(); updateCounters(meta && meta.added ? 'cart' : null); });
  N.bus.on('wishlist:change', meta => { syncFavButtons(); updateCounters(meta && meta.on ? 'fav' : null); });

  N.ui = { toast, modal, openLayer, closeLayer, openCart, observeReveals, setHeader, syncLines, selectTab, toggleAcc, renderDrawer };

  /* roda depois dos scripts de página (que injetam conteúdo) */
  window.addEventListener('DOMContentLoaded', () => {
    observeReveals(document);
    initLoader();
  });
})();
