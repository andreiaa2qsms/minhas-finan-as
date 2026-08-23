/* Renderização das telas do dashboard. Lê dados via FA.Store/FA.Analytics e
   escreve HTML diretamente — sem framework, sem build step. */
window.FA = window.FA || {};

FA.UI = (function () {
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  function currentMonth() { return FA.state.month; }

  function toast(msg, type) {
    const stack = $("#toastStack");
    const t = document.createElement("div");
    t.className = "toast " + (type || "success");
    t.textContent = msg;
    stack.appendChild(t);
    setTimeout(() => t.remove(), 4200);
  }

  // ---------- Topbar / navegação ----------

  function renderMonthSelector() {
    const sel = $("#monthSelect");
    const months = FA.Store.listMonths();
    sel.innerHTML = months.map(m => `<option value="${m}">${FA.monthLabel(m)}</option>`).join("");
    sel.value = currentMonth();
  }

  function showView(view) {
    FA.state.view = view;
    $$(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === view));
    $$(".view").forEach(v => v.hidden = v.id !== "view-" + view);
    render(view);
  }

  function render(view) {
    renderMonthSelector();
    if (view === "overview") renderOverview();
    else if (view === "transactions") renderTransactions();
    else if (view === "card") renderCard();
    else if (view === "categories") renderCategories();
    else if (view === "budget") renderBudget();
    else if (view === "import") renderImport();
    else if (view === "settings") renderSettings();
  }

  function refresh() { render(FA.state.view); }

  // ---------- Visão geral ----------

  function buildInsights(computed, monthData, prevComputed) {
    const insights = [];
    if (computed.income > 0 && computed.expenses > computed.income) {
      insights.push({ type: "critical", icon: "⚠️", text: `Você gastou ${FA.formatCurrency(computed.expenses - computed.income)} a mais do que recebeu neste mês.` });
    } else if (computed.income > 0) {
      insights.push({ type: "good", icon: "✅", text: `Você guardou ${(computed.savingsRate * 100).toFixed(0)}% da sua renda neste mês (${FA.formatCurrency(computed.net)}).` });
    }
    if (computed.topCategory && computed.topCategory.pct >= 28) {
      insights.push({ type: "warning", icon: "🔎", text: `${computed.topCategory.label} concentra ${computed.topCategory.pct.toFixed(0)}% das suas despesas (${FA.formatCurrency(computed.topCategory.value)}).` });
    }
    if (prevComputed && prevComputed.expenses > 0) {
      const diff = computed.expenses - prevComputed.expenses;
      const pct = (diff / prevComputed.expenses) * 100;
      if (Math.abs(pct) >= 12) {
        insights.push({
          type: pct > 0 ? "warning" : "good",
          icon: pct > 0 ? "📈" : "📉",
          text: `Despesas ${pct > 0 ? "subiram" : "caíram"} ${Math.abs(pct).toFixed(0)}% em relação a ${FA.monthLabel(prevComputed.month)}.`
        });
      }
    }
    if (monthData.cardMeta && monthData.cardMeta.dueDate) {
      insights.push({ type: "warning", icon: "💳", text: `Fatura do cartão final ${monthData.cardMeta.cardLast4 || "—"}: ${FA.formatCurrency(computed.cardTotal)}, vence em ${FA.formatDateBR(monthData.cardMeta.dueDate)}.` });
    }
    if (!insights.length) insights.push({ type: "good", icon: "👋", text: "Sem lançamentos suficientes ainda para gerar recomendações — importe um extrato ou adicione lançamentos." });
    return insights;
  }

  function renderOverview() {
    const month = currentMonth();
    const monthData = FA.Store.getMonth(month);
    const computed = FA.Analytics.computeMonth(monthData);
    const prevMonth = FA.shiftMonth(month, -1);
    const prevData = FA.Store.listMonths().includes(prevMonth) ? FA.Store.getMonth(prevMonth) : null;
    const prevComputed = prevData ? FA.Analytics.computeMonth(prevData) : null;

    const el = $("#view-overview");
    el.innerHTML = `
      <div class="grid grid-kpis">
        <div class="card stat-tile">
          <div class="label">Saldo do mês</div>
          <div class="value">${FA.formatCurrency(computed.net)}</div>
          ${deltaHtml(computed.net, prevComputed ? prevComputed.net : null, true)}
        </div>
        <div class="card stat-tile">
          <div class="label">Receitas</div>
          <div class="value">${FA.formatCurrency(computed.income)}</div>
          ${deltaHtml(computed.income, prevComputed ? prevComputed.income : null, true)}
        </div>
        <div class="card stat-tile">
          <div class="label">Despesas</div>
          <div class="value">${FA.formatCurrency(computed.expenses)}</div>
          ${deltaHtml(computed.expenses, prevComputed ? prevComputed.expenses : null, false)}
        </div>
        <div class="card stat-tile">
          <div class="label">Investido / poupado</div>
          <div class="value">${FA.formatCurrency(computed.investments)}</div>
          <div class="sub">${computed.income > 0 ? ((computed.investments / computed.income) * 100).toFixed(0) : 0}% da renda</div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-head">
            <div>
              <h2 class="section-title">Saldo em conta ao longo do mês</h2>
              <p class="section-sub">Reconstruído a partir dos lançamentos bancários importados.</p>
            </div>
          </div>
          <div id="balanceChart"></div>
        </div>
        <div class="card">
          <h2 class="section-title">Assistente</h2>
          <p class="section-sub">Observações automáticas sobre ${FA.monthLabel(month).toLowerCase()}.</p>
          <div class="insight-list">
            ${buildInsights(computed, monthData, prevComputed).map(i => `<div class="insight ${i.type}"><span class="icon">${i.icon}</span><span>${i.text}</span></div>`).join("")}
          </div>
        </div>
      </div>

      <div class="grid grid-2" style="margin-top:16px">
        <div class="card">
          <h2 class="section-title">Receitas x despesas</h2>
          <div id="compareChart"></div>
        </div>
        <div class="card">
          <div class="card-head">
            <h2 class="section-title">Para onde foi o dinheiro</h2>
            <a href="#" data-goto="categories" class="small">ver detalhes →</a>
          </div>
          <div id="topCategoriesChart"></div>
        </div>
      </div>
    `;

    FA.Charts.lineArea($("#balanceChart"), computed.balanceSeries, { color: "var(--series-1)", ariaLabel: "Saldo em conta ao longo do mês" });
    FA.Charts.twoBarCompare($("#compareChart"),
      { label: "Receitas", value: computed.income, color: "var(--good)" },
      { label: "Despesas", value: computed.expenses, color: "var(--critical)" });
    FA.Charts.horizontalBar($("#topCategoriesChart"), computed.byCategory.slice(0, 6), { ariaLabel: "Top categorias de despesa" });

    el.querySelector('[data-goto="categories"]').addEventListener("click", ev => {
      ev.preventDefault();
      $(`.nav-item[data-view="categories"]`).click();
    });
  }

  function deltaHtml(value, prevValue, upIsGood) {
    if (prevValue === null || prevValue === undefined) return `<div class="sub">&nbsp;</div>`;
    const diff = value - prevValue;
    if (Math.abs(diff) < 0.01) return `<div class="delta">Estável vs. mês anterior</div>`;
    const up = diff > 0;
    const good = up === upIsGood;
    const arrow = up ? "↑" : "↓";
    return `<div class="delta ${good ? "good" : "bad"}">${arrow} ${FA.formatCurrency(Math.abs(diff))} vs. mês anterior</div>`;
  }

  // ---------- Lançamentos ----------

  let txnFilter = { source: "todos", category: "todos", search: "" };

  function renderTransactions() {
    const month = currentMonth();
    const monthData = FA.Store.getMonth(month);
    const el = $("#view-transactions");

    const categoryOptions = FA.CATEGORIES.filter(c => c.group === "despesa" || c.group === "receita" || c.group === "investimento");

    el.innerHTML = `
      <div class="card">
        <div class="card-head">
          <div>
            <h2 class="section-title">Lançamentos de ${FA.monthLabel(month)}</h2>
            <p class="section-sub">${monthData.transactions.length} lançamento(s) · clique na categoria para reclassificar.</p>
          </div>
          <button class="btn btn-primary" id="txnAddBtn">+ Lançamento</button>
        </div>
        <div class="filters">
          <select id="filterSource">
            <option value="todos">Todas as origens</option>
            <option value="banco">Extrato bancário</option>
            <option value="cartao">Cartão de crédito</option>
            <option value="manual">Manual</option>
          </select>
          <select id="filterCategory">
            <option value="todos">Todas as categorias</option>
            ${categoryOptions.map(c => `<option value="${c.id}">${c.label}</option>`).join("")}
          </select>
          <input type="search" id="filterSearch" placeholder="Buscar descrição…">
        </div>
        <div class="table-scroll">
          <table class="fa-table">
            <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Origem</th><th class="num">Valor</th><th></th></tr></thead>
            <tbody id="txnTbody"></tbody>
          </table>
        </div>
      </div>
    `;

    $("#filterSource").value = txnFilter.source;
    $("#filterCategory").value = txnFilter.category;
    $("#filterSearch").value = txnFilter.search;

    function draw() {
      let list = monthData.transactions.filter(t => t.kind !== "liquidacao_fatura");
      if (txnFilter.source !== "todos") list = list.filter(t => t.source === txnFilter.source);
      if (txnFilter.category !== "todos") list = list.filter(t => t.category === txnFilter.category);
      if (txnFilter.search.trim()) {
        const q = txnFilter.search.trim().toLowerCase();
        list = list.filter(t => t.description.toLowerCase().includes(q));
      }
      list = list.slice().sort((a, b) => b.date.localeCompare(a.date));
      $("#txnTbody").innerHTML = list.map(rowHtml).join("") || `<tr><td colspan="6" class="fa-empty">Nenhum lançamento encontrado.</td></tr>`;
      wireRowEvents(monthData, draw);
    }

    function rowHtml(t) {
      const cat = FA.CATEGORY_MAP[t.category];
      const color = cat ? cat.color : "var(--series-8)";
      const isIn = t.amount >= 0;
      return `<tr data-id="${t.id}">
        <td>${FA.formatDateBR(t.date)}</td>
        <td>${FA.escapeHtml(t.description)}<div class="small muted">${FA.escapeHtml(t.subcategory || "")}</div></td>
        <td><span class="pill editable" data-id="${t.id}"><span class="dot" style="background:${color}"></span>${FA.escapeHtml(t.subcategory || FA.categoryLabel(t.category))}</span></td>
        <td><span class="tag-source">${sourceLabel(t.source)}</span></td>
        <td class="num ${isIn ? "amount-in" : "amount-out"}">${isIn ? "+" : "−"} ${FA.formatCurrency(Math.abs(t.amount))}</td>
        <td><button class="btn btn-ghost small" data-del="${t.id}" title="Excluir">🗑</button></td>
      </tr>`;
    }

    draw();

    $("#txnAddBtn").addEventListener("click", () => openManualModal());
    $("#filterSource").addEventListener("change", e => { txnFilter.source = e.target.value; draw(); });
    $("#filterCategory").addEventListener("change", e => { txnFilter.category = e.target.value; draw(); });
    $("#filterSearch").addEventListener("input", e => { txnFilter.search = e.target.value; draw(); });
  }

  function sourceLabel(s) {
    return { banco: "Extrato", cartao: "Cartão", manual: "Manual" }[s] || s;
  }

  function wireRowEvents(monthData, redraw) {
    $$('button[data-del]').forEach(b => b.onclick = () => {
      if (!confirm("Excluir este lançamento?")) return;
      FA.Store.deleteTransaction(monthData.month, b.dataset.del);
      Object.assign(monthData, FA.Store.getMonth(monthData.month));
      redraw();
      toast("Lançamento excluído.");
    });
    $$(".pill.editable").forEach(p => p.onclick = () => openCategoryPicker(p, monthData, redraw));
  }

  function openCategoryPicker(pillEl, monthData, redraw) {
    const id = pillEl.dataset.id;
    const txn = monthData.transactions.find(t => t.id === id);
    if (!txn) return;
    const group = txn.amount >= 0 ? ["receita", "investimento"] : ["despesa", "investimento"];
    const options = FA.CATEGORIES.filter(c => group.includes(c.group));
    const select = document.createElement("select");
    select.innerHTML = options.map(c => `<option value="${c.id}" ${c.id === txn.category ? "selected" : ""}>${c.label}</option>`).join("");
    pillEl.replaceWith(select);
    select.focus();
    function commit() {
      const newCat = select.value;
      const patch = { category: newCat, subcategory: FA.categoryLabel(newCat) };
      if (newCat === "investimentos") patch.kind = "investimento";
      else if (["salario", "renda_extra", "rendimentos"].includes(newCat)) patch.kind = "receita";
      else patch.kind = "despesa";
      FA.Store.updateTransaction(monthData.month, id, patch);
      FA.Categorizer.learn(txn, newCat);
      Object.assign(monthData, FA.Store.getMonth(monthData.month));
      redraw();
      toast("Categoria atualizada — o assistente vai lembrar disso da próxima vez.");
    }
    select.addEventListener("change", commit);
    select.addEventListener("blur", () => redraw());
  }

  // ---------- Cartão ----------

  function renderCard() {
    const month = currentMonth();
    const monthData = FA.Store.getMonth(month);
    const cardTxns = monthData.transactions.filter(t => t.source === "cartao");
    const total = cardTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
    const byMcc = {};
    cardTxns.forEach(t => {
      const key = t.mcc || "—";
      if (!byMcc[key]) byMcc[key] = { mcc: key, label: t.subcategory, value: 0, count: 0, category: t.category };
      byMcc[key].value += Math.abs(t.amount);
      byMcc[key].count += 1;
    });
    const mccList = Object.values(byMcc).sort((a, b) => b.value - a.value);
    const meta = monthData.cardMeta || {};

    const el = $("#view-card");
    el.innerHTML = `
      <div class="grid grid-kpis" style="grid-template-columns:repeat(4,1fr)">
        <div class="card stat-tile"><div class="label">Total da fatura</div><div class="value">${FA.formatCurrency(total)}</div><div class="sub">${cardTxns.length} compras</div></div>
        <div class="card stat-tile"><div class="label">Cartão final</div><div class="value">${meta.cardLast4 ? "•••• " + meta.cardLast4 : "—"}</div></div>
        <div class="card stat-tile"><div class="label">Fechamento</div><div class="value" style="font-size:18px">${meta.closingDate ? FA.formatDateBR(meta.closingDate) : "—"}</div></div>
        <div class="card stat-tile"><div class="label">Vencimento</div><div class="value" style="font-size:18px">${meta.dueDate ? FA.formatDateBR(meta.dueDate) : "—"}</div></div>
      </div>
      <div class="grid grid-2">
        <div class="card">
          <h2 class="section-title">Compras do período</h2>
          <div class="table-scroll">
            <table class="fa-table">
              <thead><tr><th>Data</th><th>Estabelecimento</th><th>Ramo (MCC)</th><th>Cidade</th><th class="num">Valor</th></tr></thead>
              <tbody>
                ${cardTxns.slice().sort((a, b) => a.date.localeCompare(b.date)).map(t => `
                  <tr>
                    <td>${FA.formatDateBR(t.date)}</td>
                    <td>${FA.escapeHtml(t.description)}</td>
                    <td>${FA.escapeHtml(t.subcategory)} <span class="muted small">${t.mcc}</span></td>
                    <td>${FA.escapeHtml(t.city || "")}</td>
                    <td class="num">${FA.formatCurrency(Math.abs(t.amount))}</td>
                  </tr>`).join("") || `<tr><td colspan="5" class="fa-empty">Nenhuma compra de cartão neste mês. Importe a fatura em "Importar".</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
        <div class="card">
          <h2 class="section-title">Gasto por ramo de atividade</h2>
          <div id="mccChart"></div>
        </div>
      </div>
    `;
    FA.Charts.horizontalBar($("#mccChart"), mccList.map(m => ({ label: m.label, value: m.value, pct: total ? (m.value / total) * 100 : 0, color: (FA.CATEGORY_MAP[m.category] || {}).color })), { ariaLabel: "Gasto por ramo de atividade" });
  }

  // ---------- Categorias ----------

  function renderCategories() {
    const month = currentMonth();
    const monthData = FA.Store.getMonth(month);
    const computed = FA.Analytics.computeMonth(monthData);
    const el = $("#view-categories");
    el.innerHTML = `
      <div class="grid grid-2">
        <div class="card">
          <h2 class="section-title">Despesas por categoria</h2>
          <p class="section-sub">Total: ${FA.formatCurrency(computed.expenses)}</p>
          <div id="catChart"></div>
        </div>
        <div class="card">
          <h2 class="section-title">Receitas por origem</h2>
          <p class="section-sub">Total: ${FA.formatCurrency(computed.income)}</p>
          <div id="incomeChart"></div>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <h2 class="section-title">Detalhe por subcategoria</h2>
        <div class="table-scroll">
          <table class="fa-table">
            <thead><tr><th>Categoria</th><th>Subcategoria</th><th class="num">Qtde</th><th class="num">Valor</th></tr></thead>
            <tbody>${subcategoryRows(monthData)}</tbody>
          </table>
        </div>
      </div>
    `;
    FA.Charts.horizontalBar($("#catChart"), computed.byCategory, { ariaLabel: "Despesas por categoria" });
    FA.Charts.horizontalBar($("#incomeChart"), computed.incomeByCategory, { ariaLabel: "Receitas por origem" });
  }

  function subcategoryRows(monthData) {
    const map = {};
    monthData.transactions.filter(t => t.kind === "despesa").forEach(t => {
      const key = t.category + "|" + (t.subcategory || "");
      if (!map[key]) map[key] = { category: t.category, subcategory: t.subcategory, value: 0, count: 0 };
      map[key].value += Math.abs(t.amount);
      map[key].count += 1;
    });
    const rows = Object.values(map).sort((a, b) => b.value - a.value);
    if (!rows.length) return `<tr><td colspan="4" class="fa-empty">Sem despesas neste mês.</td></tr>`;
    return rows.map(r => `<tr>
      <td><span class="pill"><span class="dot" style="background:${(FA.CATEGORY_MAP[r.category] || {}).color}"></span>${FA.categoryLabel(r.category)}</span></td>
      <td>${FA.escapeHtml(r.subcategory)}</td>
      <td class="num">${r.count}</td>
      <td class="num">${FA.formatCurrency(r.value)}</td>
    </tr>`).join("");
  }

  // ---------- Orçamento ----------

  function renderBudget() {
    const month = currentMonth();
    const monthData = FA.Store.getMonth(month);
    const computed = FA.Analytics.computeMonth(monthData);
    const budget = FA.Store.getBudget(month);
    const actualByCategory = Object.fromEntries(computed.byCategory.map(c => [c.id, c.value]));
    const despesaCats = FA.CATEGORIES.filter(c => c.group === "despesa");

    const el = $("#view-budget");
    el.innerHTML = `
      <div class="card">
        <div class="card-head">
          <div>
            <h2 class="section-title">Orçamento de ${FA.monthLabel(month)}</h2>
            <p class="section-sub">Defina um limite mensal por categoria. Fica salvo neste mês.</p>
          </div>
        </div>
        <div class="budget-row" style="border-bottom:2px solid var(--border); font-size:11.5px; color:var(--muted); text-transform:uppercase; font-weight:700;">
          <div>Categoria</div><div>Progresso</div><div class="num">Gasto</div><div class="num">Orçamento</div>
        </div>
        <div id="budgetRows"></div>
      </div>
    `;

    const rows = $("#budgetRows");
    rows.innerHTML = despesaCats.map(c => {
      const actual = actualByCategory[c.id] || 0;
      const planned = budget[c.id];
      const pct = planned ? actual / planned : 0;
      return `<div class="budget-row" data-cat="${c.id}">
        <div class="cat-name"><span class="dot" style="width:10px;height:10px;border-radius:3px;background:${c.color};display:inline-block"></span>${c.label}</div>
        <div class="meter-wrap">${planned ? "" : '<span class="muted small">sem meta definida</span>'}</div>
        <div class="num">${FA.formatCurrency(actual)}</div>
        <div><input type="number" min="0" step="10" placeholder="0,00" value="${planned || ""}" data-budget-input="${c.id}"></div>
      </div>`;
    }).join("");

    despesaCats.forEach(c => {
      const row = rows.querySelector(`.budget-row[data-cat="${c.id}"] .meter-wrap`);
      const planned = budget[c.id];
      if (planned) FA.Charts.meter(row, (actualByCategory[c.id] || 0) / planned);
    });

    $$('input[data-budget-input]').forEach(inp => {
      inp.addEventListener("change", () => {
        FA.Store.saveBudget(month, inp.dataset.budgetInput, inp.value);
        renderBudget();
        toast("Orçamento salvo.");
      });
    });
  }

  // ---------- Importar ----------

  function renderImport() {
    const el = $("#view-import");
    el.innerHTML = `
      <div class="card">
        <h2 class="section-title">Importar extrato ou fatura</h2>
        <p class="section-sub">Aceita PDF (extrato do Banco Horizonte / fatura de cartão, ou modelos parecidos), CSV genérico (Data, Descrição, Valor) ou um backup em JSON exportado pelo próprio sistema.</p>
        <div class="dropzone" id="dropzone">
          <div class="big">Arraste um arquivo aqui ou clique para escolher</div>
          <div class="small">.pdf · .csv · .json</div>
          <input type="file" id="fileInput" accept=".pdf,.csv,.json" style="display:none">
        </div>
        <div id="importResult"></div>
      </div>
      <div class="card" style="margin-top:16px">
        <h2 class="section-title">Modelo de CSV</h2>
        <p class="section-sub">Se seu banco não exporta PDF nesse formato, use um CSV com estas colunas.</p>
        <pre class="small" style="background:var(--surface-2);padding:10px;border-radius:8px;overflow-x:auto">Data;Descrição;Valor;Categoria
01/07/2026;Supermercado;-142,88;Alimentação
05/07/2026;Salário;8450,00;Salário</pre>
        <button class="btn" id="downloadTemplateBtn">Baixar modelo CSV</button>
      </div>
    `;

    const dz = $("#dropzone");
    const input = $("#fileInput");
    dz.addEventListener("click", () => input.click());
    dz.addEventListener("dragover", e => { e.preventDefault(); dz.classList.add("dragover"); });
    dz.addEventListener("dragleave", () => dz.classList.remove("dragover"));
    dz.addEventListener("drop", e => {
      e.preventDefault();
      dz.classList.remove("dragover");
      if (e.dataTransfer.files.length) FA.App.handleImportFile(e.dataTransfer.files[0]);
    });
    input.addEventListener("change", () => {
      if (input.files.length) FA.App.handleImportFile(input.files[0]);
      input.value = "";
    });

    $("#downloadTemplateBtn").addEventListener("click", () => {
      const csv = "Data;Descrição;Valor;Categoria\n01/07/2026;Supermercado;-142,88;Alimentação\n05/07/2026;Salário;8450,00;Salário\n";
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "modelo-lancamentos.csv";
      a.click();
    });
  }

  function renderImportPreview(result) {
    const box = $("#importResult");
    if (!box) return;
    if (!result.rows.length) {
      box.innerHTML = `<div class="insight critical" style="margin-top:16px"><span class="icon">⚠️</span><span>${result.warnings[0] || "Nenhum lançamento reconhecido neste arquivo."}</span></div>`;
      return;
    }
    const months = {};
    result.rows.forEach(r => { const m = r.date.slice(0, 7); months[m] = (months[m] || 0) + 1; });
    const targetMonth = Object.keys(months).sort((a, b) => months[b] - months[a])[0];

    box.innerHTML = `
      <div class="import-preview-list">
        <div class="import-file-row">
          <div><strong>${result.rows.length} lançamento(s) encontrado(s)</strong><div class="small muted">Tipo detectado: ${docTypeLabel(result.docType)}</div></div>
          <div class="form-row" style="margin:0">
            <label>Importar para o mês</label>
            <select id="importTargetMonth">${Object.keys(months).sort().map(m => `<option value="${m}" ${m === targetMonth ? "selected" : ""}>${FA.monthLabel(m)}</option>`).join("")}</select>
          </div>
        </div>
        ${result.warnings.length ? `<div class="import-warnings">${result.warnings.slice(0, 5).map(w => "⚠ " + FA.escapeHtml(w)).join("<br>")}</div>` : ""}
        <div class="table-scroll">
          <table class="fa-table">
            <thead><tr><th>Data</th><th>Descrição</th><th class="num">Valor</th></tr></thead>
            <tbody>${result.rows.slice(0, 12).map(r => `<tr><td>${FA.formatDateBR(r.date)}</td><td>${FA.escapeHtml(r.description || r.merchant)}</td><td class="num">${FA.formatCurrency(r.amount)}</td></tr>`).join("")}</tbody>
          </table>
          ${result.rows.length > 12 ? `<p class="small muted">…e mais ${result.rows.length - 12} lançamento(s).</p>` : ""}
        </div>
        <div class="modal-actions">
          <button class="btn" id="cancelImportBtn">Cancelar</button>
          <button class="btn btn-primary" id="confirmImportBtn">Confirmar importação</button>
        </div>
      </div>
    `;
    $("#cancelImportBtn").addEventListener("click", () => renderImport());
    $("#confirmImportBtn").addEventListener("click", () => {
      const month = $("#importTargetMonth").value;
      FA.App.confirmImport(result, month);
    });
  }

  function docTypeLabel(t) {
    return { banco: "Extrato bancário", cartao: "Fatura de cartão", "csv-generico": "CSV genérico", desconhecido: "Não identificado" }[t] || t;
  }

  // ---------- Configurações ----------

  function renderSettings() {
    const el = $("#view-settings");
    const months = FA.Store.listMonths();
    const rules = FA.Store.getRuleOverrides();
    el.innerHTML = `
      <div class="grid grid-2col">
        <div class="card">
          <h2 class="section-title">Meses com dados</h2>
          <div class="table-scroll">
            <table class="fa-table">
              <thead><tr><th>Mês</th><th class="num">Lançamentos</th><th></th></tr></thead>
              <tbody>
                ${months.map(m => {
                  const d = FA.Store.getMonth(m);
                  return `<tr><td>${FA.monthLabel(m)}</td><td class="num">${d.transactions.length}</td>
                    <td><button class="btn btn-ghost small btn-danger" data-delmonth="${m}">Excluir mês</button></td></tr>`;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>
        <div class="card">
          <h2 class="section-title">Backup</h2>
          <p class="section-sub">Exporte tudo (todos os meses, regras e orçamentos) para um arquivo, ou restaure de um backup anterior.</p>
          <div style="display:flex; gap:8px; flex-wrap:wrap">
            <button class="btn btn-primary" id="exportBtn">Exportar backup (.json)</button>
            <button class="btn" id="importBackupBtn">Restaurar backup</button>
            <input type="file" id="backupInput" accept=".json" style="display:none">
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-head">
          <div>
            <h2 class="section-title">Regras de categorização aprendidas</h2>
            <p class="section-sub">Toda vez que você reclassifica um lançamento, o assistente memoriza a regra (por CNPJ ou MCC) para usar nas próximas importações.</p>
          </div>
          <button class="btn btn-ghost btn-danger small" id="resetRulesBtn">Limpar todas</button>
        </div>
        <div class="table-scroll">
          <table class="fa-table">
            <thead><tr><th>Chave</th><th>Categoria aprendida</th></tr></thead>
            <tbody>
              ${Object.keys(rules).length ? Object.entries(rules).map(([k, v]) => `<tr><td><code>${FA.escapeHtml(k)}</code></td><td>${FA.categoryLabel(v)}</td></tr>`).join("") : `<tr><td colspan="2" class="fa-empty">Nenhuma regra aprendida ainda.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    $("#exportBtn").addEventListener("click", () => {
      const dump = FA.Store.exportAll();
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `financas-backup-${FA.todayISO()}.json`;
      a.click();
    });
    $("#importBackupBtn").addEventListener("click", () => $("#backupInput").click());
    $("#backupInput").addEventListener("change", async () => {
      const file = $("#backupInput").files[0];
      if (!file) return;
      try {
        const text = await file.text();
        FA.Store.importAll(JSON.parse(text));
        toast("Backup restaurado com sucesso.");
        FA.App.reloadMonths();
        showView("settings");
      } catch (e) {
        toast("Não foi possível restaurar o backup: " + e.message, "error");
      }
    });
    $$('button[data-delmonth]').forEach(b => b.onclick = () => {
      if (!confirm(`Excluir todos os dados de ${FA.monthLabel(b.dataset.delmonth)}? Esta ação não pode ser desfeita.`)) return;
      FA.Store.deleteMonth(b.dataset.delmonth);
      FA.App.reloadMonths();
      renderSettings();
      toast("Mês excluído.");
    });
    $("#resetRulesBtn").addEventListener("click", () => {
      if (!confirm("Apagar todas as regras de categorização aprendidas?")) return;
      localStorage.setItem("fa_rule_overrides", "{}");
      renderSettings();
      toast("Regras limpas.");
    });
  }

  // ---------- Modal: novo lançamento manual ----------

  function openManualModal() {
    const month = currentMonth();
    const despesaCats = FA.CATEGORIES.filter(c => c.group === "despesa");
    const receitaCats = FA.CATEGORIES.filter(c => c.group === "receita");
    const invCats = FA.CATEGORIES.filter(c => c.group === "investimento");

    const root = $("#modalRoot");
    root.innerHTML = `
      <div class="modal-backdrop" id="modalBackdrop">
        <div class="modal">
          <h3>Novo lançamento</h3>
          <div class="type-toggle" id="typeToggle">
            <button type="button" data-kind="despesa" class="active">Despesa</button>
            <button type="button" data-kind="receita">Receita</button>
            <button type="button" data-kind="investimento">Investimento</button>
          </div>
          <div class="form-row" style="margin-top:14px">
            <label>Descrição</label>
            <input type="text" id="mDesc" placeholder="Ex.: Jantar com amigos">
          </div>
          <div class="form-grid">
            <div class="form-row">
              <label>Data</label>
              <input type="date" id="mDate" value="${FA.todayISO()}">
            </div>
            <div class="form-row">
              <label>Valor (R$)</label>
              <input type="number" id="mValue" step="0.01" min="0" placeholder="0,00">
            </div>
          </div>
          <div class="form-row">
            <label>Categoria</label>
            <select id="mCategory"></select>
          </div>
          <div class="modal-actions">
            <button class="btn" id="mCancel">Cancelar</button>
            <button class="btn btn-primary" id="mSave">Salvar lançamento</button>
          </div>
        </div>
      </div>
    `;

    let kind = "despesa";
    function fillCategories() {
      const cats = kind === "despesa" ? despesaCats : kind === "receita" ? receitaCats : invCats;
      $("#mCategory").innerHTML = cats.map(c => `<option value="${c.id}">${c.label}</option>`).join("");
    }
    fillCategories();

    $$('#typeToggle button').forEach(b => b.addEventListener("click", () => {
      kind = b.dataset.kind;
      $$('#typeToggle button').forEach(x => x.classList.toggle("active", x === b));
      fillCategories();
    }));

    function close() { root.innerHTML = ""; }
    $("#modalBackdrop").addEventListener("click", e => { if (e.target.id === "modalBackdrop") close(); });
    $("#mCancel").addEventListener("click", close);
    $("#mSave").addEventListener("click", () => {
      const description = $("#mDesc").value.trim();
      const date = $("#mDate").value;
      const value = parseFloat($("#mValue").value);
      const category = $("#mCategory").value;
      if (!description || !date || !value || value <= 0) {
        toast("Preencha descrição, data e um valor maior que zero.", "error");
        return;
      }
      const txn = FA.Categorizer.normalizeManualTxn({ description, date, amount: value, category, kind }, month);
      FA.Store.addTransactions(month, [txn]);
      close();
      toast("Lançamento adicionado.");
      refresh();
    });
  }

  return {
    showView, refresh, renderMonthSelector, renderImportPreview, openManualModal, toast
  };
})();
