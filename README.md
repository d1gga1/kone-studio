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
- Test dati strutturati: https://search.google.com/test/rich-results

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
