// Crea il database della DEMO di Tavoly (prisma/demo.db): parte da prisma/template.db (sale, tavoli, menu, turni),
// aggiunge le tabelle nuove (fedelta' e buoni) e riempie clienti, prenotazioni, ordini, punti e buoni con dati di fantasia.
// Le date sono relative a OGGI (da -45 a +21 giorni): si rigenera quando la demo invecchia.
//
// Uso:  node scripts/crea-demo-db.mjs      (oppure: npm run demo:rigenera)
// REGOLE: prisma/template.db NON si tocca mai. I link di tessere e buoni sono derivati da nomi/codici (sempre uguali),
// cosi' una rigenerazione non rompe i link gia' inviati.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const template = path.join(root, "prisma", "template.db");
const out = path.join(root, "prisma", "demo.db");
const schemaTmp = path.join(root, "prisma", ".schema-demo.prisma");

if (!fs.existsSync(template)) throw new Error("prisma/template.db non trovato");

// 1) Copia del modello + aggiornamento allo schema attuale (tabelle e colonne nuove)
for (const f of [out, `${out}-journal`]) if (fs.existsSync(f)) fs.rmSync(f);
fs.copyFileSync(template, out);
const schema = fs.readFileSync(path.join(root, "prisma", "schema.prisma"), "utf8").replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url      = "file:./demo.db"');
fs.writeFileSync(schemaTmp, schema);
try {
  execSync(`npx prisma db push --schema "${schemaTmp}" --skip-generate --accept-data-loss`, { cwd: root, stdio: "pipe" });
} finally {
  fs.rmSync(schemaTmp, { force: true });
}

const { PrismaClient } = await import("@prisma/client");
const sharp = (await import("sharp")).default;
const prisma = new PrismaClient({ datasources: { db: { url: `file:${out}` } } });

const tokenStabile = (seme) => createHash("sha256").update(`tavoly-demo:${seme}`).digest("base64url").slice(0, 24);

