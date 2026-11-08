# Kone Moctar Studio — piattaforma di coaching (v2)

Demo dimostrativa della piattaforma (preventivo Danova Tech 2026/015).
Sito statico in un solo file (`index.html`) + una funzione Netlify facoltativa per l'IA.

## Sito vetrina + app (v3)

- `index.html` è ora il **sito vetrina** animato (loader, hero 3D col logo, servizi in scorrimento orizzontale,
  trattamenti, metodo, corsi intelligenti, showcase dell'app, listino, FAQ).
- L'app è stata spostata **identica** in `app.html`. Ci si arriva dal pulsante **"La tua App"** in alto a destra,
  dal popup che compare **dopo 7 secondi** (una volta per visita) e da tutti i bottoni "Entra nell'app".
- Indirizzi: `/` sito · `/app` app clienti · `/coach` pannello di Kone (in locale `app.html#coach`).
- Contatti dello studio (WhatsApp, telefono, email, Instagram, indirizzo): si compilano in cima allo script
  di `index.html`, nell'oggetto `CONTATTI`. I campi vuoti non vengono mostrati.
- Animazioni: GSAP + ScrollTrigger + Lenis, salvati in `assets/js/` (nessun CDN esterno).

## SEO e Google Search Console

- Ottimizzato per **Milano** (10/10/2026): titolo, descrizione, H1, testi, footer e dati strutturati
  (un unico `@graph`: studio con indirizzo/area Milano, Kone, sito, pagina, FAQ con 8 domande uguali a quelle visibili).
- Instagram dello studio `@km.s.t.u.d.i.o.26` collegato ai dati strutturati; quello di Kone sulla sua scheda.
- `llms.txt` per i motori di ricerca AI. Pagine app/coach/intro con `noindex` (meta + header Netlify).
- Su Netlify gli indirizzi inesistenti rispondono **404** (prima 200 = "soft 404" duplicati della home).
- Il loader animato parte solo alla prima visita della sessione (pagina più veloce dopo).
- Quando c'è l'indirizzo con la via: aggiungilo in `CONTATTI.indirizzo` e in `address.streetAddress` +
  `postalCode` nel JSON-LD in `<head>`, e aggiungi `hasMap` con il link della scheda Google.
- Verifica in Search Console: dominio `kone-studio.com` (record TXT nel DNS) oppure prefisso URL con meta tag:
  il codice va incollato in `index.html` al posto del commento `google-site-verification`.
- Dopo la verifica: Sitemap → invia `sitemap.xml`; Controllo URL → `https://kone-studio.com/` → Richiedi indicizzazione.
- **13 pagine SEO** (una cartella con `index.html` ciascuna, stile in `assets/css/pagine.css`):
  personal-trainer-milano, corsi-di-gruppo-milano, allenamento-e-massaggi-milano, massaggi-milano + 7 pagine
  per ogni massaggio, prezzi, kone-moctar. Ognuna ha titolo/descrizione propri, breadcrumb, FAQ e dati strutturati
  (Service con prezzi, FAQPage, BreadcrumbList). Sono tutte nella sitemap e collegate da home e footer.
  Se cambiano i prezzi vanno aggiornati anche lì.
- Test dati strutturati: https://search.google.com/test/rich-results

### Ottimizzazione SEO tecnica (15/10/2026)

- **Hosting reale = GitHub Pages** (repo `d1gga1/kone-studio`, file `CNAME`): `netlify.toml` qui NON viene letto.
  Il noindex di app/coach/404/intro funziona comunque grazie al meta tag nelle pagine.
- **Font in locale** (`assets/fonts/`, Oswald + Barlow woff2): niente più Google Fonts esterni
  (più veloce, nessun file bloccante, conforme GDPR). Con font "di riserva" calibrati: il testo non salta più al caricamento (CLS ~0).
- **Immagini responsive**: ogni foto dei trattamenti ha le versioni `-480`, `-800`, `-1200` (+ originale 1600) con `srcset`;
  il telefono scarica la versione piccola. Se cambi una foto, rigenera anche le 3 versioni.
- **Anteprime social per pagina** in `assets/og/<pagina>.jpg` (1200×630) + `twitter:title/description`.
- Home: H1 con parole chiave **visibili** ("Personal trainer & massaggi professionali a Milano") al posto del testo nascosto;
  alt delle foto descrittivi; ordine dei titoli corretto; loader iniziale accorciato (~0,7 s in meno).
- Da fare fuori dal sito (impatto maggiore sulla SEO locale): **Scheda Google Business Profile** con indirizzo, orari, foto e recensioni;
  poi aggiungere via, CAP, coordinate (`geo`), `openingHoursSpecification` e `hasMap` nel JSON-LD.

## Due ingressi separati

| Chi | Indirizzo | Accesso |
|---|---|---|
| Clienti | `https://tuosito.netlify.app/` | email + password del cliente. **Non vedono** l'area coach. |
| Kone | `https://tuosito.netlify.app/coach` | password coach. Da qui vede anche l'app di qualsiasi cliente (icona occhio in alto). |

In locale (aprendo il file dal computer) l'area coach si apre con `index.html#coach`.

**Password della demo — da cambiare subito** (Contabilità → Password):

- Pannello coach: `kone2026`
- Contabilità: `conti2026` (password separata, solo per il titolare; si richiude quando esci dalla pagina)
- Cliente di prova: `marco@demo.it` / `marco`

## Cosa c'è di nuovo

- **Allenamenti e Trattamenti divisi**: interruttore in alto, sia per Kone sia per i clienti.
- **Prenotazioni**: il cliente prenota one to one, corsi di gruppo (max 10 a corso) e trattamenti
  scegliendo durata 30′/60′. Kone in *Agenda* aumenta o diminuisce con − / + i posti di ogni ora,
  aggiunge/toglie persone, chiude un orario, crea nuovi orari. Il tetto (10 per i corsi) si cambia in *Capienza massima*.
- **Listino dettagliato**: allenamento (one to one, corsi, mensili, combo) e trattamenti con colonna
  dei benefici, "indicato per" e prezzi 30′/60′. Kone modifica i prezzi direttamente nella tabella.
  ⚠️ I prezzi dei corsi di gruppo sono di esempio: vanno confermati.
- **Esercizi con foto e video**: in *Esercizi* si carica una foto (anche dalla fotocamera) e un video
  (link YouTube/Vimeo o file). Il cliente li vede aprendo l'esercizio nella scheda.
- **Peso e carichi**: il cliente registra il peso (con grafico) e i carichi; chiudendo la seduta i chili
  usati finiscono da soli nello storico. Kone vede tutto nella scheda del cliente.
- **Contabilità con password**: incassi, uscite, da incassare, entrate per area, esportazione CSV.
- **Corsi · IA**: ogni giorno viene generato il programma di ogni corso (vedi sotto).

## Il motore dei corsi

Parametri per corso: tipologia, livello, obiettivo, durata, partecipanti (dalle prenotazioni),
attrezzatura, esercizi vietati/consentiti, intensità, formato.
Legge lo storico e i feedback che i clienti lasciano a fine corso (fatica 1-10, gradimento 1-5, fastidi):
troppa fatica → scende di un punto, troppo facile → sale, gradimento basso → cambia esercizi,
fastidio a ginocchia/schiena/spalle → evita gli esercizi che caricano quella zona.

Ogni programma passa dal **controllo regole** (13 vincoli: capienza, esercizi vietati, attrezzi,
livello, zone protette, tetto di intensità, riscaldamento ≥ 8′, defaticamento ≥ 5′, durata esatta,
progressione max ±1, schemi motori, persone per stazione, varietà). Se una regola salta, il programma
viene corretto; se non si può correggere, viene bloccato. Le regole di sicurezza non si possono spegnere.

**Due motori:**
1. *Regole (locale)* — gira nel browser, sempre disponibile. È quello attivo nella demo.
2. *IA Claude + regole* — `netlify/functions/genera-programma.mjs` chiede il programma a Claude
   con risposta strutturata; l'app lo ripassa comunque dal controllo regole.
   Per attivarlo: pubblicare **da Git** (il trascina-e-rilascia non carica le funzioni),
   aggiungere su Netlify la variabile `ANTHROPIC_API_KEY`, poi in *Corsi · IA* scegliere "IA Claude + regole".
   Costo indicativo: poche chiamate al giorno (una per corso).

## Pubblicare su Netlify

**Con l'IA (consigliato)**: metti questa cartella in un repository → Netlify → *Add new site → Import
an existing project*. Build command vuoto, publish directory `.`. Poi la variabile `ANTHROPIC_API_KEY`.

**Veloce, senza IA**: https://app.netlify.com/drop e trascina la cartella intera.

Dopo ogni modifica alza il numero in `sw.js` (`km-studio-v2` → `v3`) se sul telefono vedi la versione vecchia.

## Limiti della demo (da risolvere nella versione definitiva)

I dati vivono **nel browser di chi usa l'app** (localStorage, video in IndexedDB): le prenotazioni
fatte da un telefono non arrivano sul telefono di Kone, e le password sono controllate nel browser.
Per l'uso reale servono un database condiviso e l'autenticazione lato server
(es. Supabase o Netlify DB + Netlify Identity), con i video su uno storage dedicato.
L'impianto dell'app è già pensato per questo passaggio.

---
Danova Tech — info@danova-tech.com

### Calendario, prenotazione a passaggi e PayPal (20/10/2026)

- **Coach · Calendario** (ex Agenda): vista **Giorno / Settimana**, frecce ‹ Oggi ›, **Filtri** (tipo, corso, posti liberi/al completo).
  Ogni orario ha il menu ⋮: gestisci prenotati, **Sposta** (i prenotati ricevono un messaggio in chat), **Duplica**
  (giorno dopo, settimana prossima, 4 settimane, data a scelta), chiudi/riapri, elimina. In vista settimana si **trascina**
  un blocco per spostarlo e con doppio clic su uno spazio vuoto si crea un orario.
- **Cliente · Prenota** in 4 passaggi (Attività → Giorno → Orario → Conferma) con riepilogo e scelta del pagamento:
  **PayPal** (QR `assets/img/paypal-qr.webp` + pulsante), scala dal piano, oppure in studio.
  Kone vede "PayPal · conferma" sul prenotato: un tocco lo segna pagato e lo registra in Contabilità.
  Il link PayPal si cambia dal Listino (area coach).
- **Prezzi** allineati al volantino di ottobre 2026 (pacchetti PT 172/336/480, Active 320, Pro 450, combo 370/740/1.040,
  trattamenti a scelta 30′/50′). Aggiornati app, home, /prezzi e pagine SEO. I dati già salvati nel browser vengono aggiornati da soli.
- Logo ufficiale (immagine `logo-km`) usato anche nell'app: intro, schermate di accesso e barra in alto.

### Area titolare (20/10/2026, pomeriggio)

- Accesso: `kone-studio.com/coach` · password demo `kone2026` (da cambiare in Contabilità → Password).
- **Cruscotto**: "Il tuo saldo" del mese (incassato, uscite, saldo, da incassare; importi nascosti finché non tocchi "Mostra")
  e i pagamenti PayPal da confermare con il tasto "Ricevuto".
- **Clienti**: "+ Nuovo cliente" crea anagrafica e credenziali (da mandare su WhatsApp); "Accesso app" reimposta email/password.
- **Schede per cliente** (prima c'era una sola scheda demo): scheda vuota, copia da modello o da un altro cliente, oppure
  file PDF/foto caricato; "Nuova scheda" archivia la vecchia; "Salva come modello"; "Avvisa il cliente" scrive in chat.
- **Chat**: tutti i clienti in elenco con ricerca, risposte con foto allegate (anche dal cliente).
- Limite demo invariato: i dati restano nel browser del dispositivo, finché non si collega un database condiviso.

### SEO avanzata (20/10/2026, sera)

- **Velocità home** (Lighthouse mobile ~62 → ~75-80, LCP reale < 1 s): loader nero iniziale disattivato, logo visibile
  da subito in trasparenza mentre si costruisce, GSAP/ScrollTrigger/Lenis caricati con `defer`, animazioni di scroll
  avviate quando il browser è libero, smooth scroll solo con mouse. Contrasto del manifesto migliorato.
- **7 pagine nuove**: /allenamento-in-coppia-milano/, /contatti/, /guide/ + 4 guide (quanto costa un personal trainer
  a Milano, decontratturante o sportivo, ogni quanto fare un massaggio, personal trainer o corsi). Dati strutturati
  Article/Service/FAQ/ContactPage/BreadcrumbList, autore Kone Moctar.
- Link interni: "Guide" nel menu, footer aggiornato su tutte le pagine, box "Approfondisci" su prezzi, massaggi, corsi.
- Sitemap (21 URL, lastmod 2026-10-20) e llms.txt aggiornati. Corretto prezzo Pro (450 €) sulla pagina personal trainer.
- Dopo la pubblicazione: Search Console → Sitemap → reinvia sitemap.xml; Controllo URL sulle pagine nuove.

### Listino libero, abbonamenti, libreria esercizi con foto, pagina /esercizi/ (23/10/2026)

Richieste di Kone (video del 22/10): essere completamente indipendente su prezzi, listini e sedute; foto per ogni esercizio; il cliente deve poter prenotare con il suo abbonamento.

- **Listino (area titolare)**: in ogni tabella si modificano nome, dettaglio, **sedute/ingressi** (0 = illimitati) e prezzo; "+ Aggiungi voce" crea un pacchetto nuovo, il cestino lo elimina.
  **Sconti**: "% sconto" su ogni voce (percentuale + data di fine facoltativa) e "% Sconto su più voci" per una promozione su allenamenti, trattamenti, misti o tutto.
  Il cliente vede il prezzo pieno barrato e quello scontato (listino, schede trattamenti, prenotazione). Trattamenti: nome modificabile, nuovo trattamento, elimina.
- **Abbonamento del cliente**: Clienti → Apri → "Modifica abbonamento e sedute": si parte da una voce del listino o si scrive a mano (piano, cosa copre, sedute totali, sedute usate con − / +, scadenza, "Rinnova").
- **"Hai già un abbonamento? Clicca qui"**: nella home del cliente e nella prenotazione. Mostra piano e sedute rimaste, propone solo le attività incluse,
  salta il pagamento e scala una seduta; se il cliente annulla la seduta torna nell'abbonamento. Se è esaurito o scaduto lo porta ai prezzi.
- **Libreria esercizi**: 108 esercizi con 2 foto ciascuno (partenza e arrivo) in `assets/img/esercizi/` (webp, ~3 MB in tutto), da archivio libero di
  **pubblico dominio** (Free Exercise DB, github.com/yuhonas/free-exercise-db). Ricerca, filtro per gruppo, gruppi nuovi, elimina. Kone può sostituire le foto con le sue.
  Nei browser con dati già salvati esercizi e foto si aggiungono da soli (una volta sola: quelli eliminati da Kone non tornano).
- **SEO / AI**: nuova pagina pubblica **/esercizi/** (107 esercizi con foto, alt descrittivi, dati strutturati ItemList + FAQPage + BreadcrumbList,
  link "Esercizi con foto" nel footer di tutte le pagine), in `sitemap.xml` con le immagini e in `llms.txt`. App e area titolare restano `noindex`.
- `404.html` e `app.html` ora sono identici (il service worker usa `app.html`, GitHub Pages serve /app e /coach con `404.html`). Cache di `sw.js` → v16.
- ⚠️ Limite demo invariato: listino e abbonamenti modificati da Kone restano nel suo browser finché non si collega un database condiviso;
  le pagine pubbliche (/prezzi/ e pagine SEO) hanno i prezzi scritti a mano.

### Prenotazione e pagamento online + planning corsi + enciclopedia esercizi (26/10/2026)

- **Nuova pagina `/prenota/`**: il cliente prenota e paga da solo, senza dover contattare Kone.
  - **Planning settimanale** come il volantino (lunedì–sabato, 07–21, corsi colorati): ogni ora vuota è "Libero" con **2 posti**
    (singola = 1 posto, coppia = 2), i corsi mostrano i posti su 10, le ore passate sono spente. Frecce per le prossime 5 settimane; su telefono un giorno alla volta.
  - Tocca un'ora libera → PT singola 45 €, coppia 65 € (solo se ci sono 2 posti), massaggio 30′/50′ con scelta del trattamento,
    oppure "Ho già un pacchetto" (gratis, scala dal pacchetto). Tocca un corso → ingresso 12 € o carnet.
  - Sezione **Pacchetti e abbonamenti**: si paga il pacchetto e si prenota la prima seduta. Link diretti: `/prenota/?s=pt-8`, `/prenota/?cat=Massaggi`.
- **Configurazione** in `assets/js/prenota-config.js`: nome utente Cal.com, slug degli eventi, planning corsi (giorno, ora, colore), posti per ora e per corso.
- **Per attivare il pagamento automatico (Cal.com, gratis):**
  1. account su cal.com → collega Google Calendar di Kone → imposta gli orari di lavoro;
  2. App Store di Cal.com → installa **Stripe** (carta, Apple Pay, Google Pay) e/o **PayPal**;
  3. crea un "Event type" per ogni slug della lista in `prenota-config.js` con prezzo e "Richiedi pagamento";
     per `pt-singola` attiva **Seats = 2**, per ogni corso **Seats = 10**; gli eventi "inclusi" a 0 €;
  4. scrivi il nome utente in `calUser`. Da quel momento la griglia legge la disponibilità reale da Cal.com e il pagamento è obbligatorio per confermare.
  Finché `calUser` è vuoto, la pagina funziona lo stesso: dopo la scelta propone "Paga con PayPal" + messaggio WhatsApp già scritto.
- **Su tutto il sito**: pulsante oro "Prenota e paga online" in ogni pagina (WhatsApp e telefono restano come secondari), voce "Prenota" nel menu,
  home → "Prenota e paga online" e "Vedi il planning", pagina corsi con il link al planning, FAQ "Come si paga?" aggiornata. Sitemap, llms.txt, `sw.js` → v17.
- **Enciclopedia esercizi** (PDF KM Studio, 446 esercizi in 19 gruppi): aggiunti all'app i 313 che mancavano → **421 esercizi** in libreria.
  Nuovi gruppi: Avambracci e presa, Adduttori, Abduttori e anca, Tibiali e caviglie, Lombari, Cuffia rotatori e scapole, Collo e trapezi.
  I doppioni (es. "Back squat" = "Squat bilanciere") non sono stati duplicati. I nuovi non hanno ancora foto: Kone le aggiunge dalla libreria.
  Nei browser con dati già salvati si aggiungono da soli una volta (`exEnc1`).

### Prezzi sincronizzati, foto nei Corsi · IA, guida per i clienti (29/10/2026)

- **Prezzi del titolare → clienti in automatico.** Quando Kone cambia il Listino (prezzi, voci, sedute, sconti, trattamenti, link PayPal)
  l'app lo pubblica da sola nel file `assets/data/listino.json` del sito (commit tramite API di GitHub). Le app dei clienti lo rileggono
  all'apertura, quando tornano sull'app e ogni 3 minuti; anche `/prenota/` e `/prezzi/` lo leggono (`assets/js/prezzi-live.js`).
  - **Da fare una volta sul dispositivo di Kone:** Listino → **Collega** → incolla una chiave GitHub *fine-grained* con accesso solo al repo
    `d1gga1/kone-studio`, permesso **Contents: Read and write**. La chiave resta solo in quel browser.
  - In cima al Listino una barra dice se i prezzi sono sincronizzati, in pubblicazione o da ripubblicare.
  - Finché `agg` nel file è vuoto (nessuna pubblicazione ancora), app e sito usano i prezzi scritti nel codice.
  - ⚠️ Ogni pubblicazione è un commit su GitHub: prima di fare `git push` dal computer fai `git pull`.
  - Nella pagina `/prezzi/` le celle con `data-prezzo="sezione.indice"` si aggiornano da sole; le altre pagine SEO e la home restano scritte a mano.
  - `sw.js` → v18: `/assets/data/` non passa mai dalla cache.
- **Corsi · IA: foto degli esercizi.** Ogni esercizio del programma è cliccabile: la foto (partenza/arrivo) con la spiegazione compare nel riquadro
  "Come si fa" sotto a destra, che resta visibile mentre scorri. Su telefono (e per i clienti nella pagina Oggi) si apre la scheda dell'esercizio.
  Aggiunti alla libreria i 39 esercizi del motore corsi con spiegazione; 31 hanno la foto (17 nuove da Free Exercise DB, pubblico dominio, in
  `assets/img/esercizi/`). Senza foto per ora: Burpees, Bird dog, Wall slide, 90/90 delle anche, Squat profondo assistito al TRX,
  Andature leggere, Marcia veloce con ginocchia alte, Respirazione diaframmatica (Kone le carica con "Carica la foto" dal riquadro).
- **Guida a passaggi per il cliente.** Al primo accesso di ogni cliente parte una guida in 9 passi (benvenuto, Allenamenti/Trattamenti, Oggi, Scheda,
  Prenota, Progressi, Dieta, Prezzi, Chat) che evidenzia ogni sezione; alla fine propone di installare l'app. Si rivede col **?** in alto a destra.

### Nuovi corsi, libreria nella scheda, foto esercizi, corsi 29 €, bonifico, rinnovo automatico, avviso sedute (03/11/2026)

Richieste di Kone (messaggio del 03/11):

- **Corsi · IA → "+ Nuovo corso"** (in alto e nella scheda "Corsi e parametri"): nome, colore, livello, obiettivo, durata, focus, tipo, intensità, attrezzi.
  Dopo il salvataggio si apre **"Metti in calendario"**: giorni della settimana, ora, per quante settimane (4/8/12/26) e posti → le lezioni compaiono in Agenda e i clienti le prenotano.
  Da "Modifica" si può anche **eliminare** un corso (toglie le lezioni future; lo storico resta, in `DB.corsiArch`).
  Le lezioni/orari eliminati o spostati non vengono più ricreati dal calendario di base (`DB.agendaDel`).
- **Scheda del cliente → "Aggiungi dalla libreria"**: barra di ricerca + gruppi muscolari (Petto, Schiena, Spalle, Bicipiti, Tricipiti, Gambe · quadricipiti,
  Femorali, Glutei, Polpacci, Addome · core…) con la **foto** di ogni esercizio; tocchi la foto per vedere come si fa, "Aggiungi" lo mette nel giorno scelto.
- **Foto esercizi**: aggiunte le foto (partenza/arrivo) a **~355 esercizi** che non le avevano, file `assets/img/esercizi/fx-*.webp`
  (Free Exercise DB, pubblico dominio; per alcune varianti è la foto del movimento più simile). Senza foto restano 4 esercizi (Finger extension,
  Eversione/Inversione caviglia, Toe yoga): Kone le carica da Esercizi. Si applicano da sole una volta (`exFx1`); quelle già caricate da Kone non vengono toccate.
  Uniti i gruppi minori (Mobilità → Mobilità e stretching, Schiena → Lombari, ecc.) per avere chip più pulite.
- **Corsi di gruppo 29 € a seduta**: tolto il "12 €" da app, /prenota/, listino.json, home, /prezzi/, pagine SEO e guide. Su /prenota/ c'è la nuova scheda "Corsi di gruppo" tra i pacchetti.
- **Bonifico**: Listino → "Come pagare" → **IBAN, intestatario, banca** (controllo IBAN; si cambia quando si vuole, vuoto = bonifico nascosto).
  Il cliente lo trova tra i pagamenti della prenotazione (con "Copia IBAN/causale"), Kone lo conferma come PayPal ("Bonifico · conferma" → Contabilità).
  L'IBAN viaggia nel `listino.json` pubblicato, quindi arriva anche a /prenota/.
- **Abbonamenti mensili con rinnovo automatico**: Clienti → Modifica abbonamento → "Rinnovo automatico ogni mese" + importo. Alla scadenza l'app
  rinnova da sola (+1 mese, sedute azzerate, incasso "Addebito automatico" da verificare in Contabilità, messaggio al cliente). Il cliente vede
  "Rinnovo automatico attivo · Disdici": la disdetta vale fino a fine mese, poi non si rinnova (Kone riceve un messaggio in chat).
  **Addebito reale sul conto**: serve Stripe (gratis, commissione a transazione). Per ogni voce mensile del Listino il tasto "addebito auto" accetta un
  **Payment Link ricorrente mensile** (metodi: addebito SEPA + carta): il cliente inserisce il suo IBAN e paga ogni mese da solo. In "Come pagare" si
  incolla il link del **portale clienti Stripe**, che si apre quando il cliente disdice. Senza link il cliente manda la richiesta a Kone (e vede l'IBAN).
- **Avviso lampeggiante** "le sedute degli abbonamenti mensili e dei corsi di gruppo non sono recuperabili; quelle dei pacchetti sì":
  app (Prezzi, conferma prenotazione corsi/abbonamento, attivazione abbonamento), /prenota/ (planning, pacchetti, scheda corso), /prezzi/, /corsi-di-gruppo-milano/, home.
- `sw.js` → v19, `pagine.css?v=4`, `prenota.css?v=2`, `prenota.js?v=3`.

### Registrazione clienti, P.IVA, ingresso titolare, codice su Cruscotto e Contabilità (04/11/2026)

- **Registrazione dei clienti**: nella schermata d'accesso dell'app ci sono le schede **Accedi / Registrati**. Il cliente compila nome, cognome,
  email, telefono, password (min. 6) e il consenso privacy; entra subito nell'app (senza abbonamento) e Kone riceve un messaggio in chat con email e telefono.
  Link diretto alla registrazione: `kone-studio.com/app#registrati` (anche nel footer della home).
- **P.IVA**: si scrive **una volta sola** in `assets/data/studio.js` (campo `piva`). Compare nell'accesso all'app, nel passaggio di pagamento
  della prenotazione (app e `/prenota/`) e nel piè di pagina di tutte le pagine del sito. Vuota = non compare. Il file non passa dalla cache.
- **Ingresso titolare facile**: tasto **"Sei Kone? Area titolare"** nella schermata d'accesso dell'app (funziona anche dall'app installata) e link
  "Area titolare" nel footer della home. Una volta entrato, l'app riapre direttamente il pannello finché Kone non fa "Esci".
- **Codice su Cruscotto + Contabilità**: entrambe le pagine si aprono solo col **codice** (è la vecchia password della contabilità, demo `conti2026`).
  Sbloccato una volta vale per tutte e due; si richiude appena si va in un'altra sezione. Si cambia in Contabilità → "Codice cruscotto e contabilità".
- ⚠️ Limite demo invariato: un cliente registrato esiste solo nel browser del suo telefono finché non si collega il database condiviso (Supabase o simile).
- `sw.js` → v20, `prenota.js?v=4`.

### Database condiviso Supabase (04/11/2026)

L'app non tiene più i dati nel browser: clienti, agenda e prenotazioni, schede, peso e carichi, chat, programmi dei corsi,
feedback, contabilità, listino ed esercizi stanno nel database **Supabase**, progetto `artantis`, schema separato **`kmstudio`**
(le tabelle di Artantis non vengono toccate).

- **File nuovi**: `assets/js/supabase.js` (libreria ufficiale v2.119.0, in locale), `assets/js/cloud-config.js` (indirizzo e chiave
  *publishable* del progetto), `assets/js/cloud.js` (il "ponte": login, caricamento, salvataggio). Script SQL in `../supabase/`.
- **Login vero** (email + password di Supabase):
  - **Kone** entra da `/coach` con email e password. L'account si crea dal pannello Supabase (Authentication → Add user) e si
    rende titolare con la riga SQL in fondo a `kmstudio_schema.sql`.
  - **Clienti**: si registrano da `/app#registrati`. Se Kone li ha già creati con quella email, il profilo (abbonamento, scheda)
    si collega da solo. "Password dimenticata?" manda un'email per sceglierne una nuova.
  - Gli utenti di Artantis non entrano nell'app di Kone finché non si registrano anche qui.
- **Chi vede cosa** (regole RLS nel database): Kone vede tutto; ogni cliente vede solo i suoi dati; degli altri vede solo quanti
  posti sono occupati. Contabilità, impostazioni e modelli di scheda solo Kone.
- **Prenotazioni**: passano dalle funzioni `prenota` / `annulla` del database, che controllano i posti (niente posti doppi) e
  scalano/restituiscono le sedute dell'abbonamento.
- **Aggiornamento**: ogni app chiede ogni 15 s alla tabella `stato` se qualcosa è cambiato (pochi byte) e riscarica solo le
  tabelle cambiate. Ogni 10 minuti riscarica tutto.
- **Prezzi**: la pubblicazione su GitHub (`listino.json` + chiave GitHub) non serve più. Kone cambia il Listino → il documento
  `listino_pub` nel database si aggiorna → app dei clienti, `/prenota/` e `/prezzi/` lo leggono da lì (`prezzi-live.js`;
  se il database non risponde usano ancora `listino.json`).
- **Primo accesso del titolare**: il database parte vuoto. Al primo accesso l'app carica listino, corsi ed esercizi
  (quelli salvati in quel browser, se ci sono, + i prezzi di `listino.json`) e crea l'agenda senza prenotazioni finte.
  Clienti, movimenti e prenotazioni della demo **non** vengono copiati. Il primo accesso conviene farlo dal dispositivo di Kone.
- ⚠️ Ancora sul dispositivo (da spostare nello Storage di Supabase in un secondo passaggio): **foto allegate in chat**,
  **video caricati come file** negli esercizi (i link YouTube/Vimeo invece funzionano per tutti) e **schede caricate come PDF/foto**.
  I testi della chat e le schede create nell'app arrivano a tutti.
- Se cambi `cloud.js` o `cloud-config.js`, alza il `?v=` in `app.html` e la versione in `sw.js` (`km-studio-v21` → `v22`).

### Password, indirizzo, P.IVA, IBAN, dieta modificabile (08/11/2026)

- **Password**: "Password dimenticata?" anche nell'area titolare; tasto 🔑 in alto (titolare e clienti) per cambiarla da dentro l'app;
  il link dell'email apre la scelta della nuova password. Le email partono da Resend (SMTP in Supabase, mittente `noreply@kone-studio.com`,
  dominio verificato con 3 record DNS su Aruba). L'SMTP vale per tutto il progetto `artantis`.
- **Indirizzo**: Piazza Puccini 16/A, 20070 Vizzolo Predabissi (MI) — dati strutturati di tutte le pagine (con `hasMap` e `vatID`),
  piè di pagina, Contatti, FAQ, home (`CONTATTI.indirizzo`), `llms.txt`, `assets/data/studio.js`.
- **P.IVA** 14938790962 in `assets/data/studio.js`.
- **IBAN e pagamenti**: nuova voce nel menu del titolare (stessa scheda di Listino → Come pagare).
- **Dieta**: piano per cliente (`DB.diete`, tabella `progressi` con tipo `dieta`) modificabile dal cliente (Dieta → Modifica) e da Kone
  (Nutrizione, oppure Clienti → Apri → Dieta): pasti, ore, alimenti, quantità/unità, kcal, proteine, carboidrati, grassi, obiettivo kcal, note.
  Totali calcolati da soli. **Serve una volta `supabase/kmstudio_patch_03.sql`** (permette il tipo `dieta`).
- `sw.js` → v24, `cloud.js?v=4`.

### Modifiche di Kone → calendario dei clienti in tempo reale + avvisi (08/11/2026, sera)

- **Aggiornamento istantaneo**: `cloud.js` si iscrive al canale Realtime di Supabase sulla tabella `stato`. Quando Kone cambia
  qualcosa in Calendario/Agenda (sposta, trascina, cambia durata, rinomina, chiude, elimina, aggiunge o toglie persone) tutte le app
  aperte dei clienti si aggiornano in 1-2 secondi. Il controllo ogni 15 s resta come riserva.
  **Serve una volta `supabase/kmstudio_patch_04.sql`** (aggiunge `kmstudio.stato` alla pubblicazione `supabase_realtime`); senza, si aggiorna ogni 15 s come prima.
  Vale anche per chat e prenotazioni (Kone vede prima le nuove prenotazioni).
- **Avvisi al cliente**: l'app del cliente confronta le sue prenotazioni con com'erano (per numero di prenotazione) e avvisa se Kone
  le ha **spostate**, ha cambiato **durata** o **nome**, ha **chiuso/riaperto** l'orario, le ha **tolte/annullate**, oppure **l'ha prenotato lui**.
  L'avviso arriva come **notifica del telefono** (dopo "Attiva le notifiche", in Oggi e Prenota), come messaggio in basso e come riquadro
  "Kone ha modificato i tuoi appuntamenti" in **Oggi** e **Prenota** (resta finché il cliente tocca "Ok, visto").
  Le prenotazioni annullate dal cliente stesso non generano avvisi. Se il cliente aveva l'app chiusa, l'avviso compare appena la riapre.
  Lo spostamento con "Sposta" continua a mandare anche il messaggio in chat.
- Limite: con l'app **completamente chiusa** la notifica non parte subito (arriva alla riapertura). Per la notifica immediata ad app chiusa
  servono le notifiche push (Web Push con chiavi VAPID + una Edge Function di Supabase che le invia): passo successivo.
- `404.html` riallineato ad `app.html` (era rimasto indietro: /app e /coach su GitHub Pages usano `404.html`). `sw.js` → v26, `cloud.js?v=5`.
