/* ==========================================================================
   NAIN — persistência (localStorage) + barramento de eventos
   ========================================================================== */
(function () {
  const N = window.NAIN = window.NAIN || {};
  const PREFIX = 'nain:';
  const listeners = {};

  N.bus = {
    on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); return () => N.bus.off(evt, fn); },
    off(evt, fn) { listeners[evt] = (listeners[evt] || []).filter(f => f !== fn); },
    emit(evt, data) { (listeners[evt] || []).slice().forEach(fn => { try { fn(data); } catch (e) { console.error(e); } }); }
  };

  N.store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* modo privado / cota */ }
      N.bus.emit('store:' + key, value);
    },
    remove(key) {
      try { localStorage.removeItem(PREFIX + key); } catch (e) { /* noop */ }
      N.bus.emit('store:' + key, null);
    },
    session: {
      get(key) { try { return sessionStorage.getItem(PREFIX + key); } catch (e) { return null; } },
      set(key, v) { try { sessionStorage.setItem(PREFIX + key, v); } catch (e) { /* noop */ } }
    }
  };

  /* sincroniza abas diferentes */
  window.addEventListener('storage', e => {
    if (!e.key || e.key.indexOf(PREFIX) !== 0) return;
    N.bus.emit('store:sync', e.key.slice(PREFIX.length));
  });
})();
