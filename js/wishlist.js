/* ==========================================================================
   NAIN — favoritos
   ========================================================================== */
(function () {
  const N = window.NAIN;
  const KEY = 'wishlist';
  let ids = N.store.get(KEY, []);
  if (!Array.isArray(ids)) ids = [];
  ids = ids.filter(id => N.catalog.get(id));

  function save(meta) {
    N.store.set(KEY, ids);
    N.bus.emit('wishlist:change', Object.assign({ ids }, meta || {}));
  }
  N.bus.on('store:sync', key => {
    if (key !== KEY) return;
    ids = N.store.get(KEY, []);
    N.bus.emit('wishlist:change', { ids, synced: true });
  });

  N.wishlist = {
    ids: () => ids.slice(),
    has: id => ids.includes(id),
    count: () => ids.length,
    products: () => ids.map(id => N.catalog.get(id)).filter(Boolean),
    toggle(id) {
      const on = !ids.includes(id);
      ids = on ? [id].concat(ids) : ids.filter(x => x !== id);
      save({ id, on });
      return on;
    },
    clear() { ids = []; save(); }
  };
})();
