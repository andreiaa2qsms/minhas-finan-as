/* Taxonomia de categorias e regras padrão de classificação.
   Paleta categórica fixa e validada (skill dataviz) — a cor segue a identidade
   da categoria, nunca a posição/rank, e nunca é reciclada entre categorias. */
window.FA = window.FA || {};

FA.CATEGORIES = [
  { id: "moradia",   label: "Moradia",            group: "despesa", color: "var(--series-1)" },
  { id: "alimentacao", label: "Alimentação",       group: "despesa", color: "var(--series-2)" },
  { id: "transporte", label: "Transporte",         group: "despesa", color: "var(--series-3)" },
  { id: "saude",     label: "Saúde",               group: "despesa", color: "var(--series-4)" },
  { id: "lazer",     label: "Lazer & assinaturas", group: "despesa", color: "var(--series-5)" },
  { id: "compras",   label: "Compras",             group: "despesa", color: "var(--series-6)" },
  { id: "educacao",  label: "Educação",            group: "despesa", color: "var(--series-7)" },
  { id: "outros",    label: "Outros",              group: "despesa", color: "var(--series-8)" },
  { id: "salario",       label: "Salário",              group: "receita", color: "var(--good)" },
  { id: "renda_extra",   label: "Renda extra",          group: "receita", color: "var(--good)" },
  { id: "rendimentos",   label: "Rendimentos",          group: "receita", color: "var(--good)" },
  { id: "investimentos", label: "Aportes em investimentos", group: "investimento", color: "var(--series-1)" }
];

FA.CATEGORY_MAP = Object.fromEntries(FA.CATEGORIES.map(c => [c.id, c]));

FA.categoryLabel = function (id) {
  return (FA.CATEGORY_MAP[id] && FA.CATEGORY_MAP[id].label) || "Outros";
};

/* Regras por palavra-chave para lançamentos bancários, mais específicas primeiro.
   category: bucket usado para cor/gráfico. subcategory: rótulo mais granular exibido nas tabelas. */
FA.BANK_KEYWORD_RULES = [
  { test: /ALUGUEL/i, category: "moradia", subcategory: "Aluguel" },
  { test: /CONDOMINIO/i, category: "moradia", subcategory: "Condomínio" },
  { test: /(ENEL|ENERGIA|LUZ\b|CEMIG|COPEL|CPFL|CELESC)/i, category: "moradia", subcategory: "Energia elétrica" },
  { test: /(VIVO|CLARO|TIM\b|OI FIBRA|INTERNET|FIBRA|NET VIRTUA)/i, category: "moradia", subcategory: "Internet / telefonia" },
  { test: /(SABESP|SANEAMENTO|AGUA\b|COPASA)/i, category: "moradia", subcategory: "Água e saneamento" },
  { test: /(UNIMED|AMIL|SULAMERICA|HAPVIDA|BRADESCO SAUDE|PLANO DE SAUDE)/i, category: "saude", subcategory: "Plano de saúde" },
  { test: /(DROGASIL|FARMACIA|DROGARIA|PAGUE MENOS)/i, category: "saude", subcategory: "Farmácia" },
  { test: /(CULTURA INGLESA|ESCOLA|CURSO|FACULDADE|UNIVERSIDADE|EAD\b)/i, category: "educacao", subcategory: "Educação" },
  { test: /(SMARTFIT|ACADEMIA|BLUEFIT|BODYTECH)/i, category: "outros", subcategory: "Academia / bem-estar" },
  { test: /(SUPERMERCADO|MERCADO\b|HORTIFRUTI|ACOUGUE|SACOLAO)/i, category: "alimentacao", subcategory: "Supermercado" },
  { test: /(IFOOD|RAPPI|UBER EATS|RESTAURANTE|LANCHONETE|PADARIA)/i, category: "alimentacao", subcategory: "Restaurantes e delivery" },
  { test: /(POSTO|COMBUSTIVEL|IPIRANGA|SHELL|PETROBRAS|ALESAT)/i, category: "transporte", subcategory: "Combustível" },
  { test: /(UBER|99APP|TAXI|CABIFY)/i, category: "transporte", subcategory: "Transporte por app" },
  { test: /(DIARISTA|FAXINA|DOMESTICA)/i, category: "outros", subcategory: "Serviços domésticos" },
  { test: /(SEGURO|SEG AUTO|SEG VIDA|SEG RESIDENCIAL)/i, category: "outros", subcategory: "Seguros" },
  { test: /(PET SHOP|VETERINAR|PETLOVE|COBASI)/i, category: "outros", subcategory: "Pets" },
  { test: /PRESENTE/i, category: "outros", subcategory: "Presentes e doações" },
  { test: /(TARIFA|PACOTE DE SERVICOS|MANUTENCAO DE CONTA|ANUIDADE)/i, category: "outros", subcategory: "Tarifas bancárias" },
  { test: /(RENDIMENTO|CDB\b|POUPANCA RENDIMENTO|JUROS)/i, category: "rendimentos", subcategory: "Rendimentos de investimentos", kind: "receita" },
  { test: /(CONTA INVESTIMENTO|APLICACAO|RESERVA\b|TESOURO)/i, category: "investimentos", subcategory: "Aportes em investimentos", kind: "investimento" },
  { test: /SALARIO/i, category: "salario", subcategory: "Salário", kind: "receita" },
  { test: /(PAGTO FATURA|PAGAMENTO FATURA|PAGAMENTO DE FATURA)/i, category: null, subcategory: "Pagamento de fatura de cartão", kind: "liquidacao_fatura" }
];

/* Quando nenhuma palavra-chave bate, cai no tipo de lançamento do extrato. */
FA.BANK_TYPE_FALLBACK = {
  "PIX RECEBIDO":  { category: "renda_extra", subcategory: "Pix recebido", kind: "receita" },
  "CREDITO TED":   { category: "renda_extra", subcategory: "Crédito recebido", kind: "receita" },
  "PIX ENVIADO":   { category: "outros", subcategory: "Pix enviado", kind: "despesa" },
  "DEB AUTOMATICO":{ category: "outros", subcategory: "Débito automático", kind: "despesa" },
  "COMPRA DEBITO": { category: "compras", subcategory: "Compra no débito", kind: "despesa" },
  "SAQUE":         { category: "outros", subcategory: "Saque em espécie", kind: "despesa" },
  "TARIFA":        { category: "outros", subcategory: "Tarifas bancárias", kind: "despesa" },
  "RENDIMENTO":    { category: "rendimentos", subcategory: "Rendimentos", kind: "receita" },
  "PAGTO FATURA":  { category: null, subcategory: "Pagamento de fatura de cartão", kind: "liquidacao_fatura" }
};
