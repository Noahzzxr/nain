/* ==========================================================================
   NAIN — carrinho, cupons e frete simulado
   ========================================================================== */
(function () {
  const N = window.NAIN;
  const KEY = 'cart';
  const blank = () => ({ items: [], coupon: null, cep: '', shippingId: 'economica' });

  let state = Object.assign(blank(), N.store.get(KEY, {}));
  if (!Array.isArray(state.items)) state = blank();
  // descarta itens de produtos que não existem mais
  state.items = state.items.filter(i => N.catalog.get(i.id));

  function save(meta) {
    N.store.set(KEY, state);
    N.bus.emit('cart:change', Object.assign({ state }, meta || {}));
  }
  N.bus.on('store:sync', key => {
    if (key !== KEY) return;
    state = Object.assign(blank(), N.store.get(KEY, {}));
    N.bus.emit('cart:change', { state, synced: true });
  });

  const keyOf = (id, color, size) => [id, color, size].join('|');

  /* ---- frete simulado por região do CEP (primeiro dígito) ---- */
  const REGIONS = [
    { uf: 'SP', city: 'São Paulo',      eco: [14.9, 3, 5],  exp: [24.9, 1, 2] },
    { uf: 'SP', city: 'Campinas',       eco: [14.9, 3, 5],  exp: [24.9, 1, 2] },
    { uf: 'RJ', city: 'Rio de Janeiro', eco: [18.9, 4, 6],  exp: [29.9, 2, 3] },
    { uf: 'MG', city: 'Belo Horizonte', eco: [18.9, 4, 6],  exp: [29.9, 2, 3] },
    { uf: 'BA', city: 'Salvador',       eco: [24.9, 6, 9],  exp: [39.9, 3, 5] },
    { uf: 'PE', city: 'Recife',         eco: [27.9, 7, 10], exp: [44.9, 3, 5] },
    { uf: 'CE', city: 'Fortaleza',      eco: [32.9, 8, 12], exp: [54.9, 4, 6] },
    { uf: 'DF', city: 'Brasília',       eco: [24.9, 5, 8],  exp: [39.9, 3, 4] },
    { uf: 'PR', city: 'Curitiba',       eco: [19.9, 4, 7],  exp: [32.9, 2, 3] },
    { uf: 'RS', city: 'Porto Alegre',   eco: [21.9, 5, 8],  exp: [34.9, 2, 4] }
  ];

  N.shipping = {
    valid: cep => String(cep || '').replace(/\D/g, '').length === 8,
    region(cep) {
      const d = String(cep || '').replace(/\D/g, '');
      return d.length === 8 ? REGIONS[+d[0]] : null;
    },
    /* free = true quando o pedido tem direito a frete grátis (econômico) */
    quote(cep, free) {
      const r = N.shipping.region(cep);
      if (!r) return null;
      return [
        { id: 'economica', name: 'Econômica', carrier: 'Correios PAC', price: free ? 0 : r.eco[0], base: r.eco[0], days: [r.eco[1], r.eco[2]] },
        { id: 'expressa', name: 'Expressa', carrier: 'Transportadora', price: r.exp[0], base: r.exp[0], days: [r.exp[1], r.exp[2]] }
      ];
    },
    eta(days) {
      const d = new Date();
      let left = days[1];
      while (left > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) left--; }
      return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    }
  };

  N.cart = {
    keyOf,
    state: () => state,
    count: () => state.items.reduce((n, i) => n + i.qty, 0),

    /* itens com o produto resolvido */
    lines() {
      return state.items.map(i => {
        const p = N.catalog.get(i.id);
        return Object.assign({}, i, {
          product: p, max: p.stock[i.size] || 0, unit: p.price, total: p.price * i.qty,
          colorName: N.COLORS[i.color] ? N.COLORS[i.color].name : i.color
        });
      });
    },

    add(id, color, size, qty) {
      qty = qty || 1;
      const p = N.catalog.get(id);
      if (!p) return { ok: false, message: 'Peça não encontrada.' };
      const max = p.stock[size] || 0;
      if (max <= 0) return { ok: false, message: 'Tamanho ' + size + ' esgotado.' };
      const key = keyOf(id, color, size);
      const found = state.items.find(i => i.key === key);
      const current = found ? found.qty : 0;
      if (current + qty > max) {
        return { ok: false, message: 'Só temos ' + max + ' unidade' + (max > 1 ? 's' : '') + ' no tamanho ' + size + '.' };
      }
      if (found) found.qty += qty;
      else state.items.push({ key, id, color, size, qty });
      save({ added: key });
      return { ok: true, message: N.catalog.fullName(p) + ' adicionado ao carrinho.' };
    },

    setQty(key, qty) {
      const item = state.items.find(i => i.key === key);
      if (!item) return;
      const max = N.catalog.get(item.id).stock[item.size] || 0;
      if (qty <= 0) return N.cart.remove(key);
      item.qty = Math.min(qty, max);
      save();
      return item.qty;
    },

    remove(key) {
      const idx = state.items.findIndex(i => i.key === key);
      if (idx < 0) return null;
      const removed = state.items.splice(idx, 1)[0];
      save({ removed });
      return removed;
    },

    restore(item) {
      if (!item || state.items.some(i => i.key === item.key)) return;
      state.items.push(item);
      save();
    },

    clear() { state = Object.assign(blank(), { cep: state.cep }); save(); },

    applyCoupon(code) {
      code = String(code || '').trim().toUpperCase();
      const c = N.config.coupons[code];
      if (!code) return { ok: false, message: 'Digite um cupom.' };
      if (!c) return { ok: false, message: 'Cupom inválido ou expirado.' };
      const subtotal = N.cart.subtotal();
      if (c.min && subtotal < c.min) return { ok: false, message: 'Este cupom vale para compras acima de ' + N.util.brl(c.min) + '.' };
      state.coupon = code;
      save();
      return { ok: true, message: 'Cupom ' + code + ' aplicado: ' + c.label + '.' };
    },
    removeCoupon() { state.coupon = null; save(); },

    setCep(cep) { state.cep = String(cep || '').replace(/\D/g, '').slice(0, 8); save(); },
    setShipping(id) { state.shippingId = id; save(); },

    subtotal: () => state.items.reduce((sum, i) => sum + N.catalog.get(i.id).price * i.qty, 0),

    totals(opts) {
      opts = opts || {};
      const cfg = N.config;
      const subtotal = N.cart.subtotal();
      let coupon = state.coupon ? cfg.coupons[state.coupon] : null;
      if (coupon && coupon.min && subtotal < coupon.min) coupon = null;
      const discount = coupon && coupon.type === 'percent' ? subtotal * coupon.value / 100 : 0;
      const base = subtotal - discount;
      const reached = base >= cfg.freeShippingThreshold;
      const free = reached || !!(coupon && coupon.type === 'shipping');
      const options = state.items.length ? N.shipping.quote(state.cep, free) : null;
      const chosen = options ? (options.find(o => o.id === state.shippingId) || options[0]) : null;
      const shipping = chosen ? chosen.price : null;
      const pix = opts.pix ? (base * cfg.pixDiscount) : 0;
      const total = base + (shipping || 0) - pix;
      return {
        count: N.cart.count(), subtotal, discount, coupon: coupon ? state.coupon : null, couponInfo: coupon,
        free, options, chosen, shipping, pix, total,
        left: Math.max(0, cfg.freeShippingThreshold - base),
        progress: Math.min(1, base / cfg.freeShippingThreshold),
        installments: N.util.installments(base + (shipping || 0))
      };
    }
  };
})();
