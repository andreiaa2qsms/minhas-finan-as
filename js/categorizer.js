/* Motor de categorização: transforma lançamentos "crus" (do extrato, da fatura,
   de um CSV ou digitados à mão) em transações normalizadas e já categorizadas.
   Prioridade: 1) regra aprendida pelo usuário (por CNPJ/MCC)  2) palavra-chave
   3) fallback por tipo/MCC  4) "Outros". Isso segue a própria orientação dos
   documentos: CNPJ e MCC são chaves estáveis, a descrição textual não é. */
window.FA = window.FA || {};

FA.Categorizer = (function () {

  function normalizeDoc(doc) {
    return (doc || "").replace(/[^\d*]/g, "");
  }

  function overrideKeyForBank(doc, description) {
    const d = normalizeDoc(doc);
    if (d) return "cnpj:" + d;
    return "desc:" + (description || "").trim().toUpperCase().slice(0, 40);
  }

  function overrideKeyForCard(mcc) {
    return "mcc:" + mcc;
  }

  function classifyBank(description, bankType, doc) {
    const rule = FA.BANK_KEYWORD_RULES.find(r => r.test.test(description));
    if (rule) {
      return { category: rule.category, subcategory: rule.subcategory, kind: rule.kind || (rule.category ? "despesa" : "liquidacao_fatura") };
    }
    const fallback = FA.BANK_TYPE_FALLBACK[bankType];
    if (fallback) return Object.assign({}, fallback);
    return { category: "outros", subcategory: bankType || "Outros", kind: "despesa" };
  }

  function classifyCard(mcc, activity) {
    const category = FA.MCC_MAP[mcc] || "compras";
    return { category, subcategory: activity || FA.MCC_LABELS[mcc] || "Compra no cartão", kind: "despesa" };
  }

  function applyOverride(key, base) {
    const overrides = FA.Store.getRuleOverrides();
    if (overrides[key]) {
      return Object.assign({}, base, { category: overrides[key], subcategory: base.subcategory, overridden: true });
    }
    return base;
  }

  function normalizeBankTxn(raw, month, origin) {
    const key = overrideKeyForBank(raw.doc, raw.description);
    let cls = classifyBank(raw.description, raw.bankType, raw.doc);
    cls = applyOverride(key, cls);
    // Sinal de valor já vem correto do extrato (negativo = saída, positivo = entrada)
    const isIncomeType = raw.amount > 0;
    if (isIncomeType && cls.kind === "despesa") cls.kind = "receita";
    return {
      id: raw.id || FA.Store.uid(),
      month,
      date: raw.date,
      source: "banco",
      description: raw.description,
      counterparty: raw.doc || "",
      doc: raw.doc || "",
      bankType: raw.bankType,
      amount: raw.amount,
      category: cls.category,
      subcategory: cls.subcategory,
      kind: cls.kind,
      overrideKey: key,
      origin: origin || "import"
    };
  }

  function normalizeCardTxn(raw, month, origin, cardLast4) {
    const key = overrideKeyForCard(raw.mcc);
    let cls = classifyCard(raw.mcc, raw.activity);
    cls = applyOverride(key, cls);
    return {
      id: raw.id || FA.Store.uid(),
      month,
      date: raw.date,
      source: "cartao",
      description: raw.merchant,
      counterparty: raw.merchant,
      doc: raw.mcc || "",
      mcc: raw.mcc || "",
      city: raw.city || "",
      cardLast4: cardLast4 || raw.cardLast4 || "",
      amount: -Math.abs(raw.amount), // compra de cartão sempre é saída de dinheiro
      category: cls.category,
      subcategory: cls.subcategory,
      kind: "despesa",
      overrideKey: key,
      origin: origin || "import"
    };
  }

  function normalizeManualTxn(raw, month) {
    const kind = raw.kind || (raw.amount >= 0 ? "receita" : "despesa");
    const signedAmount = kind === "despesa" ? -Math.abs(raw.amount) : Math.abs(raw.amount);
    return {
      id: FA.Store.uid(),
      month,
      date: raw.date,
      source: "manual",
      description: raw.description,
      counterparty: raw.counterparty || "",
      doc: "",
      amount: kind === "investimento" ? -Math.abs(raw.amount) : signedAmount,
      category: raw.category,
      subcategory: raw.subcategory || FA.categoryLabel(raw.category),
      kind,
      origin: "manual"
    };
  }

  function normalizeCsvTxn(raw, month) {
    let category = null;
    if (raw.categoryHint) {
      const hint = raw.categoryHint.toLowerCase();
      const found = FA.CATEGORIES.find(c => c.label.toLowerCase() === hint);
      if (found) category = found.id;
    }
    let kind = raw.amount >= 0 ? "receita" : "despesa";
    if (!category) {
      const cls = classifyBank(raw.description, "", "");
      category = cls.category || "outros";
      kind = cls.kind === "despesa" && raw.amount >= 0 ? "receita" : (cls.kind || kind);
    } else if (FA.CATEGORY_MAP[category]) {
      kind = FA.CATEGORY_MAP[category].group === "receita" ? "receita" : FA.CATEGORY_MAP[category].group === "investimento" ? "investimento" : "despesa";
    }
    return {
      id: raw.id || FA.Store.uid(),
      month,
      date: raw.date,
      source: "manual",
      description: raw.description,
      counterparty: "",
      doc: "",
      amount: raw.amount,
      category,
      subcategory: FA.categoryLabel(category),
      kind,
      origin: "import-csv"
    };
  }

  function learn(txn, newCategoryId) {
    if (!txn.overrideKey) return;
    FA.Store.saveRuleOverride(txn.overrideKey, newCategoryId);
  }

  return {
    normalizeBankTxn, normalizeCardTxn, normalizeManualTxn, normalizeCsvTxn,
    classifyBank, classifyCard, learn,
    overrideKeyForBank, overrideKeyForCard
  };
})();
