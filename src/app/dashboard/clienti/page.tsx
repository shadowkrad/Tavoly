import { prisma } from "@/lib/prisma";
import { CustomersManagementView } from "@/components/dashboard/CustomersManagementView";

export const dynamic = "force-dynamic";

export default async function TavolyClientiPage() {
  const [customers, tables, nameSetting] = await Promise.all([
    prisma.customerProfile
      .findMany({
        orderBy: [{ isVip: "desc" }, { visitCount: "desc" }, { lastVisitAt: "desc" }],
      })
      .catch((err) => {
        console.warn("[CRM] Fallback query customerProfile:", err);
        return [];
      }),
    prisma.table
      .findMany({
        include: { area: true },
        orderBy: { number: "asc" },
      })
      .catch((err) => {
        console.warn("[CRM] Fallback query tables:", err);
        return [];
      }),
    prisma.localSetting
      .findUnique({
        where: { key: "restaurant_name" },
      })
      .catch(() => null),
  ]);

  const restaurantName = nameSetting?.value || "Tavoly Restaurant";

  return (
    <div className="space-y-6">
      <CustomersManagementView
        initialCustomers={customers}
        tables={tables}
        restaurantName={restaurantName}
      />
    </div>
  );
}
