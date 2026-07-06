import { DashboardLayout } from "@/components/dashboard-layout";

export default function SettingsPage() {
  return (
    <DashboardLayout title="Settings">
      <div className="px-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-white font-['Source_Serif_4',serif] mb-2">Settings</h2>
          <p className="text-slate-400">Settings page coming </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
