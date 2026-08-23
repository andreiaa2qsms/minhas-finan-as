/* Importação de arquivos: PDF (extrato bancário / fatura de cartão), CSV genérico
   e backup em JSON. O parser de PDF usa a posição (x,y) de cada palavra extraída
   pelo pdf.js para reconstruir as linhas e colunas da tabela — é mais confiável
   do que tentar separar colunas só com expressões regulares em texto corrido. */
window.FA = window.FA || {};

FA.BANK_LINE_TYPES = [
  "PIX ENVIADO", "PIX RECEBIDO", "DEB AUTOMATICO", "DEBITO AUTOMATICO",
  "COMPRA DEBITO", "COMPRA CARTAO DEBITO", "CREDITO TED", "TED RECEBIDA",
  "TED ENVIADA", "DOC RECEBIDO", "TRANSFERENCIA ENVIADA", "TRANSFERENCIA RECEBIDA",
  "PAGTO FATURA", "PAGAMENTO FATURA", "PAGAMENTO BOLETO", "SAQUE", "TARIFA",
  "RENDIMENTO", "DEPOSITO", "ESTORNO"
];

FA.Parsers = (function () {

  const CURRENCY_RE = /^-?[\d.]+,\d{2}$/;
  const DATE_RE = /^\d{2}\/\d{2}\/\d{4}$/;
  const CNPJ_RE = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
  const CPF_MASKED_RE = /^(CPF\s+)?\*{3}\.\d{3}\.\d{3}-\*{2}$/i;

  function toNumber(brStr) {
    return parseFloat(brStr.replace(/\./g, "").replace(",", "."));
  }

  function toISODate(brDate) {
    const [d, m, y] = brDate.split("/");
    return `${y}-${m}-${d}`;
  }

  // ---------- PDF: extração de linhas com posição ----------

  async function loadPdfJs() {
    if (!window.pdfjsLib) {
      throw new Error("Leitor de PDF indisponível (sem conexão para carregar a biblioteca). Use importação por CSV ou lançamento manual.");
    }
    return window.pdfjsLib;
  }

  const LINE_Y_TOLERANCE = 2.5; // pt — células da mesma linha às vezes têm baseline com sub-pixel de diferença

  async function extractLines(arrayBuffer) {
    const pdfjsLib = await loadPdfJs();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const lines = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const items = content.items
        .map(item => ({ x: item.transform[4], y: item.transform[5], str: item.str.trim() }))
        .filter(i => i.str);
      items.sort((a, b) => b.y - a.y);

      let current = null;
      let refY = null;
      items.forEach(it => {
        if (current && Math.abs(it.y - refY) <= LINE_Y_TOLERANCE) {
          current.push(it);
        } else {
          if (current) lines.push(current);
          current = [it];
          refY = it.y;
        }
      });
      if (current) lines.push(current);
    }
    lines.forEach(line => line.sort((a, b) => a.x - b.x));
    return lines; // array de linhas; cada linha é array de {x, str} ordenado da esquerda p/ direita
  }

  function detectDocType(lines) {
    const flat = lines.map(l => l.map(i => i.str).join(" ")).join(" \n ").toUpperCase();
    if (flat.includes("MCC") && flat.includes("ESTABELECIMENTO")) return "cartao";
    if (flat.includes("LANÇAMENTOS") || flat.includes("LANCAMENTOS") || flat.includes("HISTÓRICO") || flat.includes("HISTORICO")) return "banco";
    return "desconhecido";
  }

  function matchTrailingType(items) {
    // tenta casar os últimos 1 ou 2 itens com um tipo de lançamento conhecido
    for (let len = 2; len >= 1; len--) {
      if (items.length < len) continue;
      const slice = items.slice(items.length - len);
      const joined = slice.map(i => i.str).join(" ").toUpperCase();
      if (FA.BANK_LINE_TYPES.includes(joined)) {
        return { type: joined, consumed: len };
      }
    }
    return null;
  }

  function parseBankLines(lines) {
    const rows = [];
    const warnings = [];
    lines.forEach(items => {
      if (!items.length || !DATE_RE.test(items[0].str)) return;
      if (items.length >= 2 && /SALDO ANTERIOR/i.test(items.slice(1).map(i => i.str).join(" "))) return;

      const work = items.slice();
      const date = work.shift().str;

      // dois últimos valores em formato moeda = valor e saldo
      if (work.length < 2 || !CURRENCY_RE.test(work[work.length - 1].str) || !CURRENCY_RE.test(work[work.length - 2].str)) {
        warnings.push(`Linha ignorada (não reconhecida): ${items.map(i => i.str).join(" ")}`);
        return;
      }
      const saldoStr = work.pop().str;
      const valorStr = work.pop().str;

      // documento do favorecido: CNPJ, "CPF ***..." (num único item ou dois), ou "-"
      let doc = "";
      if (work.length) {
        const last = work[work.length - 1];
        if (CNPJ_RE.test(last.str) || CPF_MASKED_RE.test(last.str)) {
          doc = work.pop().str;
          if (work.length && /^CPF$/i.test(work[work.length - 1].str)) {
            doc = work.pop().str + " " + doc;
          }
        } else if (last.str === "-") {
          work.pop();
        }
      }

      const typeMatch = matchTrailingType(work);
      let bankType = "";
      let description = work.map(i => i.str).join(" ");
      if (typeMatch) {
        bankType = typeMatch.type;
        description = work.slice(0, work.length - typeMatch.consumed).map(i => i.str).join(" ");
      } else {
        warnings.push(`Tipo de lançamento não reconhecido em: ${items.map(i => i.str).join(" ")}`);
      }

      rows.push({
        date: toISODate(date),
        description: description.trim(),
        bankType: bankType || "OUTROS",
        doc: doc.trim(),
        amount: toNumber(valorStr)
      });
    });
    return { rows, warnings };
  }

  function isUpperOnly(str) {
    return /^[A-ZÀÂÃÁÉÊÍÓÔÕÚÇ0-9\s.'-]+$/.test(str) && str !== str.toLowerCase();
  }

  function parseCardLines(lines) {
    const rows = [];
    const warnings = [];
    lines.forEach(items => {
      if (!items.length || !DATE_RE.test(items[0].str)) return;
      if (/TOTAL/i.test(items.map(i => i.str).join(" "))) return;

      const work = items.slice();
      const date = work.shift().str;

      if (!work.length || !CURRENCY_RE.test(work[work.length - 1].str)) {
        warnings.push(`Linha ignorada (não reconhecida): ${items.map(i => i.str).join(" ")}`);
        return;
      }
      const amount = toNumber(work.pop().str);

      let mccIdx = -1;
      for (let i = 0; i < work.length; i++) {
        if (/^\d{4}$/.test(work[i].str)) mccIdx = i; // fica com a última ocorrência
      }
      if (mccIdx === -1) {
        warnings.push(`MCC não encontrado em: ${items.map(i => i.str).join(" ")}`);
        return;
      }
      const merchant = work.slice(0, mccIdx).map(i => i.str).join(" ").trim();
      const mcc = work[mccIdx].str;
      const rest = work.slice(mccIdx + 1);

      let splitAt = rest.length;
      for (let i = rest.length - 1; i >= 0; i--) {
        if (isUpperOnly(rest[i].str)) {
          splitAt = i;
        } else {
          break;
        }
      }
      const activity = rest.slice(0, splitAt).map(i => i.str).join(" ").trim();
      const city = rest.slice(splitAt).map(i => i.str).join(" ").trim();

      rows.push({
        date: toISODate(date),
        merchant,
        mcc,
        activity: activity || (FA.MCC_LABELS[mcc] || ""),
        city,
        amount
      });
    });
    return { rows, warnings };
  }

  async function parsePdf(file) {
    const buf = await file.arrayBuffer();
    const lines = await extractLines(buf);
    const docType = detectDocType(lines);
    if (docType === "banco") {
      const { rows, warnings } = parseBankLines(lines);
      return { docType, rows, warnings };
    }
    if (docType === "cartao") {
      const { rows, warnings } = parseCardLines(lines);
      return { docType, rows, warnings };
    }
    return { docType: "desconhecido", rows: [], warnings: ["Não foi possível identificar se é um extrato bancário ou uma fatura de cartão."] };
  }

  // ---------- CSV genérico ----------

  function splitCSVLine(line, delimiter) {
    // suporte simples a valores entre aspas
    const out = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === delimiter && !inQuotes) {
        out.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    out.push(cur.trim());
    return out;
  }

  function normalizeHeader(h) {
    return h.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }

  function parseCSVDate(str) {
    str = str.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return toISODate(str);
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) return toISODate(str.replace(/-/g, "/"));
    return str;
  }

  function parseCSVAmount(str) {
    str = str.trim().replace(/^R\$\s*/i, "");
    if (/,\d{1,2}$/.test(str)) return toNumber(str);
    return parseFloat(str.replace(/\./g, "").replace(",", "."));
  }

  function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length);
    if (!lines.length) return { rows: [], warnings: ["Arquivo CSV vazio."] };
    const delimiter = lines[0].includes(";") ? ";" : ",";
    const header = splitCSVLine(lines[0], delimiter).map(normalizeHeader);

    const idxDate = header.findIndex(h => /^data/.test(h));
    const idxDesc = header.findIndex(h => /^(descricao|historico|lancamento|descrip)/.test(h));
    const idxValor = header.findIndex(h => /^(valor|amount|montante)/.test(h));
    const idxCategoria = header.findIndex(h => /^(categoria|category)/.test(h));

    const warnings = [];
    if (idxDate === -1 || idxDesc === -1 || idxValor === -1) {
      warnings.push('Cabeçalho esperado não encontrado. Use colunas "Data", "Descrição" e "Valor".');
      return { rows: [], warnings };
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = splitCSVLine(lines[i], delimiter);
      if (cols.length < 3) continue;
      const amount = parseCSVAmount(cols[idxValor] || "0");
      if (Number.isNaN(amount)) {
        warnings.push(`Linha ${i + 1}: valor inválido ("${cols[idxValor]}")`);
        continue;
      }
      rows.push({
        date: parseCSVDate(cols[idxDate] || ""),
        description: (cols[idxDesc] || "").trim(),
        amount,
        categoryHint: idxCategoria !== -1 ? (cols[idxCategoria] || "").trim() : ""
      });
    }
    return { rows, warnings };
  }

  return {
    extractLines, detectDocType, parsePdf, parseCSV,
    toNumber, toISODate
  };
})();
