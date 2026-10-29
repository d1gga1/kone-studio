/* ============================================================
   PRENOTAZIONE ONLINE — configurazione
   ------------------------------------------------------------
   La prenotazione con pagamento usa Cal.com (gratuito):
   il cliente sceglie giorno e ora tra quelli liberi di Kone
   e paga subito con carta / Apple Pay / Google Pay (Stripe)
   oppure PayPal. Kone riceve la prenotazione sul suo calendario
   e i soldi sul suo conto.

   1. Crea l'account su https://cal.com  (es. nome utente "kone-studio")
   2. Scrivi qui sotto il nome utente in  calUser
   3. Su Cal.com crea un "Event type" per ogni servizio,
      con lo SLUG (l'ultima parte del link) uguale alla lista qui sotto
      e attiva il pagamento (App Stripe o PayPal → "Richiedi pagamento").
      Esempio: cal.com/kone-studio/pt-singola  → 45 €, 60 minuti.
   Se uno slug su Cal.com è diverso, cambialo qui a destra.
   Se calUser è vuoto, il sito mostra la scelta del servizio e
   poi propone WhatsApp (nessun errore per i clienti).
   ============================================================ */
window.KM_PRENOTA = {
  calUser: "",            // ← es. "kone-studio"
  calOrigin: "https://cal.com",

  // id del servizio sul sito  →  slug dell'evento su Cal.com
  slug: {
    "pt-singola": "pt-singola",
    "pt-coppia": "pt-coppia",
    "pt-4": "pacchetto-pt-4",
    "pt-8": "pacchetto-pt-8",
    "pt-12": "pacchetto-pt-12",
    "coppia-4": "pacchetto-coppia-4",
    "abb-start": "abbonamento-start",
    "abb-active": "abbonamento-active",
    "abb-pro": "abbonamento-pro",
    "abb-elite": "abbonamento-elite",
    "mass-30": "massaggio-30",
    "mass-50": "massaggio-50",
    "mass-4": "pacchetto-massaggi-4",
    "mass-8": "pacchetto-massaggi-8",
    "mass-12": "pacchetto-massaggi-12",
    "abb-relax": "abbonamento-relax",
    "abb-wellness": "abbonamento-wellness",
    "abb-recovery": "abbonamento-recovery",
    "combo-bronzo": "combo-bronzo",
    "combo-argento": "combo-argento",
    "combo-oro": "combo-oro",
    "essential": "essential",
    "complete": "complete",
    "premium": "premium",
    "total-body": "total-body",
    "corso": "corso-di-gruppo",   // ingresso singolo generico (se non usi uno slug per corso)
    /* già clienti: eventi GRATUITI (pagamento già fatto col pacchetto) */
    "inc-pt": "seduta-inclusa",
    "inc-coppia": "seduta-coppia-inclusa",
    "inc-mass": "massaggio-incluso",
    "inc-corso": "corso-incluso"
  },

  /* ---------- PLANNING SETTIMANALE CORSI ----------
     Uguale al volantino. giorno: 1=lunedì … 6=sabato.  ora: inizio (durata 1 ora).
     slug = evento su Cal.com di quel corso (con "Seats"/posti = 10).
     Per cambiare il planning basta modificare questa lista.          */
  orari: { inizio: 7, fine: 21 },      // prima e ultima ora della griglia
  giorni: [1, 2, 3, 4, 5, 6],          // lunedì → sabato
  postiCorso: 10,
  postiOra: 2,          // ore libere: 2 persone per ora (singola = 1 posto, coppia = 2 posti)
  planning: [
    { giorno: 1, ora: 9,  corso: "Senior Fit",                 colore: "#3B82F6", slug: "senior-fit" },
    { giorno: 2, ora: 9,  corso: "Mobilità & Postura",         colore: "#22C55E", slug: "mobilita-postura" },
    { giorno: 3, ora: 9,  corso: "Ginnastica Dolce Over 70",   colore: "#A855F7", slug: "ginnastica-dolce" },
    { giorno: 4, ora: 9,  corso: "Senior Fit",                 colore: "#3B82F6", slug: "senior-fit" },
    { giorno: 5, ora: 9,  corso: "Mobilità & Postura",         colore: "#22C55E", slug: "mobilita-postura" },
    { giorno: 6, ora: 9,  corso: "Ginnastica Dolce Over 70",   colore: "#A855F7", slug: "ginnastica-dolce" },
    { giorno: 1, ora: 12, corso: "Circuit Training",           colore: "#F97316", slug: "circuit-training" },
    { giorno: 2, ora: 12, corso: "Functional Training",        colore: "#DC2626", slug: "functional-training" },
    { giorno: 3, ora: 12, corso: "Tabata Training",            colore: "#EAB308", slug: "tabata-training" },
    { giorno: 4, ora: 12, corso: "Circuit Training",           colore: "#F97316", slug: "circuit-training" },
    { giorno: 5, ora: 12, corso: "Tabata Training",            colore: "#EAB308", slug: "tabata-training" },
    { giorno: 6, ora: 13, corso: "Total Body",                 colore: "#8B5E3C", slug: "total-body-corso" },
    { giorno: 5, ora: 18, corso: "Functional Training",        colore: "#DC2626", slug: "functional-training" },
    { giorno: 1, ora: 19, corso: "Functional Training",        colore: "#DC2626", slug: "functional-training" },
    { giorno: 2, ora: 19, corso: "Total Body",                 colore: "#8B5E3C", slug: "total-body-corso" },
    { giorno: 3, ora: 19, corso: "Total Body",                 colore: "#8B5E3C", slug: "total-body-corso" },
    { giorno: 4, ora: 19, corso: "Functional Training",        colore: "#DC2626", slug: "functional-training" },
    { giorno: 5, ora: 20, corso: "Tabata Training",            colore: "#EAB308", slug: "tabata-training" }
  ],
  prezzoCorso: 12,

  /* Fallback finché Cal.com non è collegato: pagamento PayPal */
  paypal: "https://www.paypal.com/qrcodes/p2pqrc/BAHYS4B2HYL2G",
  whatsapp: "393922696468"
};
