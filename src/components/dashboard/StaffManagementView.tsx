"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  Clock,
  KeyRound,
  Edit3,
  Trash2,
  Check,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Shield,
  ChefHat,
  Filter,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { StaffMemberModal, StaffMemberData, AreaItem, STAFF_ROLES } from "./StaffMemberModal";
import { toggleStaffActiveAction, deleteStaffMemberAction } from "@/app/actions";
import { useRouter } from "next/navigation";

interface StaffManagementViewProps {
  initialStaff: StaffMemberData[];
  areas: AreaItem[];
  restaurantName?: string;
}

export function StaffManagementView({
  initialStaff,
  areas,
  restaurantName = "Tavoly Restaurant",
}: StaffManagementViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [staff, setStaff] = useState<StaffMemberData[]>(initialStaff);
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMemberData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync state with server changes
  React.useEffect(() => {
    setStaff(initialStaff);
  }, [initialStaff]);

  // Area map for quick lookup
  const areaNameMap = useMemo(() => {
    const map = new Map<string, string>();
    areas.forEach((a) => map.set(a.id, a.name));
    return map;
  }, [areas]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staff.filter((m) => {
      // Role filter
      if (selectedRoleFilter !== "ALL") {
        if (selectedRoleFilter === "SALA" && !["CAMERIERE", "CAPOSALA"].includes(m.role)) {
          return false;
        }
        if (selectedRoleFilter === "CUCINA" && !["CUOCO", "PIZZAIOLO"].includes(m.role)) {
          return false;
        }
        if (selectedRoleFilter === "BAR" && m.role !== "BARMAN") {
          return false;
        }
        if (selectedRoleFilter === "CASSA" && m.role !== "CASSIERE") {
          return false;
        }
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = m.name.toLowerCase().includes(q);
        const matchPhone = m.phone ? m.phone.toLowerCase().includes(q) : false;
        const matchRole = m.role.toLowerCase().includes(q);
        const matchNotes = m.notes ? m.notes.toLowerCase().includes(q) : false;
        if (!matchName && !matchPhone && !matchRole && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [staff, selectedRoleFilter, search]);

  // Statistics
  const stats = useMemo(() => {
    const total = staff.length;
    const active = staff.filter((m) => m.isActive).length;
    const salaCount = staff.filter((m) => ["CAMERIERE", "CAPOSALA"].includes(m.role)).length;
    const cucinaCount = staff.filter((m) => ["CUOCO", "PIZZAIOLO"].includes(m.role)).length;
    const barCassaCount = staff.filter((m) => ["BARMAN", "CASSIERE"].includes(m.role)).length;
    return { total, active, salaCount, cucinaCount, barCassaCount };
  }, [staff]);

  const handleToggleActive = (id: string, current: boolean) => {
    startTransition(async () => {
      const res = await toggleStaffActiveAction(id, !current);
      if (res.success) {
        setStaff((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isActive: !current } : m))
        );
        setFeedback({
          type: "success",
          text: `Stato collaboratore aggiornato a: ${!current ? "Attivo" : "Disattivato"}`,
        });
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  };

  const handleDeleteStaff = (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo collaboratore dall'organico?")) {
      return;
    }
    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteStaffMemberAction(id);
      if (res.success) {
        setStaff((prev) => prev.filter((m) => m.id !== id));
        setFeedback({ type: "success", text: "Collaboratore eliminato con successo" });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: "error", text: "Errore durante l'eliminazione" });
      }
      setDeletingId(null);
    });
  };

  const getRoleBadge = (roleId: string) => {
    const roleDef = STAFF_ROLES.find((r) => r.id === roleId);
    if (!roleDef) return { label: roleId, icon: "👤", colorClass: "bg-slate-100 text-slate-700 border-slate-200" };
    switch (roleId) {
      case "CAPOSALA":
        return { label: roleDef.label, icon: roleDef.icon, colorClass: "bg-purple-50 text-purple-700 border-purple-200" };
      case "CAMERIERE":
        return { label: roleDef.label, icon: roleDef.icon, colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "CUOCO":
      case "PIZZAIOLO":
        return { label: roleDef.label, icon: roleDef.icon, colorClass: "bg-amber-50 text-amber-700 border-amber-200" };
      case "BARMAN":
        return { label: roleDef.label, icon: roleDef.icon, colorClass: "bg-sky-50 text-sky-700 border-sky-200" };
      case "CASSIERE":
        return { label: roleDef.label, icon: roleDef.icon, colorClass: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      default:
        return { label: roleDef.label, icon: roleDef.icon, colorClass: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Titolo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Staff & Camerieri di Sala
                <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  {stats.active} Attivi
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Organico di sala e cucina, mansioni, sale di competenza e PIN rapido palmari per {restaurantName}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingStaff(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuovo Membro Staff</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border animate-in fade-in duration-150 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Totale Organico</div>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
            <span>{stats.total}</span>
            <span className="text-xs font-semibold text-slate-500">collaboratori</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Personale di Sala</div>
          <div className="text-2xl font-black text-emerald-700 mt-1 flex items-baseline gap-2">
            <span>{stats.salaCount}</span>
            <span className="text-xs font-semibold text-slate-500">camerieri / maître</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Brigata Cucina & Forno</div>
          <div className="text-2xl font-black text-amber-700 mt-1 flex items-baseline gap-2">
            <span>{stats.cucinaCount}</span>
            <span className="text-xs font-semibold text-slate-500">chef / pizzaioli</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bar & Cassa</div>
          <div className="text-2xl font-black text-sky-700 mt-1 flex items-baseline gap-2">
            <span>{stats.barCassaCount}</span>
            <span className="text-xs font-semibold text-slate-500">barman / cassa</span>
          </div>
        </div>
      </div>

      {/* Toolbar di Ricerca & Filtri */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Cerca */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per nome, telefono, mansione o note..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          {/* Filtro Ruolo Rapido */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedRoleFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedRoleFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tutti ({staff.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter("SALA")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedRoleFilter === "SALA"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Sala ({stats.salaCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter("CUCINA")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedRoleFilter === "CUCINA"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Cucina ({stats.cucinaCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter("BAR")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedRoleFilter === "BAR"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Bar ({staff.filter((m) => m.role === "BARMAN").length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter("CASSA")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedRoleFilter === "CASSA"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Cassa ({staff.filter((m) => m.role === "CASSIERE").length})
            </button>
          </div>
        </div>
      </div>

      {/* Griglia Schede Staff */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Nessun collaboratore trovato</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {search || selectedRoleFilter !== "ALL"
                ? "Nessun membro dello staff corrisponde ai criteri di ricerca impostati."
                : "Non hai ancora registrato il personale di sala e cucina. Clicca sul pulsante sottostante per iniziare."}
            </p>
          </div>
          {!search && selectedRoleFilter === "ALL" && (
            <button
              type="button"
              onClick={() => {
                setEditingStaff(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Aggiungi il Primo Collaboratore</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((member) => {
            const roleBadge = getRoleBadge(member.role);

            // Parse areas
            let memberAreas: string[] = [];
            if (member.assignedAreas) {
              try {
                const parsed = JSON.parse(member.assignedAreas);
                if (Array.isArray(parsed)) {
                  memberAreas = parsed
                    .map((id) => areaNameMap.get(id) || id)
                    .filter(Boolean);
                }
              } catch {}
            }

            // Parse shifts
            let memberShifts: string[] = [];
            if (member.serviceShifts) {
              try {
                const parsed = JSON.parse(member.serviceShifts);
                if (Array.isArray(parsed)) memberShifts = parsed;
              } catch {}
            }

            return (
              <div
                key={member.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-2xs hover:shadow-md flex flex-col justify-between space-y-4 relative overflow-hidden ${
                  member.isActive
                    ? "border-slate-200/90"
                    : "border-slate-200 opacity-60 bg-slate-50/50"
                }`}
              >
                {/* Status Indicator Bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: member.color || "#10b981" }}
                />

                <div className="space-y-3 pt-1">
                  {/* Avatar, Nome e Ruolo */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-xs shrink-0"
                        style={{ backgroundColor: member.color || "#10b981" }}
                      >
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {member.name}
                          </h4>
                          {!member.isActive && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-600">
                              Disattivato
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadge.colorClass}`}
                          >
                            <span>{roleBadge.icon}</span>
                            <span>{roleBadge.label}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* PIN Pill */}
                    <div className="shrink-0">
                      {member.pin ? (
                        <span
                          title="PIN per accesso rapido impostato"
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200"
                        >
                          <KeyRound className="w-3 h-3 text-indigo-600" />
                          <span>PIN: ••••</span>
                        </span>
                      ) : (
                        <span
                          title="PIN rapido non configurato"
                          className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg"
                        >
                          No PIN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Recapiti Phone & Email */}
                  <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-100">
                    {member.phone ? (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono">{member.phone}</span>
                        </span>
                        <a
                          href={`https://wa.me/${member.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                          title="Apri chat WhatsApp con il collaboratore"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">Nessun recapito telefonico</div>
                    )}

                    {member.email && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Sale Assegnate */}
                  <div className="pt-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      Sale & Zone di Competenza
                    </div>
                    {memberAreas.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {memberAreas.map((areaName, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-md"
                          >
                            {areaName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Tutte le sale / Non assegnato</span>
                    )}
                  </div>

                  {/* Turni */}
                  <div className="pt-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Turni di Servizio
                    </div>
                    <div className="flex items-center gap-1.5">
                      {memberShifts.includes("PRANZO") && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                          ☀️ Pranzo
                        </span>
                      )}
                      {memberShifts.includes("CENA") && (
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md">
                          🌙 Cena
                        </span>
                      )}
                      {memberShifts.length === 0 && (
                        <span className="text-[11px] text-slate-400 italic">Tutti i turni</span>
                      )}
                    </div>
                  </div>

                  {/* Note */}
                  {member.notes && (
                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200/60 line-clamp-2">
                      💡 {member.notes}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(member.id, member.isActive)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                      member.isActive
                        ? "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                    }`}
                  >
                    {member.isActive ? "Disattiva" : "Attiva"}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStaff(member);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                      title="Modifica scheda collaboratore"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(member.id)}
                      disabled={deletingId === member.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Elimina collaboratore"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Aggiungi / Modifica Staff */}
      <StaffMemberModal
        isOpen={isModalOpen}
        staffMember={editingStaff}
        areas={areas}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStaff(null);
        }}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
