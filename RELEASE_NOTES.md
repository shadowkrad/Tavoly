# 🚀 Tavoly — Release Notes

## Novità della Versione 1.1.2 (Patch)

- Il pallino WhatsApp compare solo nella vetrina pubblica del sito: non piu' nelle pagine interne, nelle tessere e nei buoni dei clienti (prima bastava una pagina non prevista per vederlo).
### 1. 🖼️ Foto dei Piatti Coerenti nel Menù e nell'Asporto
- **Un solo interruttore per le foto**: disattivando "Mostra fotografie dei piatti", le foto spariscono sia dal menù digitale sia dalla pagina Asporto, che prima le mostrava comunque.
- **Più facile da trovare**: l'etichetta in Impostazioni ora dice "nel menù digitale e nell'asporto" e nella sezione Asporto del gestionale c'è una nota che indica dove si attiva o disattiva.

### 2. 👤 Scheda Cliente Rinnovata
- **Un numero, un cliente**: lo stesso telefono (anche scritto con spazi, trattini o +39) è sempre la stessa scheda: prenotazioni, asporto e nuove schede non creano più doppioni, e se il numero esiste già il gestionale lo segnala.
- **Cellulare o fisso**: i numeri fissi restano ammessi ma non ricevono WhatsApp né messaggi automatici; per loro conta l'email o l'avviso a voce.
- **Data di nascita** facoltativa e **consenso promozionale**, base per il buono compleanno.
- **Punti non più a mano**: tolti i "+10 punti" fissi a ogni prenotazione o asporto e la rettifica libera del saldo. I punti arrivano dalla spesa e ogni variazione resta registrata.

### 3. 🎟️ Fedeltà a Punti Vera
- **Punti sulla spesa**: quando il conto di un tavolo viene pagato o un asporto viene ritirato, il cliente (se ha la scheda) guadagna i punti secondo la regola del titolare, una sola volta per ordine e con storno se l'asporto viene riaperto.
- **Cassa fedeltà**, premi scelti dal titolare e **tessera digitale** con logo e colori del locale (link privato con QR), aggiungibile alla schermata Home del telefono con il logo come icona. Le pagine Fedeltà e Buoni non sono più schermate di esempio: lavorano sui dati veri del locale.

### 4. 🎁 Buoni Completi, Invio e Stampa
- **Un buono per ogni motivo**: regalo, sconto, compensazione, gesto commerciale, premio punti, compleanno, promozione; valore in euro, percentuale o piatto/servizio in omaggio; scadenza facoltativa, spesa minima, uso in più volte o unico.
- **Cassa con anteprima**, annullo con motivo e movimenti registrati. **Email** (di default, dal servizio Taaaac), **WhatsApp a scelta dell'esercente** (mai in automatico, mai verso i fissi), pagina del buono con QR, **stampa A4 o ricevuta da 80 mm** e ristampa con lo stesso codice.

### 5. 🎂 Compleanno e Premi che Diventano Buoni
- **Buono compleanno automatico**, una volta per cliente e per anno, con email solo a chi ha dato il consenso. Parte quando si apre la pagina Buoni o da `/api/cron/compleanni`.
- **Premio punti → buono**: riscattando un premio si scalano i punti e nasce un buono intestato al cliente, nella stessa operazione.


### 6. 🏠 Dati dell'Attività e Orari in un Solo Posto
- **Un solo posto per ogni dato**: nome, indirizzo, telefono, email, descrizione e orari dell'attività si modificano solo in Impostazioni > Ristorante. La vetrina, lo Studio Aspetto e Google, Facebook e Instagram li leggono da lì: niente più copie diverse tra schede.
- **Orari ufficiali sempre allineati**: il fumetto "Aperto/Chiuso/Apre alle…" di oggi, il piè di pagina e l'invio a Google, Facebook e Instagram usano lo stesso orario giorno per giorno, con i giorni di chiusura. Se cambi il pannello degli orari, la vetrina cambia subito (prima poteva restare il testo vecchio).
- **Turni tavolo e asporto restano separati**: sono usati solo per prenotazioni e ordini e non vengono mai mostrati o inviati come orario dell'attività. Tolti dalla pagina Orari i campi pranzo/cena che non salvavano nulla.
- **Colori e logo solo nell'Aspetto**: non si modificano più anche dalle impostazioni generali. Nello Studio, indirizzo, telefono, email, nome e descrizione sono in sola lettura e nella scheda Sezioni si sceglie cosa mostrare (orari, indirizzo, contatti, telefono, email).


