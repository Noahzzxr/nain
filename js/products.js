/* ==========================================================================
   NAIN — dados mockados (produtos, cores, avaliações, guia de medidas)
   ========================================================================== */
(function () {
  const N = window.NAIN;

  N.SIZES = ['P', 'M', 'G', 'GG', 'XGG'];

  N.COLORS = {
    preto:    { name: 'Preto',        hex: '#141414' },
    offwhite: { name: 'Off-white',    hex: '#F1EEE8' },
    areia:    { name: 'Areia',        hex: '#E3D2B8' },
    oliva:    { name: 'Oliva',        hex: '#56603A' },
    cafe:     { name: 'Café',         hex: '#33261E' },
    marrom:   { name: 'Marrom',       hex: '#5B3A29' },
    cinza:    { name: 'Cinza mescla', hex: '#B9B9B9' }
  };

  N.CATEGORIES = {
    camisetas: { name: 'Camisetas', singular: 'Camiseta' },
    moletons:  { name: 'Moletons',  singular: 'Moletom' }
  };

  const TEE_DETAILS = [
    '100% algodão penteado, malha 30.1 de 230 g/m²',
    'Modelagem oversized com ombro deslocado',
    'Gola canelada reforçada, costura dupla',
    'Estampa em serigrafia à base d’água',
    'Feita no Brasil, em pequenos lotes'
  ];
  const HOODIE_DETAILS = [
    'Moletom 100% algodão, 400 g/m², flanelado por dentro',
    'Modelagem boxy, capuz duplo forrado e bolso canguru',
    'Punhos e barra em ribana pesada',
    'Estampa em serigrafia puff + bordado no peito',
    'Feito no Brasil, em pequenos lotes'
  ];

  /* As fotos de cada peça/cor ficam em NAIN.images (js/config.js). */
  N.products = [
    {
      id: 'camiseta-eis-me-aqui', category: 'camisetas', name: 'Eis-me Aqui',
      price: 149.9, compareAt: null, colors: ['areia', 'preto'],
      stock: { P: 9, M: 18, G: 14, GG: 7, XGG: 3 },
      rating: 4.9, reviews: 212, isNew: true, sold: 1280, date: '2026-10-28', featured: 0,
      verse: { text: 'Eis-me aqui, envia-me a mim.', ref: 'Isaías 6:8', short: 'Is 6:8' },
      story: 'A resposta de Isaías em pinceladas de tinta, com uma coroa no centro: disponibilidade antes de qualquer plano.',
      description: 'Logo NAIN no peito e, nas costas, a resposta que muda uma vida inteira. Estampa em traço de pincel sobre algodão pesado, corte oversized.',
      details: TEE_DETAILS
    },
    {
      id: 'camiseta-todavia', category: 'camisetas', name: 'Todavia',
      price: 159.9, compareAt: null, colors: ['marrom', 'offwhite'],
      stock: { P: 6, M: 12, G: 11, GG: 6, XGG: 2 },
      rating: 4.9, reviews: 96, isNew: true, sold: 940, date: '2026-11-01', featured: 2,
      verse: { text: 'Todavia, eu me alegrarei no Senhor; exultarei no Deus da minha salvação.', ref: 'Habacuque 3:18', short: 'Hc 3:18' },
      story: 'Uma palavra muda o resto da frase. Letras góticas para uma alegria que não depende da colheita.',
      description: 'Monograma NAIN em letras góticas no peito e o versículo de Habacuque nas costas. Malha estonada, toque macio desde o primeiro uso.',
      details: TEE_DETAILS
    },
    {
      id: 'camiseta-em-tudo-deem-gracas', category: 'camisetas', name: 'Em Tudo Deem Graças',
      price: 149.9, compareAt: 169.9, colors: ['offwhite'],
      stock: { P: 8, M: 11, G: 13, GG: 5, XGG: 2 },
      rating: 4.8, reviews: 121, isNew: false, sold: 870, date: '2026-08-19', featured: 3,
      verse: { text: 'Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco.', ref: '1 Tessalonicenses 5:18', short: '1Ts 5:18' },
      story: 'O pequeno diante do gigante — e, mesmo assim, gratidão. Tinta, respingo e uma funda.',
      description: 'A cena de Davi e Golias em silhueta, com a frase em letra de pincel. Para lembrar que gratidão vem antes da vitória.',
      details: TEE_DETAILS
    },
    {
      id: 'camiseta-totalidade-da-promessa', category: 'camisetas', name: 'Totalidade da Promessa',
      price: 149.9, compareAt: null, colors: ['cafe'],
      stock: { P: 2, M: 3, G: 2, GG: 1, XGG: 0 },
      rating: 4.9, reviews: 74, isNew: false, sold: 510, date: '2026-09-07', featured: 0,
      verse: { text: 'Deus não é homem, para que minta; tendo ele falado, não o cumprirá?', ref: 'Números 23:19', short: 'Nm 23:19' },
      story: '“Eu viverei a totalidade da promessa.” Escrito à mão, com coroas, porque quem prometeu não volta atrás.',
      description: 'Declaração em lettering branco nas costas e logo NAIN no peito. Tom café profundo, lote limitado.',
      details: TEE_DETAILS
    },
    {
      id: 'camiseta-vivendo-a-promessa', category: 'camisetas', name: 'Vivendo a Promessa',
      price: 139.9, compareAt: null, colors: ['oliva'],
      stock: { P: 10, M: 15, G: 12, GG: 8, XGG: 5 },
      rating: 4.7, reviews: 59, isNew: false, sold: 640, date: '2026-07-12', featured: 0,
      verse: { text: 'Retenhamos firmes a confissão da nossa esperança, porque fiel é o que prometeu.', ref: 'Hebreus 10:23', short: 'Hb 10:23' },
      story: 'Não é sobre esperar a promessa chegar: é sobre viver dentro dela enquanto caminha.',
      description: 'Tipografia vazada em mostarda e vermelho sobre verde oliva. Logo “NAIN — Nada Intencional” no peito.',
      details: TEE_DETAILS
    },
    {
      id: 'moletom-todavia', category: 'moletons', name: 'Todavia',
      price: 349.9, compareAt: null, colors: ['oliva'],
      stock: { P: 2, M: 3, G: 3, GG: 1, XGG: 0 },
      rating: 5.0, reviews: 47, isNew: true, sold: 720, date: '2026-11-05', featured: 1,
      verse: { text: 'Todavia, eu me alegrarei no Senhor; exultarei no Deus da minha salvação.', ref: 'Habacuque 3:18', short: 'Hc 3:18' },
      story: 'O mesmo versículo, agora em dourado sobre oliva. Para os dias em que a figueira não floresce.',
      description: 'Moletom de 400 g/m² com monograma gótico no peito, ilhoses dourados e o versículo de Habacuque nas costas. Poucas unidades por tamanho.',
      details: HOODIE_DETAILS
    },
    {
      id: 'moletom-nada-intencional', category: 'moletons', name: 'Nada Intencional',
      price: 329.9, compareAt: 379.9, colors: ['cinza'],
      stock: { P: 6, M: 14, G: 11, GG: 5, XGG: 2 },
      rating: 4.8, reviews: 184, isNew: false, sold: 1120, date: '2026-06-30', featured: 4,
      verse: { text: 'O coração do homem planeja o seu caminho, mas o Senhor lhe dirige os passos.', ref: 'Provérbios 16:9', short: 'Pv 16:9' },
      story: 'NAIN também é “Nada Intencional”: os melhores encontros não estavam no nosso plano — estavam no dEle.',
      description: 'Lettering em estilo universitário, azul-marinho e branco, sobre cinza mescla. Capuz duplo e bolso canguru.',
      details: HOODIE_DETAILS
    }
  ];

  /* ---- guia de medidas (cm) ---- */
  N.sizeGuide = {
    camisetas: {
      cols: ['Tamanho', 'Largura', 'Comprimento', 'Manga'],
      rows: [['P', 56, 70, 22], ['M', 59, 72, 23], ['G', 62, 74, 24], ['GG', 65, 76, 25], ['XGG', 68, 78, 26]]
    },
    moletons: {
      cols: ['Tamanho', 'Largura', 'Comprimento', 'Manga'],
      rows: [['P', 60, 66, 60], ['M', 63, 68, 62], ['G', 66, 70, 64], ['GG', 69, 72, 65], ['XGG', 72, 74, 66]]
    }
  };

  /* ---- avaliações mockadas ---- */
  const REVIEW_POOL = [
    { name: 'Lucas M.', city: 'São Paulo, SP', rating: 5, title: 'Qualidade absurda', text: 'Tecido pesado de verdade, não é aquela malha fina. A estampa é discreta e bonita, já me perguntaram duas vezes onde comprei.' },
    { name: 'Ana Clara R.', city: 'Belo Horizonte, MG', rating: 5, title: 'Virou minha preferida', text: 'O caimento oversized é perfeito. Uso para ir à igreja e para sair, combina com tudo. Chegou em quatro dias.' },
    { name: 'Pedro H.', city: 'Curitiba, PR', rating: 4, title: 'Muito boa, veste grande', text: 'Peça linda e bem acabada. Só fiquem atentos: a modelagem é ampla, pedi um tamanho menor e ficou ideal.' },
    { name: 'Débora S.', city: 'Recife, PE', rating: 5, title: 'A mensagem fala sozinha', text: 'Comprei pela estampa e me surpreendi com o acabamento. Um colega do trabalho puxou assunto sobre o versículo.' },
    { name: 'Matheus O.', city: 'Goiânia, GO', rating: 5, title: 'Streetwear de verdade', text: 'Finalmente uma marca cristã que não parece uniforme de retiro. Design limpo, material premium.' },
    { name: 'Júlia F.', city: 'Rio de Janeiro, RJ', rating: 4, title: 'Linda, queria mais cores', text: 'A peça é impecável e lavou super bem. Só senti falta de mais opções de cor, mas já quero outra.' },
    { name: 'Rafael T.', city: 'Porto Alegre, RS', rating: 5, title: 'Presente certeiro', text: 'Dei de presente para meu irmão e ele não tira do corpo. A embalagem também é muito caprichada.' },
    { name: 'Bianca L.', city: 'Fortaleza, CE', rating: 5, title: 'Vale cada real', text: 'Depois de dez lavagens continua igual: sem desbotar, sem torcer a costura. Dá para sentir o cuidado.' },
    { name: 'Thiago A.', city: 'Campinas, SP', rating: 4, title: 'Ótima compra', text: 'Entrega rápida e a peça é exatamente como nas fotos. O tecido é encorpado, do jeito que eu gosto.' }
  ];
  const DATES = ['há 3 dias', 'há 1 semana', 'há 2 semanas', 'há 3 semanas', 'há 1 mês', 'há 2 meses'];

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  N.catalog = {
    all: () => N.products.slice(),
    get: id => N.products.find(p => p.id === id) || null,
    byCategory: cat => N.products.filter(p => p.category === cat),
    fullName: p => N.CATEGORIES[p.category].singular + ' ' + p.name,
    typeName: p => N.CATEGORIES[p.category].singular,
    totalStock: p => Object.values(p.stock).reduce((a, b) => a + b, 0),
    isLow: p => N.catalog.totalStock(p) <= N.config.lowStock,
    discount: p => (p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0),
    featured: () => N.products.filter(p => p.featured).sort((a, b) => a.featured - b.featured),
    bestSellers: (n = 8) => N.products.slice().sort((a, b) => b.sold - a.sold).slice(0, n),
    related(p, n = 4) {
      const same = N.products.filter(x => x.id !== p.id && x.category === p.category);
      const twin = N.products.filter(x => x.id !== p.id && x.category !== p.category && x.name === p.name);
      const rest = N.products.filter(x => x.id !== p.id && x.category !== p.category && x.name !== p.name);
      return twin.concat(same, rest).slice(0, n);
    },
    search(q) {
      const term = N.util.norm(q);
      if (!term) return [];
      return N.products.filter(p => {
        const hay = N.util.norm([
          N.catalog.fullName(p), p.verse.text, p.verse.ref, p.verse.short, p.description,
          N.CATEGORIES[p.category].name, p.colors.map(c => N.COLORS[c].name).join(' ')
        ].join(' '));
        return term.split(/\s+/).every(t => hay.includes(t));
      });
    },
    reviews(p) {
      const seed = hash(p.id);
      const base = [];
      for (let i = 0; i < 4; i++) {
        const r = REVIEW_POOL[(seed + i * 7) % REVIEW_POOL.length];
        if (base.some(b => b.name === r.name)) continue;
        base.push(Object.assign({}, r, {
          date: DATES[(seed + i) % DATES.length],
          size: N.SIZES[(seed + i * 3) % 4],
          verified: true
        }));
      }
      const mine = (N.store.get('reviews', {})[p.id] || []);
      return mine.concat(base);
    },
    /* distribuição de notas (para as barras do resumo) */
    ratingBars(p) {
      const five = Math.round((p.rating - 4) * 100);
      const clamp = Math.max(55, Math.min(96, five));
      const four = Math.round((100 - clamp) * .7);
      const three = Math.round((100 - clamp) * .2);
      const two = 100 - clamp - four - three;
      return [clamp, four, three, Math.max(0, two), 0];
    }
  };

  /* ---- utilitários gerais ---- */
  N.util = {
    brl: n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    norm: s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(),
    esc: s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    qs: (sel, root) => (root || document).querySelector(sel),
    qsa: (sel, root) => Array.from((root || document).querySelectorAll(sel)),
    param: name => new URLSearchParams(location.search).get(name),
    clamp: (v, a, b) => Math.min(b, Math.max(a, v)),
    hash,
    installments(total) {
      const c = N.config;
      const n = Math.max(1, Math.min(c.maxInstallments, Math.floor(total / c.minInstallment)));
      return { n, value: total / n };
    },
    productUrl: p => 'produto.html?id=' + encodeURIComponent(p.id),
    reducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    wait: ms => new Promise(r => setTimeout(r, ms))
  };
})();
