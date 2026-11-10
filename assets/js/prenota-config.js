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

  /* ---------- ORARI ----------
     Non c'è più un planning scritto qui: la pagina /prenota/ mostra gli orari
     dell'agenda di Kone (app → Agenda), letti dal database in tempo reale.
     Per cambiare corsi, orari o posti si modifica l'agenda nell'app.          */
  prezzoCorso: 29,     // ingresso singolo a un corso (se il titolare lo cambia nel Listino vale quello)

  /* Pagamento con carta, Apple Pay, Google Pay e Klarna (Stripe).
     Su Stripe: Payment Links → Nuovo → "I clienti scelgono quanto pagare" (valuta EUR),
     poi Impostazioni → Metodi di pagamento → attiva Apple Pay, Google Pay e Klarna.
     Il link (https://buy.stripe.com/…) si incolla nell'app: Area titolare → IBAN e pagamenti.
     Quello scritto qui sotto vale solo finché nell'app non ce n'è uno.                      */
  stripe: "",

  /* Fallback finché Cal.com non è collegato: pagamento PayPal */
  paypal: "https://www.paypal.com/qrcodes/p2pqrc/BAHYS4B2HYL2G",
  whatsapp: "393922696468"
};