let seed = 20261106;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const oggi = new Date();
const giorno = (offset, ora = 0, min = 0) => new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() + offset, ora, min, 0, 0);
const isoGiorno = (offset) => {
  const d = giorno(offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const nascita = (anni, offsetGiorni) => {
  const t = giorno(offsetGiorni);
  return new Date(Date.UTC(t.getFullYear() - anni, t.getMonth(), t.getDate()));
};

async function main() {
  // ---- Si ripulisce solo cio' che riguarda clienti e ordini: sale, tavoli, menu e turni restano quelli del modello ----
  for (const m of ["movimentoGiftCard", "giftCard", "movimentoPunti", "customerProfile", "takeawayOrder", "tableOrder", "reservation"]) {
    await prisma[m].deleteMany({});
  }

  // ---- Impostazioni locali: nome, logo, colori, fedelta' e compleanno ----
  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><circle cx="200" cy="200" r="190" fill="#064e3b"/><circle cx="200" cy="200" r="165" fill="none" stroke="#ffffff" stroke-width="8"/><text x="200" y="235" text-anchor="middle" font-family="Georgia, serif" font-size="120" fill="#ffffff">RT</text></svg>`;
  const logoDemo = "data:image/png;base64," + (await sharp(Buffer.from(logoSvg)).png().toBuffer()).toString("base64");
  const impostazioni = {
    restaurant_name: "Ristorante Tavoly",
    brand_logo_url: logoDemo,
    color_primary: "#064e3b",
    color_accent: "#059669",
    contact_phone: "0575 000300",
    contact_email: "info@tavoly.taaaac.eu",
    address: "Via dei Mille 8 — Arezzo (AR)",
    fidelity_enabled: "true",
    fidelity_rules: JSON.stringify({
      enabled: true,
      pointsPerEuro: 1,
      welcomeBonusPoints: 10,
      minPointsToRedeem: 50,
      rewardVoucherMonths: 6,
      compleanno: { enabled: true, tipoValore: "SERVIZIO", servizio: "Calice di prosecco e dolce della casa", giorniAnticipo: 7, validitaGiorni: 30, spesaMinima: 25, inviaEmail: true },
      rewards: [
        { id: "rew_1", name: "Dolce della Casa in Omaggio", pointsRequired: 50, rewardType: "FREE_ITEM", freeItemName: "Dolce artigianale a scelta" },
        { id: "rew_2", name: "Sconto 10€ sul Conto", pointsRequired: 100, rewardType: "DISCOUNT", discountAmount: 10 },
        { id: "rew_3", name: "Bottiglia di Vino Riserva", pointsRequired: 200, rewardType: "FREE_ITEM", freeItemName: "Vino selezione della cantina" },
      ],
    }),
  };
  for (const [key, value] of Object.entries(impostazioni)) {
    await prisma.localSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
  }

  // ---- Clienti (numeri finti; alcuni fissi, formati misti, compleanni vicini) ----
  const clienti = [
    ["Laura Ferrari", "3201000101", "laura.ferrari@example.com", nascita(34, 2), "Celiachia (senza glutine)"],
    ["Chiara Conti", "3201000102", "chiara.conti@example.com", nascita(29, 6), null],
    ["Elisa Greco", "3201000103", "elisa.greco@example.com", nascita(41, 12), null],
    ["Francesca Marino", "3201000104", null, nascita(37, 25), "Intolleranza al lattosio"],
    ["Valentina Gallo", "3201000106", null, nascita(26, -3), null],
    ["Giorgia Santoro", "3201000109", "giorgia.santoro@example.com", nascita(31, 40), null],
    ["Paola Rinaldi", "3201000111", "paola.rinaldi@example.com", nascita(52, 90), "Allergia ai crostacei"],
    ["Sofia Ferrara", "3201000113", null, nascita(23, 150), null],
    ["Camilla Leone", "3201000116", null, nascita(28, 200), null],
    ["Teresa Vitale", "3201000120", null, nascita(47, 300), null],
    ["Nadia Bindi", "3201000130", "nadia.bindi@example.com", nascita(39, 1), null],
    ["Marco Bianchi", "3331122334", "marco.bianchi@example.com", nascita(44, 33), null],
    ["Davide Moretti", "3499988776", "d.moretti@example.com", nascita(36, 75), "Vegetariano"],
    ["Federico Galli", "3285544332", "fedegalli@example.com", null, null],
    ["Simone Fabbri", "3201000107", null, null, null],
    ["Andrea Costa", "3201000108", "andrea.costa@example.com", nascita(28, 150), null],
    ["Riccardo Giuliani", "3201000110", null, null, null],
    ["Stefano Marchetti", "3201000112", "stefano.m@example.com", nascita(52, 300), null],
    ["Maria Bartolini", "0575100201", null, nascita(71, 18), null],
    ["Rosa Cecchi", "0575100202", null, nascita(68, 60), null],
    ["Franco Lucherini", "0575100203", null, nascita(75, 5), null],
    ["Mario Pieri", "0575100204", "mario.pieri@example.com", nascita(66, 220), null],
    ["Tommaso Rossetti", "+39 320 100 0121", "tommaso.r@example.com", nascita(27, 130), null],
    ["Filippo Conti", "0039 3201000122", null, null, null],
    ["Daniele Mancini", "320-1000123", "daniele.m@example.com", null, null],
    ["Claudio Ferri", "3201000124", null, null, null],
    ["Alberto Rinaldi", "3201000125", "alberto.r@example.com", nascita(38, 33), null],
    ["Michele Donati", "3201000126", null, null, null],
    ["Enrico Bellini", "3201000127", "enrico.bellini@example.com", nascita(35, 180), null],
    ["Fabio Lombardi", "32010", null, null, null], // numero incompleto: "Da verificare"
  ];
  const creati = [];
  for (const [name, phoneNumber, email, birthDate, allergies] of clienti) {
    creati.push(
      await prisma.customerProfile.create({
        data: {
          name,
          phoneNumber,
          email,
          birthDate,
          allergies,
          isVip: rnd() > 0.9,
          visitCount: 1,
          loyaltyPoints: 0,
          marketingConsent: rnd() > 0.4,
          loyaltyToken: tokenStabile(`tessera:${name}`),
          lastVisitAt: giorno(-60),
        },
      })
    );
  }

  // ---- Prenotazioni (passate e future) ----
  const turni = ["12:30", "13:00", "13:30", "19:30", "20:00", "20:30", "21:00"];
  for (const c of creati) {
    if (rnd() < 0.8) {
      const off = -(1 + Math.floor(rnd() * 40));
      await prisma.reservation.create({
        data: { customerName: c.name, phoneNumber: c.phoneNumber, email: c.email, guestCount: 2 + Math.floor(rnd() * 5), timeSlot: pick(turni), date: giorno(off), status: pick(["COMPLETATA", "COMPLETATA", "COMPLETATA", "ANNULLATA"]) },
      });
    }
    if (rnd() < 0.6) {
      await prisma.reservation.create({
        data: { customerName: c.name, phoneNumber: c.phoneNumber, email: c.email, guestCount: 2 + Math.floor(rnd() * 5), timeSlot: pick(turni), date: giorno(Math.floor(rnd() * 21)), status: "CONFERMATA" },
      });
    }
  }

  // ---- Spesa: conti dei tavoli pagati e asporti ritirati -> punti (come fa il gestionale) ----
  const punti = new Map();
  const visite = new Map();
  const accredita = async (cliente, importo, quando, etichetta, rif) => {
    const p = Math.floor(importo);
    punti.set(cliente.id, (punti.get(cliente.id) || 0) + p);
    visite.set(cliente.id, (visite.get(cliente.id) || 0) + 1);
    await prisma.movimentoPunti.create({
      data: {
        clienteId: cliente.id,
        punti: p,
        tipo: "ACCREDITO",
        origine: "APPUNTAMENTO",
        appuntamentoId: rif,
        importo,
        saldoDopo: punti.get(cliente.id),
        descrizione: `${etichetta} (+${p} pt)`,
        createdAt: quando,
      },
    });
  };
  let n = 0;
  for (const c of creati) {
    const conti = Math.floor(rnd() * 4);
    for (let i = 0; i < conti; i++) {
      const off = -(1 + Math.floor(rnd() * 45));
      const totale = Math.round((25 + rnd() * 90) * 10) / 10;
      const o = await prisma.tableOrder.create({
        data: {
          tableNumber: String(1 + Math.floor(rnd() * 10)),
          coverCount: 2 + Math.floor(rnd() * 4),
          waiterName: pick(["Marco", "Giulia", "Sara"]),
          status: "SERVITO",
          paymentStatus: "PAGATO",
          paymentMethod: pick(["CARTA", "CONTANTI"]),
          paidAt: giorno(off, 22),
          customerName: c.name,
          customerPhone: c.phoneNumber,
          itemsJson: "[]",
          totalAmount: totale,
          createdAt: giorno(off, 20),
        },
      });
      await accredita(c, totale, giorno(off, 22), "Conto tavolo pagato", o.id);
    }
    if (rnd() < 0.5) {
      const off = -(1 + Math.floor(rnd() * 45));
      const totale = Math.round((15 + rnd() * 40) * 10) / 10;
      const t = await prisma.takeawayOrder.create({
        data: {
          customerName: c.name,
          phoneNumber: c.phoneNumber,
          email: c.email,
          pickupDate: isoGiorno(off),
          pickupTime: pick(["19:30", "20:00", "20:30"]),
          itemsSummary: "2x Burger Gourmet, 1x Tagliere Misto",
          totalAmount: totale,
          status: "RITIRATO",
          paymentStatus: "PAGATO",
          createdAt: giorno(off, 17),
        },
      });
      await accredita(c, totale, giorno(off, 21), "Asporto ritirato", t.id);
    }
    n++;
  }
  // qualche asporto di oggi e di domani, ancora da ritirare
  for (let i = 0; i < 3; i++) {
    const c = creati[i];
    await prisma.takeawayOrder.create({
      data: { customerName: c.name, phoneNumber: c.phoneNumber, email: c.email, pickupDate: isoGiorno(i === 2 ? 1 : 0), pickupTime: "20:00", itemsSummary: "1x Spritz, 2x Pizza", totalAmount: 24, status: "IN_CODA", paymentStatus: "DA_PAGARE" },
    });
  }

  // ---- Punti: un premio riscattato per chi ne ha abbastanza; saldo e visite ----
  for (const c of creati) {
    let tot = punti.get(c.id) || 0;
    if (tot >= 120 && rnd() > 0.5) {
      await prisma.movimentoPunti.create({
        data: { clienteId: c.id, punti: 50, tipo: "RISCATTO", origine: "PREMIO", premioId: "rew_1", saldoDopo: tot - 50, descrizione: "Premio: Dolce della Casa in Omaggio", createdAt: giorno(-3) },
      });
      tot -= 50;
    }
    await prisma.customerProfile.update({ where: { id: c.id }, data: { loyaltyPoints: tot, visitCount: Math.max(1, visite.get(c.id) || 1) } });
  }

  // ---- Buoni di esempio ----
  const buoni = [
    ["BUO-DEMO1-REGAL", "REGALO", "IMPORTO", 50, 50, null, null, 120, null, "Giulia Moretti", "Marco Rossi", "Buon compleanno!", null, true, null, "ATTIVA"],
    ["BUO-DEMO2-REGAL", "REGALO", "IMPORTO", 100, 60, null, null, 90, null, "Paola Rinaldi", "Andrea Ferrara", "Una cena speciale per voi", null, true, null, "ATTIVA"],
    ["BUO-DEMO3-COMPE", "COMPENSAZIONE", "IMPORTO", 20, 20, null, null, null, 2, "", "", null, null, false, "Piatto arrivato freddo lo scorso sabato", "ATTIVA"],
    ["BUO-DEMO5-SERVI", "GESTO_COMMERCIALE", "SERVIZIO", 0, 0, null, "Caffè e amaro della casa per due", 60, 7, "", "", null, null, false, "Cliente fedele da 3 anni", "ATTIVA"],
    ["BUO-DEMO6-PUNTI", "PREMIO_PUNTI", "IMPORTO", 10, 10, null, null, 14, 9, "", "", null, null, false, "Premio punti: Sconto 10€ sul conto (100 punti)", "ATTIVA"],
    ["BUO-DEMO7-SCADU", "SCONTO", "PERCENTUALE", 0, 0, 15, null, -10, null, "", "", null, 30, false, "Promozione di ottobre", "ATTIVA"],
    ["BUO-DEMO8-USATO", "REGALO", "IMPORTO", 30, 0, null, null, 200, null, "Anna Neri", "Luca Verdi", null, null, true, null, "RISCATTATA"],
  ];
  for (const [codice, motivo, tipoValore, importo, residuo, percentuale, servizio, giorniScad, idx, acquirente, beneficiario, messaggio, spesaMinima, usoParziale, nota, stato] of buoni) {
    const cl = idx != null ? creati[idx] : null;
    const g = await prisma.giftCard.create({
      data: {
        codice,
        tokenPubblico: tokenStabile(`buono:${codice}`),
        motivo,
        tipoValore,
        importoIniziale: importo,
        saldoResiduo: residuo,
        percentuale,
        descrizioneServizio: servizio,
        clienteId: cl ? cl.id : null,
        spesaMinima,
        usoParziale,
        note: nota,
        acquirenteNome: acquirente,
        beneficiarioNome: beneficiario || (cl ? cl.name : ""),
        beneficiarioMessaggio: messaggio,
        dataScadenza: giorniScad == null ? null : giorno(giorniScad),
        stato,
        creatoDa: "Staff",
      },
    });
    await prisma.movimentoGiftCard.create({
      data: { giftCardId: g.id, tipo: "EMISSIONE", importo, saldoDopo: importo, operatore: "Staff", note: "Emesso", createdAt: giorno(-20) },
    });
    if (tipoValore === "IMPORTO" && residuo < importo) {
      await prisma.movimentoGiftCard.create({
        data: { giftCardId: g.id, tipo: "USO", importo: importo - residuo, saldoDopo: residuo, operatore: "Staff", note: `Sconto di ${(importo - residuo).toFixed(2)} € in cassa`, createdAt: giorno(-8) },
      });
    }
  }

  // ---- Buoni compleanno "automatici" gia' creati per chi compie gli anni nei prossimi 7 giorni ----
  // (nella demo ogni copia del database e' separata: creandoli qui restano uguali ovunque e l'automatismo non crea doppioni)
  for (const c of creati) {
    if (!c.birthDate) continue;
    const inizioOggi = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
    let comp = new Date(oggi.getFullYear(), c.birthDate.getUTCMonth(), c.birthDate.getUTCDate());
    if (comp < inizioOggi) comp = new Date(oggi.getFullYear() + 1, c.birthDate.getUTCMonth(), c.birthDate.getUTCDate());
    if (comp > new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() + 7)) continue;
    const codice = `BUO-COMP-${c.name.slice(0, 3).toUpperCase()}${comp.getFullYear()}`;
    const g = await prisma.giftCard.create({
      data: {
        codice,
        tokenPubblico: tokenStabile(`buono:${codice}`),
        motivo: "COMPLEANNO",
        tipoValore: "SERVIZIO",
        importoIniziale: 0,
        saldoResiduo: 0,
        descrizioneServizio: "Calice di prosecco e dolce della casa",
        clienteId: c.id,
        spesaMinima: 25,
        usoParziale: false,
        note: `Buono compleanno ${comp.getFullYear()} (automatico)`,
        acquirenteNome: "Attività",
        beneficiarioNome: c.name,
        dataScadenza: new Date(comp.getTime() + 30 * 86400000),
        stato: "ATTIVA",
        creatoDa: "Automatico",
      },
    });
    await prisma.movimentoGiftCard.create({
      data: { giftCardId: g.id, tipo: "EMISSIONE", importo: 0, saldoDopo: 0, operatore: "Automatico", note: "Emesso: Buono compleanno", createdAt: giorno(-1) },
    });
    if (c.email && c.marketingConsent) {
      await prisma.movimentoGiftCard.create({
        data: { giftCardId: g.id, tipo: "INVIO", importo: 0, saldoDopo: 0, operatore: "Automatico", note: `Email simulata (demo) a ${c.email}`, createdAt: giorno(-1) },
      });
    }
  }

  const [nc, nr, no, nm] = await Promise.all([prisma.customerProfile.count(), prisma.reservation.count(), prisma.tableOrder.count(), prisma.movimentoPunti.count()]);
  console.log(`Demo creata: ${out}`);
  console.log(`Clienti ${nc} | Prenotazioni ${nr} | Conti tavolo ${no} | Movimenti punti ${nm}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
