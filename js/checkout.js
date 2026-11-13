/* ==========================================================================
   NAIN — checkout em etapas (100% simulado)
   identificação → endereço → entrega → pagamento → confirmação
   Nenhum dado de cartão é salvo: só os 4 últimos dígitos entram no pedido.
   ========================================================================== */
(function () {
  const N = window.NAIN;
  const { qs, qsa, brl, esc } = N.util;
  const I = N.icons;
  const root = qs('[data-checkout]');
  if (!root) return;
  const stepsNav = qs('[data-steps]');
  const sumBox = qs('[data-summary]');

  const STEPS = [
    { key: 'id', title: 'Identificação', cta: 'Continuar para endereço' },
    { key: 'addr', title: 'Endereço', cta: 'Continuar para entrega' },
    { key: 'ship', title: 'Entrega', cta: 'Continuar para pagamento' },
    { key: 'pay', title: 'Pagamento', cta: 'Finalizar pedido' }
  ];
  const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');

  const me = N.auth.user();
  const draft = Object.assign({ id: {}, addr: {} }, N.store.get('checkout', {}));
  if (me && !draft.id.email) draft.id = { email: me.email, name: me.name, cpf: me.cpf || '', phone: me.phone || '' };
  if (me && !draft.addr.cep) { const main = (me.addresses || []).find(a => a.main); if (main) draft.addr = Object.assign({}, main); }

  let step = 0;
  let method = 'pix';
  let timer = null;
  const saveDraft = () => N.store.set('checkout', { id: draft.id, addr: draft.addr });

  /* ---------------------------------------------------------------- */
  /* utilidades visuais: QR e código de barras fictícios              */
  /* ---------------------------------------------------------------- */
  function rng(seed) {
    let a = N.util.hash(String(seed));
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function fakeQR(seed) {
    const n = 29, rand = rng(seed);
    let d = '';
    const zone = (r, c) => (r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8);
    const finder = (r, c) => {
      const rr = r < 8 ? r : r - (n - 7), cc = c < 8 ? c : c - (n - 7);
      if (rr < 0 || rr > 6 || cc < 0 || cc > 6) return false;
      return rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4);
    };
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const on = zone(r, c) ? finder(r, c) : rand() > 0.52;
      if (on) d += `M${c} ${r}h1v1h-1z`;
    }
    return `<svg viewBox="-1 -1 ${n + 2} ${n + 2}" role="img" aria-label="QR Code Pix fictício" shape-rendering="crispEdges"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><path d="${d}" fill="#0B0A08"/></svg>`;
  }
  function fakeBars(seed) {
    const rand = rng(seed);
    let x = 0, d = '';
    while (x < 300) { const w = 1 + Math.floor(rand() * 3); d += `M${x} 0h${w}v40h-${w}z`; x += w + 1 + Math.floor(rand() * 3); }
    return `<svg class="boleto__bars" viewBox="0 0 300 40" preserveAspectRatio="none" role="img" aria-label="Código de barras fictício"><path d="${d}" fill="#0B0A08"/></svg>`;
  }
  function digitsLine(seed, len) { const rand = rng(seed); let s = ''; for (let i = 0; i < len; i++) s += Math.floor(rand() * 10); return s; }
  const pixCode = seed => '00020126580014BR.GOV.BCB.PIX0136' + digitsLine(seed, 8) + '-nain-' + digitsLine(seed + 'x', 12) + '5204000053039865802BR5904NAIN6009SAO PAULO6304' + digitsLine(seed + 'y', 4);
  const boletoLine = seed => digitsLine(seed, 47).replace(/^(\d{5})(\d{5})(\d{5})(\d{6})(\d{5})(\d{6})(\d)(\d{14})$/, '$1.$2 $3.$4 $5.$6 $7 $8');
  const brand = num => { const d = num.replace(/\D/g, ''); return /^4/.test(d) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(d) ? 'Mastercard' : /^3[47]/.test(d) ? 'Amex' : /^6/.test(d) ? 'Elo' : 'Cartão'; };

  /* ---------------------------------------------------------------- */
  /* RESUMO LATERAL                                                   */
  /* ---------------------------------------------------------------- */
  const totals = () => N.cart.totals({ pix: method === 'pix' && step === 3 });

  function miniLines(lines) {
    return lines.map(l => `<div class="mini-line">
      <div class="mini-line__img">${N.media.visual(l.product || N.catalog.get(l.id), { color: l.color, label: null })}<span class="mini-line__qty" aria-hidden="true">${l.qty}</span></div>
      <div><b>${esc(l.name || N.catalog.fullName(l.product))}</b><span>${esc(l.colorName)} · ${l.size} · ${l.qty} un.</span></div>
      <strong>${brl(l.total)}</strong></div>`).join('');
  }
  function totalsRows(t) {
    const row = (a, b, cls) => `<div class="${cls || ''}"><dt>${a}</dt><dd>${b}</dd></div>`;
    return `<dl class="totals">
      ${row('Subtotal', brl(t.subtotal))}
      ${t.discount ? row('Cupom ' + esc(t.coupon), '− ' + brl(t.discount), 'is-discount') : ''}
      ${row('Frete', t.shipping == null ? 'A calcular' : t.shipping === 0 ? 'Grátis' : brl(t.shipping), t.shipping === 0 ? 'is-discount' : '')}
      ${t.pix ? row('Desconto Pix (5%)', '− ' + brl(t.pix), 'is-discount') : ''}
      ${row('Total', brl(t.total), 'totals__total')}
    </dl>`;
  }
  function renderSummary() {
    if (!sumBox) return;
    const t = totals();
    sumBox.innerHTML = `<h2>Seu pedido</h2>
      <div class="stack" style="gap:1rem">${miniLines(N.cart.lines())}</div>
      ${totalsRows(t)}
      <p class="summary__note"><a class="link" href="carrinho.html">Editar carrinho${t.coupon ? '' : ' ou aplicar cupom'}</a></p>`;
    const cta = qs('[data-pay-submit]');
    if (cta) cta.innerHTML = `Finalizar pedido · ${brl(t.total)}`;
  }

  /* ---------------------------------------------------------------- */
  /* ETAPAS                                                           */
  /* ---------------------------------------------------------------- */
  const field = (o) => `<div class="field ${o.col || ''}">
      <label class="field__label" for="${o.id}">${o.label}${o.opt ? ' <small>(opcional)</small>' : ''}</label>
      <input class="field__input" id="${o.id}" name="${o.name || o.id}" type="${o.type || 'text'}" ${o.attrs || ''} ${o.rules ? `data-validate="${o.rules}"` : ''} ${o.mask ? `data-mask="${o.mask}"` : ''} ${o.ph ? `placeholder="${o.ph}"` : ''}>
      ${o.hint ? `<p class="field__hint" ${o.hintAttr || ''}>${o.hint}</p>` : ''}
    </div>`;

  const forms = {
    id: () => `
      ${me ? '' : `<p class="note">${I.user}<span>Já tem conta? <a class="link" href="login.html?next=checkout.html">Entre</a> para preencher mais rápido. Ou siga como convidado.</span></p>`}
      <div class="form-grid">
        ${field({ id: 'email', label: 'E-mail', type: 'email', rules: 'required email', col: 'col-3', attrs: 'autocomplete="email"', ph: 'voce@email.com' })}
        ${field({ id: 'name', label: 'Nome completo', rules: 'required name', col: 'col-3', attrs: 'autocomplete="name"' })}
        ${field({ id: 'cpf', label: 'CPF', rules: 'required cpf', mask: 'cpf', col: 'col-3', attrs: 'inputmode="numeric"', ph: '000.000.000-00', hint: 'Usado apenas para a nota fiscal.' })}
        ${field({ id: 'phone', label: 'Celular', type: 'tel', rules: 'required phone', mask: 'phone', col: 'col-3', attrs: 'autocomplete="tel" inputmode="numeric"', ph: '(11) 90000-0000' })}
      </div>`,

    addr: () => {
      const saved = me ? (me.addresses || []) : [];
      return `
      ${saved.length ? `<div><p class="caps" style="margin-bottom:.6rem">Endereços salvos</p><div class="chips">${saved.map(a => `<button type="button" class="chip chip--pill" data-use-addr="${a.id}">${esc(a.label || a.street)}, ${esc(a.number)}</button>`).join('')}</div></div>` : ''}
      <div class="form-grid">
        ${field({ id: 'cep', label: 'CEP', rules: 'required cep', mask: 'cep', col: 'col-2', attrs: 'inputmode="numeric" autocomplete="postal-code"', ph: '00000-000', hint: ' ', hintAttr: 'data-cep-hint aria-live="polite"' })}
        ${field({ id: 'street', label: 'Rua / avenida', rules: 'required', col: 'col-4', attrs: 'autocomplete="address-line1"' })}
        ${field({ id: 'number', label: 'Número', rules: 'required', col: 'col-2', attrs: 'inputmode="numeric"' })}
        ${field({ id: 'complement', label: 'Complemento', opt: true, col: 'col-4', attrs: 'autocomplete="address-line2"', ph: 'Apto, bloco, referência' })}
        ${field({ id: 'district', label: 'Bairro', rules: 'required', col: 'col-2' })}
        ${field({ id: 'city', label: 'Cidade', rules: 'required', col: 'col-2', attrs: 'autocomplete="address-level2"' })}
        <div class="field col-2"><label class="field__label" for="uf">Estado</label>
          <select id="uf" name="uf" data-validate="required" autocomplete="address-level1"><option value="">UF</option>${UFS.map(u => `<option>${u}</option>`).join('')}</select></div>
      </div>`;
    },

    ship: () => {
      const t = totals();
      if (!t.options) return '<p class="muted">Informe um CEP válido na etapa anterior.</p>';
      return `<div class="stack" role="radiogroup" aria-label="Opção de entrega">${t.options.map(o => `
        <label class="radio-card check check--radio">
          <input type="radio" name="shipping" value="${o.id}" ${t.chosen.id === o.id ? 'checked' : ''}>
          <span class="check__box" aria-hidden="true"></span>
          <span class="radio-card__main">${o.name} <span class="muted">· ${o.carrier}</span><small>Chega até ${N.shipping.eta(o.days)}</small></span>
          <span class="radio-card__price">${o.price ? brl(o.price) : 'Grátis'}</span>
        </label>`).join('')}</div>
        ${t.free ? '' : `<p class="small muted">Faltam ${brl(t.left)} para o frete econômico sair grátis.</p>`}`;
    },

    pay: () => {
      const t = N.cart.totals();
      const base = t.total;
      const inst = N.util.installments(base);
      const seed = 'pix' + Math.round(base * 100);
      const tab = (id, label) => `<button type="button" class="tab" role="tab" id="tab-${id}" aria-controls="pay-${id}" aria-selected="${method === id}" tabindex="${method === id ? 0 : -1}" data-method="${id}">${label}</button>`;
      return `
      <div class="tabs" role="tablist" aria-label="Forma de pagamento">${tab('pix', 'Pix · 5% off')}${tab('cartao', 'Cartão')}${tab('boleto', 'Boleto')}</div>

      <div class="tabpanel" id="pay-pix" role="tabpanel" aria-labelledby="tab-pix" ${method === 'pix' ? '' : 'hidden'}>
        <div class="pix">
          <p>Aponte a câmera do app do seu banco ou use o código copia-e-cola. A aprovação é imediata.</p>
          <div class="pix__qr">${fakeQR(seed)}</div>
          <p class="small">Este código expira em <span class="pix__timer" data-pix-timer>15:00</span></p>
          <div class="inline-form" style="width:100%">
            <label class="sr-only" for="pix-code">Código Pix copia-e-cola</label>
            <input class="field__input mono" id="pix-code" readonly value="${pixCode(seed)}">
            <button type="button" class="btn btn--ghost" data-copy="#pix-code">${I.copy} Copiar</button>
          </div>
          <p class="note">${I.check}<span>QR Code de demonstração — nenhuma cobrança real é feita.</span></p>
        </div>
      </div>

      <div class="tabpanel" id="pay-cartao" role="tabpanel" aria-labelledby="tab-cartao" ${method === 'cartao' ? '' : 'hidden'}>
        <div class="pay-grid">
          <div class="ccard" data-ccard aria-hidden="true">
            <div class="ccard__inner">
              <div class="ccard__face">
                <div class="ccard__top"><span class="ccard__chip"></span><span class="ccard__brand" data-cc-brand>Cartão</span></div>
                <div class="ccard__num" data-cc-num>•••• •••• •••• ••••</div>
                <div class="ccard__row"><div><small>Titular</small><span data-cc-name>Nome no cartão</span></div><div><small>Validade</small><span data-cc-exp>MM/AA</span></div></div>
              </div>
              <div class="ccard__face ccard__back">
                <div class="ccard__stripe"></div>
                <div><small style="font-size:.6rem;letter-spacing:.16em;color:var(--muted-dark)">CVV</small><div class="ccard__cvv" data-cc-cvv>•••</div></div>
                <span class="ccard__brand" style="margin-top:auto">NAIN</span>
              </div>
            </div>
          </div>
          <div class="form-grid">
            ${field({ id: 'cc-number', name: 'ccnumber', label: 'Número do cartão', rules: 'required card', mask: 'card', attrs: 'inputmode="numeric" autocomplete="cc-number"', ph: '0000 0000 0000 0000', hint: 'Demonstração: use 4111 1111 1111 1111.' })}
            ${field({ id: 'cc-name', name: 'ccname', label: 'Nome impresso no cartão', rules: 'required', attrs: 'autocomplete="cc-name" style="text-transform:uppercase"' })}
            ${field({ id: 'cc-exp', name: 'ccexp', label: 'Validade', rules: 'required expiry', mask: 'expiry', col: 'col-3', attrs: 'inputmode="numeric" autocomplete="cc-exp"', ph: 'MM/AA' })}
            ${field({ id: 'cc-cvv', name: 'cccvv', label: 'CVV', rules: 'required cvv', mask: 'cvv', col: 'col-3', attrs: 'inputmode="numeric" autocomplete="cc-csc"', ph: '123' })}
            <div class="field"><label class="field__label" for="cc-inst">Parcelas</label>
              <select id="cc-inst" name="ccinst">${Array.from({ length: inst.n }, (_, i) => `<option value="${i + 1}">${i + 1}x de ${brl(base / (i + 1))} sem juros</option>`).join('')}</select></div>
          </div>
        </div>
      </div>

      <div class="tabpanel" id="pay-boleto" role="tabpanel" aria-labelledby="tab-boleto" ${method === 'boleto' ? '' : 'hidden'}>
        <div class="stack" style="gap:1rem">
          <p>O boleto é gerado ao finalizar e vence em 2 dias úteis. A compensação leva até 1 dia útil — só então separamos o seu pedido.</p>
          <p class="note">${I.box}<span>As peças ficam reservadas até o vencimento do boleto.</span></p>
        </div>
      </div>`;
    }
  };

  const summaries = {
    id: () => `${esc(draft.id.name)} · ${esc(draft.id.email)} · ${esc(N.forms.masks.phone(draft.id.phone || ''))}`,
    addr: () => { const a = draft.addr; return `${esc(a.street)}, ${esc(a.number)}${a.complement ? ' — ' + esc(a.complement) : ''} · ${esc(a.district)}, ${esc(a.city)}/${esc(a.uf)} · CEP ${N.forms.masks.cep(a.cep || '')}`; },
    ship: () => { const c = N.cart.totals().chosen; return c ? `${c.name} · até ${N.shipping.eta(c.days)} · ${c.price ? brl(c.price) : 'Grátis'}` : ''; }
  };

  function render(focusStep) {
    clearInterval(timer);
    stepsNav.innerHTML = STEPS.concat([{ title: 'Confirmação' }]).map((s, i) => `<li class="${i < step ? 'is-done' : i === step ? 'is-current' : ''}" ${i === step ? 'aria-current="step"' : ''}><span>${s.title}</span></li>`).join('');
    root.innerHTML = STEPS.map((s, i) => {
      if (i < step) return `<section class="cstep is-done" aria-label="${s.title}"><div class="cstep__head"><h2>${s.title}</h2><button type="button" class="link small" data-edit="${i}">Editar</button></div><p class="cstep__sum">${summaries[s.key]()}</p></section>`;
      if (i > step) return `<section class="cstep is-locked" aria-label="${s.title} (etapa bloqueada)"><div class="cstep__head"><h2>${s.title}</h2></div></section>`;
      return `<section class="cstep is-current" aria-labelledby="step-title"><div class="cstep__head"><h2 id="step-title" tabindex="-1">${s.title}</h2><span class="caps muted">Etapa ${i + 1} de ${STEPS.length}</span></div>
        <form class="cstep__body" data-step-form novalidate>${forms[s.key]()}
          <div class="cstep__actions">
            <button class="btn" type="submit" ${s.key === 'pay' ? 'data-pay-submit' : ''}>${s.cta} ${I.arrow}</button>
            ${i > 0 ? `<button type="button" class="link small" data-edit="${i - 1}">Voltar</button>` : ''}
          </div>
          ${s.key === 'pay' ? `<p class="small muted">${I.lock.replace('class="icon"', 'class="icon icon--sm" style="display:inline;vertical-align:-.15em"')} Ambiente de demonstração: nenhum pagamento é processado.</p>` : ''}
        </form></section>`;
    }).join('');

    const form = qs('[data-step-form]', root);
    const key = STEPS[step].key;
    if (key === 'id') N.forms.fill(form, draft.id);
    if (key === 'addr') N.forms.fill(form, draft.addr);
    if (key === 'pay') startPixTimer();
    renderSummary();
    if (focusStep) {
      const h = qs('#step-title');
      if (h) { h.focus({ preventScroll: true }); h.scrollIntoView({ block: 'start', behavior: N.util.reducedMotion() ? 'auto' : 'smooth' }); }
    }
  }

  function startPixTimer() {
    let left = 15 * 60;
    const el = qs('[data-pix-timer]');
    if (!el) return;
    timer = setInterval(() => {
      left = Math.max(0, left - 1);
      el.textContent = String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(left % 60).padStart(2, '0');
      if (!left) clearInterval(timer);
    }, 1000);
  }

  /* busca simulada de CEP */
  let cepLookup = '';
  function lookupCep(input) {
    const d = N.forms.digits(input.value);
    if (d.length !== 8 || d === cepLookup) return;
    cepLookup = d;
    const hint = qs('[data-cep-hint]');
    const form = input.form;
    hint.textContent = 'Buscando endereço…';
    setTimeout(() => {
      const r = N.shipping.region(d);
      if (!r || N.forms.digits(input.value) !== d) return;
      form.city.value = r.city;
      form.uf.value = r.uf;
      hint.textContent = `Encontramos: ${r.city}/${r.uf}. Complete rua e número.`;
      N.cart.setCep(d);
      if (!form.street.value) form.street.focus();
    }, 650);
  }

  function next(form) {
    const key = STEPS[step].key;
    if (key === 'pay') return finish(form);
    if (!N.forms.validate(form)) return;
    const v = N.forms.values(form);
    if (key === 'id') { draft.id = { email: v.email.toLowerCase(), name: v.name, cpf: N.forms.digits(v.cpf), phone: N.forms.digits(v.phone) }; }
    if (key === 'addr') { draft.addr = Object.assign({}, v, { cep: N.forms.digits(v.cep) }); N.cart.setCep(draft.addr.cep); }
    if (key === 'ship') { if (v.shipping) N.cart.setShipping(v.shipping); }
    saveDraft();
    step++;
    render(true);
  }

  function finish(form) {
    if (method === 'cartao' && !N.forms.validate(form)) return;
    const btn = qs('[data-pay-submit]');
    btn.classList.add('is-loading');
    const v = N.forms.values(form);
    const t = N.cart.totals({ pix: method === 'pix' });
    const lines = N.cart.lines();
    setTimeout(() => {
      const order = N.orders.create({
        email: draft.id.email,
        customer: Object.assign({}, draft.id),
        address: Object.assign({}, draft.addr),
        items: lines.map(l => ({ id: l.id, name: N.catalog.fullName(l.product), color: l.color, colorName: l.colorName, size: l.size, qty: l.qty, unit: l.unit, total: l.total })),
        totals: { subtotal: t.subtotal, discount: t.discount, shipping: t.shipping || 0, pix: t.pix, total: t.total },
        coupon: t.coupon,
        shipping: { name: t.chosen.name, carrier: t.chosen.carrier, eta: N.shipping.eta(t.chosen.days) },
        payment: method === 'cartao'
          ? { method, brand: brand(v.ccnumber), last4: N.forms.digits(v.ccnumber).slice(-4), installments: +v.ccinst || 1 }
          : { method }
      });
      /* salva o endereço na conta, se logado e ainda não houver nenhum */
      if (N.auth.isLogged() && !N.auth.addresses().length) N.auth.saveAddress(Object.assign({ label: 'Casa', main: true }, draft.addr));
      N.cart.clear();
      confirmation(order);
    }, 1500);
  }

  /* ---------------------------------------------------------------- */
  /* CONFIRMAÇÃO                                                      */
  /* ---------------------------------------------------------------- */
  function confirmation(o) {
    clearInterval(timer);
    step = STEPS.length;
    stepsNav.innerHTML = STEPS.concat([{ title: 'Confirmação' }]).map((s, i) => `<li class="${i < step ? 'is-done' : 'is-current'}"><span>${s.title}</span></li>`).join('');
    const pm = o.payment;
    const first = o.customer.name.split(' ')[0];
    const payBox = pm.method === 'pix'
      ? `<div class="pix" style="justify-items:center;margin-top:1rem"><div class="pix__qr">${fakeQR(o.number)}</div>
          <div class="inline-form" style="width:min(100%,30rem)"><label class="sr-only" for="pix-final">Código Pix</label><input class="field__input mono" id="pix-final" readonly value="${pixCode(o.number)}"><button type="button" class="btn btn--ghost" data-copy="#pix-final">${I.copy} Copiar</button></div>
          <p class="small muted">Pague em até 15 minutos para garantir as peças. (Demonstração — nada será cobrado.)</p></div>`
      : pm.method === 'boleto'
        ? `<div class="stack" style="width:min(100%,34rem);gap:1rem;margin-top:1rem">${fakeBars(o.number)}
            <div class="inline-form"><label class="sr-only" for="boleto-line">Linha digitável</label><input class="field__input mono" id="boleto-line" readonly value="${boletoLine(o.number)}"><button type="button" class="btn btn--ghost" data-copy="#boleto-line">${I.copy} Copiar</button></div>
            <p class="small muted">Boleto de demonstração, vencimento em 2 dias úteis.</p></div>`
        : '';
    const layout = qs('[data-checkout-layout]');
    layout.className = '';
    layout.innerHTML = `<section class="confirm" aria-labelledby="confirm-title">
      <span class="empty__dot" aria-hidden="true"></span>
      <p class="eyebrow">${pm.method === 'cartao' ? 'Pagamento aprovado' : 'Pedido recebido'}</p>
      <h1 class="display display--lg" id="confirm-title" tabindex="-1">${esc(first)}, <em>levanta-te.</em><br>Seu pedido está a caminho.</h1>
      <p class="lead" style="margin-inline:auto">Enviamos os detalhes para <strong>${esc(o.email)}</strong>. Guarde o número do pedido:</p>
      <p class="confirm__num">${o.number}</p>
      ${payBox}
      <div class="confirm__grid">
        <div class="box"><h3>Entrega</h3><p>${esc(o.shipping.name)} · chega até ${esc(o.shipping.eta)}</p><p class="small muted">${esc(o.address.street)}, ${esc(o.address.number)} — ${esc(o.address.city)}/${esc(o.address.uf)}</p></div>
        <div class="box"><h3>Pagamento</h3><p>${pm.method === 'pix' ? 'Pix (5% de desconto)' : pm.method === 'boleto' ? 'Boleto bancário' : `${esc(pm.brand)} final ${esc(pm.last4)} · ${pm.installments}x`}</p><p class="small muted">${pm.method === 'cartao' ? 'Aprovado' : 'Aguardando pagamento'}</p></div>
        <div class="box"><h3>Total</h3><p style="font-family:var(--serif);font-size:1.9rem;line-height:1;letter-spacing:-.03em">${brl(o.totals.total)}</p><p class="small muted">${o.items.reduce((n, i) => n + i.qty, 0)} ${o.items.length === 1 && o.items[0].qty === 1 ? 'peça' : 'peças'}</p></div>
      </div>
      <div class="box" style="width:min(100%,60rem);text-align:left"><div class="stack" style="gap:1rem">${miniLines(o.items)}</div></div>
      <div class="confirm__actions">
        <a class="btn" href="${N.auth.isLogged() ? 'conta.html#pedidos' : 'login.html?next=conta.html'}">${N.auth.isLogged() ? 'Acompanhar pedido' : 'Criar conta para acompanhar'} ${I.arrow}</a>
        <a class="btn btn--ghost" href="catalogo.html">Continuar comprando</a>
      </div>
    </section>`;
    window.scrollTo({ top: 0, behavior: 'auto' });
    qs('#confirm-title').focus({ preventScroll: true });
    N.ui.toast('Pedido ' + o.number + ' confirmado.');
  }

  /* ---------------------------------------------------------------- */
  /* EVENTOS                                                          */
  /* ---------------------------------------------------------------- */
  document.addEventListener('submit', e => {
    const form = e.target.closest('[data-step-form]');
    if (!form) return;
    e.preventDefault();
    next(form);
  });

  document.addEventListener('click', e => {
    let el;
    if ((el = e.target.closest('[data-edit]'))) { step = +el.dataset.edit; render(true); return; }
    if ((el = e.target.closest('[data-copy]'))) {
      const input = qs(el.dataset.copy);
      input.select();
      const done = () => N.ui.toast('Código copiado.');
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(input.value).then(done, done);
      else { try { document.execCommand('copy'); } catch (err) { /* noop */ } done(); }
      return;
    }
    if ((el = e.target.closest('[data-use-addr]'))) {
      const a = (me.addresses || []).find(x => x.id === el.dataset.useAddr);
      if (a) { N.forms.fill(qs('[data-step-form]'), a); N.cart.setCep(a.cep); }
    }
  });

  document.addEventListener('input', e => {
    const el = e.target;
    if (el.id === 'cep') lookupCep(el);
    /* preview animado do cartão */
    const card = qs('[data-ccard]');
    if (!card) return;
    if (el.id === 'cc-number') {
      const d = N.forms.digits(el.value).padEnd(16, '•');
      qs('[data-cc-num]').textContent = d.replace(/(.{4})(?=.)/g, '$1 ');
      qs('[data-cc-brand]').textContent = brand(el.value);
    }
    if (el.id === 'cc-name') qs('[data-cc-name]').textContent = el.value || 'Nome no cartão';
    if (el.id === 'cc-exp') qs('[data-cc-exp]').textContent = el.value || 'MM/AA';
    if (el.id === 'cc-cvv') qs('[data-cc-cvv]').textContent = el.value || '•••';
  });
  document.addEventListener('focusin', e => { const c = qs('[data-ccard]'); if (c) c.classList.toggle('is-flipped', e.target.id === 'cc-cvv'); });
  document.addEventListener('change', e => { if (e.target.name === 'shipping') N.cart.setShipping(e.target.value); });

  N.bus.on('tab:change', d => {
    if (!d.tab.dataset.method) return;
    method = d.tab.dataset.method;
    renderSummary();
  });
  N.bus.on('cart:change', () => { if (step < STEPS.length) renderSummary(); });

  /* ---- init ---- */
  if (!N.cart.count()) {
    const layout = qs('[data-checkout-layout]');
    layout.className = '';
    stepsNav.hidden = true;
    layout.innerHTML = N.tpl.empty({ title: 'Nada para finalizar ainda', text: 'Seu carrinho está vazio. Escolha uma peça e volte aqui — o checkout leva menos de dois minutos.', cta: 'Ver coleção' });
    return;
  }
  render(false);
})();
