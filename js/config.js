/* ==========================================================================
   NAIN — configuração central
   Tudo que você provavelmente vai querer trocar está neste arquivo:
   regras da loja, cupons, contatos e — principalmente — as IMAGENS.
   ========================================================================== */
window.NAIN = window.NAIN || {};

NAIN.config = {
  brand: 'NAIN',
  freeShippingThreshold: 299,   // frete grátis acima de (R$)
  pixDiscount: 0.05,            // 5% de desconto no Pix
  maxInstallments: 6,           // parcelas sem juros
  minInstallment: 40,           // valor mínimo da parcela (R$)
  lowStock: 10,                 // total de unidades para exibir "últimas unidades"
  whatsapp: '5511999990000',
  email: 'ola@nain.com.br',
  instagram: 'https://instagram.com/',
  tiktok: 'https://tiktok.com/',

  coupons: {
    NAIN10:      { type: 'percent',  value: 10, label: '10% OFF' },
    LEVANTA20:   { type: 'percent',  value: 20, min: 400, label: '20% OFF acima de R$ 400' },
    FRETEGRATIS: { type: 'shipping', label: 'Frete grátis' }
  }
};

/* --------------------------------------------------------------------------
   IMAGENS
   Uma entrada por produto e, dentro dela, uma por cor (mesmas chaves de
   NAIN.COLORS em js/products.js). Cada cor aceita `front` (frente) e
   `back` (costas). Se só existir uma das duas, o site usa a que houver.
   Fotos que já mostram frente e costas juntas entram inteiras em `front`;
   `focus` (opcional) diz onde o zoom de "detalhe da estampa" deve mirar.

   Use fotos com FUNDO BRANCO (ou PNG transparente), proporção 4:5 e, de
   preferência, 1600 × 2000 px. O fundo branco se funde ao site sozinho.
   -------------------------------------------------------------------------- */
(function () {
  const dir = 'assets/produtos/';

  NAIN.images = {
    products: {
      'camiseta-eis-me-aqui': {
        areia: { front: dir + 'eis-me-aqui-areia.jpg', focus: '74% 50%' },
        preto: { front: dir + 'eis-me-aqui-preto.jpg', focus: '74% 50%' }
      },
      'camiseta-todavia': {
        marrom:   { front: dir + 'todavia-marrom-frente.jpg' },
        offwhite: { back: dir + 'todavia-offwhite-costas.jpg' }
      },
      'camiseta-em-tudo-deem-gracas': {
        offwhite: { back: dir + 'em-tudo-deem-gracas-offwhite-costas.jpg' }
      },
      'camiseta-totalidade-da-promessa': {
        cafe: { front: dir + 'totalidade-da-promessa-cafe.jpg', focus: '74% 50%' }
      },
      'camiseta-vivendo-a-promessa': {
        oliva: { front: dir + 'vivendo-a-promessa-oliva.jpg', focus: '74% 50%' }
      },
      'moletom-todavia': {
        oliva: { front: dir + 'moletom-todavia-oliva.jpg', focus: '72% 70%' }
      },
      'moletom-nada-intencional': {
        cinza: { front: dir + 'moletom-nada-intencional-cinza-frente.jpg' }
      }
    },

    /* peça que "se levanta" no hero da home (fundo branco ou PNG transparente) */
    hero: { garment: dir + 'hero-moletom.jpg', product: 'moletom-nada-intencional' },

    /* blocos gigantes de categoria na home: produto + cor + vista usados como capa */
    categories: {
      camisetas: { product: 'camiseta-todavia', color: 'marrom', view: 'front' },
      moletons:  { product: 'moletom-todavia', color: 'oliva', view: 'front' }
    },

    /* seção "O versículo por trás da peça" (home): produto + cor */
    verses: [
      { product: 'camiseta-todavia', color: 'offwhite', highlight: 'eu me alegrarei' },
      { product: 'camiseta-em-tudo-deem-gracas', color: 'offwhite', highlight: 'dai graças' },
      { product: 'camiseta-eis-me-aqui', color: 'areia', highlight: 'Eis-me aqui' },
      { product: 'camiseta-totalidade-da-promessa', color: 'cafe', highlight: 'não o cumprirá' },
      { product: 'moletom-todavia', color: 'oliva', highlight: 'exultarei' }
    ]
  };
})();
