# 🚀 Tavoly — Release Notes

## Novità della Versione 1.1.0 (In Sviluppo)

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

## Novità della Versione 1.1.0 (In Sviluppo)

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
