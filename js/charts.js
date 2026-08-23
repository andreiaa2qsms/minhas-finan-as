/* Gráficos em SVG puro (sem bibliotecas externas), seguindo a skill de dataviz:
   traços finos, extremidades arredondadas de 4px, legenda quando há 2+ séries,
   rótulos diretos esparsos, tooltip ao passar o mouse e uma versão em tabela
   sempre disponível como alternativa acessível. */
window.FA = window.FA || {};

FA.Charts = (function () {

  const fmt = FA.formatCurrency || (v => "R$ " + v.toFixed(2));

  function el(tag, attrs, ns) {
    const e = document.createElementNS(ns || "http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(k => {
      if (k === "style") e.setAttribute("style", attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    return e;
  }

  let tooltipEl = null;
  function tooltip() {
    if (!tooltipEl) {
      tooltipEl = document.createElement("div");
      tooltipEl.className = "fa-tooltip";
      document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
  }
  function showTooltip(html, x, y) {
    const t = tooltip();
    t.innerHTML = html;
    t.style.left = (x + 14) + "px";
    t.style.top = (y + 14) + "px";
    t.classList.add("visible");
  }
  function hideTooltip() {
    if (tooltipEl) tooltipEl.classList.remove("visible");
  }

  /* Barra horizontal ranqueada — usada para "gasto por categoria". */
  function horizontalBar(container, data, opts) {
    opts = opts || {};
    container.innerHTML = "";
    if (!data.length) {
      container.innerHTML = '<p class="fa-empty">Sem lançamentos neste período.</p>';
      return;
    }
    const sorted = data.slice().sort((a, b) => b.value - a.value);
    const max = Math.max(...sorted.map(d => d.value), 1);
    const barH = 22, gap = 14, leftLabelW = 172, rightValueW = 96, topPad = 4;
    const width = opts.width || 560;
    const plotW = width - leftLabelW - rightValueW;
    const height = sorted.length * (barH + gap) + topPad;

    const svg = el("svg", { viewBox: `0 0 ${width} ${height}`, width: "100%", height, style: "overflow:visible", role: "img", "aria-label": opts.ariaLabel || "Gráfico de barras" });

    sorted.forEach((d, i) => {
      const y = topPad + i * (barH + gap);
      const w = Math.max((d.value / max) * plotW, 2);

      const fullLabel = d.label || "";
      const shortLabel = fullLabel.length > 24 ? fullLabel.slice(0, 22).trimEnd() + "…" : fullLabel;
      const label = el("text", { x: leftLabelW - 10, y: y + barH / 2 + 4, "text-anchor": "end", class: "fa-chart-label" });
      label.textContent = shortLabel;
      if (shortLabel !== fullLabel) label.appendChild(el("title", {}, "http://www.w3.org/2000/svg")).textContent = fullLabel;
      svg.appendChild(label);

      const track = el("rect", { x: leftLabelW, y, width: plotW, height: barH, rx: 4, style: "fill:var(--gridline)" });
      svg.appendChild(track);

      const bar = el("rect", {
        x: leftLabelW, y, width: w, height: barH, rx: 4,
        style: `fill:${d.color || "var(--series-1)"}`, class: "fa-bar"
      });
      bar.dataset.tooltip = `<strong>${d.label}</strong><br>${fmt(d.value)}${d.pct !== undefined ? " · " + d.pct.toFixed(1) + "%" : ""}`;
      svg.appendChild(bar);

      const val = el("text", { x: leftLabelW + w + 10, y: y + barH / 2 + 4, class: "fa-chart-value" });
      val.textContent = fmt(d.value);
      svg.appendChild(val);

      [bar, track].forEach(node => {
        node.addEventListener("mousemove", ev => showTooltip(bar.dataset.tooltip, ev.clientX, ev.clientY));
        node.addEventListener("mouseleave", hideTooltip);
      });
    });

    container.appendChild(svg);
  }

  /* Linha com área — evolução do saldo bancário ao longo do mês. */
  function lineArea(container, points, opts) {
    opts = opts || {};
    container.innerHTML = "";
    if (!points.length) {
      container.innerHTML = '<p class="fa-empty">Sem dados para exibir.</p>';
      return;
    }
    const width = opts.width || 720, height = opts.height || 220;
    const padL = 56, padR = 16, padT = 16, padB = 28;
    const plotW = width - padL - padR, plotH = height - padT - padB;

    const values = points.map(p => p.value);
    let min = Math.min(...values, 0), max = Math.max(...values);
    if (min === max) { min -= 1; max += 1; }
    const rangePad = (max - min) * 0.08;
    min -= rangePad; max += rangePad;

    const x = i => padL + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
    const y = v => padT + plotH - ((v - min) / (max - min)) * plotH;

    const svg = el("svg", { viewBox: `0 0 ${width} ${height}`, width: "100%", height, role: "img", "aria-label": opts.ariaLabel || "Gráfico de linha" });

    // gridlines horizontais (0, meio, topo)
    [min, (min + max) / 2, max].forEach(gv => {
      const gy = y(gv);
      svg.appendChild(el("line", { x1: padL, x2: width - padR, y1: gy, y2: gy, class: "fa-gridline" }));
      const t = el("text", { x: padL - 8, y: gy + 4, "text-anchor": "end", class: "fa-axis-label" });
      t.textContent = fmt(gv);
      svg.appendChild(t);
    });

    // linha de zero, se estiver dentro do range
    if (min < 0 && max > 0) {
      const zy = y(0);
      svg.appendChild(el("line", { x1: padL, x2: width - padR, y1: zy, y2: zy, class: "fa-baseline" }));
    }

    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.value)}`).join(" ");
    const areaD = pathD + ` L ${x(points.length - 1)} ${padT + plotH} L ${x(0)} ${padT + plotH} Z`;

    svg.appendChild(el("path", { d: areaD, style: `fill:${opts.color || "var(--series-1)"}; opacity:0.1; stroke:none` }));
    svg.appendChild(el("path", { d: pathD, style: `fill:none; stroke:${opts.color || "var(--series-1)"}; stroke-width:2; stroke-linejoin:round; stroke-linecap:round` }));

    const hoverGroup = el("g", { class: "fa-hover-group", style: "display:none" });
    const crosshair = el("line", { y1: padT, y2: padT + plotH, class: "fa-crosshair" });
    const dot = el("circle", { r: 5, style: `fill:${opts.color || "var(--series-1)"}; stroke:var(--surface-1); stroke-width:2` });
    hoverGroup.appendChild(crosshair);
    hoverGroup.appendChild(dot);
    svg.appendChild(hoverGroup);

    // rótulo direto no último ponto
    const last = points[points.length - 1];
    const lastLabel = el("text", { x: x(points.length - 1) - 4, y: y(last.value) - 10, "text-anchor": "end", class: "fa-chart-value" });
    lastLabel.textContent = fmt(last.value);
    svg.appendChild(lastLabel);

    const overlay = el("rect", { x: padL, y: padT, width: plotW, height: plotH, style: "fill:transparent" });
    overlay.addEventListener("mousemove", ev => {
      const rect = svg.getBoundingClientRect();
      const scaleX = width / rect.width;
      const localX = (ev.clientX - rect.left) * scaleX;
      const i = Math.max(0, Math.min(points.length - 1, Math.round(((localX - padL) / plotW) * (points.length - 1))));
      const px = x(i), py = y(points[i].value);
      crosshair.setAttribute("x1", px); crosshair.setAttribute("x2", px);
      dot.setAttribute("cx", px); dot.setAttribute("cy", py);
      hoverGroup.style.display = "";
      showTooltip(`<strong>${points[i].label}</strong><br>${fmt(points[i].value)}`, ev.clientX, ev.clientY);
    });
    overlay.addEventListener("mouseleave", () => { hoverGroup.style.display = "none"; hideTooltip(); });
    svg.appendChild(overlay);

    container.appendChild(svg);
  }

  /* Duas barras verticais simples — Receitas x Despesas. */
  function twoBarCompare(container, a, b) {
    container.innerHTML = "";
    const max = Math.max(a.value, b.value, 1);
    const width = 220, height = 160, barW = 56, gap = 48, base = height - 24;
    const svg = el("svg", { viewBox: `0 0 ${width} ${height}`, width: "100%", height, role: "img", "aria-label": "Receitas comparadas a despesas" });
    [a, b].forEach((d, i) => {
      const h = (d.value / max) * (base - 20);
      const bx = 24 + i * (barW + gap);
      svg.appendChild(el("rect", { x: bx, y: base - h, width: barW, height: h, rx: 4, style: `fill:${d.color}` }));
      const val = el("text", { x: bx + barW / 2, y: base - h - 8, "text-anchor": "middle", class: "fa-chart-value" });
      val.textContent = fmt(d.value);
      svg.appendChild(val);
      const lbl = el("text", { x: bx + barW / 2, y: base + 16, "text-anchor": "middle", class: "fa-chart-label" });
      lbl.textContent = d.label;
      svg.appendChild(lbl);
    });
    svg.appendChild(el("line", { x1: 8, x2: width - 8, y1: base, y2: base, class: "fa-baseline" }));
    container.appendChild(svg);
  }

  /* Medidor de orçamento: preenchimento carrega a severidade. */
  function meter(container, pct, opts) {
    opts = opts || {};
    const clamped = Math.max(0, Math.min(pct, 1.4));
    let sevClass = "fa-meter-good";
    if (pct >= 1) sevClass = "fa-meter-critical";
    else if (pct >= 0.85) sevClass = "fa-meter-warning";
    const track = document.createElement("div");
    track.className = "fa-meter-track";
    const fill = document.createElement("div");
    fill.className = "fa-meter-fill " + sevClass;
    fill.style.width = Math.min(clamped / 1.4, 1) * 100 + "%";
    track.appendChild(fill);
    container.innerHTML = "";
    container.appendChild(track);
  }

  return { horizontalBar, lineArea, twoBarCompare, meter, showTooltip, hideTooltip };
})();
