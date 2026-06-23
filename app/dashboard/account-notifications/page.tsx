import { DashboardLayout } from '@/components/dashboard-layout'

export default function AccountNotificationsPage() {
  return (
    <DashboardLayout title="Notifications">
      <div className="px-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-2">Notifications</h2>
          <p className="text-slate-400">Notification preferences coming soon</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
