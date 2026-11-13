/* ==========================================================================
   NAIN — máscaras e validação de formulários
   Uso no HTML:
     <input data-mask="cpf" data-validate="required cpf">
   Máscaras: cpf, cep, phone, card, expiry, cvv
   Regras:  required, email, cpf, cep, phone, card, expiry, cvv, min:N, match:#id, name
   ========================================================================== */
(function () {
  const N = window.NAIN;
  const digits = v => String(v || '').replace(/\D/g, '');

  const masks = {
    cpf: v => digits(v).slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'),
    cep: v => digits(v).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2'),
    phone: v => {
      const d = digits(v).slice(0, 11);
      if (d.length <= 2) return d.length ? '(' + d : '';
      if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
      if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
      return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    },
    card: v => digits(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '),
    expiry: v => digits(v).slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2'),
    cvv: v => digits(v).slice(0, 4)
  };

  function validCPF(v) {
    const c = digits(v);
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    const calc = n => {
      let sum = 0;
      for (let i = 0; i < n; i++) sum += +c[i] * (n + 1 - i);
      const r = (sum * 10) % 11;
      return r === 10 ? 0 : r;
    };
    return calc(9) === +c[9] && calc(10) === +c[10];
  }
  function luhn(v) {
    const d = digits(v);
    if (d.length < 13) return false;
    let sum = 0, alt = false;
    for (let i = d.length - 1; i >= 0; i--) {
      let n = +d[i];
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n; alt = !alt;
    }
    return sum % 10 === 0;
  }
  function validExpiry(v) {
    const d = digits(v);
    if (d.length !== 4) return false;
    const m = +d.slice(0, 2), y = 2000 + +d.slice(2);
    if (m < 1 || m > 12) return false;
    const now = new Date();
    return y > now.getFullYear() || (y === now.getFullYear() && m >= now.getMonth() + 1);
  }

  const rules = {
    required: (v, el) => (el.type === 'checkbox' ? el.checked : v.trim() !== '') || 'Campo obrigatório.',
    email: v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Digite um e-mail válido.',
    name: v => !v || v.trim().split(/\s+/).length >= 2 || 'Digite nome e sobrenome.',
    cpf: v => !v || validCPF(v) || 'CPF inválido.',
    cep: v => !v || digits(v).length === 8 || 'CEP inválido.',
    phone: v => !v || digits(v).length >= 10 || 'Telefone inválido.',
    card: v => !v || luhn(v) || 'Número de cartão inválido.',
    expiry: v => !v || validExpiry(v) || 'Validade inválida.',
    cvv: v => !v || digits(v).length >= 3 || 'CVV inválido.',
    min: (v, el, n) => !v || v.length >= +n || 'Mínimo de ' + n + ' caracteres.',
    match: (v, el, sel) => { const o = document.querySelector(sel); return !o || o.value === v || 'Os campos não coincidem.'; }
  };

  function fieldOf(el) { return el.closest('.field') || el.closest('.check') || el.parentElement; }

  function setError(el, msg) {
    const field = fieldOf(el);
    let err = field.querySelector('.field__error');
    if (!err) {
      err = document.createElement('p');
      err.className = 'field__error';
      err.id = (el.id || el.name || 'f' + Math.random().toString(36).slice(2)) + '-erro';
      (field.classList.contains('check') ? field.parentElement : field).appendChild(err);
    }
    err.textContent = msg || '';
    field.classList.toggle('is-invalid', !!msg);
    if (msg) { el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', err.id); }
    else el.removeAttribute('aria-invalid');
  }

  function check(el) {
    const list = (el.dataset.validate || '').split(/\s+/).filter(Boolean);
    for (const item of list) {
      const [name, arg] = item.split(':');
      const fn = rules[name];
      if (!fn) continue;
      const res = fn(el.value || '', el, arg);
      if (res !== true) { setError(el, res); return false; }
    }
    setError(el, '');
    return true;
  }

  function validate(root) {
    const fields = N.util.qsa('[data-validate]', root).filter(el => !el.disabled && el.offsetParent !== null);
    let first = null;
    fields.forEach(el => { if (!check(el) && !first) first = el; });
    if (first) first.focus({ preventScroll: false });
    return !first;
  }

  function values(root) {
    const out = {};
    N.util.qsa('input[name], select[name], textarea[name]', root).forEach(el => {
      if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
      else if (el.type === 'checkbox') out[el.name] = el.checked;
      else out[el.name] = el.value.trim();
    });
    return out;
  }

  function fill(root, data) {
    Object.keys(data || {}).forEach(k => {
      const el = root.querySelector('[name="' + k + '"]');
      if (!el || data[k] == null) return;
      if (el.type === 'checkbox') el.checked = !!data[k];
      else el.value = el.dataset.mask && masks[el.dataset.mask] ? masks[el.dataset.mask](data[k]) : data[k];
    });
  }

  /* delegação global: máscara ao digitar, validação ao sair do campo */
  document.addEventListener('input', e => {
    const el = e.target;
    if (!el.dataset) return;
    if (el.dataset.mask && masks[el.dataset.mask]) {
      const masked = masks[el.dataset.mask](el.value);
      if (masked !== el.value) el.value = masked;
    }
    if (el.getAttribute('aria-invalid') === 'true') check(el);
  });
  document.addEventListener('focusout', e => {
    const el = e.target;
    if (el.dataset && el.dataset.validate && el.value) check(el);
  });

  N.forms = { masks, digits, validate, check, setError, values, fill, validCPF, luhn };
})();
