/* ==========================================================================
   NAIN — imagens de produto
   Monta o bloco visual de cada peça a partir das fotos configuradas em
   NAIN.images (js/config.js). Vistas: 'front' (frente), 'back' (costas)
   e 'detail' (zoom na estampa). Se a vista pedida não existir para a cor,
   usa a que houver.
   ========================================================================== */
(function () {
  const N = window.NAIN;

  function setFor(p, color) {
    const cfg = (N.images.products || {})[p.id] || {};
    return cfg[color] || cfg[p.colors[0]] || cfg[Object.keys(cfg)[0]] || {};
  }

  /* a foto dessa vista existe para a cor? */
  function has(p, color, view) {
    return !!setFor(p, color)[view];
  }

  /* vistas disponíveis para a galeria da página de produto */
  function views(p, color) {
    const out = [];
    if (has(p, color, 'front')) out.push(['front', 'Frente']);
    if (has(p, color, 'back')) out.push(['back', 'Costas']);
    out.push(['detail', 'Detalhe da estampa']);
    return out;
  }

  function src(p, color, view) {
    const set = setFor(p, color);
    if (view === 'detail') return set.back || set.front || '';
    return set[view] || set.front || set.back || '';
  }

  /* bloco visual de um produto.
     opts: { view: 'front'|'back'|'detail', color, cls, label } */
  function visual(p, opts) {
    opts = opts || {};
    const view = opts.view || 'front';
    const color = opts.color && N.COLORS[opts.color] ? opts.color : p.colors[0];
    const label = opts.label === undefined
      ? N.catalog.fullName(p) + ' ' + N.COLORS[color].name.toLowerCase() + (view === 'front' ? ', frente' : view === 'back' ? ', costas' : ', detalhe da estampa')
      : (opts.label || '');
    const file = src(p, color, view);
    const cls = 'pv pv--photo' + (view === 'detail' ? ' pv--detail' : '') + (opts.cls ? ' ' + opts.cls : '');
    if (!file) return `<div class="${cls} pv--empty" role="img" aria-label="Foto em breve"><span class="caps">Foto em breve</span></div>`;
    const focus = view === 'detail' && setFor(p, color).focus ? ` style="transform-origin:${setFor(p, color).focus}"` : '';
    return `<div class="${cls}"><img src="${N.util.esc(file)}" alt="${N.util.esc(label)}" loading="lazy" decoding="async"${focus}></div>`;
  }

  N.media = { visual, has, views, src };
})();
