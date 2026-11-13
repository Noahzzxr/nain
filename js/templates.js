/* ==========================================================================
   NAIN — templates reutilizáveis (ícones, card de produto, preço, linhas)
   ========================================================================== */
(function () {
  const N = window.NAIN;
  const { esc, brl } = N.util;

  const svg = (body, cls) => `<svg class="icon${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
  N.icons = {
    search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'),
    user: svg('<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c.8-3.6 3.8-5.5 7.5-5.5s6.700 1.900 7.500 5.500"/>'),
    heart: svg('<path d="M12 20s-7.500-4.600-7.500-10.200A4.300 4.300 0 0 1 12 7.200a4.300 4.300 0 0 1 7.500 2.600C19.500 15.400 12 20 12 20z"/>'),
    bag: svg('<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6.500a3 3 0 0 1 6 0V8"/>'),
    menu: svg('<path d="M3 8h18M3 16h18"/>'),
    close: svg('<path d="m5 5 14 14M19 5 5 19"/>'),
    arrow: svg('<path d="M4 12h16m-6-6 6 6-6 6"/>'),
    arrowLeft: svg('<path d="M20 12H4m6-6-6 6 6 6"/>'),
    arrowDiag: svg('<path d="M4 12h16m-6-6 6 6-6 6"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>', 'icon--sm'),
    check: svg('<path d="m5 12.500 4.500 4.500L19 7.500"/>'),
    truck: svg('<path d="M3 6.500h11v10H3zM14 10h4l3 3v3.500h-7"/><circle cx="7.500" cy="17.500" r="1.800"/><circle cx="17.500" cy="17.500" r="1.800"/>'),
    swap: svg('<path d="M4 8h14m-4-4 4 4-4 4M20 16H6m4 4-4-4 4-4"/>'),
    lock: svg('<rect x="5" y="10.500" width="14" height="9.500" rx="1"/><path d="M8.500 10.500V8a3.500 3.500 0 0 1 7 0v2.500"/>'),
    ruler: svg('<path d="m3.500 16 12.500-12.500 4.500 4.500L8 20.500z"/><path d="m7.500 12 2 2m1-5 2 2m1-5 2 2"/>'),
    filter: svg('<path d="M4 7h16M7 12h10M10 17h4"/>'),
    pin: svg('<path d="M12 21s-6.500-5.800-6.500-11a6.500 6.500 0 0 1 13 0c0 5.200-6.500 11-6.500 11z"/><circle cx="12" cy="10" r="2.300"/>'),
    mail: svg('<rect x="3.500" y="5.500" width="17" height="13" rx="1"/><path d="m4 6.500 8 6.500 8-6.500"/>'),
    box: svg('<path d="M12 3 4 7v10l8 4 8-4V7l-8-4z"/><path d="m4 7 8 4 8-4M12 11v10"/>'),
    copy: svg('<rect x="8.500" y="8.500" width="11" height="11" rx="1"/><path d="M15.500 8.500v-4h-11v11h4"/>'),
    instagram: svg('<rect x="4" y="4" width="16" height="16" rx="4.500"/><circle cx="12" cy="12" r="3.600"/><circle cx="16.700" cy="7.300" r=".6" fill="currentColor"/>'),
    tiktok: svg('<path d="M14 4v10.500a3.500 3.500 0 1 1-3.500-3.500M14 4c.3 2.400 1.900 4 4.500 4.300"/>'),
    youtube: svg('<rect x="3" y="6" width="18" height="12" rx="3.500"/><path d="m10.500 9.500 4.500 2.500-4.500 2.500z"/>'),
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.200a9.700 9.700 0 0 0-8.300 14.800L2.300 21.800l4.900-1.300A9.700 9.700 0 1 0 12 2.200zm0 1.800a7.900 7.900 0 1 1-4.100 14.700l-.3-.2-2.800.7.800-2.700-.2-.3A7.900 7.900 0 0 1 12 4zm-3.300 3.600c-.2 0-.5.1-.7.300-.3.300-1 1-1 2.300s1 2.700 1.100 2.900c.1.200 1.900 3 4.700 4.100 2.300.9 2.800.7 3.300.7.500-.1 1.600-.7 1.800-1.300.2-.600.2-1.200.2-1.300-.100-.100-.300-.200-.500-.300l-1.900-.900c-.300-.100-.400-.100-.600.100l-.800 1c-.200.200-.300.200-.600.100-1.500-.700-2.500-1.600-3.300-3-.200-.300 0-.400.100-.600l.4-.500c.100-.200.200-.300.300-.500.100-.200 0-.400 0-.500l-.900-2.100c-.200-.400-.400-.500-.600-.500h-.700z"/></svg>'
  };

  const stars = (rating) => `<span class="stars" style="--w:${(rating / 5 * 100).toFixed(1)}%" role="img" aria-label="${String(rating).replace('.', ',')} de 5 estrelas"><span class="stars__fill"></span></span>`;

  const price = (p, cls) => `<span class="price${cls ? ' ' + cls : ''}">` +
    (p.compareAt ? `<span class="sr-only">De ${brl(p.compareAt)} por </span><s aria-hidden="true">${brl(p.compareAt)}</s>` : '') +
    `<span>${brl(p.price)}</span></span>`;

  function tags(p) {
    const out = [];
    if (p.isNew) out.push('<span class="tag tag--new">Lançamento</span>');
    if (p.compareAt) out.push(`<span class="tag tag--sale">−${N.catalog.discount(p)}%</span>`);
    if (N.catalog.isLow(p)) out.push('<span class="tag tag--low">Últimas unidades</span>');
    return out.join('');
  }

  /* card de produto. opts: { rank, headingLevel, color } */
  function card(p, opts) {
    opts = opts || {};
    const name = N.catalog.fullName(p);
    const url = N.util.productUrl(p);
    const color = opts.color || p.colors[0];
    const fav = N.wishlist.has(p.id);
    const h = opts.headingLevel || 3;
    const flip = N.media.has(p, color, 'front') && N.media.has(p, color, 'back');
    const sizes = N.SIZES.map(s => `<button type="button" data-quick-size="${s}" ${p.stock[s] > 0 ? '' : 'disabled'} aria-label="Adicionar tamanho ${s}${p.stock[s] > 0 ? '' : ' (esgotado)'}">${s}</button>`).join('');
    const swatches = p.colors.map((c, i) =>
      `<button type="button" class="swatch swatch--sm${c === color ? ' is-active' : ''}" style="--c:${N.COLORS[c].hex}" data-card-color="${c}" aria-label="Ver na cor ${N.COLORS[c].name}" aria-pressed="${c === color}"></button>`).join('');
    return `<article class="card" data-id="${p.id}" data-color="${color}"${flip ? ' data-flip' : ''}>
      <div class="card__frame">
        <a class="card__media" href="${url}" aria-label="${esc(name)}" tabindex="-1">
          <div class="card__img card__img--front">${N.media.visual(p, { view: 'front', color, label: null })}</div>
          <div class="card__img card__img--back">${flip ? N.media.visual(p, { view: 'back', color, label: null }) : ''}</div>
        </a>
        <div class="card__tags">${tags(p)}</div>
        ${opts.rank ? `<span class="card__rank" aria-hidden="true">${String(opts.rank).padStart(2, '0')}</span>` : ''}
        <button type="button" class="card__fav" data-fav="${p.id}" aria-pressed="${fav}" aria-label="${fav ? 'Remover' : 'Adicionar'} ${esc(name)} ${fav ? 'dos' : 'aos'} favoritos">${N.icons.heart}</button>
        <div class="card__quick">
          <button type="button" class="card__quick-btn" data-quick aria-expanded="false" aria-label="Compra rápida: ${esc(name)}"><span>Compra rápida</span>${N.icons.plus}</button>
          <div class="card__sizes" role="group" aria-label="Escolha o tamanho">${sizes}</div>
        </div>
      </div>
      <div class="card__info">
        <h${h} class="card__name"><a href="${url}">${esc(name)}</a></h${h}>
        <p class="card__cat">${esc(p.verse.short)} · ${p.colors.length} ${p.colors.length > 1 ? 'cores' : 'cor'}</p>
        ${price(p)}
        <div class="swatches">${swatches}</div>
      </div>
    </article>`;
  }

  const skeletonCards = n => Array.from({ length: n }, () =>
    '<div class="sk-card" aria-hidden="true"><div class="skeleton"></div><div class="skeleton sk-line"></div><div class="skeleton sk-line sk-line--short"></div></div>').join('');

  /* linha de carrinho (drawer e página) */
  function line(l) {
    const p = l.product;
    const name = N.catalog.fullName(p);
    return `<div class="line" data-key="${esc(l.key)}">
      <a class="line__media" href="${N.util.productUrl(p)}" tabindex="-1" aria-hidden="true">${N.media.visual(p, { color: l.color, label: null })}</a>
      <div class="line__info">
        <a class="line__name" href="${N.util.productUrl(p)}">${esc(name)}</a>
        <p class="line__meta">${esc(l.colorName)} · Tam. ${l.size}</p>
        <div class="qty qty--sm" role="group" aria-label="Quantidade de ${esc(name)}">
          <button type="button" data-qty="-1" aria-label="Diminuir quantidade">−</button>
          <output aria-live="polite">${l.qty}</output>
          <button type="button" data-qty="1" aria-label="Aumentar quantidade" ${l.qty >= l.max ? 'disabled' : ''}>+</button>
        </div>
      </div>
      <div class="line__side">
        <span class="line__price">${brl(l.total)}</span>
        <button type="button" class="line__remove" data-remove aria-label="Remover ${esc(name)} do carrinho">Remover</button>
      </div>
    </div>`;
  }

  function shipbar(t) {
    const done = t.free && t.count > 0;
    const msg = !t.count ? `Frete grátis acima de <b>${brl(N.config.freeShippingThreshold)}</b>`
      : done ? 'Você ganhou <b>frete grátis</b>.'
        : `Faltam <b>${brl(t.left)}</b> para o frete grátis`;
    return `<div class="shipbar${done ? ' is-done' : ''}">
      <p>${msg}</p>
      <div class="shipbar__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(t.progress * 100)}" aria-label="Progresso para frete grátis">
        <div class="shipbar__fill" style="--p:${done ? 1 : t.progress.toFixed(3)}"></div>
      </div>
    </div>`;
  }

  function empty(o) {
    return `<div class="empty"><span class="empty__dot" aria-hidden="true"></span>
      <h2>${o.title}</h2><p>${o.text}</p>
      ${o.cta ? `<a class="btn" href="${o.href || 'catalogo.html'}">${o.cta}${N.icons.arrow}</a>` : ''}</div>`;
  }

  /* quebra um título em linhas para a animação [data-reveal="lines"] */
  function splitLines(el) {
    if (el.dataset.split) return;
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map((html, i) => `<span class="ln" style="--i:${i}"><span>${html}</span></span>`).join('');
    el.dataset.split = '1';
  }

  N.tpl = { stars, price, tags, card, skeletonCards, line, shipbar, empty, splitLines };
})();
