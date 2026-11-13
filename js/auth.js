/* ==========================================================================
   NAIN — conta, endereços e pedidos (tudo simulado em localStorage)
   ATENÇÃO: isto é apenas uma simulação de front-end. Nunca guarde senhas
   no navegador em um projeto real — a autenticação deve ficar no backend.
   ========================================================================== */
(function () {
  const N = window.NAIN;

  /* "hash" apenas ilustrativo, para não deixar a senha em texto puro no storage */
  const fakeHash = s => 'h' + N.util.hash('nain::' + s).toString(36);

  const users = () => N.store.get('users', {});
  const saveUsers = u => N.store.set('users', u);

  N.auth = {
    user() {
      const email = N.store.get('session', null);
      if (!email) return null;
      const u = users()[email];
      return u ? Object.assign({ email }, u, { pass: undefined }) : null;
    },
    isLogged: () => !!N.auth.user(),

    register(data) {
      const email = String(data.email || '').trim().toLowerCase();
      const all = users();
      if (all[email]) return { ok: false, field: 'email', message: 'Já existe uma conta com este e-mail.' };
      all[email] = { name: data.name.trim(), phone: data.phone || '', cpf: data.cpf || '', pass: fakeHash(data.password), addresses: [], since: new Date().toISOString() };
      saveUsers(all);
      N.store.set('session', email);
      N.bus.emit('auth:change', N.auth.user());
      return { ok: true };
    },

    login(email, password) {
      email = String(email || '').trim().toLowerCase();
      const u = users()[email];
      if (!u || u.pass !== fakeHash(password)) return { ok: false, message: 'E-mail ou senha incorretos.' };
      N.store.set('session', email);
      N.bus.emit('auth:change', N.auth.user());
      return { ok: true };
    },

    logout() {
      N.store.remove('session');
      N.bus.emit('auth:change', null);
    },

    update(patch) {
      const me = N.auth.user();
      if (!me) return;
      const all = users();
      Object.assign(all[me.email], patch);
      saveUsers(all);
      N.bus.emit('auth:change', N.auth.user());
    },

    /* endereços */
    addresses: () => (N.auth.user() || { addresses: [] }).addresses || [],
    saveAddress(addr) {
      const me = N.auth.user();
      if (!me) return;
      const list = (me.addresses || []).slice();
      if (addr.id) {
        const i = list.findIndex(a => a.id === addr.id);
        if (i >= 0) list[i] = addr; else list.push(addr);
      } else {
        addr.id = 'e' + Date.now().toString(36);
        list.push(addr);
      }
      if (addr.main || list.length === 1) list.forEach(a => { a.main = a.id === addr.id; });
      N.auth.update({ addresses: list });
      return addr;
    },
    removeAddress(id) {
      const list = N.auth.addresses().filter(a => a.id !== id);
      if (list.length && !list.some(a => a.main)) list[0].main = true;
      N.auth.update({ addresses: list });
    }
  };

  /* ---- pedidos ---- */
  N.orders = {
    all: () => N.store.get('orders', []),
    mine() {
      const me = N.auth.user();
      return me ? N.orders.all().filter(o => o.email === me.email) : [];
    },
    get: number => N.orders.all().find(o => o.number === number) || null,
    create(order) {
      const now = new Date();
      const number = 'NAIN-' + String(now.getFullYear()).slice(2) + String(now.getMonth() + 1).padStart(2, '0') +
        '-' + String(Math.floor(10000 + Math.random() * 89999));
      const full = Object.assign({ number, date: now.toISOString(), status: order.payment.method === 'cartao' ? 'pago' : 'aguardando' }, order);
      const list = N.orders.all();
      list.unshift(full);
      N.store.set('orders', list);
      N.store.set('lastOrder', number);
      return full;
    },
    STATUS: {
      aguardando: { label: 'Aguardando pagamento', step: 0 },
      pago: { label: 'Pagamento aprovado', step: 1 },
      separacao: { label: 'Em separação', step: 2 },
      enviado: { label: 'Enviado', step: 3 },
      entregue: { label: 'Entregue', step: 4 }
    }
  };
})();
