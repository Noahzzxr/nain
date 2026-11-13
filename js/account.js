/* ==========================================================================
   NAIN — login / cadastro e Minha conta (pedidos, endereços, dados)
   Tudo simulado: os dados ficam apenas no localStorage deste navegador.
   ========================================================================== */
(function () {
  const N = window.NAIN;
  const { qs, qsa, brl, esc } = N.util;
  const I = N.icons;
  const page = document.body.dataset.page;
  const safeNext = () => {
    const next = N.util.param('next') || '';
    return /^[a-z0-9-]+\.html(#[a-z0-9-]*)?$/i.test(next) ? next : 'conta.html';
  };

  /* ================================================================ */
  /* LOGIN / CADASTRO                                                  */
  /* ================================================================ */
  if (page === 'login') {
    if (N.auth.isLogged()) { location.replace(safeNext()); return; }

    if (N.util.param('aba') === 'cadastro') N.ui.selectTab(qs('#tab-cadastro'), true);

    qs('[data-login]').addEventListener('submit', e => {
      e.preventDefault();
      const form = e.target;
      if (!N.forms.validate(form)) return;
      const btn = qs('button[type="submit"]', form);
      btn.classList.add('is-loading');
      setTimeout(() => {
        const res = N.auth.login(form.email.value, form.password.value);
        btn.classList.remove('is-loading');
        if (!res.ok) { N.forms.setError(form.password, res.message); form.password.focus(); return; }
        location.href = safeNext();
      }, 600);
    });

    qs('[data-register]').addEventListener('submit', e => {
      e.preventDefault();
      const form = e.target;
      if (!N.forms.validate(form)) return;
      const v = N.forms.values(form);
      const btn = qs('button[type="submit"]', form);
      btn.classList.add('is-loading');
      setTimeout(() => {
        const res = N.auth.register({ name: v.name, email: v.email, phone: N.forms.digits(v.phone), password: v.password });
        btn.classList.remove('is-loading');
        if (!res.ok) { N.forms.setError(form.email, res.message); form.email.focus(); return; }
        location.href = safeNext();
      }, 700);
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('[data-forgot]')) return;
      const modal = N.ui.modal({
        title: 'Recuperar senha', width: '30rem', focus: '#fg-email',
        html: `<form class="form-grid" novalidate><p class="muted">Digite o e-mail da sua conta. Enviaremos um link para criar uma nova senha.</p>
          <div class="field"><label class="field__label" for="fg-email">E-mail</label><input class="field__input" id="fg-email" name="email" type="email" data-validate="required email" autocomplete="email"></div>
          <button class="btn btn--block" type="submit">Enviar link</button></form>`
      });
      qs('form', modal).addEventListener('submit', ev => {
        ev.preventDefault();
        if (!N.forms.validate(ev.target)) return;
        N.ui.closeLayer(modal);
        N.ui.toast('Se o e-mail existir, o link chega em instantes. (Demonstração)');
      });
    });
    return;
  }

  /* ================================================================ */
  /* MINHA CONTA                                                       */
  /* ================================================================ */
  if (page !== 'conta') return;
  const me = N.auth.user();
  if (!me) { location.replace('login.html?next=conta.html'); return; }

  const TABS = ['pedidos', 'enderecos', 'dados'];
  const dateBR = iso => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  qs('[data-hello]').textContent = me.name.split(' ')[0];
  qs('[data-since]').textContent = 'Cliente desde ' + new Date(me.since || Date.now()).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  /* ---- pedidos ---- */
  function renderOrders() {
    const box = qs('#painel-pedidos');
    const orders = N.orders.mine();
    if (!orders.length) {
      box.innerHTML = '<h2>Pedidos</h2>' + N.tpl.empty({ title: 'Nenhum pedido ainda', text: 'Quando você fizer a primeira compra, ela aparece aqui com o status de entrega.', cta: 'Ver coleção' });
      return;
    }
    const labels = ['Pedido recebido', 'Pagamento aprovado', 'Em separação', 'Enviado', 'Entregue'];
    box.innerHTML = '<h2>Pedidos</h2>' + orders.map((o, idx) => {
      const st = N.orders.STATUS[o.status] || N.orders.STATUS.aguardando;
      const count = o.items.reduce((n, i) => n + i.qty, 0);
      return `<article class="order">
        <div class="order__head">
          <div><small>Pedido</small><strong>${esc(o.number)}</strong></div>
          <div><small>Data</small><span>${dateBR(o.date)}</span></div>
          <div><small>Status</small><span class="status${st.step >= 1 ? ' status--ok' : ''}">${st.label}</span></div>
          <div><small>Total</small><strong>${brl(o.totals.total)}</strong></div>
          <button type="button" class="acc__btn" style="padding:0;width:auto;font-size:.76rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase" aria-expanded="${idx === 0}" aria-controls="pedido-${idx}">Detalhes <span class="acc__plus" aria-hidden="true"></span></button>
        </div>
        <div class="acc__panel${idx === 0 ? ' is-open' : ''}" id="pedido-${idx}"><div><div class="order__body">
          <ol class="timeline" aria-label="Andamento do pedido">${labels.map((l, i) => `<li class="${i <= st.step ? 'is-done' : ''}${i === st.step + 1 ? ' is-now' : ''}">${l}</li>`).join('')}</ol>
          <div class="stack">${o.items.map(i => `<div class="mini-line">
            <div class="mini-line__img">${N.catalog.get(i.id) ? N.media.visual(N.catalog.get(i.id), { color: i.color, label: null }) : ''}</div>
            <div><b>${esc(i.name)}</b><span>${esc(i.colorName)} · ${esc(i.size)} · ${i.qty} un.</span></div><strong>${brl(i.total)}</strong></div>`).join('')}</div>
          <div class="addr-grid">
            <div><p class="caps muted" style="margin-bottom:.4rem">Entrega</p><p>${esc(o.shipping.name)} · até ${esc(o.shipping.eta)}</p><p class="small muted">${esc(o.address.street)}, ${esc(o.address.number)} · ${esc(o.address.city)}/${esc(o.address.uf)}</p></div>
            <div><p class="caps muted" style="margin-bottom:.4rem">Pagamento</p><p>${o.payment.method === 'pix' ? 'Pix' : o.payment.method === 'boleto' ? 'Boleto' : esc(o.payment.brand) + ' final ' + esc(o.payment.last4) + ' · ' + o.payment.installments + 'x'}</p><p class="small muted">${count} ${count === 1 ? 'peça' : 'peças'} · frete ${o.totals.shipping ? brl(o.totals.shipping) : 'grátis'}</p></div>
          </div>
          <p><a class="link small" href="trocas.html">Precisa trocar ou devolver?</a></p>
        </div></div></div>
      </article>`;
    }).join('');
  }

  /* ---- endereços ---- */
  function renderAddresses() {
    const list = N.auth.addresses();
    qs('#painel-enderecos').innerHTML = `<h2>Endereços</h2><div class="addr-grid">
      ${list.map(a => `<div class="addr">
        <p class="caps">${esc(a.label || 'Endereço')}${a.main ? ' · <span style="color:var(--accent-ink)">Principal</span>' : ''}</p>
        <p>${esc(a.street)}, ${esc(a.number)}${a.complement ? ' — ' + esc(a.complement) : ''}</p>
        <p class="muted small">${esc(a.district)} · ${esc(a.city)}/${esc(a.uf)} · CEP ${N.forms.masks.cep(a.cep || '')}</p>
        <div class="addr__actions"><button type="button" class="link" data-addr-edit="${a.id}">Editar</button>${a.main ? '' : `<button type="button" class="link" data-addr-main="${a.id}">Tornar principal</button>`}<button type="button" class="link" data-addr-del="${a.id}">Excluir</button></div>
      </div>`).join('')}
      <button type="button" class="addr addr--new" data-addr-edit="">${I.plus}<span>Adicionar endereço</span></button>
    </div>`;
  }

  function addressModal(id) {
    const a = N.auth.addresses().find(x => x.id === id) || {};
    const f = (idn, label, rules, col, extra) => `<div class="field ${col || ''}"><label class="field__label" for="ad-${idn}">${label}</label><input class="field__input" id="ad-${idn}" name="${idn}" ${rules ? `data-validate="${rules}"` : ''} ${extra || ''}></div>`;
    const modal = N.ui.modal({
      title: id ? 'Editar endereço' : 'Novo endereço', focus: '#ad-label',
      html: `<form class="form-grid" novalidate>
        ${f('label', 'Apelido', 'required', 'col-3', 'placeholder="Casa, trabalho…"')}
        ${f('cep', 'CEP', 'required cep', 'col-3', 'data-mask="cep" inputmode="numeric" placeholder="00000-000"')}
        ${f('street', 'Rua / avenida', 'required', 'col-4')}
        ${f('number', 'Número', 'required', 'col-2')}
        ${f('complement', 'Complemento', '', 'col-3')}
        ${f('district', 'Bairro', 'required', 'col-3')}
        ${f('city', 'Cidade', 'required', 'col-4')}
        ${f('uf', 'UF', 'required', 'col-2', 'maxlength="2" style="text-transform:uppercase"')}
        <label class="check"><input type="checkbox" name="main"><span class="check__box" aria-hidden="true"></span><span>Usar como endereço principal</span></label>
        <button class="btn btn--block" type="submit">Salvar endereço</button>
      </form>`
    });
    const form = qs('form', modal);
    N.forms.fill(form, a);
    form.cep.addEventListener('input', () => {
      const r = N.shipping.region(form.cep.value);
      if (r && !form.city.value) { form.city.value = r.city; form.uf.value = r.uf; }
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!N.forms.validate(form)) return;
      const v = N.forms.values(form);
      N.auth.saveAddress(Object.assign({}, a, v, { cep: N.forms.digits(v.cep), uf: v.uf.toUpperCase() }));
      N.ui.closeLayer(modal);
      renderAddresses();
      N.ui.toast('Endereço salvo.');
    });
  }

  /* ---- dados ---- */
  function renderData() {
    const u = N.auth.user();
    qs('#painel-dados').innerHTML = `<h2>Meus dados</h2>
      <form class="form-grid" data-profile novalidate style="max-width:44rem">
        <div class="field col-3"><label class="field__label" for="pf-name">Nome completo</label><input class="field__input" id="pf-name" name="name" data-validate="required name" autocomplete="name"></div>
        <div class="field col-3"><label class="field__label" for="pf-email">E-mail</label><input class="field__input" id="pf-email" name="email" readonly aria-describedby="pf-email-hint" style="opacity:.65"><p class="field__hint" id="pf-email-hint">O e-mail identifica a sua conta e não pode ser alterado.</p></div>
        <div class="field col-3"><label class="field__label" for="pf-cpf">CPF</label><input class="field__input" id="pf-cpf" name="cpf" data-mask="cpf" data-validate="cpf" inputmode="numeric" placeholder="000.000.000-00"></div>
        <div class="field col-3"><label class="field__label" for="pf-phone">Celular</label><input class="field__input" id="pf-phone" name="phone" data-mask="phone" data-validate="phone" inputmode="numeric" placeholder="(11) 90000-0000"></div>
        <div><button class="btn" type="submit">Salvar alterações</button></div>
      </form>
      <hr class="rule" style="margin:2.5rem 0">
      <p class="muted small" style="max-width:52ch">Esta é uma conta de demonstração: todos os dados ficam guardados apenas neste navegador. Para apagar tudo, saia da conta e limpe os dados do site.</p>`;
    N.forms.fill(qs('[data-profile]'), u);
  }

  /* ---- navegação por abas + hash ---- */
  function show(tab) {
    if (!TABS.includes(tab)) tab = 'pedidos';
    N.ui.selectTab(qs('#aba-' + tab), true);
  }
  N.bus.on('tab:change', d => {
    const name = (d.panel || '').replace('painel-', '');
    if (TABS.includes(name)) { try { history.replaceState(null, '', '#' + name); } catch (e) { /* noop */ } }
  });
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));

  document.addEventListener('click', e => {
    let el;
    if (e.target.closest('[data-logout]')) { N.auth.logout(); location.href = 'index.html'; return; }
    if ((el = e.target.closest('[data-addr-edit]'))) { addressModal(el.dataset.addrEdit); return; }
    if ((el = e.target.closest('[data-addr-main]'))) {
      const a = N.auth.addresses().find(x => x.id === el.dataset.addrMain);
      N.auth.saveAddress(Object.assign({}, a, { main: true }));
      renderAddresses();
      return;
    }
    if ((el = e.target.closest('[data-addr-del]'))) { N.auth.removeAddress(el.dataset.addrDel); renderAddresses(); N.ui.toast('Endereço excluído.'); }
  });
  document.addEventListener('submit', e => {
    const form = e.target.closest('[data-profile]');
    if (!form) return;
    e.preventDefault();
    if (!N.forms.validate(form)) return;
    const v = N.forms.values(form);
    N.auth.update({ name: v.name, cpf: N.forms.digits(v.cpf), phone: N.forms.digits(v.phone) });
    qs('[data-hello]').textContent = v.name.split(' ')[0];
    N.ui.toast('Dados atualizados.');
  });

  renderOrders();
  renderAddresses();
  renderData();
  show(location.hash.slice(1));
})();
