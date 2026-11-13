/* ==========================================================================
   NAIN — catálogo: filtros, ordenação, busca, contador, estado vazio
   O estado dos filtros fica na URL (dá para compartilhar o link).
   ========================================================================== */
(function () {
  const N = window.NAIN;
  const { qs, qsa, brl, esc } = N.util;
  const grid = qs('[data-grid]');
  if (!grid) return;

  const prices = N.products.map(p => p.price);
  const PMIN = Math.floor(Math.min.apply(null, prices) / 10) * 10;
  const PMAX = Math.ceil(Math.max.apply(null, prices) / 10) * 10;
  const params = new URLSearchParams(location.search);
  const listParam = k => (params.get(k) || '').split(',').filter(Boolean);
  const SORTS = {
    relevancia: ['Relevância', (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.sold - a.sold],
    novidades: ['Novidades', (a, b) => new Date(b.date) - new Date(a.date)],
    vendidos: ['Mais vendidos', (a, b) => b.sold - a.sold],
    'menor-preco': ['Menor preço', (a, b) => a.price - b.price],
    'maior-preco': ['Maior preço', (a, b) => b.price - a.price],
    avaliacao: ['Melhor avaliados', (a, b) => b.rating - a.rating || b.reviews - a.reviews]
  };

  const state = {
    cats: listParam('categoria').filter(c => N.CATEGORIES[c]),
    sizes: listParam('tamanho').filter(s => N.SIZES.includes(s)),
    colors: listParam('cor').filter(c => N.COLORS[c]),
    min: N.util.clamp(+params.get('min') || PMIN, PMIN, PMAX),
    max: N.util.clamp(+params.get('max') || PMAX, PMIN, PMAX),
    q: params.get('q') || '',
    sort: SORTS[params.get('ordem')] ? params.get('ordem') : 'relevancia',
    promo: params.get('promo') === '1'
  };

  /* ---- HTML dos filtros (usado na lateral e no drawer mobile) ---- */
  function filtersHTML() {
    const count = fn => N.products.filter(fn).length;
    return `
      <div class="fgroup" role="group" aria-label="Categoria">
        <h3 class="fgroup__title">Categoria</h3>
        ${Object.keys(N.CATEGORIES).map(c => `<label class="check"><input type="checkbox" data-f="cats" value="${c}"><span class="check__box" aria-hidden="true"></span><span>${N.CATEGORIES[c].name}</span><small>${count(p => p.category === c)}</small></label>`).join('')}
      </div>
      <div class="fgroup" role="group" aria-label="Tamanho">
        <h3 class="fgroup__title">Tamanho</h3>
        <div class="chips">${N.SIZES.map(s => `<button type="button" class="chip" data-f="sizes" data-v="${s}" aria-pressed="false">${s}</button>`).join('')}</div>
      </div>
      <div class="fgroup" role="group" aria-label="Cor">
        <h3 class="fgroup__title">Cor <span data-color-label class="muted"></span></h3>
        <div class="swatches">${Object.keys(N.COLORS).map(c => `<button type="button" class="swatch" style="--c:${N.COLORS[c].hex}" data-f="colors" data-v="${c}" aria-pressed="false" aria-label="${N.COLORS[c].name}" title="${N.COLORS[c].name}"></button>`).join('')}</div>
      </div>
      <div class="fgroup" role="group" aria-label="Faixa de preço">
        <h3 class="fgroup__title">Preço</h3>
        <div class="range">
          <div class="range__track"><div class="range__fill"></div></div>
          <input type="range" min="${PMIN}" max="${PMAX}" step="10" data-f="min" aria-label="Preço mínimo">
          <input type="range" min="${PMIN}" max="${PMAX}" step="10" data-f="max" aria-label="Preço máximo">
        </div>
        <div class="range__vals"><span data-min-label></span><span data-max-label></span></div>
      </div>
      <div class="fgroup">
        <label class="check"><input type="checkbox" data-f="promo"><span class="check__box" aria-hidden="true"></span><span>Só peças em promoção</span></label>
      </div>
      <button type="button" class="btn btn--ghost btn--sm btn--block filters__clear" data-clear>Limpar filtros</button>`;
  }

  /* espelha o estado em todos os controles (lateral + drawer) */
  function syncControls() {
    qsa('[data-f]').forEach(el => {
      const f = el.dataset.f;
      if (f === 'cats') el.checked = state.cats.includes(el.value);
      else if (f === 'promo') el.checked = state.promo;
      else if (f === 'min' || f === 'max') el.value = state[f];
      else el.setAttribute('aria-pressed', state[f].includes(el.dataset.v));
    });
    const a = (state.min - PMIN) / (PMAX - PMIN) * 100, b = (PMAX - state.max) / (PMAX - PMIN) * 100;
    qsa('.range__fill').forEach(el => { el.style.left = a + '%'; el.style.right = b + '%'; });
    qsa('[data-min-label]').forEach(el => { el.textContent = brl(state.min).replace(',00', ''); });
    qsa('[data-max-label]').forEach(el => { el.textContent = brl(state.max).replace(',00', ''); });
    qsa('[data-color-label]').forEach(el => { el.textContent = state.colors.map(c => N.COLORS[c].name).join(', '); });
    const sort = qs('#sort');
    if (sort) sort.value = state.sort;
  }

  function results() {
    let res = state.q.trim() ? N.catalog.search(state.q) : N.catalog.all();
    res = res.filter(p =>
      (!state.cats.length || state.cats.includes(p.category)) &&
      (!state.sizes.length || state.sizes.some(s => p.stock[s] > 0)) &&
      (!state.colors.length || state.colors.some(c => p.colors.includes(c))) &&
      p.price >= state.min && p.price <= state.max &&
      (!state.promo || p.compareAt));
    return res.sort(SORTS[state.sort][1]);
  }

  function activeChips() {
    const chips = [];
    const add = (label, f, v) => chips.push(`<button type="button" class="chip chip--pill is-active" data-unset="${f}" data-v="${v == null ? '' : v}" aria-label="Remover filtro ${esc(label)}">${esc(label)} <span aria-hidden="true">×</span></button>`);
    if (state.q.trim()) add('“' + state.q.trim() + '”', 'q');
    state.cats.forEach(c => add(N.CATEGORIES[c].name, 'cats', c));
    state.sizes.forEach(s => add('Tam. ' + s, 'sizes', s));
    state.colors.forEach(c => add(N.COLORS[c].name, 'colors', c));
    if (state.min > PMIN || state.max < PMAX) add(brl(state.min).replace(',00', '') + ' – ' + brl(state.max).replace(',00', ''), 'price');
    if (state.promo) add('Promoção', 'promo');
    return chips;
  }

  function syncUrl() {
    const p = new URLSearchParams();
    if (state.cats.length) p.set('categoria', state.cats.join(','));
    if (state.sizes.length) p.set('tamanho', state.sizes.join(','));
    if (state.colors.length) p.set('cor', state.colors.join(','));
    if (state.min > PMIN) p.set('min', state.min);
    if (state.max < PMAX) p.set('max', state.max);
    if (state.q.trim()) p.set('q', state.q.trim());
    if (state.sort !== 'relevancia') p.set('ordem', state.sort);
    if (state.promo) p.set('promo', '1');
    const s = p.toString();
    try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '')); } catch (e) { /* file:// em alguns navegadores */ }
  }

  function syncHead() {
    const title = qs('[data-cat-title]'), lead = qs('[data-cat-lead]'), crumb = qs('[data-cat-crumb]');
    const one = state.cats.length === 1 ? state.cats[0] : null;
    const copy = {
      camisetas: ['Camisetas', 'Algodão penteado de 230 g/m², corte oversized e estampa em serigrafia à base d’água. Cada peça, uma passagem.'],
      moletons: ['Moletons', '400 g/m² de algodão flanelado, capuz duplo e modelagem boxy. Pesado no corpo, leve na mensagem.']
    };
    const t = state.q.trim() ? ['Busca', `Resultados para “${state.q.trim()}”.`] : one ? copy[one] : ['Coleção', 'Uma coleção, um só enredo: o instante em que a escuridão perde. Filtre por categoria, tamanho, cor ou preço.'];
    title.textContent = t[0];
    lead.textContent = t[1];
    crumb.textContent = t[0];
    document.title = t[0] + ' — NAIN';
  }

  let token = 0;
  function render(withSkeleton) {
    const t = ++token;
    syncControls();
    syncUrl();
    syncHead();
    const res = results();
    const chips = activeChips();
    qs('[data-active]').innerHTML = chips.length ? chips.join('') + '<button type="button" class="link small" data-clear style="margin-left:.5rem">Limpar tudo</button>' : '';
    qs('[data-count]').innerHTML = `<b>${res.length}</b> ${res.length === 1 ? 'peça' : 'peças'}`;
    qsa('[data-filter-count]').forEach(el => { el.innerHTML = chips.length ? `<b>${chips.length}</b>` : ''; });
    qsa('[data-drawer-apply]').forEach(el => { el.textContent = `Ver ${res.length} ${res.length === 1 ? 'peça' : 'peças'}`; });

    const paint = () => {
      if (t !== token) return;
      grid.removeAttribute('aria-busy');
      if (!res.length) {
        grid.style.display = 'block';
        grid.innerHTML = `<div class="empty"><span class="empty__dot" aria-hidden="true"></span>
          <h2>Nenhuma peça por aqui</h2>
          <p>Não encontramos nada com esses filtros. Tente tirar um deles — ou comece de novo.</p>
          <button type="button" class="btn" data-clear>Limpar filtros</button></div>`;
        return;
      }
      grid.style.display = '';
      grid.innerHTML = res.map((p, i) => {
        const color = state.colors.find(c => p.colors.includes(c));
        return N.tpl.card(p, { color, headingLevel: 2 }).replace('<article class="card"', `<article data-reveal style="--d:${(Math.min(i, 5) * 0.06).toFixed(2)}s" class="card"`);
      }).join('');
      N.ui.observeReveals(grid);
    };
    if (withSkeleton === false) return paint();
    grid.style.display = '';
    grid.setAttribute('aria-busy', 'true');
    grid.innerHTML = N.tpl.skeletonCards(Math.max(3, Math.min(6, res.length)));
    setTimeout(paint, 420);
  }

  function clearAll() {
    Object.assign(state, { cats: [], sizes: [], colors: [], min: PMIN, max: PMAX, q: '', promo: false });
    const input = qs('#cat-q');
    if (input) input.value = '';
    render();
  }

  /* ---- montagem ---- */
  qs('[data-filters-side]').innerHTML = filtersHTML();
  const drawer = document.createElement('div');
  drawer.className = 'drawer drawer--left';
  drawer.id = 'filters-drawer';
  drawer.hidden = true;
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-label', 'Filtros');
  drawer.innerHTML = `<div class="drawer__backdrop" data-close></div>
    <div class="drawer__panel">
      <div class="drawer__head"><h2>Filtros</h2><button type="button" class="icon-btn" data-close aria-label="Fechar filtros">${N.icons.close}</button></div>
      <div class="drawer__body">${filtersHTML()}</div>
      <div class="drawer__foot"><button type="button" class="btn btn--block" data-close data-drawer-apply>Ver peças</button></div>
    </div>`;
  document.body.appendChild(drawer);

  const sort = qs('#sort');
  sort.innerHTML = Object.keys(SORTS).map(k => `<option value="${k}">${SORTS[k][0]}</option>`).join('');
  sort.addEventListener('change', () => { state.sort = sort.value; render(); });

  const search = qs('#cat-q');
  search.value = state.q;
  let st;
  search.addEventListener('input', () => { clearTimeout(st); st = setTimeout(() => { state.q = search.value; render(); }, 260); });
  search.form.addEventListener('submit', e => { e.preventDefault(); clearTimeout(st); state.q = search.value; render(); });

  document.addEventListener('click', e => {
    let el;
    if ((el = e.target.closest('[data-open-filters]'))) { N.ui.openLayer(drawer, { focus: '[data-close]' }); return; }
    if ((el = e.target.closest('[data-clear]'))) { clearAll(); return; }
    if ((el = e.target.closest('button[data-f][data-v]'))) {
      const arr = state[el.dataset.f], v = el.dataset.v;
      const i = arr.indexOf(v);
      if (i >= 0) arr.splice(i, 1); else arr.push(v);
      render();
      return;
    }
    if ((el = e.target.closest('[data-unset]'))) {
      const f = el.dataset.unset, v = el.dataset.v;
      if (f === 'q') { state.q = ''; search.value = ''; }
      else if (f === 'price') { state.min = PMIN; state.max = PMAX; }
      else if (f === 'promo') state.promo = false;
      else state[f] = state[f].filter(x => x !== v);
      render();
    }
  });
  document.addEventListener('change', e => {
    const el = e.target;
    if (!el.dataset || !el.dataset.f) return;
    if (el.dataset.f === 'cats') { state.cats = el.checked ? state.cats.concat(el.value).filter((v, i, a) => a.indexOf(v) === i) : state.cats.filter(c => c !== el.value); render(); }
    else if (el.dataset.f === 'promo') { state.promo = el.checked; render(); }
    else if (el.type === 'range') render();
  });
  document.addEventListener('input', e => {
    const el = e.target;
    if (el.type !== 'range' || !el.dataset.f) return;
    if (el.dataset.f === 'min') state.min = Math.min(+el.value, state.max - 10);
    else state.max = Math.max(+el.value, state.min + 10);
    syncControls();
  });

  render();
})();
