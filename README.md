# 🍽️ Tavoly — Taaaac Ecosystem

**Tavoly** è il vertical software indipendente per la gestione smart di sale, tavoli e prenotazioni, parte dell'ecosistema modulare **Taaaac** ideato da **Alessio Guidelli** ([shadowkrad](https://github.com/shadowkrad)).

Lavora in sinergia con la console centrale [Taaaac Core](https://taaaac.eu).

---

## 🚀 Architettura & Stack Tecnologico

- **Framework**: Next.js 15 (App Router, Server Actions, Server Components)
- **UI & Styling**: Tailwind CSS (Taaaac Design System), Lucide React
- **Database**: SQLite isolato per singolo tenant tramite Prisma ORM
- **Integrazione Core**: Consumo runtime dell'endpoint Taaaac Core (`/api/public/tenant-config`)
- **Deployment**:
  - **Vercel**: Anteprime e branch `cliente-demo`.
  - **VPS Aruba**: Container Docker isolati con proxy Traefik SSL (`[subdomain].taaaac.eu`).

---

## 🎨 Taaaac Design System

- **Sfondo Neutro**: `bg-slate-50`
- **Card & Container**: `taaaac-card` (`bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs`)
- **Pulsanti**: `taaaac-btn-primary`, `taaaac-btn-secondary` (`rounded-xl font-semibold transition-all cursor-pointer`)
- **Tema Dinamico**: Iniezione automatica variabili semantiche (`--brand-primary`, `--brand-accent`, ecc.) fornite da Taaaac Core.

---

## 🔗 Integrazione Taaaac Core

All'avvio o durante le richieste, l'applicativo interroga:
```http
GET https://taaaac.eu/api/public/tenant-config?domain=[domain]&token=[token]
```

Dati sincronizzati:
1. **Stato Licenza**: `ATTIVO`, `SOSPESO`, `IN_SCADENZA` (con blocco o banner di allerta).
2. **Moduli Add-on**:
   - `WHATSAPP_REMINDERS` (notifiche e promemoria WhatsApp)
   - `LOYALTY_CARD` (raccolta punti cliente)
   - `VENDOLY_CHANNEL_MANAGER` (sincronizzazione ordini / asporto)
3. **Personalizzazione Tema**: Colori brand, nome locale, logo.

---

## 🛠️ Avvio Locale

1. **Clona e installa le dipendenze**:
   ```bash
   git clone https://github.com/shadowkrad/tavoly.git
   cd tavoly
   npm install
   ```

2. **Configura le variabili d'ambiente**:
   Copia `.env.example` in `.env`:
   ```env
   DATABASE_URL="file:./dev.db"
   TAAAAC_CORE_URL="https://taaaac.eu"
   TAAAAC_DOMAIN="demo.taaaac.eu"
   TAAAAC_TOKEN="demo-secret-token"
   ```

3. **Inizializza e popola il database**:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. **Avvia il server di sviluppo**:
   ```bash
   npm run dev
   ```
   Apri [http://localhost:3000](http://localhost:3000).

---

## 🐳 Deployment Docker (VPS Aruba con Traefik)

```bash
# Imposta il sottodominio del tenant
export SUBDOMAIN="trattoriarossi"
export TAAAAC_TOKEN="token-generato-da-taaaac-core"

# Avvia il container collegato alla rete Traefik
docker-compose up -d --build
```

Il servizio sarà raggiungibile via HTTPS su `https://trattoriarossi.taaaac.eu`.
