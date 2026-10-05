# 🍽️ Tavoly — Release Notes

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
