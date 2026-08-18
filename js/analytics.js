/* Agregações: transforma a lista de transações de um mês em indicadores,
   séries para gráficos e rankings de categoria. */
window.FA = window.FA || {};

FA.Analytics = (function () {

  function computeMonth(monthData) {
    const txns = monthData.transactions || [];
    const real = txns.filter(t => t.kind !== "liquidacao_fatura");

    const income = real.filter(t => t.kind === "receita").reduce((s, t) => s + Math.abs(t.amount), 0);
    const expenses = real.filter(t => t.kind === "despesa").reduce((s, t) => s + Math.abs(t.amount), 0);
    const investments = real.filter(t => t.kind === "investimento").reduce((s, t) => s + Math.abs(t.amount), 0);
    const net = income - expenses;
    const savingsRate = income > 0 ? net / income : 0;

    const byCategory = groupByCategory(real.filter(t => t.kind === "despesa"), expenses);
    const incomeByCategory = groupByCategory(real.filter(t => t.kind === "receita"), income);

    const cardTotal = real.filter(t => t.source === "cartao").reduce((s, t) => s + Math.abs(t.amount), 0);
    const bankExpenses = real.filter(t => t.source === "banco" && t.kind === "despesa").reduce((s, t) => s + Math.abs(t.amount), 0);

    const balanceSeries = buildBalanceSeries(monthData);

    return {
      month: monthData.month,
      income, expenses, investments, net, savingsRate,
      byCategory, incomeByCategory,
      cardTotal, bankExpenses,
      balanceSeries,
      txnCount: txns.length,
      topCategory: byCategory[0] || null
    };
  }

  function groupByCategory(list, total) {
    const map = {};
    list.forEach(t => {
      const id = t.category || "outros";
      map[id] = (map[id] || 0) + Math.abs(t.amount);
    });
    return Object.keys(map)
      .map(id => ({
        id,
        label: FA.categoryLabel(id),
        value: map[id],
        color: (FA.CATEGORY_MAP[id] && FA.CATEGORY_MAP[id].color) || "var(--series-8)",
        pct: total > 0 ? (map[id] / total) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  }

  function buildBalanceSeries(monthData) {
    const bank = (monthData.transactions || [])
      .filter(t => t.source === "banco")
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date) || 0);
    let running = monthData.openingBalance || 0;
    const byDay = {};
    const order = [];
    bank.forEach(t => {
      running += t.amount;
      if (!(t.date in byDay)) order.push(t.date);
      byDay[t.date] = running;
    });
    const points = order.map(date => ({ date, label: FA.formatDateBR(date), value: byDay[date] }));
    points.unshift({ date: "abertura", label: "Saldo inicial", value: monthData.openingBalance || 0 });
    return points;
  }

  function monthOverMonth(months) {
    // months: array ordenada de { month, computed }
    return months.map((m, i) => {
      const prev = months[i - 1];
      return {
        month: m.month,
        income: m.computed.income,
        expenses: m.computed.expenses,
        net: m.computed.net,
        deltaExpenses: prev ? m.computed.expenses - prev.computed.expenses : null
      };
    });
  }

  return { computeMonth, groupByCategory, buildBalanceSeries, monthOverMonth };
})();