### 🎨 Studio Grafico Buoni Regalo & Biglietti da Visita (Solo Fronte o Fronte/Retro)
- **Dati di biglietti e buoni: ereditati, modificabili solo se vuoi**: nome, recapiti e orari stampati sono sempre quelli di Impostazioni. Nella scheda *5. Dati* dell'editor puoi, su tua scelta esplicita, usare testi diversi solo su biglietti e buoni ("Modifica solo qui") e tornare ai dati di Impostazioni con un clic ("Ripristina"). Nulla di un altro cliente compare più come esempio.
- **Editor Visivo in Tempo Reale**: in *Impostazioni → Biglietti & Buoni* (e direttamente dalla pagina *Buoni*) puoi personalizzare e vedere subito l'anteprima 1:1 del tuo **Biglietto da Visita (85 × 55 mm)** e dei **Buoni Regalo**, con guide dei margini di taglio attivabili.
- **5 Stili + Sfondo Personalizzato**: scegli tra *Botanico & Luxury* (con rami d'ulivo, stelline ✦ e filetti dorati), *Classico Elegante*, *Heritage & Artigianale*, *Moderno & Minimal* o *Sfondo Personalizzato Puro*. Puoi anche caricare una tua immagine/texture di sfondo distinta per Fronte, Retro e Buoni e regolare il **velo di contrasto** per mantenere le scritte sempre nitide.
- **Biglietto da Visita Solo Fronte oppure Fronte + Retro**:
  - **Solo Fronte**: stampa su un solo lato (1 pagina A4 da 10 biglietti), con opzione per mostrare una riga compatta degli orari o il QR di prenotazione direttamente sul fronte.
  - **Fronte + Retro**: fronte con medaglione/logo (mai ritagliato) e recapiti + retro compilato in automatico con gli **orari ufficiali dell'attività**, il QR Code di prenotazione o le righe promemoria prossimo appuntamento (2 pagine A4 a registro con 10 fronti + 10 retri, oppure formato singolo 1:1 per tipografia).
- **Nuovo Cartoncino Regalo per Busta**: oltre a *Stampa A4* e *Ricevuta 80 mm*, i buoni si stampano anche come **Cartoncino Regalo panoramico** da consegnare in busta regalo, coordinato al tema dell'attività.

---

## Novità della Versione 1.1.1 (Patch)

### 1. ✈️ Telegram Gestito da Taaaac Core (Hub Centralizzato)
- **Un solo posto per configurare Telegram**: il pannello Telegram locale è sostituito da una scheda di sola lettura (stato, bot, avvisi attivi) con il link al portale Taaaac, da cui si attiva o disattiva il canale.
- **Nessun token nel modulo**: token del bot e chat ID non vengono più inseriti né salvati nelle impostazioni del modulo, e il test non passa più dal browser.
- **Stato letto dal Core**: la scheda legge `telegram*` da `/api/public/tenant-config` (mai token né chat ID).
- **Avvisi staff tramite il Core**: comande, asporto e prenotazioni vengono inviate a `POST /api/internal/telegram/send` di Taaaac Core; il modulo non conosce più token o chat ID.

---

## Novità della Versione 1.1.0

### 1. 💬 Integrazione WhatsApp a 360° (Smart Link Gratuito & Connessione Taaaac Hub)
- **Floating WhatsApp Widget sulla Vetrina Ristorante**: Pulsante galleggiante WhatsApp ufficiale in basso a destra su tutte le pagine pubbliche (`FloatingWhatsAppWidget`), per consentire ai clienti di richiedere informazioni o concordare menu speciali direttamente dalla landing page.
- **Perfezionamento Grafico Bollino WhatsApp Ufficiale**: integrato il tracciato vettoriale ufficiale Meta WhatsApp (fumetto solido bianco puro `#FFFFFF` ad alta definizione con cornetta verde `#25D366` in risalto), eliminando il vecchio bordo vuoto wireframe e garantendo la massima nitidezza visiva su tutti i dispositivi.
- **Pulsanti 1-Click WhatsApp Svincolati da Moduli a Pagamento**: Nelle schermate Prenotazioni e Asporto, il pulsante WhatsApp è ora sempre attivo e utilizzabile a costo 0 € per inviare conferme, promemoria tavolo e avvisi *"Ordine pronto al banco!"* direttamente via WhatsApp Web o app mobile.
- **Client Standardizzato (`@/lib/whatsapp-client` & `@/lib/whatsapp-server`)**: Connessione al micro-servizio centralizzato di Taaaac Core per le notifiche cloud automatiche.

### 2. 🌐 Hub Sincronizzazione Omnicanale (Google Maps, Meta Facebook & IG, WhatsApp Business)
- **Aggiornamento Turni & Orari All'Unisono con 1 Click**: Dalla scheda *Dashboard > Impostazioni > Turni & Coperti*, il pulsante `🚀 Salva e Sincronizza Turni su Google & Canali` aggiorna simultaneamente gli orari di apertura pranzo/cena sulla scheda Google Business Profile (Maps & Ricerca), sulle Pagine Meta (Facebook & Instagram) e sul profilo WhatsApp Business del ristorante.
- **Badge di Stato Canali in Tempo Reale**: Nuova scheda visiva nella gestione turni con indicatori live dello stato di connessione e sincronizzazione per Google Maps, Meta, WhatsApp Business e Google Review Booster.
- **Architettura Centralizzata Taaaac Core**: Gestione centralizzata e sicura di tutti i token di accesso e delle API dei canali esterni tramite Taaaac Core.

### 3. ⭐ Google Review Booster Automatico via Email (5 Stelle Intelligenti)
- **Email Post-Tavolo & Asporto Automatica a Costo Zero**: Quando una prenotazione del tavolo viene contrassegnata come `COMPLETATA` o un ordine asporto viene segnato come `RITIRATO`, il sistema invia in automatico un'email con 5 stelle interattive da `noreply@taaaac.eu` senza consumare la quota messaggi WhatsApp.
- **Routing Intelligente Reputazione**:
  - **4 e 5 Stelle (Pasto Eccellente)**: Reindirizzano il commensale direttamente alla scheda Google Maps per pubblicare la recensione a 5 stelle verificata.
  - **1, 2 e 3 Stelle (Customer Care)**: Reindirizzano al modulo di feedback privato interno (`/feedback`) permettendo al ristoratore di ascoltare il cliente e risolvere ogni disservizio privatamente.

### 4. 🎨 Showcase Visual Studio WYSIWYG Fedele al 100% & Priorità Assoluta Nome Attività
- **Simulatore Live Mirroring al 100%**: Ridisegnato il pannello di anteprima del Live Studio Vetrina (`ShowcaseVisualStudio`) affinché specchi fedelmente la pagina pubblica reale sia su smartphone che su desktop:
  - Header completo con icona/logo, nome attività e pulsanti di navigazione fedeli.
  - Hero a 2 colonne in modalità desktop con la card turni interattiva in tempo reale (*"Ospitalità & Sala — Tavoli in tempo reale — Aperto Oggi"*).
  - Tutte le sezioni reali renderizzate (Galleria sala & piatti, Esperienze & Momenti della giornata a 4 card, Filosofia dark e callout prenotazione rapida).
- **Nuovo Campo Insegna & Nome Locale nell'Editor**: Aggiunto il campo di configurazione dedicato all'insegna del ristorante nella scheda *Insegna & Copy*, con aggiornamento istantaneo del titolo e dell'header.
- **Risoluzione Sovrascrittura Palette Colori**: Risolto il bug che schiacciava il nome dell'attività con i placeholder fittizi della palette (es. `"Bistrot Botanico Da Taaaac"`): i token colore (`primaryColor`, `accentColor`) sono ora strettamente isolati, garantendo che il vero nome dell'attività configurato dal ristoratore abbia la massima priorità in tutta l'applicazione, nel `<title>` del browser, nella navbar e nei promemoria WhatsApp.

### 6. 🎨 Pulizia Estetica Vetrina & Studio: Navbar Minimale e Hero Pulita
- **Navbar Elegante & Senza Badge Invasivi**: Rimosso il micro-badge fisso "Ristorante & Bar" accanto al nome del locale. Centralizzato il menu su un unico pulsante primario chiaro ("Prenota un Tavolo") e lucchetto discreto, spostando Menù Digitale e Asporto nella barra di navigazione orizzontale come link puliti.
- **Hero Vetrina Minimale Senza Affollamento**: Eliminato il micro-badge slogan sopra l'insegna e rimossi i tre grossi pulsanti CTA duplicati dalla copertina di benvenuto. L'insegna e il claim del locale risaltano con la massima eleganza, guidando l'ospite verso la sezione servizi.
- **Pulsanti di Azione a Fondo Pagina**: Confermato il posizionamento dei pulsanti di prenotazione tavolo e asporto a chiusura della pagina, dove il visitatore conclude naturalmente la navigazione.
- **Allineamento Live Studio Vetrina**: Rimosso il campo badge promozionale dall'editor e sincronizzato il simulatore in tempo reale per rispecchiare fedelmente la nuova veste grafica pulita sia su desktop che su smartphone.

---

## Novità della Versione 1.0.10 (Hotfix / Patch)

### 1. 💬 Pallino WhatsApp Unificato (Attivazione da Taaaac Core)
- **`FloatingWhatsAppWidget` allineato su tutta la flotta**: il pulsante galleggiante compare sulle pagine pubbliche solo se il modulo WhatsApp è attivo nella configurazione del tenant (`/api/public/tenant-config` di Taaaac Core).
- **Nascosto nelle aree gestionali**: non appare in `/dashboard`, `/admin` e `/login`.
- **Risposta del Core normalizzata**: lettura uniforme dei campi del tenant-config.

### 2. ⚙️ Pannelli Telegram/Fidelity Visibili & Salvataggio Istantaneo dei Toggle
- **Auto-save**: in `/dashboard/impostazioni` ogni interruttore salva subito nel database e aggiorna la vista, senza un secondo pulsante "Salva".
- **Pannelli dedicati**: i pannelli Telegram Hub e Fidelity sono ora sempre raggiungibili dalle impostazioni.

### 3. 🍽️ Ristrutturazione Flusso Comande (Cassa, CRM & Cucina)
- **Conto unificato per tavolo** con aggiunte successive, pagamento in cassa e storico completo del cliente.
- ⚠️ **Nota di governance**: è una modifica funzionale ampia (~1.900 righe) finita nel ramo hotfix; è documentata qui per trasparenza e può essere riclassificata come minor su indicazione di Alessio.

### 4. ✈️ Notifiche Telegram allo Staff
- **Invio automatico** di notifiche per comande, asporto e prenotazioni al gruppo staff, con pulsante di salvataggio dedicato.

### 5. 🧭 Navbar Vetrina
- **Tasto Prenota sintetico**, rimozione dei link ridondanti Menu e Asporto, spaziatura aumentata tra Orari & Contatti e Prenota.

### 6. ☁️ Compatibilità Vercel Serverless con SQLite
- **Aggiornamento di `prisma/template.db`**, `outputFileTracingIncludes` e auto-migrazione `ensureDatabase` per l'esecuzione su Vercel.

---

## Novità della Versione 1.0.9 (Hotfix / Patch)

### 1. ✈️ Promemoria Tavoli Gratuiti su Telegram
- **Invito 1-Tocco a Fine Prenotazione**: Al termine della prenotazione del tavolo online, il cliente può attivare con un semplice tocco i promemoria automatici tramite Telegram sul proprio smartphone.
- **Zero Costi & Zero Spam**: Il cliente riceve il promemoria il giorno prima senza alcun costo per il ristorante, in modo comodo e riservato.

### 2. ⏰ Sincronizzazione Notifiche 24 Ore Prima con Taaaac Core
- **Canale Unificato con la Console Centrale**: Predisposto il canale protetto per permettere al motore centrale di Taaaac di recapitare i promemoria dei tavoli all'orario preferito scelto dal ristorante (es. ogni mattina alle 09:00).
- **Trasparenza Totale**: Pieno supporto ai promemoria via Email, Telegram e WhatsApp (con account dell'attività).

### 3. ⏰ Unificazione Orari Ufficiali del Locale & Eliminazione Campi Duplicati
- **Centralizzazione in "Ristorante & Sede"**: Gli orari di apertura ufficiali al pubblico del locale sono ora configurati centralmente nella scheda *Impostazioni > Ristorante & Sede* (Orario Feriale, Orario Weekend, Note di Chiusura).
- **Sincronizzazione Automatica Vetrina Pubblica**: La card in evidenza in alto a destra ("Hero Card") e la sezione inferiore "Turni di Servizio & Orari" ora leggono esattamente dagli stessi orari ufficiali, garantendo perfetta coerenza su tutta la landing page.
- **Pulizia Studio Vetrina**: Rimossi i vecchi campi orari sparsi e duplicati nello Studio Vetrina (sia nella card Hero sia nella tab "Orari & Info"), sostituiti da chiare indicazioni di sincronizzazione automatica.
- **Integrità Turni Interni**: I turni di servizio della sala e le fasce di asporto rimangono indipendenti e dedicati alla gestione operativa della cucina e delle prenotazioni.

### 4. 🗺️ Modulo Flaggabile Pianta & Mappa del Locale
- **Attivazione On/Off nello Studio Vetrina**: Nuovo modulo flaggabile per mostrare o nascondere la mappa interattiva o la piantina del locale direttamente nella sezione *Posizione & Location*.
- **Supporto Iframe & Immagine**: Pieno supporto all'incorporamento con tag `<iframe>` (es. Google Maps / OpenStreetMap) o link diretto a immagini della pianta della sala (.png, .jpg, .webp).
---

### 5. ⏰ Nuovo Modulo Orari Settimanali Personalizzabile (Settimana, Festività, Ferie)
- **Configurazione Giorno per Giorno (Lunedì - Domenica)**: Ogni giorno della settimana dispone ora di un toggle dedicato di apertura/chiusura con selezione della modalità orario (*Orario Continuato* o *Orario Spezzato con Pausa Pranzo/Cena*).
- **Fasce Orarie Dedicate**: Impostazione precisa di inizio e fine servizio per il turno di pranzo e di cena con pulsante di copia rapida per applicare la configurazione a tutti i giorni feriali (Mar-Ven) in un click.
- **Gestione Festività Nazionali Italiane**: Possibilità per il gestore di attivare o disattivare la chiusura automatica nei giorni festivi di calendario (Capodanno, Pasqua, Pasquetta, 25 Aprile, 1 Maggio, Ferragosto, Natale, ecc.), lasciando il locale aperto per i pranzi e le cene di festa secondo le proprie esigenze commerciali.
- **Aperture Straordinarie & Chiusure per Ferie**: Calendario integrato per pianificare date speciali (ferie estive o aperture eccezionali nei giorni di riposo) con orari straordinari dedicati.
- **Sincronizzazione Automatica Totale**: Tutte le modifiche aggiornano all'istante la card informativa della vetrina, il badge in tempo reale ("Aperto Adesso", "In Pausa", "Chiuso per Riposo") e il motore di prenotazione.

### 6. 🍽️ Risoluzione Bug Blocco Prenotazioni & Doppio Turno (Meco)
- **Risolto Allineamento Dati Form**: Corretto l'inoltro dei parametri del cliente (`phoneNumber` e `customerPhone`, `email` e `customerEmail`) nell'azione di prenotazione pubblica, eliminando il blocco validazione *"Numero di telefono non valido"* che impediva il salvataggio.
- **Riconoscimento Automatico Turno & Doppio Turno**: Implementata la generazione e il riconoscimento automatico dei turni di servizio (Pranzo, Cena 1° Turno e Cena 2° Turno) anche in assenza di record pregressi nel database, garantendo la selezione fluida degli orari di arrivo sia per il primo sia per il secondo turno.
- **Verifica Stato Giorno Potenziata**: La verifica del calendario per la data di prenotazione seleziona ora con precisione gli orari del giorno della settimana configurato dal locale, informando tempestivamente il cliente qualora il ristorante sia chiuso per riposo settimanale o ferie.

### 7. 👨‍🍳 Monitor Cucina (KDS): Risoluzione Avanzamento Ordini Asporto & Opzione Annullamento
- **Mapping Automatico Stato Asporto**: Risolto il blocco delle comande da asporto in stato `PRONTO` al pass: il sistema mappa ora automaticamente l'avanzamento su `RITIRATO` per gli ordini takeaway (precedentemente rifiutato con *"Stato ordine non valido"* se associato allo stato tavolo).
- **Pulsante Dedicato al Banco Asporto**: Il pulsante touch di completamento per le comande da asporto mostra ora chiaramente *"Ritirato dal Cliente ✓"* anziché *"Servito al Tavolo ✓"*, garantendo massima chiarezza alla brigata.
- **Pulsante Annullamento / Rimozione dal Pass**: Aggiunta la possibilità per la cucina di rimuovere o annullare direttamente una comanda dal monitor pass in caso di errore con richiesta di conferma immediata.
- **Normalizzazione Automatica Canali Telegram**: La configurazione delle notifiche Telegram Staff supporta ora l'inserimento diretto degli ID gruppo copiati da Telegram Web K (con prefisso `-100` automatico per supergruppi e canali).

### 8. ⚡ Notifiche Telegram Staff Immediate per Comande, Asporto e Prenotazioni
- **Invio Istantaneo al Gruppo dello Staff**: Ogni nuova comanda tavolo inviata dalla sala o dai palmari genera all'istante un messaggio formattato in HTML nel gruppo Telegram del personale con numero tavolo, coperti, cameriere, elenco dettagliato dei piatti con note/varianti e totale stimato.
- **Notifica Ordini Asporto & Takeaway**: All'arrivo di un ordine da asporto (dalla vetrina online o inserito dal banco) il gruppo staff riceve la notifica con nome cliente, telefono, data/ora di ritiro, riepilogo piatti e stato pagamento.
- **Notifica Nuove Prenotazioni Tavolo**: Recapito istantaneo delle prenotazioni ricevute online con nome cliente, recapito telefonico, data, turno/orario e numero coperti.
- **Pulsante di Salvataggio Dedicato nella Scheda Telegram**: Aggiunto il tasto rapido *"Salva Impostazioni Telegram"* con feedback immediato direttamente all'interno della card del pannello impostazioni, consentendo all'esercente di memorizzare le credenziali senza dover risalire in cima alla pagina.

### 9. 🎨 Ottimizzazione Navbar Vetrina: Tasto "Prenota" Diretto & Rimozione Link Ridondanti
- **Pulsante CTA Sintetico "Prenota"**: Il pulsante di azione rapida nella barra in alto mostra ora sinteticamente *"Prenota"* sia su desktop che su smartphone, rendendo la testata del locale ancora più pulita e leggibile.
- **Eliminazione Link Ridondanti (Menù e Asporto)**: Rimossi i link testuali centrali duplicati *"Menù"* e *"Asporto"* dalla barra di navigazione orizzontale in alto, focalizzando l'attenzione dell'utente sulle due sole sezioni chiave di orientamento (*"I Nostri Servizi"* e *"Orari & Contatti"*).
- **Allineamento Live Studio Vetrina**: Aggiornato il simulatore interattivo dello Studio Vetrina per specchiare fedelmente la nuova barra di navigazione minimale.

### 10. 🧾 Ristrutturazione Flusso Comande, Conto Unificato Tavolo in Cassa & Storico Completo Cliente
- **Separazione Stato Cucina e Stato Pagamento Cassa (`DA_PAGARE` / `PAGATO`)**: Le comande al tavolo contrassegnate in cucina come *"Servito al Tavolo"* non spariscono più prima della riscossione in cassa, ma restano agganciate al conto aperto del tavolo fino al saldo effettivo (`POS / Carta` o `Contanti`).
- **Conto Unificato Tavolo (1ª Comanda + Aggiunte Successive)**: Tutte le comande e le aggiunte inviate nel corso del servizio per lo stesso tavolo vengono raggruppate e sommate automaticamente nel pannello **Conto Tavolo & Comande (Cassa)** dentro il dettaglio del tavolo (e mostrate con badge `€ Totale` direttamente sulle card della Mappa Sala, Vista Pocket e Vista Griglia), con possibilità di inviare una nuova **Aggiunta**, stampare il **Preconto Unificato ESC/POS** e incassare l'intero conto con 1 click liberando il tavolo.
- **Tab "Serviti / In Cassa 💳" nel Monitor Cucina KDS**: Aggiunta nel KDS la vista dedicata alle comande già servite al tavolo ma ancora da riscuotere in cassa, con indicazione progressiva (`1ª Comanda`, `➕ Aggiunta #2`), nome del cliente prenotato e pulsanti rapidi di incasso POS/Contanti.
- **Storico Completo del Cliente nel CRM (`Clienti & Ospiti`)**: Ogni scheda ospite raccoglie ora automaticamente lo storico completo delle **Prenotazioni Tavolo**, delle **Comande & Aggiunte consumate** (con stato pagamento e metodo) e degli **Ordini Asporto**, calcolando in tempo reale la **Spesa Storica Totale (€)** del cliente.

---

## Novità della Versione 1.0.8 (Hotfix / Patch)

### 1. 🍽️ Vetrina Ristorante 100% Personalizzabile & Live Studio Completo
- **Pannello Esperienze & Momenti della Giornata nello Studio**: Aggiunta la gestione visuale completa nel Live Studio per creare, ordinare, modificare icone e rimuovere le schede delle esperienze culinarie (*Colazioni, Pranzo di Lavoro, Aperitivo, Cena Gourmet*).
- **Pannello Orari di Servizio, Posizione & Recapiti nello Studio**: Configurazione diretta di tutti i recapiti (telefono/WhatsApp, email, indirizzo bottega, note parcheggio e accessibilità) e degli orari feriali/weekend con note cucina, eliminando ogni testo cablato.
- **Card Live Turni & Invito Prenotazione Editabili**: Possibilità di personalizzare le etichette dei turni (es. *"Cena 18:30 - 23:00"* per pizzerie serali), badge di stato, note sala e testi dei pulsanti di prenotazione.
- **Dinamizzazione Integrale della Pagina Vetrina (`page.tsx`)**: Ogni intestazione (*Posizione & Location*, *Turni di Servizio & Orari*, *Dove Trovarci & Prenotazioni*, nota tempi di risposta) ora riflette fedelmente i dati configurati dall'esercente.

### 2. ⏰ Orari di Servizio Flessibili: Fascia Pranzo Modificabile & Secondo Turno Opzionale
- **Fascia Pranzo 100% Editabile**: Sostituito il vecchio testo fisso con un campo di input personalizzabile per la fascia del pranzo. I locali possono ora inserire liberamente il proprio orario (es. `12:30 - 15:00`), personalizzarlo o lasciarlo vuoto nel caso di attività a sola apertura serale (es. pizzerie).
- **Secondo Turno Cena Opzionale**: Il secondo turno serale è ora esplicitamente opzionale con placeholder chiarificatore; i ristoranti o pizzerie a turno unico possono lasciarlo vuoto senza alcun vincolo o errore di validazione.
- **Persistenza & Sincronizzazione Database**: I turni (primo turno cena, secondo turno, fascia pranzo, tolleranza ritardo e coperti delle sale) vengono ora salvati stabilmente nel database (`LocalSetting`) e ricaricati automaticamente all'apertura del pannello impostazioni.

### 3. 🛵 Sincronizzazione Dinamica Orari Asporto e Vetrina Live
- **Allineamento Automatico Card Live e Asporto**: Quando l'esercente modifica gli orari del takeaway da *Dashboard > Impostazioni > Asporto & Takeaway*, la card orari della vetrina pubblica riflette all'istante la nuova fascia oraria di apertura e chiusura dell'asporto senza rimanere ancorata a valori statici precedenti.
- **Sincronizzazione Bidirezionale**: Il salvataggio delle impostazioni di asporto aggiorna automaticamente anche i parametri di vetrina collegati all'asporto, garantendo una coerenza totale tra form d'ordine, orari del pass cucina e landing page.

### 4. 🔑 Autenticazione Rapida & Biometria Hardware (FIDO2 / WebAuthn)
- **Risoluzione Errore Registrazione Dispositivi Mobili**: Corretta la lettura dei payload crittografici (`clientDataJSON`) nella procedura di registrazione di smartphone e palmari sala, risolvendo il blocco *"Dati di registrazione biometrica mancanti"* e garantendo la piena compatibilità con `@simplewebauthn` su tutti i browser mobile (iOS Safari e Android Chrome).
- **Riconoscimento Multi-Dominio Flessibile**: Riconoscimento dinamico sicuro di `rpID` e `origin` sia su domini personalizzati che su sottodomini `taaaac.eu` con reverse proxy e connessioni cifrate HTTPS.

### 5. 🎯 Unificazione Controllo Visibilità Sezione "Filosofia & La Nostra Cucina"
- **Eliminazione Doppio Flag Ridondante**: Rimosso il selettore toggle duplicato presente nell'intestazione della scheda *La Cucina*, uniformando l'interfaccia a tutte le altre schede tematiche del Live Studio.
- **Pannello "Sezioni" come Unica Sorgente di Verità**: La visibilità pubblica e l'anteprima live della sezione cucina/filosofia sono ora governate in modo univoco e immediato dal checkbox *Filosofia & La Nostra Cucina* nella scheda *Sezioni*, garantendo che l'attivazione o la disattivazione operi all'istante senza conflitti di stato.

---

## Novità della Versione 1.0.7 (Hotfix & Griglia Oraria Calendario)

### 1. 📅 Griglia Oraria e Vista Calendario Interattiva per Prenotazioni (Issue #18)
- **Nuovo Switch a Due Viste**: Possibilità di alternare in un clic tra la classica **Vista Elenco** e la nuova **Griglia Oraria / Calendario**.
- **Vista Giornaliera a Griglia Oraria (Timeline)**:
  - Visualizzazione ad agenda oraria suddivisa per sale (Sala Interna, Dehors, ecc.) e per tavolo.
  - Fasce orarie continue per il servizio pranzo (11:30 - 15:30) e cena (18:30 - 23:30) con slot a 30 minuti.
  - Blocchi prenotazione colorati in base allo stato (In Attesa, Confermata, Accomodati, Completata, Annullata) con indicazione di nome cliente, coperti, orario e note speciali.
  - Spazio dedicato ai **Tavoli da Assegnare** per gestire walk-in e prenotazioni prive di tavolo con assegnazione rapida 1-click.
- **Vista Settimanale (Agenda 7 Giorni)**:
  - Panoramica completa dal lunedì alla domenica con riepilogo coperti e prenotazioni per turno (Pranzo e Cena).
- **Dettaglio & Spostamento Rapido**:
  - Cliccando su qualsiasi blocco prenotazione si apre la scheda di dettaglio rapido con possibilità di modificare orario, numero coperti, tavolo assegnato, stato o inviare messaggio WhatsApp.
  - Cliccando su uno slot o cella vuota della griglia si apre la modale di nuova prenotazione con orario, data e tavolo già preimpostati.
- **Filtri Rapidi**:
  - Filtro per turno di servizio (Tutti i turni, Pranzo, Cena).
  - Filtro per sala (Tutte le sale, Sala Interna, Dehors, ecc.).

### 2. 👨‍🍳 Gestione Organico, Camerieri e Staff di Sala (Issue #16)
- **Anagrafica Completa Collaboratori (CRUD)**: Creazione, modifica e disattivazione di camerieri, capisala/maître, barman, chef, pizzaioli e cassieri con nome, recapiti, avatar colorato e note interne.
- **Assegnazione Sale & Zone di Competenza**: Possibilità di collegare ciascun cameriere a una o più sale (Sala Interna, Dehors, ecc.) per una distribuzione efficiente dei tavoli.
- **Turni di Servizio Abituali**: Gestione rapida della disponibilità per i turni di Pranzo ☀️ e Cena 🌙.
- **PIN Rapido a 4 Cifre**: Accesso e identificazione istantanea per palmari comande sala e monitor cucina KDS senza digitare password complesse.
- **Nuova Sezione in Sidebar**: Voce dedicata "Staff & Camerieri" con statistiche in tempo reale su organico, presenze attive e suddivisione dei reparti.

### 4. 🖨️ Supporto Stampante Termica Comande ESC/POS Cucina & Pizzeria (Issue #22)
- **Protocollo Standard ESC/POS Hardware**: Driver socket TCP nativo Node.js sulla porta standard `9100` compatibile con tutte le stampanti termiche di mercato (Epson, Xprinter, Rongta, Munbyn, Star Micronics) sia a carta 80mm che 58mm.
- **Stampa Automatica all'Invio Ordine**: Opzione per emissione istantanea automatica del ticket termico comanda non appena il cameriere invia l'ordine dal tavolo o quando arriva una comanda d'asporto/takeaway.
- **Ristampa Comanda con 1-Tap**:
  - **Monitor Cucina KDS**: Pulsante stampante su ciascun ticket in lavorazione per consentire alla brigata di cucina di ristampare la comanda cartacea in qualsiasi momento.
  - **Modulo Asporto & Takeaway**: Pulsante dedicato su ogni ordine per stampare lo scontrino da pinzare alla busta o alla scatola della pizza con orario di ritiro e recapito telefonico.
- **Modale Anteprima Termica 80mm**: Finestra di anteprima fedele con font monospazio, taglierina virtuale e fallback `window.print` per tablet, iPad e stampanti collegate via Bluetooth o AirPrint.
- **Pannello Configurazione Dedicato**: Nuova tab "Stampante Termica (ESC/POS)" in Impostazioni con test di stampa in tempo reale, buzzer acustico abilitabile e configurazione IP/Porta di rete.

### 3. 📱 Ottimizzazione Touch, Zoom e Vista "Pocket Cameriere" per la Mappa 2D Tavoli (Issue #14)
- **Supporto Pieno a Touch Drag & Drop**: Spostamento e riposizionamento dei tavoli su iPad e smartphone tramite gesture touch dirette con blocco dello scroll accidentale in modalità modifica.
- **Controlli Zoom & Pan Fluttuanti**: Pulsanti di zoom in/out (+ / -) e reset rapido 100% per esplorare agevolmente sale ampie o tavoli fitti su qualsiasi display.
- **Nuova Vista "Pocket Cameriere"**: Modalità tascabile ultra-veloce progettata per l'uso ad una mano su smartphone da parte del personale di sala:
  - Filtri stato rapidi (Tutti, Liberi, Occupati, Conto, Da Pulire).
  - Stepper coperti a pulsanti spessi a pollice (+ / -).
  - **Barra 1-Tap per Cambio Stato Immediato**: Pulsanti colorati (Libero, Occupato, Conto, Pulisci) direttamente sulla scheda del tavolo per cambiare stato al volo senza aprire finestre di dialogo.
  - Rilevamento automatico schermi mobile con switch intelligente alla vista tascabile.

---


### 5. 🖼️ Vetrina Pubblica Premium con Immagine di Copertina Hero Panoramica
- **Sfondo Fotografico Ristorante d'Autore**: Introduzione di una suggestiva copertina fotografica panoramica ad alta risoluzione raffigurante una sala ristorante elegante con illuminazione calda e mise en place d'atmosfera.
- **Contrasto Visivo & Glassmorphism**: Testi e claim con leggibilità perfetta in bianco puro, badge con effetto smeraldo semitrasparente e card "Ospitalità & Sala" in stile glassmorphism con riflessi e bagliore soft.
- **Piena Personalizzazione dal Live Studio**: Modificabile in tempo reale dal ristoratore tramite il modulo *Aspetto & Brand* in Impostazioni per caricare una fotografia reale della propria location o calibrare l'opacità di scurimento della copertina.

### 6. 🔐 Autenticazione Distinta: Email + Password Titolare & PIN Staff Sala
- **Accesso Titolare Diretto con Email e Password**: Il ristoratore accede inserendo l'indirizzo email e la password ricevuti al momento della registrazione o aggiornati nel proprio account Taaaac, eliminando la richiesta confusa del solo PIN anonimo.
- **PIN Tastierino Touch Dedicato ai Collaboratori**: Il tastierino numerico PIN rapido è ora dedicato esclusivamente ai collaboratori e camerieri di sala/staff presenti nell'organico per sbloccare rapidamente i tablet e le postazioni di comanda.
- **Centralizzazione Sicurezza e MFA su Taaaac Core**: Le impostazioni avanzate di sicurezza (2FA TOTP, codici di recupero, cambio password) sono centralizzate al 100% nella dashboard utente di Taaaac (taaaac.eu/portal), semplificando l'esperienza all'interno del modulo satellite.

---
## Novità della Versione 1.0.6 (Patch di Sicurezza e Hardening Accessi)

### 1. 🛡️ Autenticazione a Due Fattori (2FA / MFA Volontaria con Codici di Emergenza)
- **Supporto TOTP Universale**: Ogni ristoratore o membro dello staff può abilitare liberamente l'autenticazione a due fattori scansionando il QR code con qualsiasi app Authenticator standard (Google Authenticator, Microsoft Authenticator, Apple Passwords, 1Password, Bitwarden).
- **8 Codici di Recupero di Emergenza**: Generazione di codici di backup monouso crittografati nel database, da conservare per accedere qualora lo smartphone non fosse momentaneamente disponibile.
- **Login Dinamico a 2 Step**: Interfaccia di accesso con verifica delle credenziali e passaggio immediato all'inserimento del codice a 6 cifre o di emergenza.

### 2. 📧 Allerta Immediata per Accesso da Nuovo Dispositivo
- **Riconoscimento Automatico Dispositivi**: Rilevamento di browser, sistema operativo e indirizzo IP ad ogni login.
- **Email di Sicurezza Automatica**: Al primo accesso da un nuovo computer o smartphone, il sistema invia un'email di avviso con data, ora, dispositivo e indirizzo IP, per la massima tranquillità del locale.

### 3. 📋 Centro di Controllo Sicurezza, Registro Accessi e Disconnessione Remota
- **Pannello "Sicurezza & 2FA" in Dashboard**: Accessibile direttamente dalla barra laterale della dashboard per verificare i dispositivi registrati e la cronologia degli accessi con esito dettagliato.
- **Disconnessione Remota Globale (Kill-Switch)**: Possibilità di revocare all'istante l'accesso da tutti i dispositivi remoti con un singolo clic.

### 4. 🛑 Protezione Anti Brute-Force e Honey-Pot Anti-Bot
- **Blocco Temporaneo Automatico**: Protezione attiva contro tentativi di indovinare la password o il PIN; dopo 5 tentativi consecutivi errati dall'IP o sull'account, l'accesso viene sospeso per 15 minuti con timer di sblocco in tempo reale.
- **Honey-Pot Silenzioso**: Campo esca invisibile nel modulo di login che respinge all'istante bot automatizzati prima dell'elaborazione.

### 5. 🎄 Motore Festività Nazionali, Chiusure per Ferie & Aperture Straordinarie Ristorante
- **Riconoscimento Festività Italiane**: Il sistema include il calendario delle festività civili e religiose (Natale, Santo Stefano, Capodanno, Befana, Pasqua, Pasquetta, 25 Aprile, 1 Maggio, 2 Giugno, Ferragosto, Ognissanti, 8 Dicembre), con switch rapido in *Dashboard > Orari & Festività*.
- **Aperture Straordinarie per le Feste (es. Pranzo di Natale, Cenone di Capodanno, Pasqua)**: Possibilità di programmare date speciali con orari dedicati (es. Pranzo di Natale con menù fisso) oppure chiusure per ferie dello staff.
- **Notifica di Preavviso in Dashboard (7 Giorni Prima)**: Almeno una settimana prima di una festività o chiusura speciale, la mappa tavoli e la console mostrano un banner di avviso prominente con conto alla rovescia e link rapido 1-click a *Orari* per impostare turni e aperture speciali.
- **Protezione Prenotazioni Online**: Nei giorni festivi di chiusura, le prenotazioni tavoli online vengono automaticamente disattivate evitando overbooking a serrande abbassate.

### 6. 🛑 Blocco Rigoroso Ordini Asporto nel Passato (Date e Fasce Orarie Trascorse)
- **Verifica Fuso Orario Locale (Europe/Rome)**: Allineato il calcolo degli slot disponibili e del tempo minimo di preparazione all'orario esatto del locale, impedendo l'inserimento o l'invio di comande per giorni precedenti o orari già trascorsi sia da vetrina pubblica che da console gestionale.



### 7. 🧭 Riposizionamento e Ottimizzazione Tasti Navbar Vetrina
- **Eliminazione Tasto Duplicato Menù**: Risolta la ridondanza visiva che presentava contemporaneamente due pulsanti menù ('Menù Digitale' a sinistra e 'Menù' a destra).
- **Nuovo Layout Pulsanti Azione**:
  - Il pulsante **Menù Digitale** è stato spostato sul lato destro nel blocco delle azioni principali.
  - Il pulsante **Ordina Asporto** è stato posizionato strategicamente al centro, esattamente tra **Menù Digitale** e **Prenota Ora**, garantendo una navigazione chiara, ordinata e senza duplicati sia da computer che da smartphone.

### 8. 🍽️ Personalizzazione Completa Sezione "Esperienze & Momenti" e "Orari & Contatti" nel Live Studio Vetrina
- **Esperienze & Momenti Dinamici al 100%**: Aggiunta la possibilità per il ristoratore di personalizzare liberamente titolo, descrizione e icona di ciascuna card nella sezione Esperienze della vetrina pubblica (es. Pizzeria con Forno a Legna, Cene d'Autore, Aperitivi al Bancone, Pranzo Rapido) con selettore di icone dedicate (Pizza, Forno/Fiamma, Calice, Posate, Cocktail, Caffè, Stella, Birra, Cuore, Cappello Chef), aggiunta e rimozione di card.
- **Orari di Servizio e Informazioni di Contatto Personalizzabili**: Nuova scheda di configurazione dedicata a orari feriali, orari weekend, apertura cucina, indirizzo reale del locale, note di parcheggio e recapiti WhatsApp/email diretti, eliminando ogni testo predefinito generico.
- **Header Mobile Salva-Spazio**: Ottimizzazione della larghezza dei tasti di azione su smartphone per garantire la perfetta leggibilità del logo e del nome del locale senza tagli o sovrapposizioni.
---

## Novità della Versione 1.0.5 (Hotfix Produzione)

### 1. 📱 Fix Icone PWA per Smartphone (iOS & Android) & Supporto Favicon Personalizzata
- **Risoluzione Icone Vuote o Fallback su Mobile**: Risolto il problema per cui su iPhone e dispositivi Android le icone PWA apparivano come quadrati monocromatici vuoti o lettere di ripiego. iOS Safari richiede rigorosamente formati PNG raster per `apple-touch-icon`, scartando i file vettoriali SVG.
- **Logica Intelligente di Fallback**:
  - Se il cliente/tenant ha caricato un proprio logo o favicon personalizzato nelle impostazioni di brand, la PWA su smartphone adotta automaticamente l'immagine del cliente.
  - Se il cliente non ha configurato una favicon, il sistema inietta l'icona ufficiale nativa in alta risoluzione (Cloche gourmet da portata su Mediterranean Emerald) con formati specifici (`apple-touch-icon.png` a 180x180 per Apple, `icon-192.png`, `icon-512.png` e `icon-maskable-512.png` per Android).
- **Allineamento Universale Manifest**: Serviti contemporaneamente sia `/manifest.json` sia `/manifest.webmanifest` con MIME type standard e categorie W3C PWA valide.

### 2. 🧭 Fix Navigazione Menu Impostazioni su Smartphone & PWA (Risoluzione Schermata Singola)
- **Risoluzione Blocco Prima Pagina**: Risolto il problema per cui su smartphone e display mobile i pulsanti delle impostazioni occupavano il 100% della larghezza orizzontale nascondendo le altre sezioni e impedendo l'accesso alle schede successive (Turni, Email, WhatsApp, Cucina KDS, Asporto, Dispositivi, Aspetto).
- **Nuovo Selettore Nativo Mobile**: Introdotto un menu a tendina rapido nativo su smartphone (< lg) ancorato stabilmente sotto l'header (sticky). Consente di selezionare ed esplorare istantaneamente qualsiasi sezione con 1 tap, sfruttando il picker nativo di iOS e Android. Su desktop la barra di navigazione verticale completa rimane intatta.

### 3. 🔐 Autenticazione Master Qualificata & Accesso Rapido Passkey Biometrica
- **Rimozione Completa Credenziali in Chiaro**: Eliminati tutti i testi e hint con credenziali di default o PIN di test esposti nell'interfaccia di login dei tenant reali.
- **Supporto Password Master & PIN Operatore**: Accesso amministrativo unificato con password master impostata all'attivazione del tenant su Taaaac o PIN operatore, con selettore intuitivo tra inserimento classico (con toggle visibilità) e tastierino numerico touch per palmari e postazioni cassa.
- **Accesso 1-Click su Ambiente Demo (Vercel)**: Nei canali di prova e demo pubblica, pulsante dedicato ad accesso immediato senza digitazione di credenziali.
- **Sblocco Istantaneo con Passkey Biometrica**: Accesso in 1 secondo via impronta digitale, Face ID o PIN nativo del dispositivo (WebAuthn) per i dispositivi registrati in *Impostazioni > Dispositivi PWA*.

### 4. 📲 Guida Rapida per il Cliente: Come Aggiornare l'Icona sul Tuo Smartphone
> **⚠️ Nota Tecnica Importante sulla Cache dei Telefoni:**
> I sistemi operativi mobili (Apple iOS e Android) memorizzano l'icona dell'applicazione nella cache locale permanente al momento del primo salvataggio sulla schermata Home. Pertanto, **le app già aggiunte in precedenza continueranno a mostrare la vecchia icona finché non vengono registrate nuovamente**.

#### 🛠️ Istruzioni Passo-Passo per Sostituire la Vecchia Icona (30 secondi):
1. **Elimina la vecchia icona dalla schermata Home**:
   - Tieni premuto il dito sull'icona attuale dell'app sullo schermo del telefono fino a quando compare il menu a comparsa, quindi tocca **"Rimuovi app"** (oppure **"Elimina dalla schermata Home"**).
2. **Apri il tuo gestionale nel browser**:
   - Apri il browser dello smartphone (**Safari** su iPhone/iPad oppure **Chrome** su Android) e collegati all'indirizzo del tuo sito web.
3. **Aggiungi nuovamente l'app alla schermata Home**:
   - **Su iPhone (iOS / Safari)**: tocca l'icona di condivisione in basso al centro (il quadrato con la freccia verso l'alto ⬆️), scorri il menu verso il basso e tocca **"Aggiungi alla schermata Home"**, quindi conferma con **"Aggiungi"** in alto a destra.
   - **Su Android (Chrome)**: tocca il menu con i tre puntini in alto a destra (⋮), seleziona **"Aggiungi a schermata Home"** (o **"Installa applicazione"**), e conferma con **"Aggiungi"**.
4. **Fatto!** L'icona sulla schermata Home del tuo smartphone sarà ora perfettamente nitida, con la grafica dedicata o con il logo del tuo brand.

---

## Novità della Versione 1.0.5 (Hotfix / Patch)

### 1. 📱 Fix Icone PWA per Smartphone (iOS & Android) & Supporto Favicon Personalizzata
- **Risoluzione Icone Vuote o Fallback su Mobile**: Risolto il problema per cui su iPhone e dispositivi Android le icone PWA apparivano come quadrati monocromatici vuoti o lettere di ripiego. iOS Safari richiede rigorosamente formati PNG raster per `apple-touch-icon`, scartando i file vettoriali SVG.
- **Logica Intelligente di Fallback**:
  - Se il cliente/tenant ha caricato un proprio logo o favicon personalizzato nelle impostazioni di brand, la PWA su smartphone adotta automaticamente l'immagine del cliente.
  - Se il cliente non ha configurato una favicon, il sistema inietta l'icona ufficiale nativa in alta risoluzione (Cloche gourmet da portata su Mediterranean Emerald) con formati specifici (`apple-touch-icon.png` a 180x180 per Apple, `icon-192.png`, `icon-512.png` e `icon-maskable-512.png` per Android).
- **Allineamento Universale Manifest**: Serviti contemporaneamente sia `/manifest.json` sia `/manifest.webmanifest` con MIME type standard e categorie W3C PWA valide.

### 2. 🧭 Fix Navigazione Menu Impostazioni su Smartphone & PWA (Risoluzione Schermata Singola)
- **Risoluzione Blocco Prima Pagina**: Risolto il problema per cui su smartphone e display mobile i pulsanti delle impostazioni occupavano il 100% della larghezza orizzontale nascondendo le altre sezioni e impedendo l'accesso alle schede successive (Turni, Email, WhatsApp, Cucina KDS, Asporto, Dispositivi, Aspetto).
- **Nuovo Selettore Nativo Mobile**: Introdotto un menu a tendina rapido nativo su smartphone (< lg) ancorato stabilmente sotto l'header (sticky). Consente di selezionare ed esplorare istantaneamente qualsiasi sezione con 1 tap, sfruttando il picker nativo di iOS e Android. Su desktop la barra di navigazione verticale completa rimane intatta.

### 3. 🔐 Autenticazione Master Qualificata & Accesso Rapido Passkey Biometrica
- **Rimozione Completa Credenziali in Chiaro**: Eliminati tutti i testi e hint con credenziali di default o PIN di test esposti nell'interfaccia di login dei tenant reali.
- **Supporto Password Master & PIN Operatore**: Accesso amministrativo unificato con password master impostata all'attivazione del tenant su Taaaac o PIN operatore, con selettore intuitivo tra inserimento classico (con toggle visibilità) e tastierino numerico touch per palmari e postazioni cassa.
- **Accesso 1-Click su Ambiente Demo (Vercel)**: Nei canali di prova e demo pubblica, pulsante dedicato ad accesso immediato senza digitazione di credenziali.
- **Sblocco Istantaneo con Passkey Biometrica**: Accesso in 1 secondo via impronta digitale, Face ID o PIN nativo del dispositivo (WebAuthn) per i dispositivi registrati in *Impostazioni > Dispositivi PWA*.

### 4. 📲 Guida Rapida per il Cliente: Come Aggiornare l'Icona sul Tuo Smartphone
> **⚠️ Nota Tecnica Importante sulla Cache dei Telefoni:**
> I sistemi operativi mobili (Apple iOS e Android) memorizzano l'icona dell'applicazione nella cache locale permanente al momento del primo salvataggio sulla schermata Home. Pertanto, **le app già aggiunte in precedenza continueranno a mostrare la vecchia icona finché non vengono registrate nuovamente**.

#### 🛠️ Istruzioni Passo-Passo per Sostituire la Vecchia Icona (30 secondi):
1. **Elimina la vecchia icona dalla schermata Home**:
   - Tieni premuto il dito sull'icona attuale dell'app sullo schermo del telefono fino a quando compare il menu a comparsa, quindi tocca **"Rimuovi app"** (oppure **"Elimina dalla schermata Home"**).
2. **Apri il tuo gestionale nel browser**:
   - Apri il browser dello smartphone (**Safari** su iPhone/iPad oppure **Chrome** su Android) e collegati all'indirizzo del tuo sito web.
3. **Aggiungi nuovamente l'app alla schermata Home**:
   - **Su iPhone (iOS / Safari)**: tocca l'icona di condivisione in basso al centro (il quadrato con la freccia verso l'alto ⬆️), scorri il menu verso il basso e tocca **"Aggiungi alla schermata Home"**, quindi conferma con **"Aggiungi"** in alto a destra.
   - **Su Android (Chrome)**: tocca il menu con i tre puntini in alto a destra (⋮), seleziona **"Aggiungi a schermata Home"** (o **"Installa applicazione"**), e conferma con **"Aggiungi"**.
4. **Fatto!** L'icona sulla schermata Home del tuo smartphone sarà ora perfettamente nitida, con la grafica dedicata o con il logo del tuo brand.

---

---

## Novità della Versione 1.0.4

### 1. 🗺️ Sala & Mappa Tavoli Rimodernata con Editor Stanze
- **Mappa Tavoli Focalizzata e Snella**: Eliminazione del disordine visivo e dei moduli superflui per massimizzare la visibilità della disposizione tavoli, dei percorsi e dello stato occupazione in sala.
- **Gestore ed Editor Stanze/Sale**: Creazione, rinomina ed eliminazione delle sale del ristorante (es. Sala Interna, Dehors, Terrazza, Privé) con gestione sicura e sincronizzata dei tavoli.
- **Controllo Occupazione Touch**: Gestione rapida dello stato dei tavoli (Libero, Occupato, Prenotato, Conto) ottimizzata per tablet di sala e palmari.

### 2. 📅 Gestione Prenotazioni Avanzata con Ricerca & Filtri Temporali
- **Visualizzazione Flessibile**: Consultazione delle prenotazioni del giorno con filtri temporali rapidi per pianificare turni futuri o consultare lo storico passato.
- **Ricerca Live Multicriterio**: Ricerca istantanea per nome cliente, recapito telefonico, codice prenotazione e note speciali (es. allergie, compleanni, seggioloni).

### 3. 🍽️ Menù Digitale, 14 Allergeni UE & Layout Adattivo (Con o Senza Foto)
- **Catalogazione Piatti & Categorie**: Creazione e modifica rapida dei piatti con prezzo, categoria personalizzabile o predefinita, descrizione e switch istantaneo Disponibile/Esaurito.
- **14 Allergeni Ufficiali UE (Reg. 1169/2011)**: Selezione interattiva a chip multi-select di tutti i 14 allergeni ufficiali UE con icone intuitive e legenda informativa.
- **Layout Adattivo Fotografico / Bistrot Gourmet**:
  - *Opzione nelle Impostazioni (Aspetto & Menù QR)* per scegliere se mostrare o nascondere le foto dei piatti.
  - Se attivo: card visive con immagini HD e libreria di preset fotografici rapidi per ogni categoria.
  - Se disattivato: il menù si riadatta istantaneamente su un raffinato layout tipografico stile carta bistrot/alta ristorazione con puntini guida e prezzi allineati, senza spazi vuoti o placeholder.

### 4. 🖨️ Generazione QR Code Stampabile con Logo per Segnatavoli
- **QR Code HD con Brand**: Generazione dinamica con correzione d'errore massima (`H`) e logo/simbolo del locale posizionato al centro.
- **Menù Generale o Segnatavolo Dedicato**: Scelta della destinazione tra Menù Generale (`/menu`) o tavolo specifico (`/menu?tavolo=N`).
- **Cartellino Segnatavolo A6 da Stampare**: Anteprima reale con nome ristorante, numero tavolo e chiamata all'azione, pronto per la stampa da tavolo (`@media print`) o il download in formato PNG ad alta risoluzione.

### 5. 📱 Pagina Pubblica Menù per Smartphone Commensali (`/menu`)
- **Mobile-First per i Clienti al Tavolo**: Ottimizzata per la scansione da smartphone, con navigazione a categorie orizzontale *sticky*, badge del tavolo rilevato e ricerca istantanea.
- **Filtro Esclusione Allergeni**: I clienti con intolleranze o allergie possono filtrare il menù per escludere automaticamente i piatti a rischio.
- **Informativa di Legge**: Sezione di conformità al Regolamento UE 1169/2011 integrata a fondo pagina.

### 6. 🛍️ Rimodernamento Ordini Asporto & Takeaway (Flusso Snello & Anti-Stress)
- **Presa Ordine Rapida in 30 Secondi**: Maschera touch-friendly per banco e telefono con autocompletamento clienti dal CRM, tasti rapidi orari (+15m, +30m, +45m) e selezione istantanea piatti dal Menù Digitale con calcolo automatico totale.
- **Semaforo Saturazione Oraria Cucina**: Visualizzazione in tempo reale del carico ordini per ciascun quarto d'ora con codice colore (verde, giallo, rosso) per evitare sovraccarichi nei momenti di punta.
- **Flusso Operativo a 4 Fasi**: Avanzamento comande a 1-tap (*In Coda*, *In Preparazione*, *Pronto al Banco*, *Ritirato & Saldato*) con orario di ritiro cubitale ad alto contrasto e calcolo urgenza/ritardo.
- **Notifica WhatsApp 1-Click "Ordine Pronto"**: Quando la comanda è pronta al banco, un tap apre WhatsApp con messaggio precompilato elegante per avvisare il cliente ed evitare file all'interno del locale.

### 7. 👥 Gestionale Clienti & CRM Sala Rimodernato
- **Scheda Ospite Potenziata con Tavolo Preferito & Intolleranze**: Anagrafica clienti con memorizzazione del tavolo o zona preferita del locale (es. Vista Giardino, Finestra, Privé) ed evidenziazione critica di intolleranze alimentari e allergeni per la massima sicurezza dello staff di sala.
- **Metriche CRM Istantanee**: Totale ospiti censiti, clienti VIP con badge dedicato, ospiti con intolleranze segnalate e conteggio cene/visite complessive nel locale.
- **Ricerca Live & Filtri Rapidi**: Ricerca in tempo reale per nome, numero telefonico, tavolo preferito, allergie o note; filtri veloci a tab (*Tutti*, *VIP ⭐*, *Con Allergeni ⚠️*, *Ospiti Frequenti 🔥*).
- **Azioni 1-Click per lo Staff**: Invio messaggio WhatsApp personalizzato con saluto e disponibilità tavolo, registrazione rapida passaggio (+1 Cena e punti fedeltà), chiamata diretta con click sul recapito e modal touch con chip rapidi per allergeni frequenti.

### 8. 📱 Ottimizzazione Mobile & Schermi Smartphone ("Zero Fuorilinea")
- **Layout Mobile Dedicato per le Prenotazioni**: Sostituzione della tabella a 7 colonne su smartphone con card native ariose ed ergonomiche, tasti WhatsApp e gestione rapida dello stato spaziati per il tocco touch.
- **Filtri di Servizio a Scorrimento Fluido**: Filtri data (*Oggi, Domani, Future, Storico*) e filtri di stato (*Tutte, In Attesa, Confermate, Accomodati*) ora scorrono fluidamente in orizzontale su singola riga senza spezzarsi o andare a capo in modo disordinato.
- **Mappa Tavoli Mobile-First**: Riconoscimento automatico schermi inferiori a 768px con passaggio intelligente alla vista Grid card pulita (zero collisioni tavolo) e canvas 2D protetto da overflow con scroll orizzontale a proporzioni fisse.

### 9. 📝 Presa Comande Cameriere al Tavolo con Gestione Varianti
- **Registratore Comanda Digitale Touch**: Maschera rapida per il cameriere al tavolo accessibile direttamente dalla Mappa Tavoli e dal dettaglio di ciascun tavolo con selezione rapida coperti e comanda associata.
- **Selezione Piatti dal Menù Digitale**: Navigazione a chip per categoria (*Antipasti, Primi, Secondi, Pizze, Bevande, Dolci*) e ricerca istantanea.
- **Gestione Varianti Rapide & Personalizzate**: Chip veloci per le richieste più frequenti (*Al sangue, Media cottura, Ben cotto, Senza cipolla, Senza formaggio, Gluten Free, Senza lattosio, Salsa a parte, Doppia porzione, Poco sale*) più campo testo libero per qualsiasi nota specifica del commensale.
- **Invio Istantaneo al Pass**: Tasto "Invia in Cucina 🚀" con calcolo totale immediato e occupazione automatica del tavolo sulla planimetria.

### 10. 👨‍🍳 Monitor Cucina KDS (Kitchen Display System) Fast-Food Style
- **Ordine di Arrivo Rigoroso (FIFO)**: Comande di sala e ordini d'asporto visualizzati in ordine di arrivo, ciascuno con numero tavolo cubitale, coperti, cameriere e orario.
- **Timer di Attesa Visivo & Urgenza**: Calcolo automatico dei minuti trascorsi con semaforo cromatico (*Verde <10m*, *Giallo 10-20m*, *Rosso lampeggiante >20m con alert "In Ritardo!"*).
- **Visualizzazione Piatti ad Alto Contrasto**: Quantità ben visibili e varianti evidenziate in ambra ad alto impatto per azzerare gli errori di preparazione dei cuochi.
- **Avanzamento a 1-Tocco Touch**: Pulsanti grandi per la brigata di cucina (*In Preparazione 👨‍🍳*, *Pronto al Pass 🔔*, *Servito al Tavolo ✓*).
- **Suono Avviso Nuovi Ordini (Beep Synth)**: Chime audio a doppia campana integrato sintetico per avvisare la cucina all'arrivo di nuove comande senza necessità di ricaricare la pagina (polling live ogni 4 secondi).
- **Doppia Modalità Schermo**: Accessibile all'interno della dashboard (`/dashboard/cucina`) e in modalità *A Tutto Schermo* (`/cucina`) ideale per smart TV, tablet o monitor fissi a parete al pass.
- **Flag Attivazione nelle Impostazioni**: Attivabile/disattivabile con un toggle nelle Impostazioni di Sala (*Impostazioni > Monitor Cucina KDS*). Quando disattivato, non compare nella sidebar per la massima pulizia del gestionale.

---

## Novità della Versione 1.0.3

### 1. 🖼️ Sistema Brand & Vetrina Adattiva (Zero Deformazioni)
Standardizzazione completa degli asset grafici per il Ristorante / Locale con salvataggio, compressione automatica client-side WebP e proporzioni perfette su qualsiasi dispositivo:
- **Logo Navbar, Header & Ricevute Prenotazione (`logoUrl`)**:
  - **Dimensione consigliata**: `400 × 100 px` (aspect ratio 4:1 o 3:1).
  - **Vincoli & Rendering**: altezza massima bloccata a 80 px con proprietà CSS `object-contain`, assicurando massima nitidezza sia su smartphone che su monitor o tablet di sala senza allungamenti o distorsioni.
  - **Formato raccomandato**: PNG con sfondo trasparente o SVG vettoriale.
- **Favicon Browser Ultra-Visibile (`faviconUrl`)**:
  - **Dimensione consigliata**: `128 × 128 px` o `256 × 256 px` (rapporto 1:1 quadrato).
  - **Resa grafica**: sagoma ad alto contrasto con margine di sicurezza per renderla immediatamente distinguibile a 16×16 px sulla linguetta del browser sia in Dark Mode che in Light Mode. Funge da icona ufficiale per il menù digitale salvato dai clienti su smartphone.
- **Logo Insegna / Banner Principale Hero (`logoHeroUrl` + `mostraLogoInHero`)**:
  - Possibilità di sostituire il testo del nome del ristorante con un'insegna grafica o marchio sopra alla vetrina prenotazioni.
  - **Dimensione consigliata**: `800 × 240 px` (insegna orizzontale) oppure `400 × 400 px` (stemmi gastronomici o loghi tondi).
  - **Adattamento fluido**: auto-scale fino all'85vw su mobile e massimo 480 px su desktop con proporzioni protette. Fallback automatico sul logo navbar in assenza di insegna separata.
- **Immagine Copertina Vetrina (Hero Background) (`fotoHeroUrl`)**:
  - **Dimensione consigliata**: `1920 × 800 px` (panoramica 16:9 / 21:9).
  - **Formato raccomandato**: JPG o WebP compresso (peso massimo 2 MB).
  - **Resa grafica**: sfondo panoramico a tutto schermo della sala o dei piatti arricchito da un filtro overlay sfumato scuro antiriflesso (`bg-gradient-to-t` da nero/60% a nero/30%), per garantire il massimo contrasto per orari, turni di servizio, bottoni di prenotazione e insegna del locale.

### 2. 🏷️ Esperienza 100% White-Label (Nessun Riferimento al Modulo)
- **Titolo scheda browser dinamico (`generateMetadata`)**: visualizzazione esclusiva di `{Nome Ristorante} — {Slogan / Tipologia Cucina}` nella vetrina pubblica e nel menù digitale, eliminando ogni traccia del nome gestionale o piattaforma.
- **Sottopagine con template coerente**: `{Titolo Sezione / Pagina} | {Nome Ristorante}` per un'esperienza totalmente immersiva per i commensali.
- **Footer e interfacce clienti pulite**: rimozione totale di link a piattaforme terze o loghi di sistema. Footer con copyright puro `© 2026 {Nome Ristorante}. Tutti i diritti riservati.`
- **Accesso Staff & Sala**: etichetta neutrale e professionale `"Area Riservata Staff"`.

### 3. 🎨 Motore Colori Brand Dinamici & Caricamento Drag & Drop
- Sincronizzazione in tempo reale del colore Primario e di Accento direttamente applicati su bottoni di selezione turno/coperti, gradienti e badge di stato.
- Pannello impostazioni locale aggiornato con caricamento drag & drop fino a 16 MB con compressione WebP e badge con dimensioni ottimali suggerite.

---

## Novità della Versione 1.0.2

### 1. 🎨 Personalizzazione Brand: Logo Ristorante & Favicon Menù
- Possibilità di caricare il logo del ristorante da *Dashboard > Impostazioni > Aspetto & Brand* con compressione automatica WebP.
- Favicon 128x128 personalizzata applicata alla scheda del browser e visibile durante la consultazione del menù digitale QR da smartphone dei clienti.
- Live preview in tempo reale sia dell'header della vetrina sia della tab del browser.

### 2. ⚙️ Impostazioni Moderne a 2 Colonne (Stile Stripe)
- Riorganizzazione della gestione ristorante con interfaccia pulita a due colonne, icone Lucide e navigazione per sezioni tematiche.
- Configurazione semplificata di turni (pranzo/cena), capienza massima coperti, durata media tavolo e tolleranza ritardo arrivo clienti.

### 3. 📲 Accesso Biometrico PWA & Gestione Dispositivi (WebAuthn)
- Login rapido con impronta digitale / Face ID su tablet comande di sala e smartphone del personale senza digitare password.
- Pannello di controllo dei dispositivi autorizzati con revoca accessi in 1 click.
