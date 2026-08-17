/* Funções utilitárias compartilhadas: formatação de moeda, datas e meses. */
window.FA = window.FA || {};

FA.formatCurrency = function (value) {
  return (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

FA.formatDateBR = function (iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

FA.monthLabel = function (month) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

FA.shiftMonth = function (month, delta) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

FA.todayISO = function () {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

FA.currentMonthISO = function () {
  return FA.todayISO().slice(0, 7);
};

FA.escapeHtml = function (str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
};
