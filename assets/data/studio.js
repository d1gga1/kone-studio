/* KM Studio - dati fiscali mostrati su sito, app e pagamenti.
   Scrivi qui la Partita IVA: compare nell'accesso all'app, al momento del pagamento e nel piè di pagina del sito.
   Vuota = non viene mostrata. (Questo file non passa dalla cache: la modifica si vede subito.) */
window.KM_STUDIO = {
  ragione: "Kone Moctar Studio",
  piva: ""
};
(function () {
  function fill() {
    var k = window.KM_STUDIO || {}, t = k.piva ? (k.ragione || "Kone Moctar Studio") + " · P.IVA " + k.piva : "";
    var n = document.querySelectorAll("[data-piva]");
    for (var i = 0; i < n.length; i++) {
      n[i].textContent = n[i].getAttribute("data-piva") === "short" ? (k.piva ? " · P.IVA " + k.piva : "") : t;
      n[i].hidden = !t;
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fill); else fill();
})();
