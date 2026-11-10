/* =====================================================================
   KM STUDIO · collegamento al database condiviso (Supabase, schema "kmstudio")
   ---------------------------------------------------------------------
   L'app continua a lavorare sull'oggetto DB in memoria, come prima.
   Questo file:
   - gestisce il login vero (email + password) di clienti e titolare;
   - all'accesso costruisce DB con i dati del database (il titolare vede tutto,
     il cliente solo i suoi: degli altri vede solo quanti posti sono occupati);
   - a ogni save() manda al database solo quello che è cambiato;
   - ogni 15 secondi chiede "è cambiato qualcosa?" (risposta di pochi byte)
     e riscarica solo le tabelle cambiate.
   Le prenotazioni dei clienti passano dalle funzioni del database
   (prenota / annulla), che controllano i posti: niente posti doppi.
   Configurazione: assets/js/cloud-config.js
   ===================================================================== */
(function () {
  "use strict";
  var CFG = window.KM_CLOUD;
  if (!CFG) return;
  if (!window.supabase) {
    window.KMC = { sess: function () { return null; } }; window.KMC_READY = true;
    if (window.KMC_WAIT) afterIntro();
    setTimeout(function () { toast("Non riesco a caricare il collegamento al database: ricarica la pagina"); }, 1500);
    return;
  }

  /* arrivo dal link "scegli una nuova password" ricevuto per email (letto prima che Supabase pulisca l'indirizzo) */
  var RECUPERO = /type=recovery/.test(location.hash + location.search);

  var sb = window.supabase.createClient(CFG.url, CFG.key, {
    db: { schema: "kmstudio" },
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "km-studio-auth" }
  });

  sb.auth.onAuthStateChange(function (ev) {
    if (ev !== "PASSWORD_RECOVERY") return;
    RECUPERO = true;
    if (K.pronto) apriNuovaPassword();
  });

  var K = window.KMC = {
    sb: sb, ruolo: null, cid: null, raw: null, snap: null, noto: {},
    carico: false, timer: null, inCorso: false, ancora: false, errori: 0,
    daRicostruire: false, ultimoTotale: 0
  };

  /* ---------------------------- utilità ---------------------------- */
  var SEGRETI = ["pwCoach", "pwConti", "pub", "prezziPend", "prezziPub"];
  var CHIAVE = { documenti: "chiave", clienti: "id", slot: "id", prenotazioni: "id", schede: "rif",
    progressi: "rif", programmi: "id", feedback: "rif", movimenti: "rif", messaggi: "id" };
  var ORDINE = ["documenti", "clienti", "slot", "prenotazioni", "schede", "progressi", "programmi", "feedback", "movimenti"];
  var DOC_PUB = { impostazioni_pub: 1, listino: 1, trattamenti: 1, corsi: 1, corsiArch: 1, esercizi: 1, exVar: 1, listino_pub: 1 };

  function copia(o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); }
  function senza(o, keys) { var r = {}; Object.keys(o || {}).forEach(function (k) { if (keys.indexOf(k) < 0 && o[k] !== undefined) r[k] = o[k]; }); return r; }
  function stabile(v) {
    if (v === null || typeof v !== "object") return v === undefined ? "null" : JSON.stringify(v);
    if (Array.isArray(v)) return "[" + v.map(function (x) { return x === undefined ? "null" : stabile(x); }).join(",") + "]";
    return "{" + Object.keys(v).filter(function (k) { return v[k] !== undefined; }).sort()
      .map(function (k) { return JSON.stringify(k) + ":" + stabile(v[k]); }).join(",") + "}";
  }
  function nuovoId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, function (c) {
      return (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16);
    });
  }
  function giorno(n) { return iso(addD(TODAY, n)); }
  function giorniFa(n) { return new Date(Date.now() - n * 864e5).toISOString(); }
  function attesa(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function err(e) { var m = (e && (e.message || e.msg || e.error_description)) || String(e || "errore"); return m; }
  function traduci(m) {
    if (/invalid login|invalid_credentials/i.test(m)) return "Email o password non corretti";
    if (/not confirmed/i.test(m)) return "Conferma prima la tua email: apri il link che ti abbiamo mandato";
    if (/already|registered|exists/i.test(m)) return "Esiste già un account con questa email: accedi";
    if (/password/i.test(m) && /6|short|weak/i.test(m)) return "La password deve avere almeno 6 caratteri";
    if (/rate|too many/i.test(m)) return "Troppi tentativi: riprova tra qualche minuto";
    if (/fetch|network|failed/i.test(m)) return "Connessione assente: riprova";
    return m;
  }
  function busy(on) { document.body.style.cursor = on ? "progress" : ""; }

  /* ---------------------- avviso di salvataggio ---------------------- */
  function avviso(t) {
    var a = document.getElementById("kmcAvviso");
    if (!t) { if (a) a.remove(); return; }
    if (!a) {
      a = document.createElement("div"); a.id = "kmcAvviso";
      a.style.cssText = "position:fixed;left:50%;bottom:calc(76px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:90;background:#3a1d1d;color:#ffd9d2;border:1px solid #7a3b33;border-radius:12px;padding:9px 14px;font-size:13.5px;box-shadow:0 8px 24px rgba(0,0,0,.4);max-width:calc(100vw - 32px);text-align:center";
      document.body.appendChild(a);
    }
    a.textContent = t;
  }

  /* --------------------------- lettura dati --------------------------- */
  function finestra(t) {
    var coach = K.ruolo === "coach";
    return {
      slot: function (q) { return q.gte("giorno", giorno(coach ? -90 : -21)); },
      prenotazioni: function (q) { return q.gte("creato", giorniFa(coach ? 160 : 90)); },
      messaggi: function (q) { return q.gte("creato", giorniFa(180)); },
      programmi: function (q) { return q.gte("creato", giorniFa(200)); },
      feedback: function (q) { return q.gte("creato", giorniFa(200)); }
    }[t];
  }
  async function tutte(t) {
    var out = [], da = 0, f = finestra(t);
    for (;;) {
      var q = sb.from(t).select("*");
      if (f) q = f(q);
      var r = await q.order(CHIAVE[t]).range(da, da + 999);
      if (r.error) throw r.error;
      out = out.concat(r.data || []);
      if (!r.data || r.data.length < 1000) break;
      da += 1000;
    }
    var m = new Map(); out.forEach(function (x) { m.set(String(x[CHIAVE[t]]), x); }); return m;
  }
  async function documenti(chiavi) {
    var q = sb.from("documenti").select("*");
    if (chiavi) q = q.in("chiave", chiavi);
    var r = await q; if (r.error) throw r.error;
    if (!chiavi) K.raw.doc = new Map();
    (r.data || []).forEach(function (d) { K.raw.doc.set(d.chiave, d); });
    if (chiavi) chiavi.forEach(function (k) { if (!(r.data || []).some(function (d) { return d.chiave === k; })) K.raw.doc.delete(k); });
  }
  async function disponibilita() {
    var r = await sb.rpc("disponibilita", { da: giorno(-21), a: giorno(120) });
    if (r.error) throw r.error; K.raw.disp = r.data || [];
  }
  function tabelleRuolo() {
    return K.ruolo === "coach" ? ORDINE.slice(1) : ["clienti", "slot", "prenotazioni", "schede", "progressi", "messaggi", "programmi", "feedback"];
  }
  async function scarica(tab, docs) {
    if (!K.raw) K.raw = { doc: new Map(), disp: [] };
    var lista = tab || tabelleRuolo().concat(K.ruolo === "coach" ? ["messaggi"] : []);
    var lavori = [];
    if (tab === null || docs === null || (docs && docs.length)) lavori.push(documenti(docs || null));
    lista.forEach(function (t) { if (t !== "documenti") lavori.push(tutte(t).then(function (m) { K.raw[t] = m; })); });
    if (K.ruolo !== "coach" && (tab === null || lista.indexOf("slot") >= 0 || lista.indexOf("prenotazioni") >= 0)) lavori.push(disponibilita());
    await Promise.all(lavori);
  }
  async function leggiStato() {
    var r = await sb.from("stato").select("chiave,agg"); if (r.error) throw r.error;
    var m = {}; (r.data || []).forEach(function (x) { m[x.chiave] = x.agg; }); return m;
  }

  /* ------------------ dal database all'oggetto DB dell'app ------------------ */
  function valori(t) { return K.raw[t] ? Array.from(K.raw[t].values()) : []; }
  function doc(k) { var d = K.raw.doc.get(k); return d ? copia(d.dati) : undefined; }

  function costruisci() {
    var coach = K.ruolo === "coach", primo = coach && !K.raw.doc.has("settings");
    var loc = null;
    if (primo) { try { var l = LS.get("db", null); if (l && l.v === DBV) loc = l; } catch (e) {} }
    var base = function (k, seme) { var v = doc(k); if (v !== undefined) return v; if (loc && loc[k] !== undefined) return copia(loc[k]); return seme(); };
    var st = coach ? doc("settings") : doc("impostazioni_pub");
    if (!st && loc) st = senza(copia(loc.settings), ["pwCoach", "pub", "prezziPend", "prezziPub"]);
    var D = {
      v: DBV,
      settings: Object.assign({ maxCorso: 10, maxPT: 3, maxTratt: 2, motore: "regole", regoleOff: [] }, coach && primo ? { pwConti: hashPw("conti2026") } : {}, st || {}),
      listino: base("listino", function () { return clone(LISTINO_SEED); }),
      trattamenti: base("trattamenti", function () { return clone(TRATT_SEED); }),
      corsi: base("corsi", function () { return clone(CORSI_SEED); }),
      corsiArch: base("corsiArch", function () { return []; }),
      esercizi: base("esercizi", function () { return EX_SEED.map(function (e, i) { return { id: "ex" + i, n: e[0], m: e[1], istr: e[2], foto: e[3] || null, foto2: e[4] || null, video: null }; }); }),
      exVar: base("exVar", function () { return {}; }),
      modelli: coach ? base("modelli", function () { return []; }) : [],
      agendaDel: coach ? base("agendaDel", function () { return {}; }) : {},
      clienti: [], schede: {}, schedeArch: {}, pesi: {}, carichi: {}, diete: {}, agenda: {}, programmi: {}, feedback: [], movimenti: [], chat: []
    };
    /* primo avvio del titolare: prezzi pubblicati sul sito (listino.json) se più recenti */
    var L = K.listinoSito;
    if (primo && L && L.listino && L.agg && L.agg > (D.settings.prezziAgg || "")) {
      D.listino = L.listino;
      if (Array.isArray(L.trattamenti) && L.trattamenti.length) D.trattamenti = L.trattamenti;
      if (L.paypal) D.settings.paypal = L.paypal;
      if (L.bonifico && typeof L.bonifico === "object") D.settings.bonifico = L.bonifico;
      if (typeof L.portale === "string") D.settings.portale = L.portale;
      if (typeof L.stripe === "string") D.settings.stripe = L.stripe;
      D.settings.prezziAgg = L.agg;
    }
    valori("clienti").sort(function (a, b) { return a.id - b.id; }).forEach(function (r) {
      var c = Object.assign({}, r.dati || {}, { id: r.id, n: r.nome, email: r.email || "", tel: r.telefono || "" });
      delete c.pw; D.clienti.push(c);
    });
    var ids = new Set(D.clienti.map(function (c) { return c.id; }));
    valori("slot").forEach(function (r) {
      D.agenda[r.id] = Object.assign({}, r.dati || {}, { id: r.id, d: String(r.giorno).slice(0, 10), h: r.ora, tipo: r.tipo, corso: r.corso || null, cap: r.cap, dur: r.durata, chiuso: !!r.chiuso, pren: [] });
    });
    valori("prenotazioni").sort(function (a, b) { return a.creato < b.creato ? -1 : a.creato > b.creato ? 1 : 0; }).forEach(function (r) {
      var s = D.agenda[r.slot_id]; if (!s) return;
      s.pren.push(Object.assign({}, r.dati || {}, { pid: r.id, cid: r.cliente_id == null ? null : r.cliente_id, nome: r.nome }));
    });
    if (!coach) (K.raw.disp || []).forEach(function (x) {
      var s = D.agenda[x.slot_id]; if (!s) return;
      for (var i = s.pren.length; i < x.occupati; i++) s.pren.push({ cid: null, nome: "Posto occupato", _ph: 1 });
    });
    valori("schede").sort(function (a, b) { return String(a.rif).localeCompare(String(b.rif), "it", { numeric: true }); }).forEach(function (r) {
      if (!ids.has(r.cliente_id)) return;
      if (r.archiviata) (D.schedeArch[r.cliente_id] = D.schedeArch[r.cliente_id] || []).push(r.dati);
      else D.schede[r.cliente_id] = r.dati;
    });
    valori("progressi").forEach(function (r) {
      if (r.tipo === "peso") D.pesi[r.cliente_id] = (r.dati && r.dati.v) || [];
      if (r.tipo === "carico") D.carichi[r.cliente_id] = (r.dati && r.dati.v) || {};
      if (r.tipo === "dieta" && r.dati && Array.isArray(r.dati.pasti)) D.diete[r.cliente_id] = r.dati;
    });
    var fili = {};
    valori("messaggi").sort(function (a, b) { return a.creato < b.creato ? -1 : a.creato > b.creato ? 1 : 0; }).forEach(function (r) {
      var c = D.clienti.find(function (x) { return x.id === r.cliente_id; }); if (!c) return;
      var t = fili[c.id] || (fili[c.id] = { id: 100 + c.id, n: c.n, i: c.i, unread: 0, unreadC: 0, last: "", msgs: [] });
      var m = Object.assign({}, r.dati || {}, { mid: r.id, me: r.da === "coach" ? 1 : 0 });
      if (m.t == null && r.testo) m.t = r.testo;
      t.msgs.push(m); t.last = m.t || "📷 Foto";
      if (!r.letto) { if (r.da === "cliente") t.unread++; else t.unreadC++; }
    });
    D.chat = Object.keys(fili).map(function (k) { return fili[k]; });
    valori("programmi").forEach(function (r) { D.programmi[r.id] = r.dati; });
    valori("feedback").forEach(function (r) { D.feedback.push(r.dati); });
    D.movimenti = valori("movimenti").sort(function (a, b) { return a.giorno < b.giorno ? 1 : a.giorno > b.giorno ? -1 : 0; })
      .map(function (r) { return r.dati; });
    return D;
  }

  /* ------------------ dall'oggetto DB alle righe del database ------------------ */
  function righe() {
    var coach = K.ruolo === "coach", out = {};
    function put(t, k, r) { (out[t] || (out[t] = new Map())).set(String(k), r); }
    var ids = new Set((DB.clienti || []).map(function (c) { return c.id; }));
    if (coach) {
      var st = DB.settings || {};
      var docs = {
        settings: st, impostazioni_pub: senza(st, SEGRETI), listino: DB.listino, trattamenti: DB.trattamenti,
        corsi: DB.corsi, corsiArch: DB.corsiArch || [], esercizi: DB.esercizi, exVar: DB.exVar || {},
        modelli: DB.modelli || [], agendaDel: DB.agendaDel || {},
        listino_pub: Object.assign(prezziSnap(), { agg: st.prezziAgg || "" })
      };
      Object.keys(docs).forEach(function (k) { put("documenti", k, { chiave: k, pubblico: !!DOC_PUB[k], dati: docs[k] }); });
      DB.clienti.forEach(function (c) {
        put("clienti", c.id, { id: c.id, nome: c.n || "", email: (c.email || "").toLowerCase() || null, telefono: c.tel || null, dati: senza(c, ["pw"]) });
      });
      Object.keys(DB.agenda).forEach(function (id) {
        var s = DB.agenda[id];
        put("slot", s.id, { id: s.id, giorno: s.d, ora: s.h, tipo: s.tipo, corso: s.corso || null, cap: s.cap | 0, durata: s.dur || 60, chiuso: !!s.chiuso,
          dati: senza(s, ["pren", "id", "d", "h", "tipo", "corso", "cap", "dur", "chiuso"]) });
        (s.pren || []).forEach(function (b) {
          if (b._ph) return;
          if (!b.pid) b.pid = nuovoId();
          put("prenotazioni", b.pid, { id: b.pid, slot_id: s.id, cliente_id: ids.has(b.cid) ? b.cid : null, nome: b.nome || "", posti: 1,
            abbonamento: !!(b.pay && b.pay.m === "piano"), dati: senza(b, ["pid"]) });
        });
      });
      Object.keys(DB.schede || {}).forEach(function (k) {
        var cid = +k; if (!ids.has(cid) || !DB.schede[k]) return;
        put("schede", "att_" + cid, { rif: "att_" + cid, cliente_id: cid, archiviata: false, dati: DB.schede[k] });
      });
      Object.keys(DB.schedeArch || {}).forEach(function (k) {
        var cid = +k; if (!ids.has(cid)) return;
        (DB.schedeArch[k] || []).forEach(function (sc, i) { put("schede", "arch_" + cid + "_" + i, { rif: "arch_" + cid + "_" + i, cliente_id: cid, archiviata: true, dati: sc }); });
      });
      Object.keys(DB.programmi || {}).forEach(function (id) { put("programmi", id, { id: id, dati: DB.programmi[id] }); });
      (DB.movimenti || []).forEach(function (m) {
        if (!m || m.id == null) return;
        put("movimenti", m.id, { rif: String(m.id), giorno: m.d || T0, tipo: m.tipo === "uscita" ? "uscita" : "entrata", descr: m.desc || null,
          cliente: m.cli || null, area: m.area || null, importo: +m.imp || 0, metodo: m.met || null, pagato: !!m.pag, dati: m });
      });
    }
    var miei = coach ? ids : new Set([K.cid]);
    Object.keys(DB.pesi || {}).forEach(function (k) { var cid = +k; if (miei.has(cid) && ids.has(cid)) put("progressi", "peso_" + cid, { rif: "peso_" + cid, cliente_id: cid, tipo: "peso", dati: { v: DB.pesi[k] || [] } }); });
    Object.keys(DB.carichi || {}).forEach(function (k) { var cid = +k; if (miei.has(cid) && ids.has(cid)) put("progressi", "carico_" + cid, { rif: "carico_" + cid, cliente_id: cid, tipo: "carico", dati: { v: DB.carichi[k] || {} } }); });
    Object.keys(DB.diete || {}).forEach(function (k) { var cid = +k; if (miei.has(cid) && ids.has(cid) && DB.diete[k]) put("progressi", "dieta_" + cid, { rif: "dieta_" + cid, cliente_id: cid, tipo: "dieta", dati: DB.diete[k] }); });
    (DB.feedback || []).forEach(function (f) {
      if (!f || !miei.has(f.cid) || !ids.has(f.cid)) return;
      put("feedback", f.pid + "_" + f.cid, { rif: f.pid + "_" + f.cid, programma_id: f.pid, cliente_id: f.cid, dati: f });
    });
    return out;
  }

  function fotografa() {
    /* lo stato "come sul server": solo le righe che il server ha davvero */
    var R = righe(), snap = {};
    ORDINE.forEach(function (t) {
      var m = new Map(), sorg = t === "documenti" ? K.raw.doc : K.raw[t];
      (R[t] || new Map()).forEach(function (r, k) { if (sorg && sorg.has(k)) m.set(k, stabile(r)); });
      snap[t] = m;
    });
    K.snap = snap;
    K.snapLetti = {};
    (DB.chat || []).forEach(function (t) { K.snapLetti[t.id - 100] = { u: t.unread || 0, uc: t.unreadC || 0 }; });
    K.snapMie = new Map();
    if (K.ruolo !== "coach") Object.keys(DB.agenda).forEach(function (id) {
      var b = (DB.agenda[id].pren || []).find(function (x) { return x.cid === K.cid && !x._ph; });
      if (b && b.pid) K.snapMie.set(id, { pid: b.pid, s: stabile(senza(b, ["pid"])) });
    });
    var me0 = (DB.clienti || []).find(function (c) { return c.id === K.cid; });
    K.snapDisd = me0 ? (me0.disdetta || null) : null;
  }

  function ricostruisci() {
    K.carico = true;
    try {
      DB = costruisci();
      migraSchede();
      fotografa();
      migraPrezzi(); migraEsercizi(); migraEnciclopedia(); migraEserciziCorsi(); migraEserciziTemi(); caricaVarianti(); migraV8();
      if (K.ruolo === "coach") { ensureAgenda(false); autoProgrammi(); }
      _pSig = prezziSig();
    } finally { K.carico = false; }
    K.daRicostruire = false;
    if (K.ruolo === "coach") K.salva();
  }

  /* ------------------------- invio delle modifiche ------------------------- */
  function aggiornaRaw(t, k, r) {
    if (t === "documenti") { K.raw.doc.set(k, r); return; }
    if (!K.raw[t]) K.raw[t] = new Map();
    K.raw[t].set(k, Object.assign({}, K.raw[t].get(k) || { creato: new Date().toISOString() }, r));
  }
  async function spingi() {
    if (!DB || !K.ruolo || !K.snap) return;
    var coach = K.ruolo === "coach", R = righe(), toccate = {};
    var tabelle = coach ? ORDINE : ["progressi", "feedback"];
    for (var i = 0; i < tabelle.length; i++) {
      var t = tabelle[i], cur = R[t] || new Map(), old = K.snap[t] || new Map(), su = [];
      cur.forEach(function (r, k) { var s = stabile(r); if (old.get(k) !== s) su.push([k, r, s]); });
      for (var j = 0; j < su.length; j += 200) {
        var pezzo = su.slice(j, j + 200);
        var x = await sb.from(t).upsert(pezzo.map(function (p) { return p[1]; }), { onConflict: CHIAVE[t] });
        if (x.error) throw x.error;
        pezzo.forEach(function (p) { old.set(p[0], p[2]); if (coach) aggiornaRaw(t, p[0], p[1]); });
        K.snap[t] = old; toccate[t === "documenti" ? null : t] = 1;
        if (t === "documenti") pezzo.forEach(function (p) { toccate["documenti:" + p[0]] = 1; });
      }
    }
    await spingiMessaggi(toccate);
    if (!coach) await spingiCliente();
    if (coach) for (var a = ORDINE.length - 1; a >= 0; a--) {
      var tt = ORDINE[a], cur2 = R[tt] || new Map(), old2 = K.snap[tt] || new Map(), via = [];
      old2.forEach(function (s, k) { if (!cur2.has(k)) via.push(k); });
      for (var b = 0; b < via.length; b += 100) {
        var pz = via.slice(b, b + 100);
        var y = await sb.from(tt).delete().in(CHIAVE[tt], pz);
        if (y.error) throw y.error;
        pz.forEach(function (k) { old2.delete(k); if (tt === "documenti") K.raw.doc.delete(k); else if (K.raw[tt]) K.raw[tt].delete(k); });
        toccate[tt === "documenti" ? "documenti:" + pz[0] : tt] = 1;
      }
    }
    return toccate;
  }
  async function spingiMessaggi(toccate) {
    var coach = K.ruolo === "coach", nuovi = [];
    (DB.chat || []).forEach(function (t) {
      var cid = t.id - 100;
      var c = DB.clienti.find(function (x) { return x.id === cid; }) || DB.clienti.find(function (x) { return x.n === t.n; });
      if (!c || (!coach && c.id !== K.cid)) return;
      t.msgs.forEach(function (m) {
        if (m.mid) return;
        if (!coach && m.me) return; /* messaggi "di Kone" creati sul telefono del cliente: li scrive solo Kone */
        m.mid = nuovoId();
        nuovi.push({ id: m.mid, cliente_id: c.id, da: m.me ? "coach" : "cliente", testo: m.t || null, dati: senza(m, ["mid"]) });
      });
    });
    if (nuovi.length) {
      var r = await sb.from("messaggi").insert(nuovi);
      if (r.error) { nuovi.forEach(function (n) { DB.chat.forEach(function (t) { t.msgs.forEach(function (m) { if (m.mid === n.id) delete m.mid; }); }); }); throw r.error; }
      if (coach) nuovi.forEach(function (n) { aggiornaRaw("messaggi", n.id, Object.assign({ letto: false }, n)); });
      toccate.messaggi = 1;
    }
    for (var i = 0; i < (DB.chat || []).length; i++) {
      var t = DB.chat[i], cid = t.id - 100, p = K.snapLetti[cid] || { u: 0, uc: 0 };
      if (coach && !(t.unread || 0) && p.u > 0) {
        var x = await sb.from("messaggi").update({ letto: true }).eq("cliente_id", cid).eq("da", "cliente").eq("letto", false);
        if (x.error) throw x.error;
        if (K.raw.messaggi) K.raw.messaggi.forEach(function (r) { if (r.cliente_id === cid && r.da === "cliente") r.letto = true; });
        p.u = 0; toccate.messaggi = 1;
      }
      if (!coach && cid === K.cid && !(t.unreadC || 0) && p.uc > 0) {
        var y = await sb.rpc("segna_letti"); if (y.error) throw y.error; p.uc = 0;
      }
      K.snapLetti[cid] = p;
    }
  }
  async function spingiCliente() {
    var mie = new Map(), problemi = [];
    Object.keys(DB.agenda).forEach(function (id) {
      var b = (DB.agenda[id].pren || []).find(function (x) { return x.cid === K.cid && !x._ph; });
      if (b) mie.set(id, b);
    });
    var ids = Array.from(mie.keys());
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i], b = mie.get(id), prima = K.snapMie.get(id), s = stabile(senza(b, ["pid"]));
      if (!prima) {
        b.pid = b.pid || nuovoId();
        var r = await sb.rpc("prenota", { p_slot: id, p_posti: 1, p_abbonamento: !!(b.pay && b.pay.m === "piano"), p_dati: senza(b, ["pid"]), p_id: b.pid });
        if (r.error) { problemi.push(err(r.error)); DB.agenda[id].pren = DB.agenda[id].pren.filter(function (x) { return x !== b; }); K.daRicostruire = true; continue; }
        K.snapMie.set(id, { pid: b.pid, s: s });
      } else if (prima.s !== s) {
        var u = await sb.rpc("aggiorna_prenotazione", { p_id: prima.pid, p_dati: senza(b, ["pid"]) });
        if (u.error) throw u.error; prima.s = s;
      }
    }
    var tolte = [];
    K.snapMie.forEach(function (v, id) { if (!mie.has(id)) tolte.push([id, v]); });
    for (var j = 0; j < tolte.length; j++) {
      var a = await sb.rpc("annulla", { p_id: tolte[j][1].pid });
      if (a.error) problemi.push(err(a.error)); K.snapMie.delete(tolte[j][0]); K.daRicostruire = true;
    }
    var me0 = DB.clienti.find(function (c) { return c.id === K.cid; }), d = me0 ? (me0.disdetta || null) : null;
    if (d !== K.snapDisd) { var z = await sb.rpc("imposta_disdetta", { p_disdetta: d }); if (z.error) throw z.error; K.snapDisd = d; }
    if (problemi.length) { toast(problemi[0]); K.daRicostruire = true; setTimeout(function () { aggiorna(true); }, 300); }
  }

  K.salva = function () {
    if (!K.ruolo || K.carico || !K.snap) return;
    clearTimeout(K.timer);
    K.timer = setTimeout(function () { K.timer = null; esegui(); }, 600);
  };
  async function esegui() {
    if (!K.ruolo) return;
    if (K.inCorso) { K.ancora = true; return; }
    K.inCorso = true;
    try {
      var prima = K.ruolo === "coach" ? Object.assign({}, K.noto) : null;
      var toccate = await spingi();
      K.errori = 0; avviso("");
      /* le nostre modifiche cambiano il registro: non serve riscaricarle */
      if (K.ruolo === "coach" && toccate && Object.keys(toccate).length) {
        var st = await leggiStato();
        Object.keys(toccate).forEach(function (k) { if (k !== "null" && st[k]) K.noto[k] = st[k]; });
        void prima;
      }
    } catch (e) {
      console.error("[KM cloud]", e);
      K.errori++;
      avviso(navigator.onLine === false ? "Sei offline: le modifiche partono appena torna la rete" : "Non riesco a salvare online: riprovo tra poco");
      setTimeout(esegui, Math.min(30000, 3000 * K.errori));
    } finally {
      K.inCorso = false;
      if (K.ancora) { K.ancora = false; esegui(); }
    }
  }
  K.flush = async function () {
    if (K.timer) { clearTimeout(K.timer); K.timer = null; }
    while (K.inCorso) await attesa(100);
    await esegui();
  };

  /* --------------------------- aggiornamento --------------------------- */
  function puoiDisegnare() {
    var a = document.activeElement;
    return el("app").classList.contains("show") && !el("modal").classList.contains("on") &&
      !(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) && !document.getElementById("tour").classList.contains("on");
  }
  function tabellePerChiave(k) {
    if (k.indexOf("documenti:") === 0) return { doc: k.slice(10) };
    var coach = K.ruolo === "coach";
    if (!coach && k === "movimenti") return {};
    if (!coach && (k === "slot" || k === "prenotazioni")) return { tab: [k === "slot" ? "slot" : "prenotazioni"] };
    return { tab: [k] };
  }
  async function aggiorna(tutto) {
    if (!K.ruolo || K.timer || K.inCorso) return;
    if (document.hidden && !tutto) return;
    try {
      var st = await leggiStato(), tab = {}, docs = {};
      Object.keys(st).forEach(function (k) {
        if (K.noto[k] === st[k] && !tutto) return;
        var x = tabellePerChiave(k);
        if (x.doc && (K.ruolo === "coach" || DOC_PUB[x.doc])) docs[x.doc] = 1;
        (x.tab || []).forEach(function (t) { if (tabelleRuolo().indexOf(t) >= 0 || t === "messaggi") tab[t] = 1; });
      });
      var tl = Object.keys(tab), dl = Object.keys(docs);
      if (tutto) { await scarica(null, null); }
      else if (tl.length || dl.length) await scarica(tl, dl);
      else if (!K.daRicostruire) { K.noto = st; return; }
      if (K.timer || K.inCorso) { K.daRicostruire = true; return; } /* modifiche in arrivo: ricostruisco al prossimo giro */
      K.noto = st;
      ricostruisci();
      if (puoiDisegnare()) render(); else K.ridisegna = true;
      try { dispatchEvent(new Event("km:dati")); } catch (e) {}
    } catch (e) { console.warn("[KM cloud] aggiornamento", e); }
  }
  K.aggiorna = aggiorna;

  /* ------------------------------- accesso ------------------------------- */
  async function entra(user, reg) {
    var co = await sb.rpc("is_coach");
    if (co.error) throw co.error;
    K.ruolo = null; K.cid = null; K.raw = null; K.snap = null; K.noto = {};
    if (co.data === true) {
      K.ruolo = "coach";
      try { var r = await fetch("/assets/data/listino.json?t=" + Date.now(), { cache: "no-store" }); if (r.ok) K.listinoSito = await r.json(); } catch (e) {}
    } else {
      var meta = (user && user.user_metadata) || {};
      var dati = reg || (meta.sito === "kmstudio" ? meta : null);
      var c = await sb.rpc("collega_cliente", { p_crea: false });
      if (c.error) throw c.error;
      K.nuovo = false;
      if (c.data == null && dati) {
        c = await sb.rpc("collega_cliente", { p_nome: dati.nome, p_tel: dati.tel || "", p_dati: dati.dati || {}, p_crea: true });
        if (c.error) throw c.error;
        K.nuovo = c.data != null;
      }
      if (c.data == null) return null;
      K.ruolo = "client"; K.cid = c.data;
    }
    K.noto = await leggiStato();
    await scarica(null, null);
    ricostruisci();
    try { LS.set("sess", K.ruolo === "coach" ? { role: "coach" } : { role: "client", cid: K.cid }); } catch (e) {}
    riservaId();
    return K.ruolo;
  }
  K.sess = function () { return K.ruolo === "coach" ? { role: "coach" } : K.ruolo === "client" ? { role: "client", cid: K.cid } : null; };

  K.boot = async function () {
    preparaSchermate();
    try {
      var s = await sb.auth.getSession();
      if (s.data && s.data.session) {
        var r = await entra(s.data.session.user);
        if (!r) await sb.auth.signOut();
      }
    } catch (e) {
      console.error("[KM cloud] avvio", e);
      setTimeout(function () { toast("Connessione al database non riuscita: controlla la rete e riapri l'app"); }, 1600);
    }
    K.pronto = true; window.KMC_READY = true;
    if (window.KMC_WAIT) afterIntro();
    if (K.ruolo === "client" && K.nuovo) benvenuto();
    tempoReale();
    setInterval(function () { aggiorna(false); }, 15000);
    setInterval(function () { aggiorna(true); }, 600000);
    document.addEventListener("visibilitychange", function () { if (document.hidden) { if (K.timer) K.flush(); } else aggiorna(false); });
    addEventListener("online", function () { if (K.errori) esegui(); });
    var tm = setInterval(function () { if (K.ridisegna && puoiDisegnare()) { K.ridisegna = false; render(); } }, 1500);
    void tm;
    if (RECUPERO) apriNuovaPassword();
  };

  /* tempo reale: appena Kone (o un cliente) cambia qualcosa, il database lo segnala sulla tabella "stato"
     e tutte le app aperte si aggiornano subito, senza aspettare il controllo dei 15 secondi (che resta come riserva).
     Serve una volta supabase/kmstudio_patch_04.sql; senza, funziona come prima. */
  function tempoReale() {
    var t = null, ch = null;
    function arriva() { clearTimeout(t); t = setTimeout(function () { aggiorna(false); }, 350); }
    function apri() {
      try {
        if (ch) sb.removeChannel(ch);
        ch = sb.channel("km-stato").on("postgres_changes", { event: "*", schema: "kmstudio", table: "stato" }, arriva)
          .subscribe(function (st) { if (st === "CHANNEL_ERROR" || st === "TIMED_OUT") setTimeout(apri, 30000); });
      } catch (e) { console.warn("[KM cloud] tempo reale", e); }
    }
    apri();
    sb.auth.onAuthStateChange(function (ev, ses) {
      if (ses && ses.access_token) { try { sb.realtime.setAuth(ses.access_token); } catch (e) {} }
    });
  }

  /* numero per un nuovo cliente creato da Kone: lo chiedo prima al database */
  K.idRiservato = null;
  async function riservaId() {
    if (K.ruolo !== "coach") return;
    try { var r = await sb.rpc("prossimo_id"); if (!r.error && r.data != null) K.idRiservato = r.data; } catch (e) {}
  }
  K.prendiId = function () {
    var maxLoc = Math.max.apply(null, (DB.clienti || []).map(function (c) { return c.id; }).concat([0]));
    var id = K.idRiservato != null && K.idRiservato > maxLoc ? K.idRiservato : maxLoc + 1 + Math.floor(Math.random() * 1000);
    K.idRiservato = null; riservaId();
    return id;
  };

  function benvenuto() {
    var c = (DB.clienti || []).find(function (x) { return x.id === K.cid; }); if (!c) return;
    K.nuovo = false;
    msgAKone(c.id, "Ciao Kone, mi sono appena registrato nell'app. Email: " + (c.email || "") + " · Telefono: " + (c.tel || "") + ".");
    save();
  }

  /* --------------------- schermate di accesso (modifiche) --------------------- */
  var ICONA_CHIAVE = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3 21 2M16 7l3 3M19 4l2 2"/></svg>';
  var EMAIL_OK = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  function linkDimenticata(campo, id, chi) {
    var pw = el(campo);
    if (!pw || document.getElementById(id)) return;
    var b = document.createElement("button"); b.type = "button"; b.id = id; b.className = "linkbtn";
    b.style.cssText = "align-self:flex-end;font-size:13px;margin-top:-4px"; b.textContent = "Password dimenticata?";
    b.onclick = function () { passwordDimenticata(chi); };
    pw.closest(".field").insertAdjacentElement("afterend", b);
  }
  function preparaSchermate() {
    var demo = document.querySelector('#cliForm button[onclick="demoCliente()"]'); if (demo) demo.remove();
    linkDimenticata("cliPw", "kmcForgot", "cliente");
    linkDimenticata("coachPw", "kmcForgotC", "coach");
    /* tasto "Cambia password" nella barra in alto, per Kone e per i clienti */
    var out = document.querySelector('.tb-right button[onclick="esci()"]');
    if (out && !document.getElementById("kmcPwBtn")) {
      var k = document.createElement("button"); k.type = "button"; k.className = "icon-btn"; k.id = "kmcPwBtn";
      k.title = "Cambia password"; k.setAttribute("aria-label", "Cambia password"); k.innerHTML = ICONA_CHIAVE;
      k.onclick = function () { K.cambiaPassword(); };
      out.parentNode.insertBefore(k, out);
    }
  }

  /* 1 · dalla schermata di accesso: "Password dimenticata?" → email con il link */
  async function passwordDimenticata(chi) {
    var c = chi === "coach", f = c ? "coachForm" : "cliForm", e = c ? "coachErr" : "cliErr";
    var em = ((el(c ? "coachEmail" : "cliEmail") || {}).value || "").trim().toLowerCase();
    if (!EMAIL_OK.test(em)) return errShake(e, f, "Scrivi la tua email qui sopra, poi tocca “Password dimenticata?”");
    busy(true);
    try {
      var r = await mandaLink(em, c);
      if (r.error) return errShake(e, f, traduci(err(r.error)));
      el(e).textContent = "";
      emailInviata(em);
    } catch (x) { errShake(e, f, traduci(err(x))); } finally { busy(false); }
  }
  function mandaLink(em, coach) {
    return sb.auth.resetPasswordForEmail(em, { redirectTo: location.origin + (coach ? "/coach" : "/app") });
  }
  function emailInviata(em) {
    openModal('<h3>Controlla la tua email</h3><p class="muted" style="margin-bottom:10px">Se <b>' + esc(em) + '</b> ha un account, ti abbiamo appena mandato un link per scegliere una nuova password.</p>' +
      '<p class="hint">Apri il link (meglio da questo stesso telefono o computer): si apre l\'app e ti chiede la password nuova. Non la trovi? Guarda nello spam. Il link vale un\'ora.</p>');
  }

  /* 2 · dal link dell'email: scegli la nuova password (aspetto che l'app sia sullo schermo, se no la finestra si chiude) */
  function apriNuovaPassword() {
    if (K.pwAperta) return; K.pwAperta = true;
    var n = 0, t = setInterval(function () {
      n++;
      var vis = ["app", "auth", "coachAuth"].some(function (id) { var x = el(id); return x && x.classList.contains("show"); });
      if (vis || n > 60) { clearInterval(t); setTimeout(nuovaPassword, 300); }
    }, 250);
  }
  function campiNuova(pre) {
    return '<div class="field"><label>Nuova password</label><input class="fi" id="' + pre + 'Np" type="password" autocomplete="new-password" placeholder="min. 6 caratteri"></div>' +
      '<div class="field"><label>Ripeti la nuova password</label><input class="fi" id="' + pre + 'Np2" type="password" autocomplete="new-password"></div>';
  }
  function nuovaPassword() {
    openModal('<h3>Scegli la nuova password</h3><p class="muted" style="margin-bottom:12px">La userai da ora in poi per entrare.</p>' + campiNuova("kmc") +
      '<div class="inline" style="justify-content:flex-end"><button class="btn primary" onclick="KMC.salvaPassword()">Salva la password</button></div>');
    setTimeout(function () { try { el("kmcNp").focus(); } catch (e) {} }, 200);
  }
  function controllaNuova(p, p2) {
    if (p.length < 6) return "La password deve avere almeno 6 caratteri";
    if (p !== p2) return "Le due password non coincidono";
    return "";
  }
  K.salvaPassword = async function () {
    var p = el("kmcNp").value, ko = controllaNuova(p, el("kmcNp2").value); if (ko) return toast(ko);
    busy(true);
    try {
      var r = await sb.auth.updateUser({ password: p });
      if (r.error) return toast(traduci(err(r.error)));
      RECUPERO = false; K.pwAperta = false;
      try { history.replaceState(null, "", location.pathname); } catch (e) {}
      closeModal(); toast("Password aggiornata ✓");
      if (!K.ruolo) {
        var s = await sb.auth.getSession();
        if (s.data.session) { var ro = await entra(s.data.session.user); if (ro) enterApp(ro, K.cid); }
      }
    } catch (x) { toast(traduci(err(x))); } finally { busy(false); }
  };

  /* 3 · da dentro l'app: tasto chiave in alto → cambia password (serve quella attuale) */
  async function emailUtente() { var u = await sb.auth.getUser(); return u.data && u.data.user ? u.data.user.email : ""; }
  K.cambiaPassword = function () {
    openModal('<h3>Cambia password</h3><p class="muted" style="margin-bottom:12px">Per sicurezza scrivi prima quella che usi adesso.</p>' +
      '<div class="field"><label>Password attuale</label><input class="fi" id="kmcOld" type="password" autocomplete="current-password"></div>' + campiNuova("kmcC") +
      '<div class="inline" style="justify-content:space-between;flex-wrap:wrap;gap:10px"><button class="linkbtn" type="button" onclick="KMC.linkDaDentro()">Non ricordo quella attuale</button>' +
      '<button class="btn primary" onclick="KMC.salvaCambio()">Cambia password</button></div>');
  };
  K.cambia = async function (old, p, p2) {
    if (!old) { toast("Scrivi la password attuale"); return false; }
    var ko = controllaNuova(p, p2); if (ko) { toast(ko); return false; }
    busy(true);
    try {
      var em = await emailUtente(); if (!em) { toast("Sessione scaduta: esci e rientra"); return false; }
      var v = await sb.auth.signInWithPassword({ email: em, password: old });
      if (v.error) { toast(/invalid/i.test(err(v.error)) ? "La password attuale non è corretta" : traduci(err(v.error))); return false; }
      var r = await sb.auth.updateUser({ password: p });
      if (r.error) { toast(/different|same/i.test(err(r.error)) ? "La nuova password deve essere diversa da quella attuale" : traduci(err(r.error))); return false; }
      toast("Password cambiata ✓"); return true;
    } catch (x) { toast(traduci(err(x))); return false; } finally { busy(false); }
  };
  K.salvaCambio = async function () {
    if (await K.cambia(el("kmcOld").value, el("kmcCNp").value, el("kmcCNp2").value)) closeModal();
  };
  K.linkDaDentro = async function () {
    var em = await emailUtente(); if (!em) return toast("Sessione scaduta: esci e rientra");
    var r = await mandaLink(em, K.ruolo === "coach");
    if (r.error) return toast(traduci(err(r.error)));
    emailInviata(em);
  };

  async function loginCliente(e) {
    e.preventDefault();
    var em = el("cliEmail").value.trim().toLowerCase(), pw = el("cliPw").value;
    if (!em || !pw) return errShake("cliErr", "cliForm", "Scrivi email e password");
    busy(true);
    try {
      var r = await sb.auth.signInWithPassword({ email: em, password: pw });
      if (r.error) return errShake("cliErr", "cliForm", traduci(err(r.error)));
      var ro = await entra(r.data.user);
      if (!ro) { await sb.auth.signOut(); return errShake("cliErr", "cliForm", "Non risulti ancora iscritto a KM Studio: tocca “Registrati”."); }
      el("cliPw").value = ""; el("cliErr").textContent = "";
      enterApp(ro, K.cid);
      if (K.nuovo) benvenuto();
    } catch (x) { errShake("cliErr", "cliForm", traduci(err(x))); } finally { busy(false); }
  }

  async function registraCliente(e) {
    e.preventDefault();
    var cap = function (x) { return x.toLowerCase().replace(/(^|[\s'-])\S/g, function (m) { return m.toUpperCase(); }); };
    var no = cap(el("rgN").value.trim()), co = cap(el("rgC").value.trim()), em = el("rgE").value.trim().toLowerCase(), tel = el("rgT").value.trim(), pw = el("rgP").value, pw2 = el("rgP2").value;
    var ko = function (m) { errShake("rgErr", "regForm", m); };
    if (!no || !co) return ko("Scrivi nome e cognome");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return ko("Email non valida");
    if (tel.replace(/\D/g, "").length < 8) return ko("Numero di telefono non valido");
    if (pw.length < 6) return ko("La password deve avere almeno 6 caratteri");
    if (pw !== pw2) return ko("Le due password non coincidono");
    if (!el("rgOk").checked) return ko("Serve il consenso al trattamento dei dati");
    var reg = { sito: "kmstudio", nome: no + " " + co, tel: tel,
      dati: { i: (no[0] + co[0]).toUpperCase(), reg: T0, privacy: new Date().toISOString(), note: "Registrato dall'app il " + fmtD(T0, { day: "numeric", month: "long", year: "numeric" }) + "." } };
    busy(true);
    try {
      var r = await sb.auth.signUp({ email: em, password: pw, options: { emailRedirectTo: location.origin + "/app", data: reg } });
      var sess = r.data && r.data.session, user = r.data && r.data.user;
      if (r.error && !/already|registered|exists/i.test(err(r.error))) return ko(traduci(err(r.error)));
      if (!sess) {
        /* email già usata (anche per un altro servizio) o conferma via email richiesta */
        var s2 = await sb.auth.signInWithPassword({ email: em, password: pw });
        if (s2.error) {
          /* email già usata da un account esistente (anche di un altro servizio dello stesso progetto):
             Supabase risponde senza errore ma con identities vuoto e non manda nessuna email */
          var esiste = !!r.error || (user && Array.isArray(user.identities) && user.identities.length === 0);
          if (esiste && !/not confirmed/i.test(err(s2.error)))
            return ko("Questa email ha già un account: usa la sua password oppure, in “Accedi”, tocca “Password dimenticata?”");
          if (/not confirmed/i.test(err(s2.error)) || user) {
            ["rgP", "rgP2"].forEach(function (x) { el(x).value = ""; });
            openModal('<h3>Controlla la tua email</h3><p class="muted">Ti abbiamo mandato un link a <b>' + esc(em) + '</b>: aprilo per confermare l\'account, poi torna qui e accedi con email e password.</p>');
            authTab("login"); el("cliEmail").value = em; return;
          }
          return ko(r.error ? "Esiste già un account con questa email: accedi (o usa “Password dimenticata?”)" : traduci(err(s2.error)));
        }
        user = s2.data.user;
      }
      var ro = await entra(user, reg);
      if (ro !== "client") { await sb.auth.signOut(); return ko("Non riesco a creare il profilo: riprova"); }
      ["rgN", "rgC", "rgE", "rgT", "rgP", "rgP2"].forEach(function (x) { el(x).value = ""; }); el("rgOk").checked = false;
      enterApp("client", K.cid);
      if (K.nuovo) benvenuto();
      toast("Benvenuto " + no + "! Il tuo account è pronto");
    } catch (x) { ko(traduci(err(x))); } finally { busy(false); }
  }

  async function loginCoach(e) {
    e.preventDefault();
    var em = (el("coachEmail") ? el("coachEmail").value : "").trim().toLowerCase(), pw = el("coachPw").value;
    if (!em || !pw) return errShake("coachErr", "coachForm", "Scrivi email e password");
    busy(true);
    try {
      var r = await sb.auth.signInWithPassword({ email: em, password: pw });
      if (r.error) return errShake("coachErr", "coachForm", traduci(err(r.error)));
      var ro = await entra(r.data.user);
      if (ro !== "coach") { await sb.auth.signOut(); K.ruolo = null; return errShake("coachErr", "coachForm", "Questo account non è quello del titolare"); }
      el("coachPw").value = ""; el("coachErr").textContent = "";
      enterApp("coach");
    } catch (x) { errShake("coachErr", "coachForm", traduci(err(x))); } finally { busy(false); }
  }

  async function esci() {
    tourEnd(false);
    if (S.preview) return tornaCoach();
    var eraCoach = K.ruolo === "coach";
    try { await K.flush(); } catch (e) {}
    try { await sb.auth.signOut(); } catch (e) {}
    K.ruolo = null; K.cid = null; K.snap = null; K.raw = null;
    LS.del("sess"); S.contiOk = false;
    if (eraCoach) showCoachAuth(); else showClientAuth();
  }

  /* ------------- sostituisco le funzioni dell'app che usano il browser ------------- */
  window.loginCliente = loginCliente;
  window.registraCliente = registraCliente;
  window.loginCoach = loginCoach;
  window.esci = esci;
  window.demoCliente = function () {};
  var cambiaPwLocale = window.cambiaPw;
  window.cambiaPw = function (k) {
    if (k !== "pwCoach") return cambiaPwLocale(k);
    K.cambia(el("pcOld").value, el("pcNew").value, el("pcNew2").value).then(function (ok) {
      if (ok) ["pcOld", "pcNew", "pcNew2"].forEach(function (x) { el(x).value = ""; });
    });
  };
  window.save = function () { prezziCheck(); K.salva(); };
  window.caricaPrezzi = function () {};
  window.pubBarHTML = function () {
    return '<div class="alert info pubbar"><div><b>Prezzi collegati al database</b><p>Ogni modifica arriva da sola nell\'app di tutti i clienti e nelle pagine Prenota e Prezzi del sito.</p></div></div>';
  };
  window.credBox = function (em) {
    var txt = "Ciao! Ti ho iscritto all'app di KM Studio. Apri https://kone-studio.com/app#registrati e registrati con questa email: " + em + " (la password la scegli tu). Il tuo profilo si collega da solo.";
    return '<div class="cred"><div class="kv"><span>Indirizzo</span><b>kone-studio.com/app#registrati</b></div><div class="kv"><span>Email</span><b>' + esc(em) + '</b></div><div class="kv"><span>Password</span><b>la sceglie il cliente</b></div></div>' +
      '<p class="hint" style="margin:10px 0">Il cliente si registra con questa email e trova già il suo profilo, la scheda e l\'abbonamento. La password che vedi nel modulo non serve più.</p>' +
      '<div class="inline" style="justify-content:flex-end"><a class="btn primary" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(txt) + '">Manda su WhatsApp</a></div>';
  };

  /* "Accesso app" nella scheda del cliente: con il database la password la sceglie il cliente */
  window.accessoModal = function (cid) {
    var c = cli(cid); if (!c) return;
    var r = K.raw && K.raw.clienti && K.raw.clienti.get(String(cid)), coll = !!(r && r.user_id);
    openModal('<h3>Accesso all\'app · ' + esc(c.n) + '</h3>' + (coll
      ? '<p class="muted" style="margin-bottom:12px"><b>Registrato</b> con l\'email <b>' + esc(c.email || "") + '</b>. Entra con la password che ha scelto lui.</p>' +
        '<p class="hint">Se l\'ha dimenticata: nella schermata di accesso scrive la sua email e tocca <b>“Password dimenticata?”</b>, poi riceve un\'email per sceglierne una nuova.</p>'
      : '<p class="muted" style="margin-bottom:12px"><b>Non si è ancora registrato.</b> Controlla l\'email e mandagli il link: quando si registra con questa email trova già il suo profilo.</p>' +
        '<div class="field"><label>Email</label><input class="fi" id="acE" type="email" value="' + esc(c.email || "") + '"></div>' +
        '<div class="inline" style="justify-content:flex-end"><button class="btn primary" onclick="KMC.salvaEmail(' + cid + ')">Salva</button></div>'));
  };
  K.salvaEmail = function (cid) {
    var c = cli(cid), em = el("acE").value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return toast("Email non valida");
    if (DB.clienti.some(function (x) { return x.id !== cid && (x.email || "").toLowerCase() === em; })) return toast("Email già usata da un altro cliente");
    c.email = em; save(); openModal('<h3>Accesso all\'app · ' + esc(c.n) + '</h3>' + credBox(em));
  };

  K.boot();
})();
