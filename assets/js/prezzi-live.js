/* KM Studio — prezzi sempre aggiornati.
   Legge /assets/data/listino.json (pubblicato dal pannello titolare) e:
   - aggiorna nella pagina ogni elemento con data-prezzo="sezione.indice" (es. "pt.0", "abbPt.2", "corsi.0")
     oppure data-prezzo="tr.p30" / "tr.p60" (prezzo minimo dei trattamenti 30′ / 50′);
   - mette i dati a disposizione di altri script con window.KM_LISTINO (Promise → listino o null). */
(function(){
  "use strict";
  var oggi=new Date().toISOString().slice(0,10);
  function eff(r,k){if(!r)return null;var v=r[k||"p"];if(typeof v!=="number")return null;
    return(r.sc>0&&(!r.scFino||r.scFino>=oggi))?Math.round(v*(100-r.sc))/100:v}
  function eur(n){return n.toLocaleString("it-IT",{minimumFractionDigits:n%1?2:0,maximumFractionDigits:2})+" €"}
  function valore(L,key){
    var p=key.split(".");
    if(p[0]==="tr"){var m=null;(L.trattamenti||[]).forEach(function(t){var v=eff(t,p[1]);if(v!=null&&(m==null||v<m))m=v});return m}
    var r=(L.listino[p[0]]||[])[+p[1]];return eff(r,p[2]||"p");
  }
  window.KM_PREZZI_UTIL={eff:eff,eur:eur,valore:valore};
  window.KM_LISTINO=fetch("/assets/data/listino.json?t="+Date.now(),{cache:"no-store"})
    .then(function(r){return r.ok?r.json():null})
    .then(function(L){
      if(!L||!L.agg||!L.listino)return null;
      function applica(){document.querySelectorAll("[data-prezzo]").forEach(function(e){
        var k=e.getAttribute("data-prezzo"),v=valore(L,k);if(v==null)return;
        if(e.hasAttribute("data-div")){var q=k.split("."),r=(L.listino[q[0]]||[])[+q[1]];if(!r||!r.sed)return;v=Math.round(v/r.sed*100)/100}
        var fmt=e.getAttribute("data-f");e.textContent=fmt?fmt.replace("#",v.toLocaleString("it-IT",{minimumFractionDigits:v%1?2:0,maximumFractionDigits:2})):eur(v)})}
      if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",applica);else applica();
      return L;
    }).catch(function(){return null});
})();
