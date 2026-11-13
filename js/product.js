/* ==========================================================================
   NAIN — página de produto
   galeria com zoom, cor/tamanho, guia de medidas, quantidade, frete por CEP,
   parcelamento, avaliações, versículo da peça e relacionados.
   ========================================================================== */
(function () {
  const N = window.NAIN;
  const { qs, qsa, brl, esc } = N.util;
  const I = N.icons;
  const root = qs('[data-pdp]');
  if (!root) return;

  const p = N.catalog.get(N.util.param('id'));
  if (!p) {
    document.title = 'Peça não encontrada — NAIN';
    root.innerHTML = N.tpl.empty({ title: 'Peça não encontrada', text: 'Este link não leva a nenhuma peça da coleção. Ela pode ter saído de linha — ou o endereço está errado.', cta: 'Ver coleção' });
    qsa('[data-pverse], [data-reviews], [data-related]').forEach(el => el.remove());
    return;
  }

  const name = N.catalog.fullName(p);
  const colorParam = N.util.param('cor');
  const state = { color: p.colors.includes(colorParam) ? colorParam : p.colors[0], size: null, qty: 1, view: 'front' };
  state.view = N.media.views(p, state.color)[0][0];
  document.title = name + ' — NAIN';

  /* ------------------------------------------------------------------ */
  function render() {
    const inst = N.util.installments(p.price);
    const pix = p.price * (1 - N.config.pixDiscount);
    const fav = N.wishlist.has(p.id);
    const cat = N.CATEGORIES[p.category];
    root.innerHTML = `
      <div class="gallery">
        <div class="gallery__stage" data-stage tabindex="0" role="button" aria-label="Ampliar imagem da peça">
          <div data-stage-img></div>
          <div class="card__tags">${N.tpl.tags(p)}</div>
          <span class="gallery__hint caps" aria-hidden="true">Passe o cursor ou toque para ampliar</span>
        </div>
        <div class="gallery__thumbs" role="tablist" aria-label="Imagens da peça" data-thumbs></div>
      </div>

      <div class="pdp__info">
        <div>
          <h1 class="pdp__title"><small>${cat.singular} · ${esc(p.verse.short)}</small>${esc(p.name)}</h1>
        </div>
        <a class="rating" href="#avaliacoes">${N.tpl.stars(p.rating)} <strong>${p.rating.toFixed(1).replace('.', ',')}</strong> <span class="muted link" data-review-count></span></a>

        <div class="pdp__price">
          ${N.tpl.price(p, 'price--lg')}
          <p>${inst.n > 1 ? `ou <b>${inst.n}x de ${brl(inst.value)}</b> sem juros` : 'à vista'} · <b>${brl(pix)}</b> no Pix (5% off)</p>
        </div>

        <div class="opt">
          <div class="opt__head"><p class="caps" id="cor-label">Cor: <span data-color-name></span></p></div>
          <div class="swatches" role="radiogroup" aria-labelledby="cor-label" data-colors>
            ${p.colors.map(c => `<button type="button" class="swatch" role="radio" style="--c:${N.COLORS[c].hex}" data-color="${c}" aria-checked="false" aria-label="${N.COLORS[c].name}" title="${N.COLORS[c].name}"></button>`).join('')}
          </div>
        </div>

        <div class="opt">
          <div class="opt__head">
            <p class="caps" id="tam-label">Tamanho: <span data-size-name>escolha</span></p>
            <button type="button" class="link small" data-size-guide style="display:inline-flex;gap:.4rem;align-items:center">${I.ruler} Guia de medidas</button>
          </div>
          <div class="chips" role="radiogroup" aria-labelledby="tam-label" data-sizes>
            ${N.SIZES.map(s => `<button type="button" class="chip" role="radio" data-size="${s}" aria-checked="false" ${p.stock[s] > 0 ? '' : 'disabled aria-label="' + s + ' — esgotado"'}>${s}</button>`).join('')}
          </div>
          <p class="opt__note is-ok" data-size-note aria-live="polite">Modelagem ampla. Na dúvida entre dois tamanhos, escolha o menor.</p>
        </div>

        <div class="stack">
          <div class="pdp__buy">
            <div class="qty" role="group" aria-label="Quantidade">
              <button type="button" data-step="-1" aria-label="Diminuir quantidade">−</button>
              <output data-qty aria-live="polite">1</output>
              <button type="button" data-step="1" aria-label="Aumentar quantidade">+</button>
            </div>
            <button type="button" class="btn" data-add>Adicionar ao carrinho</button>
            <button type="button" class="pdp__fav" data-fav="${p.id}" aria-pressed="${fav}" aria-label="Favoritar ${esc(name)}">${I.heart}</button>
          </div>
          <button type="button" class="btn btn--ghost btn--block" data-buy-now>Comprar agora ${I.arrow}</button>
        </div>

        <form class="box" data-cep-form novalidate>
          <p class="caps">Calcule o frete</p>
          <div class="field">
            <label class="sr-only" for="cep">CEP</label>
            <div class="inline-form">
              <input class="field__input" id="cep" name="cep" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" data-mask="cep" data-validate="required cep">
              <button class="btn btn--ghost" type="submit">Calcular</button>
            </div>
          </div>
          <div class="shipopts" data-ship-result aria-live="polite"></div>
        </form>

        <ul class="perks">
          <li>${I.truck} <span>Frete grátis acima de ${brl(N.config.freeShippingThreshold)}</span></li>
          <li>${I.swap} <span>Primeira troca grátis em até 30 dias</span></li>
          <li>${I.lock} <span>Pagamento seguro: Pix, cartão em até ${N.config.maxInstallments}x ou boleto</span></li>
        </ul>

        <div class="acc">
          ${acc('desc', 'Descrição', `<p>${esc(p.description)}</p><p>${esc(p.story)}</p>`, true)}
          ${acc('comp', 'Composição e cuidados', `<ul class="prose">${p.details.map(d => `<li>${esc(d)}</li>`).join('')}</ul><p>Lave do avesso, com água fria. Não use alvejante nem secadora. Passe sem encostar na estampa.</p>`)}
          ${acc('envio', 'Entrega e trocas', `<p>Postamos em até 24h úteis após a confirmação do pagamento. O prazo depende do seu CEP — calcule acima.</p><p>Não serviu? A primeira troca é por nossa conta, em até 30 dias. <a class="link" href="trocas.html">Veja como funciona</a>.</p>`)}
        </div>
      </div>`;

    const crumbs = qs('[data-crumbs]');
    if (crumbs) crumbs.innerHTML = `<li><a href="index.html">Início</a></li><li><a href="catalogo.html?categoria=${p.category}">${cat.name}</a></li><li aria-current="page">${esc(p.name)}</li>`;
    updateGallery();
    updateOptions();
    const cep = N.cart.state().cep;
    if (cep) { qs('#cep').value = N.forms.masks.cep(cep); showShipping(cep); }
  }

  function acc(id, title, html, open) {
    return `<div class="acc__item"><h2 style="font:inherit;letter-spacing:0"><button type="button" class="acc__btn" aria-expanded="${!!open}" aria-controls="acc-${id}">${title}<span class="acc__plus" aria-hidden="true"></span></button></h2>
      <div class="acc__panel${open ? ' is-open' : ''}" id="acc-${id}"><div><div class="acc__content">${html}</div></div></div></div>`;
  }

  /* ---- galeria ---- */
  function updateGallery() {
    const list = N.media.views(p, state.color);
    if (!list.some(v => v[0] === state.view)) state.view = list[0][0];
    qs('[data-stage-img]').innerHTML = N.media.visual(p, { view: state.view, color: state.color });
    qs('[data-thumbs]').innerHTML = list.map(v =>
      `<button type="button" class="gallery__thumb" role="tab" data-view="${v[0]}" aria-selected="${v[0] === state.view}" tabindex="${v[0] === state.view ? 0 : -1}" aria-label="${v[1]}">${N.media.visual(p, { view: v[0], color: state.color, label: null })}</button>`).join('');
  }

  function updateOptions() {
    qsa('[data-color]', root).forEach(b => b.setAttribute('aria-checked', b.dataset.color === state.color));
    qs('[data-color-name]').textContent = N.COLORS[state.color].name;
    qsa('[data-size]', root).forEach(b => b.setAttribute('aria-checked', b.dataset.size === state.size));
    qs('[data-size-name]').textContent = state.size || 'escolha';
    const note = qs('[data-size-note]');
    const max = state.size ? p.stock[state.size] : 0;
    if (state.size) {
      note.classList.toggle('is-ok', max > 3);
      note.textContent = max <= 3 ? `Últimas ${max} unidade${max > 1 ? 's' : ''} neste tamanho.` : 'Em estoque. Postagem em até 24h úteis.';
      state.qty = Math.min(state.qty, max);
    }
    qs('[data-qty]').textContent = state.qty;
    qs('[data-step="-1"]').disabled = state.qty <= 1;
    qs('[data-step="1"]').disabled = state.size ? state.qty >= max : state.qty >= 10;
    const bar = qs('[data-buybar-meta]');
    if (bar) bar.textContent = N.COLORS[state.color].name + (state.size ? ' · ' + state.size : ' · escolha o tamanho');
  }

  function needSize() {
    const note = qs('[data-size-note]');
    note.classList.remove('is-ok');
    note.textContent = 'Escolha um tamanho para continuar.';
    const first = qs('[data-size]:not([disabled])', root);
    qs('[data-sizes]').scrollIntoView({ block: 'center', behavior: N.util.reducedMotion() ? 'auto' : 'smooth' });
    if (first) first.focus({ preventScroll: true });
  }

  function addToCart(then) {
    if (!state.size) { needSize(); return false; }
    const res = N.cart.add(p.id, state.color, state.size, state.qty);
    if (!res.ok) { N.ui.toast(res.message, { type: 'error' }); return false; }
    if (then === 'checkout') { location.href = 'checkout.html'; return true; }
    N.ui.toast(res.message);
    setTimeout(N.ui.openCart, 300);
    return true;
  }

  function showShipping(cep) {
    const box = qs('[data-ship-result]');
    const opts = N.shipping.quote(cep, p.price * state.qty >= N.config.freeShippingThreshold);
    const r = N.shipping.region(cep);
    if (!opts) { box.innerHTML = ''; return; }
    box.innerHTML = opts.map(o => `<div class="shipopt"><span>${o.name}<small>${o.days[0]} a ${o.days[1]} dias úteis · ${r.city}/${r.uf} e região</small></span><b>${o.price ? brl(o.price) : 'Grátis'}</b></div>`).join('');
  }

  function sizeGuide() {
    const g = N.sizeGuide[p.category];
    N.ui.modal({
      title: 'Guia de medidas',
      html: `<p class="muted" style="margin-bottom:1.25rem">Medidas da peça em centímetros, com ela esticada sobre uma superfície plana. Compare com uma peça sua que vista bem.</p>
        <div style="overflow-x:auto"><table class="size-table"><thead><tr>${g.cols.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead>
        <tbody>${g.rows.map(r => `<tr class="${r[0] === state.size ? 'is-active' : ''}">${r.map((c, i) => i ? `<td>${c} cm</td>` : `<th scope="row" style="color:var(--ink);font-size:1rem">${c}</th>`).join('')}</tr>`).join('')}</tbody></table></div>
        <div class="note" style="margin-top:1.5rem">${I.ruler}<p><strong>Como medir:</strong> largura de axila a axila; comprimento do ombro até a barra; manga do ombro até o punho. A modelagem é oversized — se preferir mais justo, peça um tamanho abaixo.</p></div>`
    });
  }

  /* ------------------------------------------------------------------ */
  /* VERSÍCULO DA PEÇA                                                   */
  /* ------------------------------------------------------------------ */
  function renderVerse() {
    const el = qs('[data-pverse]');
    if (!el) return;
    el.innerHTML = `
      <div class="pverse__art" data-reveal="scale">${N.media.visual(p, { view: 'detail', label: null })}</div>
      <div>
        <p class="eyebrow" data-reveal>O versículo da peça</p>
        <blockquote data-reveal style="--d:.1s">“${esc(p.verse.text)}”</blockquote>
        <p class="pverse__ref caps" data-reveal style="--d:.15s">${esc(p.verse.ref)}</p>
        <p class="pverse__story" data-reveal style="--d:.2s">${esc(p.story)}</p>
      </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* AVALIAÇÕES                                                          */
  /* ------------------------------------------------------------------ */
  function renderReviews() {
    const el = qs('[data-reviews]');
    if (!el) return;
    const list = N.catalog.reviews(p);
    const mine = (N.store.get('reviews', {})[p.id] || []).length;
    const total = p.reviews + mine;
    const bars = N.catalog.ratingBars(p);
    qsa('[data-review-count]').forEach(x => { x.textContent = `${total} avaliações`; });
    el.innerHTML = `
      <div class="reviews__aside">
        <p class="eyebrow">Avaliações</p>
        <p class="reviews__score">${p.rating.toFixed(1).replace('.', ',')}</p>
        <p class="rating">${N.tpl.stars(p.rating)} <span class="muted">${total} avaliações</span></p>
        <div class="bars" role="img" aria-label="Distribuição das notas">
          ${bars.map((b, i) => `<div class="bar"><span>${5 - i}★</span><div class="bar__track"><div class="bar__fill" style="--p:${b / 100}"></div></div><span>${b}%</span></div>`).join('')}
        </div>
        <button type="button" class="btn btn--ghost" data-write-review>Escrever avaliação</button>
      </div>
      <div>
        <h2 class="display display--md" style="margin-bottom:1.5rem">O que dizem de quem veste</h2>
        ${list.map(r => `<article class="review">
          <div class="review__head">${N.tpl.stars(r.rating)}<span class="review__meta">${esc(r.date)}</span></div>
          <h3 class="review__title" style="font-family:var(--sans);letter-spacing:0;line-height:1.3">${esc(r.title)}</h3>
          <p>${esc(r.text)}</p>
          <p class="review__meta"><strong style="color:var(--ink)">${esc(r.name)}</strong>${r.city ? ' · ' + esc(r.city) : ''}${r.size ? ' · comprou ' + esc(r.size) : ''}${r.verified ? ' · <b>✓ Compra verificada</b>' : ''}</p>
        </article>`).join('')}
      </div>`;
  }

  function writeReview() {
    const me = N.auth.user();
    const modal = N.ui.modal({
      title: 'Sua avaliação',
      width: '34rem',
      focus: '#rv-5',
      html: `<form class="form-grid" data-review-form novalidate>
        <div>
          <p class="field__label" id="rv-label" style="margin-bottom:.5rem">Nota</p>
          <div class="star-input" role="radiogroup" aria-labelledby="rv-label">
            ${[5, 4, 3, 2, 1].map(n => `<input type="radio" name="rating" id="rv-${n}" value="${n}" ${n === 5 ? 'checked' : ''}><label for="rv-${n}"><span class="sr-only">${n} estrela${n > 1 ? 's' : ''}</span><span aria-hidden="true">★</span></label>`).join('')}
          </div>
        </div>
        <div class="field"><label class="field__label" for="rv-name">Seu nome</label><input class="field__input" id="rv-name" name="name" value="${me ? esc(me.name) : ''}" data-validate="required" autocomplete="name"></div>
        <div class="field"><label class="field__label" for="rv-title">Título</label><input class="field__input" id="rv-title" name="title" placeholder="Resuma em uma frase" data-validate="required"></div>
        <div class="field"><label class="field__label" for="rv-text">Avaliação</label><textarea id="rv-text" name="text" placeholder="Como é o tecido, o caimento, a estampa?" data-validate="required min:20"></textarea></div>
        <button class="btn btn--block" type="submit">Publicar avaliação</button>
      </form>`
    });
    qs('form', modal).addEventListener('submit', e => {
      e.preventDefault();
      if (!N.forms.validate(e.target)) return;
      const v = N.forms.values(e.target);
      const all = N.store.get('reviews', {});
      (all[p.id] = all[p.id] || []).unshift({ name: v.name, title: v.title, text: v.text, rating: +v.rating || 5, date: 'agora mesmo', size: state.size || '' });
      N.store.set('reviews', all);
      N.ui.closeLayer(modal);
      renderReviews();
      N.ui.toast('Avaliação publicada. Obrigado por compartilhar!');
    });
  }

  function renderRelated() {
    const el = qs('[data-related-grid]');
    if (!el) return;
    el.innerHTML = N.catalog.related(p, 4).map((r, i) => N.tpl.card(r).replace('<article class="card"', `<article data-reveal style="--d:${(i * 0.07).toFixed(2)}s" class="card"`)).join('');
  }

  /* ------------------------------------------------------------------ */
  /* EVENTOS                                                             */
  /* ------------------------------------------------------------------ */
  root.addEventListener('click', e => {
    let el;
    if ((el = e.target.closest('[data-color]'))) { state.color = el.dataset.color; updateGallery(); updateOptions(); return; }
    if ((el = e.target.closest('[data-size]'))) { state.size = el.dataset.size; updateOptions(); return; }
    if ((el = e.target.closest('[data-step]'))) { state.qty = Math.max(1, state.qty + +el.dataset.step); updateOptions(); return; }
    if (e.target.closest('[data-add]')) { addToCart(); return; }
    if (e.target.closest('[data-buy-now]')) { addToCart('checkout'); return; }
    if (e.target.closest('[data-size-guide]')) { sizeGuide(); return; }
    if ((el = e.target.closest('[data-stage]'))) el.classList.toggle('is-zoomed');
  });
  root.addEventListener('keydown', e => {
    const stage = e.target.closest('[data-stage]');
    if (stage && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); stage.classList.toggle('is-zoomed'); }
    /* setas nos grupos de rádio (cor / tamanho) */
    const radio = e.target.closest('[role="radio"]');
    if (radio && ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      const items = qsa('[role="radio"]:not([disabled])', radio.parentElement);
      const next = items[(items.indexOf(radio) + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
      next.focus();
      next.click();
    }
  });
  /* zoom segue o cursor */
  root.addEventListener('mousemove', e => {
    const stage = e.target.closest('[data-stage]');
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const pv = qs('.pv', stage);
    if (pv) pv.style.transformOrigin = `${((e.clientX - r.left) / r.width * 100).toFixed(1)}% ${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`;
  });
  root.addEventListener('mouseleave', e => { if (e.target.matches && e.target.matches('[data-stage]')) e.target.classList.remove('is-zoomed'); }, true);

  root.addEventListener('submit', e => {
    const form = e.target.closest('[data-cep-form]');
    if (!form) return;
    e.preventDefault();
    if (!N.forms.validate(form)) return;
    const btn = qs('button[type="submit"]', form);
    const cep = form.cep.value;
    btn.classList.add('is-loading');
    qs('[data-ship-result]').innerHTML = '<div class="skeleton" style="height:3.4rem"></div><div class="skeleton" style="height:3.4rem"></div>';
    setTimeout(() => { btn.classList.remove('is-loading'); N.cart.setCep(cep); showShipping(cep); }, 700);
  });

  N.bus.on('tab:change', d => {
    if (!d.tab.dataset.view) return;
    state.view = d.tab.dataset.view;
    qs('[data-stage]').classList.remove('is-zoomed');
    qs('[data-stage-img]').innerHTML = N.media.visual(p, { view: state.view, color: state.color });
  });

  document.addEventListener('click', e => {
    if (e.target.closest('[data-write-review]')) writeReview();
    if (e.target.closest('[data-buybar-add]')) addToCart();
  });

  /* ---- init ---- */
  setTimeout(() => {
    render();
    renderReviews();
    /* barra de compra fixa no mobile quando o botão principal sai da tela */
    const bar = qs('[data-buybar]');
    const add = qs('[data-add]', root);
    if (bar && add && 'IntersectionObserver' in window) {
      qs('[data-buybar-name]').textContent = name;
      qs('[data-buybar-price]').textContent = brl(p.price);
      new IntersectionObserver(en => bar.classList.toggle('is-on', !en[0].isIntersecting && en[0].boundingClientRect.top < 0), { threshold: 0 }).observe(add);
      updateOptions();
    }
  }, 280);
  renderVerse();
  renderReviews();
  renderRelated();
})();
