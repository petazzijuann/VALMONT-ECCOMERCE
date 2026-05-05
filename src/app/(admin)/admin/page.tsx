import DashboardClient from "@/components/admin/DashboardClient";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <p className="label-tag text-muted-foreground text-[10px] mb-1">BIENVENIDO</p>
        <h1 className="font-bebas text-5xl">DASHBOARD</h1>
      </div>
      <DashboardClient />
    </div>
  );
}
