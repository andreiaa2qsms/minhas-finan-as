/* Inicialização, estado global e orquestração dos fluxos de importação. */
window.FA = window.FA || {};

FA.state = { month: null, view: "overview" };

FA.App = (function () {
  const $ = sel => document.querySelector(sel);

  function seedIfEmpty() {
    if (FA.Store.listMonths().length) return;
    const seed = FA.SEED_2026_07;
    const bankTxns = seed.bank.map(r => FA.Categorizer.normalizeBankTxn(r, seed.month, "seed"));
    const cardTxns = seed.card.purchases.map(r => FA.Categorizer.normalizeCardTxn(r, seed.month, "seed", seed.card.cardLast4));
    FA.Store.saveMonth({
      month: seed.month,
      openingBalance: seed.openingBalance,
      cardMeta: {
        cardLast4: seed.card.cardLast4,
        closingDate: seed.card.closingDate,
        dueDate: seed.card.dueDate,
        creditLimit: seed.card.creditLimit,
        previousBalance: seed.card.previousBalance
      },
      transactions: bankTxns.concat(cardTxns)
    });
  }

  function reloadMonths() {
    const months = FA.Store.listMonths();
    if (!months.length) {
      seedIfEmpty();
    }
    const list = FA.Store.listMonths();
    if (!list.includes(FA.state.month)) {
      FA.state.month = list[list.length - 1];
    }
  }

  function isDuplicate(existingTxns, cand) {
    return existingTxns.some(t =>
      t.date === cand.date &&
      t.source === cand.source &&
      Math.abs(t.amount - cand.amount) < 0.005 &&
      t.description.trim().toUpperCase() === (cand.description || "").trim().toUpperCase()
    );
  }

  async function handleImportFile(file) {
    const name = file.name.toLowerCase();
    try {
      if (name.endsWith(".pdf")) {
        FA.UI.toast("Lendo PDF…");
        const result = await FA.Parsers.parsePdf(file);
        result.previewRows = result.rows.map(r => ({ date: r.date, description: r.description || r.merchant, amount: r.amount }));
        renderPreview(result);
      } else if (name.endsWith(".csv")) {
        const text = await file.text();
        const { rows, warnings } = FA.Parsers.parseCSV(text);
        renderPreview({ docType: "csv-generico", rows, previewRows: rows, warnings });
      } else if (name.endsWith(".json")) {
        const text = await file.text();
        const dump = JSON.parse(text);
        if (!dump.months) throw new Error("Este JSON não parece ser um backup do sistema.");
        if (!confirm("Este arquivo é um backup completo. Restaurar agora vai adicionar/atualizar os meses contidos nele. Continuar?")) return;
        FA.Store.importAll(dump);
        reloadMonths();
        FA.UI.showView("overview");
        FA.UI.toast("Backup importado com sucesso.");
      } else {
        FA.UI.toast("Formato não suportado. Use .pdf, .csv ou .json.", "error");
      }
    } catch (e) {
      console.error(e);
      FA.UI.toast("Falha ao importar: " + e.message, "error");
    }
  }

  function renderPreview(result) {
    FA.UI.renderImportPreview({ docType: result.docType, rows: result.previewRows, warnings: result.warnings || [], full: result.rows });
  }

  function confirmImport(previewResult, month) {
    const monthData = FA.Store.ensureMonth(month);
    let toAdd = [];

    if (previewResult.docType === "banco") {
      toAdd = previewResult.full.map(r => FA.Categorizer.normalizeBankTxn(r, month, "import-pdf"));
    } else if (previewResult.docType === "cartao") {
      toAdd = previewResult.full.map(r => FA.Categorizer.normalizeCardTxn(r, month, "import-pdf"));
    } else if (previewResult.docType === "csv-generico") {
      toAdd = previewResult.full.map(r => FA.Categorizer.normalizeCsvTxn(r, month));
    }

    const fresh = FA.Store.getMonth(month);
    const unique = toAdd.filter(t => !isDuplicate(fresh.transactions, t));
    const dupCount = toAdd.length - unique.length;

    FA.Store.addTransactions(month, unique);
    reloadMonths();
    FA.state.month = month;
    FA.UI.toast(`${unique.length} lançamento(s) importado(s)${dupCount ? ` · ${dupCount} duplicado(s) ignorado(s)` : ""}.`);
    FA.UI.showView(previewResult.docType === "cartao" ? "card" : "transactions");
  }

  function wireNav() {
    document.querySelectorAll(".nav-item").forEach(btn => {
      btn.addEventListener("click", () => {
        FA.UI.showView(btn.dataset.view);
        closeMobileMenu();
      });
    });
    $("#menuToggle").addEventListener("click", () => {
      $("#sidebar").classList.toggle("open");
      $("#sidebarBackdrop").classList.toggle("open");
    });
    $("#sidebarBackdrop").addEventListener("click", closeMobileMenu);
    $("#monthSelect").addEventListener("change", e => {
      FA.state.month = e.target.value;
      FA.UI.showView(FA.state.view);
    });
    $("#prevMonth").addEventListener("click", () => stepMonth(-1));
    $("#nextMonth").addEventListener("click", () => stepMonth(1));
    $("#addTxnBtn").addEventListener("click", () => FA.UI.openManualModal());
    $("#importNavBtn").addEventListener("click", () => FA.UI.showView("import"));
    $("#newMonthBtn").addEventListener("click", openNewMonthModal);
  }

  function closeMobileMenu() {
    $("#sidebar").classList.remove("open");
    $("#sidebarBackdrop").classList.remove("open");
  }

  function stepMonth(delta) {
    const target = FA.shiftMonth(FA.state.month, delta);
    const months = FA.Store.listMonths();
    if (months.includes(target)) {
      FA.state.month = target;
      FA.UI.showView(FA.state.view);
    } else {
      if (confirm(`Ainda não há dados para ${FA.monthLabel(target)}. Criar esse mês agora?`)) {
        FA.Store.ensureMonth(target);
        FA.state.month = target;
        FA.UI.showView(FA.state.view);
      }
    }
  }

  function openNewMonthModal() {
    const val = prompt("Novo mês (formato AAAA-MM), ex.: 2026-08:", FA.shiftMonth(FA.state.month, 1));
    if (!val || !/^\d{4}-\d{2}$/.test(val)) return;
    const opening = prompt("Saldo inicial em conta neste mês (opcional):", "0");
    const data = FA.Store.ensureMonth(val);
    data.openingBalance = parseFloat((opening || "0").replace(",", ".")) || 0;
    FA.Store.saveMonth(data);
    FA.state.month = val;
    FA.UI.showView("overview");
  }

  function initPdfJs() {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = window.FA_PDFJS_WORKER_SRC;
    }
  }

  function init() {
    initPdfJs();
    seedIfEmpty();
    const months = FA.Store.listMonths();
    FA.state.month = months.includes("2026-07") ? "2026-07" : months[months.length - 1];
    wireNav();
    FA.UI.showView("overview");
  }

  return { init, handleImportFile, confirmImport, reloadMonths };
})();

document.addEventListener("DOMContentLoaded", FA.App.init);
