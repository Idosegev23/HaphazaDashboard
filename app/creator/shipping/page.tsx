import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShipmentCard } from "@/components/creator/ShipmentCard";
import { AddressCard } from "@/components/creator/AddressCard";

export default async function CreatorShippingPage() {
  const user = await getUser();

  if (!user || user.role !== "creator") {
    redirect("/");
  }

  const supabase = await createClient();

  // Get shipment requests
  const { data: shipmentRequests } = await supabase
    .from("shipment_requests")
    .select("*, campaigns(title, brands(name)), shipments(*)")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  // Get addresses
  const { data: addresses } = await supabase
    .from("shipment_addresses")
    .select("*")
    .eq("creator_id", user.id)
    .order("is_default", { ascending: false });

  const primaryAddress = addresses?.[0];

  return (
    <div className="flex justify-center w-full px-4 py-6 lg:px-8">
        <div className="flex flex-col max-w-[1024px] flex-1 w-full gap-8">
          {/* Page Heading */}
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-black leading-tight tracking-[-0.033em]">
              משלוחים ולוגיסטיקה
            </h1>
            <p className="text-slate-500 dark:text-[#90adcb] text-base font-normal leading-normal max-w-2xl">
              נהל את כתובות המשלוח שלך ועקוב אחר מוצרי קמפיין נכנסים. שמור על
              הפרטים מעודכנים כדי להבטיח משלוחים בזמן.
            </p>
          </div>

          {/* Primary Address Section */}
          {primaryAddress && (
            <div className="flex flex-col gap-4">
              <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em]">
                כתובת משלוח ראשית
              </h2>
              <AddressCard
                label={primaryAddress.full_name}
                name={primaryAddress.full_name}
                addressLines={[
                  `${primaryAddress.street} ${primaryAddress.house_number}${
                    primaryAddress.apartment
                      ? `, דירה ${primaryAddress.apartment}`
                      : ""
                  }`,
                  `${primaryAddress.city}, ${primaryAddress.postal_code || ""}`,
                  primaryAddress.country,
                ]}
                isDefault={primaryAddress.is_default || false}
                onEdit={() => {}}
              />
            </div>
          )}

          {/* Pending Shipments Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em]">
                משלוחים ממתינים{" "}
                <span className="text-slate-400 ml-1 text-lg font-medium">
                  ({shipmentRequests?.length || 0})
                </span>
              </h2>
              <button className="text-sm text-primary font-bold hover:underline">
                צפה בהיסטוריה
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {shipmentRequests && shipmentRequests.length > 0 ? (
                shipmentRequests.map((request) => {
                  // @ts-ignore
                  const campaign = request.campaigns;
                  // @ts-ignore
                  const brand = campaign?.brands;
                  // @ts-ignore
                  const shipment = request.shipments?.[0];

                  let status:
                    | "action_required"
                    | "processing"
                    | "shipped"
                    | "delivered" = "processing";
                  if (request.status === "waiting_address")
                    status = "action_required";
                  else if (request.status === "shipped") status = "shipped";
                  else if (request.status === "delivered") status = "delivered";

                  return (
                    <ShipmentCard
                      key={request.id}
                      brandName={brand?.name || "מותג"}
                      campaignTitle={campaign?.title || "קמפיין"}
                      productDescription="מוצר מהקמפיין"
                      productImage="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"
                      status={status}
                      onAction={() => console.log("Action")}
                    />
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark">
                  <span className="material-symbols-outlined text-4xl text-slate-400 mb-3">
                    inbox
                  </span>
                  <p className="text-slate-500 dark:text-slate-400">
                    אין משלוחים ממתינים
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Stats Summary */}
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-border-dark grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1 p-4 rounded-lg bg-white dark:bg-card-dark/50 border border-slate-100 dark:border-border-dark">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                סך המשלוחים
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {shipmentRequests?.length || 0}
              </span>
            </div>
            <div className="flex flex-col gap-1 p-4 rounded-lg bg-white dark:bg-card-dark/50 border border-slate-100 dark:border-border-dark">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                בדרך
              </span>
              <span className="text-2xl font-black text-primary">
                {shipmentRequests?.filter((r) => r.status === "shipped")
                  .length || 0}
              </span>
            </div>
            <div className="flex flex-col gap-1 p-4 rounded-lg bg-white dark:bg-card-dark/50 border border-slate-100 dark:border-border-dark">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                נמסרו
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {shipmentRequests?.filter((r) => r.status === "delivered")
                  .length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
  );
}
