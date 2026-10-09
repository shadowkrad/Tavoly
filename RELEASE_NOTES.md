# 🍽️ Tavoly — Release Notes

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
