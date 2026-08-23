/* Camada de persistência: tudo fica salvo no localStorage do navegador.
   Nenhum dado sai da sua máquina — não há backend. */
window.FA = window.FA || {};

FA.Store = (function () {
  const MONTH_PREFIX = "fa_month_";
  const RULES_KEY = "fa_rule_overrides";
  const BUDGET_PREFIX = "fa_budget_";
  const SETTINGS_KEY = "fa_settings";

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn("Falha ao ler", key, e);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid() {
    return "t_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function listMonths() {
    const months = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.indexOf(MONTH_PREFIX) === 0) {
        months.push(key.slice(MONTH_PREFIX.length));
      }
    }
    return months.sort();
  }

  function getMonth(month) {
    return readJSON(MONTH_PREFIX + month, { month, openingBalance: 0, transactions: [] });
  }

  function saveMonth(monthData) {
    writeJSON(MONTH_PREFIX + monthData.month, monthData);
  }

  function ensureMonth(month) {
    const existing = readJSON(MONTH_PREFIX + month, null);
    if (existing) return existing;
    const fresh = { month, openingBalance: 0, transactions: [] };
    saveMonth(fresh);
    return fresh;
  }

  function addTransactions(month, txns) {
    const data = ensureMonth(month);
    txns.forEach(t => {
      if (!t.id) t.id = uid();
      data.transactions.push(t);
    });
    saveMonth(data);
    return data;
  }

  function updateTransaction(month, id, patch) {
    const data = getMonth(month);
    const idx = data.transactions.findIndex(t => t.id === id);
    if (idx === -1) return null;
    data.transactions[idx] = Object.assign({}, data.transactions[idx], patch);
    saveMonth(data);
    return data.transactions[idx];
  }

  function deleteTransaction(month, id) {
    const data = getMonth(month);
    data.transactions = data.transactions.filter(t => t.id !== id);
    saveMonth(data);
    return data;
  }

  function deleteMonth(month) {
    localStorage.removeItem(MONTH_PREFIX + month);
    localStorage.removeItem(BUDGET_PREFIX + month);
  }

  function getRuleOverrides() {
    return readJSON(RULES_KEY, {});
  }

  function saveRuleOverride(key, categoryId) {
    const rules = getRuleOverrides();
    rules[key] = categoryId;
    writeJSON(RULES_KEY, rules);
  }

  function getBudget(month) {
    return readJSON(BUDGET_PREFIX + month, {});
  }

  function saveBudget(month, categoryId, amount) {
    const budget = getBudget(month);
    if (amount === null || amount === undefined || amount === "") {
      delete budget[categoryId];
    } else {
      budget[categoryId] = Number(amount);
    }
    writeJSON(BUDGET_PREFIX + month, budget);
  }

  function getSettings() {
    return readJSON(SETTINGS_KEY, { seeded: false });
  }

  function saveSettings(patch) {
    const s = getSettings();
    writeJSON(SETTINGS_KEY, Object.assign(s, patch));
  }

  function exportAll() {
    const dump = { version: 1, exportedAt: new Date().toISOString(), months: {}, rules: getRuleOverrides(), budgets: {} };
    listMonths().forEach(m => {
      dump.months[m] = getMonth(m);
      dump.budgets[m] = getBudget(m);
    });
    return dump;
  }

  function importAll(dump) {
    if (!dump || !dump.months) throw new Error("Arquivo de backup inválido.");
    Object.keys(dump.months).forEach(m => saveMonth(dump.months[m]));
    if (dump.rules) writeJSON(RULES_KEY, dump.rules);
    if (dump.budgets) {
      Object.keys(dump.budgets).forEach(m => writeJSON(BUDGET_PREFIX + m, dump.budgets[m]));
    }
  }

  return {
    uid, listMonths, getMonth, saveMonth, ensureMonth,
    addTransactions, updateTransaction, deleteTransaction, deleteMonth,
    getRuleOverrides, saveRuleOverride,
    getBudget, saveBudget,
    getSettings, saveSettings,
    exportAll, importAll
  };
})();
