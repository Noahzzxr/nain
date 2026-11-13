/* ==========================================================================
   NAIN — página do carrinho
   quantidade, remover, cupom, frete por CEP e barra de frete grátis.
   (As ações de quantidade/remover são delegadas em js/ui.js.)
   ========================================================================== */
(function () {
  const N = window.NAIN;
  const { qs, qsa, brl, esc } = N.util;
  const root = qs('[data-cartpage]');
  if (!root) return;

  function totalsHTML(t) {
    const row = (label, value, cls) => `<div class="${cls || ''}"><dt>${label}</dt><dd>${value}</dd></div>`;
    return `<dl class="totals">
      ${row(`Subtotal (${t.count} ${t.count === 1 ? 'item' : 'itens'})`, brl(t.subtotal))}
      ${t.discount ? row(`Cupom ${esc(t.coupon)}`, '− ' + brl(t.discount), 'is-discount') : ''}
      ${row('Frete', t.shipping == null ? 'Informe o CEP' : t.shipping === 0 ? 'Grátis' : brl(t.shipping), t.shipping === 0 ? 'is-discount' : '')}
      ${row('Total', brl(t.total), 'totals__total')}
    </dl>
    <p class="small muted">${t.installments.n > 1 ? `ou ${t.installments.n}x de ${brl(t.installments.value)} sem juros · ` : ''}${brl((t.total - (t.shipping || 0)) * (1 - N.config.pixDiscount) + (t.shipping || 0))} no Pix</p>`;
  }

  function shipOptsHTML(t) {
    if (!t.options) return '';
    const r = N.shipping.region(N.cart.state().cep);
    return `<div class="stack" role="radiogroup" aria-label="Opção de entrega">${t.options.map(o => `
      <label class="radio-card check check--radio">
        <input type="radio" name="shipping" value="${o.id}" ${t.chosen.id === o.id ? 'checked' : ''}>
        <span class="check__box" aria-hidden="true"></span>
        <span class="radio-card__main">${o.name}<small>${o.days[0]} a ${o.days[1]} dias úteis · ${r.city}/${r.uf}</small></span>
        <span class="radio-card__price">${o.price ? brl(o.price) : 'Grátis'}</span>
      </label>`).join('')}</div>`;
  }

  function couponHTML(t) {
    const code = N.cart.state().coupon;
    if (code && t.couponInfo) {
      return `<p><span class="coupon-tag">${esc(code)} · ${esc(t.couponInfo.label)} <button type="button" data-coupon-remove aria-label="Remover cupom ${esc(code)}">${N.icons.close}</button></span></p>`;
    }
    return `<form class="field" data-coupon-form novalidate>
      <label class="field__label" for="cupom">Cupom de desconto</label>
      <div class="inline-form">
        <input class="field__input" id="cupom" name="cupom" placeholder="Ex.: NAIN10" autocomplete="off" style="text-transform:uppercase">
        <button class="btn btn--ghost" type="submit">Aplicar</button>
      </div>
      <p class="field__error"></p>
    </form>`;
  }

  function skeleton() {
    root.innerHTML = `<div>${Array.from({ length: 2 }, () => '<div class="skeleton" style="height:9rem;margin-bottom:1rem"></div>').join('')}</div><div class="skeleton" style="height:24rem"></div>`;
  }

  function build() {
    const lines = N.cart.lines();
    if (!lines.length) {
      root.style.display = 'block';
      root.innerHTML = N.tpl.empty({ title: 'Seu carrinho está vazio', text: 'Nada aqui ainda. Toda história de ressurreição começa com um primeiro passo — escolha a sua peça.', cta: 'Ver coleção' });
      qs('[data-cart-title-count]').textContent = '';
      return;
    }
    root.style.display = '';
    const cep = N.cart.state().cep;
    root.innerHTML = `
      <div>
        <div data-shipbar style="margin-bottom:1.5rem"></div>
        <div class="cartpage__lines" data-lines></div>
        <p style="margin-top:1.5rem"><a class="link-arrow" href="catalogo.html">${N.icons.arrowLeft} Continuar comprando</a></p>
      </div>
      <aside class="summary" aria-label="Resumo do pedido">
        <h2>Resumo</h2>
        <form class="field" data-cep-form novalidate>
          <label class="field__label" for="cep">Calcular frete</label>
          <div class="inline-form">
            <input class="field__input" id="cep" name="cep" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" data-mask="cep" data-validate="required cep" value="${cep ? N.forms.masks.cep(cep) : ''}">
            <button class="btn btn--ghost" type="submit">Calcular</button>
          </div>
        </form>
        <div data-shipopts></div>
        <div data-coupon></div>
        <div data-totals></div>
        <a class="btn btn--block" href="checkout.html">Finalizar compra ${N.icons.arrow}</a>
        <p class="summary__note">${N.icons.lock.replace('class="icon"', 'class="icon icon--sm" style="display:inline;vertical-align:-.15em"')} Compra segura · Pix, cartão ou boleto</p>
      </aside>`;
    update(true);
  }

  function update(full) {
    const lines = N.cart.lines();
    const hasLayout = !!qs('[data-lines]', root);
    if (!lines.length || !hasLayout) return build();
    const t = N.cart.totals();
    N.ui.syncLines(qs('[data-lines]', root), lines);
    qs('[data-shipbar]', root).innerHTML = N.tpl.shipbar(t);
    qs('[data-shipopts]', root).innerHTML = shipOptsHTML(t);
    qs('[data-totals]', root).innerHTML = totalsHTML(t);
    const couponBox = qs('[data-coupon]', root);
    const showing = qs('.coupon-tag', couponBox) ? 'tag' : qs('form', couponBox) ? 'form' : '';
    const want = N.cart.state().coupon && t.couponInfo ? 'tag' : 'form';
    if (full || showing !== want) couponBox.innerHTML = couponHTML(t);
    qs('[data-cart-title-count]').textContent = `${t.count} ${t.count === 1 ? 'item' : 'itens'}`;
  }

  root.addEventListener('submit', e => {
    const cepForm = e.target.closest('[data-cep-form]');
    const couponForm = e.target.closest('[data-coupon-form]');
    if (cepForm) {
      e.preventDefault();
      if (!N.forms.validate(cepForm)) return;
      const btn = qs('button', cepForm);
      btn.classList.add('is-loading');
      qs('[data-shipopts]', root).innerHTML = '<div class="skeleton" style="height:4rem;margin-bottom:.6rem"></div><div class="skeleton" style="height:4rem"></div>';
      setTimeout(() => { btn.classList.remove('is-loading'); N.cart.setCep(cepForm.cep.value); N.ui.toast('Frete calculado para ' + N.shipping.region(cepForm.cep.value).city + ' e região.'); }, 650);
    }
    if (couponForm) {
      e.preventDefault();
      const input = couponForm.cupom;
      const res = N.cart.applyCoupon(input.value);
      if (res.ok) N.ui.toast(res.message);
      else { N.forms.setError(input, res.message); input.focus(); }
    }
  });
  root.addEventListener('click', e => {
    if (e.target.closest('[data-coupon-remove]')) { N.cart.removeCoupon(); N.ui.toast('Cupom removido.'); }
  });
  root.addEventListener('change', e => {
    if (e.target.name === 'shipping') N.cart.setShipping(e.target.value);
  });

  N.bus.on('cart:change', () => update());

  /* relacionados */
  const rel = qs('[data-cart-related]');
  if (rel) {
    const inCart = N.cart.state().items.map(i => i.id);
    rel.innerHTML = N.catalog.bestSellers(12).filter(p => !inCart.includes(p.id)).slice(0, 4)
      .map((p, i) => N.tpl.card(p).replace('<article class="card"', `<article data-reveal style="--d:${(i * 0.07).toFixed(2)}s" class="card"`)).join('');
  }

  skeleton();
  setTimeout(build, 350);
})();
