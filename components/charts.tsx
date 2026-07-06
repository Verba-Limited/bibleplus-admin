'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const userSignupData = [
  { month: 'Jun', value: 4 },
  { month: 'Jul', value: 2 },
  { month: 'Aug', value: 3 },
  { month: 'Sep', value: 3 },
  { month: 'Oct', value: 4 },
  { month: 'Nov', value: 5 },
  { month: 'Dec', value: 6 },
  { month: 'Jan', value: 5 },
  { month: 'Feb', value: 4 },
  { month: 'Mar', value: 4 },
  { month: 'Apr', value: 5 },
  { month: 'May', value: 6 },
  { month: 'Jun', value: 1 },
]

const contentProductionData = [
  { month: 'Dec', published: 2, draft: 2 },
  { month: 'Jan', published: 3, draft: 3 },
  { month: 'Feb', published: 4, draft: 2 },
  { month: 'Mar', published: 3, draft: 3 },
  { month: 'Apr', published: 5, draft: 1 },
  { month: 'May', published: 4, draft: 2 },
  { month: 'Jun', published: 6, draft: 2 },
]

const userRolesData = [
  { name: 'Admin', value: 25, color: '#a78bfa' },
  { name: 'Editor', value: 35, color: '#fbbf24' },
  { name: 'Viewer', value: 20, color: '#34d399' },
  { name: 'Guest', value: 20, color: '#f472b6' },
]

const pageStatusData = [
  { name: 'Published', value: 60, color: '#34d399' },
  { name: 'Draft', value: 30, color: '#fbbf24' },
  { name: 'Review', value: 10, color: '#fbbf24' },
]

export function UserSignupsChart() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white font-['Source_Serif_4',serif]">User Signups</h3>
        <p className="text-sm text-slate-400">New user registrations over time</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={userSignupData}>
          <defs>
            <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
          <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#ffffff',
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#7c3aed"
            strokeWidth={2}
            dot={{ fill: '#7c3aed', r: 4 }}
            activeDot={{ r: 6 }}
            fillOpacity={1}
            fill="url(#colorSignups)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ContentProductionChart() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white font-['Source_Serif_4',serif]">Content Production</h3>
        <p className="text-sm text-slate-400">Pages created by month and status</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={contentProductionData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
          <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#ffffff',
            }}
          />
          <Legend />
          <Bar dataKey="published" stackId="a" fill="#34d399" name="Published" />
          <Bar dataKey="draft" stackId="a" fill="#0ea5e9" name="Draft" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function UserRolesPie() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white font-['Source_Serif_4',serif]">User Roles</h3>
        <p className="text-sm text-slate-400">Distribution of user roles</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={userRolesData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {userRolesData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#ffffff',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {userRolesData.map((role) => (
          <div key={role.name} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: role.color }}
            ></div>
            <span className="text-xs text-slate-400">{role.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PageStatusPie() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white font-['Source_Serif_4',serif]">Page Status</h3>
        <p className="text-sm text-slate-400">Content by status</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pageStatusData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {pageStatusData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#ffffff',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {pageStatusData.map((status) => (
          <div key={status.name} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: status.color }}
            ></div>
            <span className="text-xs text-slate-400">{status.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SystemOverview() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white font-['Source_Serif_4',serif]">System Overview</h3>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800">
              <span className="text-sm font-semibold text-white font-['Source_Serif_4',serif]">📄</span>
            </div>
            <span className="text-sm text-slate-300">Published</span>
          </div>
          <span className="text-lg font-semibold text-white font-['Source_Serif_4',serif]">49</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800">
              <span className="text-sm font-semibold text-white font-['Source_Serif_4',serif]">✏️</span>
            </div>
            <span className="text-sm text-slate-300">Active Editors</span>
          </div>
          <span className="text-lg font-semibold text-white font-['Source_Serif_4',serif]">15</span>
        </div>
      </div>
    </div>
  )
}
