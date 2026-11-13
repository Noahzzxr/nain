/* ==========================================================================
   NAIN — páginas simples: Favoritos, FAQ (busca) e Contato (formulário)
   ========================================================================== */
(function () {
  const N = window.NAIN;
  const { qs, qsa, esc } = N.util;
  const page = document.body.dataset.page;

  /* ---- FAVORITOS ---- */
  if (page === 'favoritos') {
    const grid = qs('[data-fav-grid]');
    const count = qs('[data-fav-total]');
    const render = () => {
      const list = N.wishlist.products();
      count.textContent = list.length ? `${list.length} ${list.length === 1 ? 'peça salva' : 'peças salvas'}` : '';
      if (!list.length) {
        grid.style.display = 'block';
        grid.innerHTML = N.tpl.empty({ title: 'Nada salvo ainda', text: 'Toque no coração de uma peça para guardá-la aqui. Seus favoritos ficam salvos neste navegador.', cta: 'Explorar a coleção' });
        return;
      }
      grid.style.display = '';
      grid.innerHTML = list.map(p => N.tpl.card(p, { headingLevel: 2 })).join('');
    };
    grid.innerHTML = N.tpl.skeletonCards(Math.max(2, Math.min(4, N.wishlist.count())));
    setTimeout(render, 320);
    N.bus.on('wishlist:change', render);
    document.addEventListener('click', e => {
      if (!e.target.closest('[data-fav-all]')) return;
      const list = N.wishlist.products();
      if (!list.length) return;
      let added = 0;
      list.forEach(p => {
        const size = N.SIZES.find(s => s === 'M' && p.stock[s] > 0) || N.SIZES.find(s => p.stock[s] > 0);
        if (size && N.cart.add(p.id, p.colors[0], size, 1).ok) added++;
      });
      N.ui.toast(added ? `${added} ${added === 1 ? 'peça adicionada' : 'peças adicionadas'} ao carrinho (confira os tamanhos).` : 'Não foi possível adicionar.', added ? {} : { type: 'error' });
      if (added) setTimeout(N.ui.openCart, 300);
    });
  }

  /* ---- FAQ: busca que filtra as perguntas ---- */
  if (page === 'faq') {
    const input = qs('#faq-q');
    const empty = qs('[data-faq-empty]');
    const filter = () => {
      const term = N.util.norm(input.value);
      let shown = 0;
      qsa('.doc section').forEach(sec => {
        let any = false;
        qsa('.acc__item', sec).forEach(item => {
          const ok = !term || N.util.norm(item.textContent).includes(term);
          item.hidden = !ok;
          if (ok) { any = true; shown++; }
          if (term && ok) N.ui.toggleAcc(qs('.acc__btn', item), true);
        });
        sec.hidden = !any;
      });
      empty.hidden = shown > 0;
    };
    input.addEventListener('input', filter);
    input.form.addEventListener('submit', e => e.preventDefault());
    /* abre a pergunta/âncora indicada no hash */
    if (location.hash) {
      const target = qs(location.hash);
      if (target) setTimeout(() => target.scrollIntoView(), 100);
    }
  }

  /* ---- CONTATO ---- */
  if (page === 'contato') {
    const form = qs('[data-contact]');
    const me = N.auth.user();
    if (me) N.forms.fill(form, { name: me.name, email: me.email });
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!N.forms.validate(form)) return;
      const btn = qs('button[type="submit"]', form);
      const v = N.forms.values(form);
      btn.classList.add('is-loading');
      setTimeout(() => {
        const protocol = 'AT-' + String(Date.now()).slice(-6);
        form.innerHTML = `<div class="empty" style="padding:2rem 0;justify-items:start;text-align:left" role="status">
          <span class="empty__dot" aria-hidden="true"></span>
          <h2>Mensagem enviada.</h2>
          <p>Obrigado, ${esc(v.name.split(' ')[0])}. Respondemos em até 1 dia útil no e-mail <strong>${esc(v.email)}</strong>. Protocolo: <strong>${protocol}</strong>.</p>
          <a class="btn btn--ghost" href="catalogo.html">Voltar à coleção</a></div>`;
        N.ui.toast('Mensagem enviada. Protocolo ' + protocol + '.');
      }, 900);
    });
  }
})();
