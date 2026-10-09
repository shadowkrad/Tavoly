"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  Users,
  Phone,
  Search,
  Plus,
  Check,
  X,
  MessageSquare,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserCheck,
  Award,
  ExternalLink,
  Trash2,
  MapPin,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  updateReservationStatus,
  assignTableToReservationAction,
  deleteReservationAction,
} from "@/app/actions";
import { NewReservationModal } from "@/components/NewReservationModal";
import { CustomerProfileModal } from "./CustomerProfileModal";
import { CustomerProfileMapItem } from "@/components/ReservationsList";
import {
  generateWhatsAppLink,
  buildConfirmationMessage,
  buildReminderMessage,
} from "@/lib/whatsapp";

export interface BookingTableOption {
  id: string;
  number: string;
  capacity: number;
  areaName: string;
  status: string;
}

export interface BookingItem {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string | null;
  guestCount: number;
  timeSlot: string;
  date: string | Date;
  status: string;
  notes: string | null;
  whatsappSent: boolean;
  isWalkIn?: boolean;
  tableId: string | null;
  table: {
    id: string;
    number: string;
    capacity: number;
    area: {
      id: string;
      name: string;
    };
  } | null;
}

interface BookingsManagementViewProps {
  initialReservations: BookingItem[];
  tables: BookingTableOption[];
  customerProfiles: Record<string, CustomerProfileMapItem>;
  restaurantName: string;
  hasWhatsAppModule: boolean;
}

type DateMode = "TODAY" | "TOMORROW" | "FUTURE" | "PAST" | "SPECIFIC" | "ALL";

const STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; bg: string; text: string }
> = {
  IN_ATTESA: {
    label: "In Attesa",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    bg: "bg-amber-500",
    text: "text-amber-800",
  },
  CONFERMATA: {
    label: "Confermata",
    badge: "bg-blue-50 text-blue-800 border-blue-200",
    bg: "bg-blue-600",
    text: "text-blue-800",
  },
  SEDUTI: {
    label: "Accomodati",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    bg: "bg-emerald-600",
    text: "text-emerald-800",
  },
  COMPLETATA: {
    label: "Completata",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    bg: "bg-slate-500",
    text: "text-slate-700",
  },
  ANNULLATA: {
    label: "Annullata",
    badge: "bg-rose-50 text-rose-800 border-rose-200",
    bg: "bg-rose-600",
    text: "text-rose-800",
  },
};

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function BookingsManagementView({
  initialReservations,
  tables,
  customerProfiles,
  restaurantName,
  hasWhatsAppModule,
}: BookingsManagementViewProps) {
  const [isPending, startTransition] = useTransition();

  // Data odierna in formato YYYY-MM-DD
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatLocalDate(d);
  }, []);

  // Stati di filtro data
  const [dateMode, setDateMode] = useState<DateMode>("TODAY");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Ricerca testuale & Stato
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [forceGlobalSearch, setForceGlobalSearch] = useState(false);

  // Modali
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [activeCustomerModal, setActiveCustomerModal] = useState<{
    profile: CustomerProfileMapItem;
    reservation: { timeSlot: string; guestCount: number; tableNumber?: string };
  } | null>(null);

  // Modal assegnazione tavolo
  const [assigningReservation, setAssigningReservation] = useState<BookingItem | null>(null);
  const [selectedTableForAssign, setSelectedTableForAssign] = useState<string>("");

  // Normalizza la data di una prenotazione a stringa YYYY-MM-DD
  const getReservationDateStr = (dateVal: string | Date): string => {
    if (!dateVal) return todayStr;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return todayStr;
    return formatLocalDate(d);
  };

  // Navigazione giorno per giorno
  const handleShiftDay = (delta: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + delta);
    const newStr = formatLocalDate(current);
    setSelectedDate(newStr);
    setDateMode(newStr === todayStr ? "TODAY" : newStr === tomorrowStr ? "TOMORROW" : "SPECIFIC");
  };

  const handleSelectDateMode = (mode: DateMode) => {
    setDateMode(mode);
    setForceGlobalSearch(false);
    if (mode === "TODAY") {
      setSelectedDate(todayStr);
    } else if (mode === "TOMORROW") {
      setSelectedDate(tomorrowStr);
    }
  };

  // Filtraggio intelligente delle prenotazioni
  const filteredReservations = useMemo(() => {
    return initialReservations.filter((r) => {
      const resDateStr = getReservationDateStr(r.date);

      // Se c'è una ricerca con override globale attivo, saltiamo il filtro data
      const isSearchingGlobal = Boolean(searchQuery.trim() && forceGlobalSearch);

      if (!isSearchingGlobal) {
        if (dateMode === "TODAY") {
          if (resDateStr !== todayStr) return false;
        } else if (dateMode === "TOMORROW") {
          if (resDateStr !== tomorrowStr) return false;
        } else if (dateMode === "FUTURE") {
          if (resDateStr <= todayStr) return false;
        } else if (dateMode === "PAST") {
          if (resDateStr >= todayStr) return false;
        } else if (dateMode === "SPECIFIC") {
          if (resDateStr !== selectedDate) return false;
        }
        // "ALL": nessun filtro di data
      }

      // Filtro per stato
      if (statusFilter !== "ALL" && r.status !== statusFilter) {
        return false;
      }

      // Filtro per ricerca testuale
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = r.customerName.toLowerCase().includes(q);
        const matchPhone = r.phoneNumber.toLowerCase().includes(q);
        const matchNotes = r.notes ? r.notes.toLowerCase().includes(q) : false;
        const matchTable = r.table ? r.table.number.toLowerCase().includes(q) : false;
        const matchArea = r.table?.area ? r.table.area.name.toLowerCase().includes(q) : false;

        if (!matchName && !matchPhone && !matchNotes && !matchTable && !matchArea) {
          return false;
        }
      }

      return true;
    });
  }, [
    initialReservations,
    dateMode,
    selectedDate,
    todayStr,
    tomorrowStr,
    statusFilter,
    searchQuery,
    forceGlobalSearch,
  ]);

  // Metriche per la vista corrente
  const totalGuests = useMemo(() => {
    return filteredReservations
      .filter((r) => r.status !== "ANNULLATA")
      .reduce((sum, r) => sum + r.guestCount, 0);
  }, [filteredReservations]);

  const activeCount = useMemo(() => {
    return filteredReservations.filter((r) => r.status !== "ANNULLATA" && r.status !== "COMPLETATA")
      .length;
  }, [filteredReservations]);

  const seatedCount = useMemo(() => {
    return filteredReservations.filter((r) => r.status === "SEDUTI").length;
  }, [filteredReservations]);

  const pendingCount = useMemo(() => {
    return filteredReservations.filter((r) => r.status === "IN_ATTESA").length;
  }, [filteredReservations]);

  // Conteggi per i tab degli stati
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: 0, IN_ATTESA: 0, CONFERMATA: 0, SEDUTI: 0, COMPLETATA: 0, ANNULLATA: 0 };
    filteredReservations.forEach((r) => {
      counts.ALL++;
      if (counts[r.status] !== undefined) counts[r.status]++;
    });
    return counts;
  }, [filteredReservations]);

  // Handlers azioni
  const handleStatusChange = (id: string, newStatus: string) => {
    startTransition(async () => {
      await updateReservationStatus(id, newStatus);
    });
  };

  const handleOpenAssignModal = (reservation: BookingItem) => {
    setAssigningReservation(reservation);
    setSelectedTableForAssign(reservation.tableId || "");
  };

  const handleSaveTableAssignment = () => {
    if (!assigningReservation) return;
    startTransition(async () => {
      await assignTableToReservationAction(
        assigningReservation.id,
        selectedTableForAssign === "" ? null : selectedTableForAssign
      );
      setAssigningReservation(null);
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Sei sicuro di voler eliminare la prenotazione di ${name}?`)) return;
    startTransition(async () => {
      await deleteReservationAction(id);
    });
  };

  const handleOpenCustomer = (r: BookingItem) => {
    const existing = customerProfiles[r.phoneNumber] || {
      phoneNumber: r.phoneNumber,
      name: r.customerName,
      notes: r.notes,
      visitCount: 1,
      loyaltyPoints: 10,
    };
    setActiveCustomerModal({
      profile: existing,
      reservation: {
        timeSlot: r.timeSlot,
        guestCount: r.guestCount,
        tableNumber: r.table?.number,
      },
    });
  };

  // Formatta la data visualizzata in italiano
  const currentFormattedDate = useMemo(() => {
    const d = new Date(selectedDate);
    if (isNaN(d.getTime())) return selectedDate;
    return d.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  return (
    <div className="space-y-5">
      {/* HEADER DELLA PAGINA CON AZIONI RAPIDE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <CalendarDays className="w-5 h-5 text-emerald-600" />
            </div>
            <span>Registro Prenotazioni Tavoli</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Gestione servizio odierno, pianificazione turni futuri e consultazione storico clienti
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          className="taaaac-btn-primary text-xs px-4 py-2.5 flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuova Prenotazione</span>
        </button>
      </div>

      {/* METRIC PILL CARDS DINAMICHE */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 leading-tight">
              {filteredReservations.length}
            </div>
            <div className="text-[11px] font-semibold text-slate-500">Prenotazioni</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 leading-tight">{totalGuests}</div>
            <div className="text-[11px] font-semibold text-slate-500">Coperti Totali</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-amber-700 leading-tight">{pendingCount}</div>
            <div className="text-[11px] font-semibold text-slate-500">Da Confermare</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-emerald-700 leading-tight">{seatedCount}</div>
            <div className="text-[11px] font-semibold text-slate-500">Accomodati</div>
          </div>
        </div>
      </div>

      {/* SEZIONE FILTRI: TEMPORALE (DATA) & RICERCA */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        {/* Riga 1: Selettore Temporale (Oggi, Domani, Future, Passate, Tutte) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Quick Date Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => handleSelectDateMode("TODAY")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateMode === "TODAY" && !forceGlobalSearch
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              ☀️ Oggi
            </button>
            <button
              type="button"
              onClick={() => handleSelectDateMode("TOMORROW")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateMode === "TOMORROW" && !forceGlobalSearch
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              🌅 Domani
            </button>
            <button
              type="button"
              onClick={() => handleSelectDateMode("FUTURE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateMode === "FUTURE" && !forceGlobalSearch
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              🔮 Future
            </button>
            <button
              type="button"
              onClick={() => handleSelectDateMode("PAST")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateMode === "PAST" && !forceGlobalSearch
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              📜 Storico Passate
            </button>
            <button
              type="button"
              onClick={() => handleSelectDateMode("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateMode === "ALL" || forceGlobalSearch
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              📁 Tutte le Date
            </button>
          </div>

          {/* Date Picker Puntuale + Navigatore Giorno */}
          <div className="flex items-center gap-1.5 self-start lg:self-center">
            <button
              type="button"
              onClick={() => handleShiftDay(-1)}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Giorno precedente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDateMode("SPECIFIC");
                  setForceGlobalSearch(false);
                }}
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => handleShiftDay(1)}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Giorno successivo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {selectedDate !== todayStr && (
              <button
                type="button"
                onClick={() => handleSelectDateMode("TODAY")}
                className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                Torna ad Oggi
              </button>
            )}
          </div>
        </div>

        {/* Riga 2: Ricerca Globale & Filtri di Stato */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Barra di Ricerca */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca per cliente, telefono, note (es. celiaco, bimbo) o tavolo..."
              className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 border border-slate-200/90 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle Ricerca Globale se l'utente sta cercando */}
          {searchQuery.trim() && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setForceGlobalSearch(!forceGlobalSearch)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  forceGlobalSearch
                    ? "bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>
                  {forceGlobalSearch ? "Ricerca in Tutte le Date Attiva" : "Cerca in Tutto lo Storico"}
                </span>
              </button>
            </div>
          )}

          {/* Filtri Stato */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: "Tutte" },
              { id: "IN_ATTESA", label: "In Attesa" },
              { id: "CONFERMATA", label: "Confermate" },
              { id: "SEDUTI", label: "Accomodati" },
              { id: "COMPLETATA", label: "Completate" },
              { id: "ANNULLATA", label: "Annullate" },
            ].map((f) => {
              const count = statusCounts[f.id] || 0;
              const isSelected = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-slate-800 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Indicatore Data Attuale in Consultazione */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              {forceGlobalSearch
                ? "Ricerca globale in tutto lo storico e prenotazioni future"
                : dateMode === "TODAY"
                ? `Visualizzando il servizio di Oggi (${currentFormattedDate})`
                : dateMode === "TOMORROW"
                ? `Visualizzando il servizio di Domani (${currentFormattedDate})`
                : dateMode === "FUTURE"
                ? "Visualizzando tutte le prenotazioni future"
                : dateMode === "PAST"
                ? "Visualizzando lo storico prenotazioni passate"
                : dateMode === "ALL"
                ? "Visualizzando tutte le prenotazioni dell'archivio"
                : `Data selezionata: ${currentFormattedDate}`}
            </span>
          </div>
          <span className="font-semibold text-slate-700">
            {filteredReservations.length} prenotazioni trovate
          </span>
        </div>
      </div>

      {/* TABELLA PRENOTAZIONI COMPLETA & PROFESSIONALE */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
              <tr>
                <th className="p-4">Orario / Data</th>
                <th className="p-4">Cliente & Recapito</th>
                <th className="p-4">Coperti</th>
                <th className="p-4">Tavolo & Sala</th>
                <th className="p-4">Note Speciali</th>
                <th className="p-4">Stato</th>
                <th className="p-4 text-right">Azioni Rapide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 px-4">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <CalendarDays className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-slate-800 text-sm">
                        Nessuna prenotazione trovata
                      </div>
                      <p className="text-xs text-slate-500">
                        {searchQuery.trim()
                          ? `Nessuna prenotazione corrisponde alla ricerca "${searchQuery}". Prova a cliccare su "Cerca in Tutto lo Storico".`
                          : "Non ci sono prenotazioni registrate per i filtri temporali selezionati."}
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsNewModalOpen(true)}
                        className="taaaac-btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Aggiungi Prenotazione</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReservations.map((r) => {
                  const statusConf = STATUS_CONFIG[r.status] || STATUS_CONFIG.CONFERMATA;
                  const resDate = new Date(r.date);
                  const isMultiDateView =
                    dateMode === "FUTURE" ||
                    dateMode === "PAST" ||
                    dateMode === "ALL" ||
                    forceGlobalSearch;

                  const customerProfile = customerProfiles[r.phoneNumber];
                  const hasHistory = Boolean(customerProfile && customerProfile.visitCount > 1);

                  // WhatsApp Links
                  const confirmMsg = buildConfirmationMessage(
                    restaurantName,
                    r.customerName,
                    resDate.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }),
                    r.timeSlot,
                    r.guestCount
                  );
                  const waConfirmUrl = generateWhatsAppLink(r.phoneNumber, confirmMsg);

                  const reminderMsg = buildReminderMessage(
                    restaurantName,
                    r.customerName,
                    r.timeSlot,
                    r.guestCount
                  );
                  const waReminderUrl = generateWhatsAppLink(r.phoneNumber, reminderMsg);

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        r.status === "SEDUTI" ? "bg-emerald-50/20" : ""
                      }`}
                    >
                      {/* Colonna 1: Orario & Data */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-mono text-sm font-black text-slate-900 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{r.timeSlot}</span>
                        </div>
                        {isMultiDateView && (
                          <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                            {resDate.toLocaleDateString("it-IT", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </div>
                        )}
                        {r.isWalkIn && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded mt-1 inline-block">
                            Walk-In
                          </span>
                        )}
                      </td>

                      {/* Colonna 2: Cliente & Recapito */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {r.customerName}
                          </span>
                          {hasHistory && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center gap-0.5"
                              title={`Cliente fedele: ${customerProfile.visitCount} visite`}
                            >
                              <Award className="w-2.5 h-2.5" />
                              <span>{customerProfile.visitCount}v</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                          <a
                            href={`tel:${r.phoneNumber}`}
                            className="font-mono hover:text-emerald-700 flex items-center gap-1 transition-colors"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{r.phoneNumber}</span>
                          </a>

                          {hasWhatsAppModule && r.phoneNumber && (
                            <a
                              href={waConfirmUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded hover:bg-emerald-50 transition-colors"
                              title="Invia messaggio WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {r.email && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                            {r.email}
                          </div>
                        )}
                      </td>

                      {/* Colonna 3: Coperti / Ospiti */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {r.guestCount} {r.guestCount === 1 ? "persona" : "persone"}
                          </span>
                        </div>
                      </td>

                      {/* Colonna 4: Tavolo & Sala */}
                      <td className="p-4 whitespace-nowrap">
                        {r.table ? (
                          <div className="space-y-0.5">
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(r)}
                              className="font-bold text-xs text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                              title="Clicca per cambiare tavolo"
                            >
                              <span>Tavolo {r.table.number}</span>
                              <span className="text-[10px] text-slate-400">
                                ({r.table.capacity}p)
                              </span>
                            </button>
                            <span className="text-[11px] font-medium text-slate-500 block">
                              {r.table.area?.name || "Sala"}
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(r)}
                            className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            <span>Assegna Tavolo</span>
                          </button>
                        )}
                      </td>

                      {/* Colonna 5: Note Speciali */}
                      <td className="p-4 max-w-xs">
                        {r.notes ? (
                          <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200/60 font-medium">
                            {r.notes}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Colonna 6: Stato Prenotazione con Selector Rapido */}
                      <td className="p-4 whitespace-nowrap">
                        <select
                          value={r.status}
                          disabled={isPending}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${statusConf.badge}`}
                        >
                          <option value="IN_ATTESA">In Attesa</option>
                          <option value="CONFERMATA">Confermata</option>
                          <option value="SEDUTI">Accomodati</option>
                          <option value="COMPLETATA">Completata</option>
                          <option value="ANNULLATA">Annullata</option>
                        </select>
                      </td>

                      {/* Colonna 7: Azioni Rapide */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Accomoda al tavolo rapido */}
                          {r.status !== "SEDUTI" && r.status !== "COMPLETATA" && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(r.id, "SEDUTI")}
                              disabled={isPending}
                              className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                              title="Accomoda clienti al tavolo"
                            >
                              Accomoda
                            </button>
                          )}

                          {/* Scheda Cliente CRM */}
                          <button
                            type="button"
                            onClick={() => handleOpenCustomer(r)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            title="Visualizza Scheda Cliente & Punti"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>

                          {/* WhatsApp Reminder Rapido */}
                          {hasWhatsAppModule && r.phoneNumber && (
                            <a
                              href={waReminderUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors"
                              title="Invia Promemoria WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          )}

                          {/* Elimina */}
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id, r.customerName)}
                            disabled={isPending}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                            title="Elimina prenotazione"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALE ASSEGNAZIONE / CAMBIO TAVOLO */}
      {assigningReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Assegna Tavolo a {assigningReservation.customerName}
                </h3>
                <p className="text-xs text-slate-500">
                  {assigningReservation.guestCount} coperti alle ore {assigningReservation.timeSlot}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningReservation(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Seleziona Tavolo Disponibile
              </label>

              <select
                value={selectedTableForAssign}
                onChange={(e) => setSelectedTableForAssign(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="">— Nessun Tavolo Assegnato —</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Tavolo {t.number} ({t.areaName}) — {t.capacity} posti [{t.status}]
                  </option>
                ))}
              </select>

              <p className="text-[11px] text-slate-500">
                Puoi cambiare o rimuovere il tavolo in qualsiasi momento. Se i clienti sono già seduti, il tavolo verrà occupato automaticamente.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssigningReservation(null)}
                className="taaaac-btn-secondary text-xs px-4 py-2"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSaveTableAssignment}
                disabled={isPending}
                className="taaaac-btn-primary text-xs px-5 py-2 disabled:opacity-50"
              >
                {isPending ? "Salvataggio..." : "Salva Assegnazione"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUOVA PRENOTAZIONE */}
      <NewReservationModal
        tables={tables}
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        showTrigger={false}
      />

      {/* MODAL SCHEDA CLIENTE */}
      {activeCustomerModal && (
        <CustomerProfileModal
          customer={activeCustomerModal.profile}
          currentReservation={activeCustomerModal.reservation}
          restaurantName={restaurantName}
          onClose={() => setActiveCustomerModal(null)}
        />
      )}
    </div>
  );
}
