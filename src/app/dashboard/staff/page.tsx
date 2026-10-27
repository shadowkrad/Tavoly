import React from "react";
import { prisma } from "@/lib/prisma";
import { getTenantConfig } from "@/lib/taaaac-core";
import { StaffManagementView } from "@/components/dashboard/StaffManagementView";
import { StaffMemberData, AreaItem } from "@/components/dashboard/StaffMemberModal";

export const dynamic = "force-dynamic";

export default async function TavolyStaffPage() {
  const [tenantConfig, rawStaff, rawAreas] = await Promise.all([
    getTenantConfig().catch(() => ({
      theme: { restaurantName: "Tavoly Restaurant" },
    })),
    prisma.staffMember
      .findMany({
        orderBy: [{ isActive: "desc" }, { role: "asc" }, { name: "asc" }],
      })
      .catch((err) => {
        console.error("[Dashboard Staff] Errore caricamento staff:", err);
        return [];
      }),
    prisma.area
      .findMany({
        orderBy: { orderIndex: "asc" },
        select: { id: true, name: true },
      })
      .catch((err) => {
        console.error("[Dashboard Staff] Errore caricamento aree:", err);
        return [];
      }),
  ]);

  const staff: StaffMemberData[] = rawStaff.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    phone: m.phone,
    email: m.email,
    color: m.color,
    pin: m.pin,
    assignedAreas: m.assignedAreas,
    serviceShifts: m.serviceShifts,
    isActive: m.isActive,
    notes: m.notes,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }));

  const areas: AreaItem[] = rawAreas.map((a) => ({
    id: a.id,
    name: a.name,
  }));

  return (
    <StaffManagementView
      initialStaff={staff}
      areas={areas}
      restaurantName={tenantConfig.theme?.restaurantName || "Tavoly Restaurant"}
    />
  );
}
