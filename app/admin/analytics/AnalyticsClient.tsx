'use client';

import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Cell, PieChart, Pie, Legend,
} from 'recharts';
import type { PlatformStats } from '@/lib/admin/queries';

interface Props {
  stats: PlatformStats;
  userGrowth: { date: string; count: number }[];
  cardGrowth: { date: string; count: number }[];
  planDist: { plan: string; count: number }[];
}

const PLAN_COLORS: Record<string, string> = {
  free:   '#6B7A72',
  pro:    '#C9A45E',
  studio: '#1F4D3A',
};

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white border border-[#E5E0D4] rounded-2xl p-5">
      <div className="text-[11px] font-mono text-[#6B7A72] uppercase tracking-[0.14em] mb-2">{label}</div>
      <div className="text-[32px] font-display font-bold text-[#0F1F18] tracking-tight leading-none">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && <div className="text-[11px] text-[#6B7A72] mt-1.5">{sub}</div>}
    </div>
  );
}

function formatDateShort(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const TooltipStyle = {
  contentStyle: {
    background: '#fff',
    border: '1px solid #E5E0D4',
    borderRadius: '10px',
    fontSize: '12px',
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#0F1F18',
    boxShadow: '0 4px 16px rgba(15,31,24,0.08)',
  },
  labelStyle: { color: '#6B7A72', marginBottom: 4 },
  cursor: { stroke: '#E5E0D4', strokeWidth: 1 },
};

export function AnalyticsClient({ stats, userGrowth, cardGrowth, planDist }: Props) {
  const conversionRate = stats.totalUsers > 0
    ? ((stats.paidUsers / stats.totalUsers) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-8">
      {/* â”€â”€ Stat cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard label="Total users" value={stats.totalUsers} />
        <StatCard label="New this month" value={stats.newUsersThisMonth} sub="signups" />
        <StatCard label="Total events" value={stats.totalEvents} sub={`${stats.publishedEvents} published`} />
        <StatCard label="Total registrations" value={stats.totalRegistrations} />
        <StatCard label="Cards shared" value={stats.totalCards} />
        <StatCard label="Paid users" value={stats.paidUsers} sub={`${conversionRate}% conversion`} />
        <StatCard
          label="Free users"
          value={stats.totalUsers - stats.paidUsers}
          sub={`${stats.totalUsers > 0 ? (100 - parseFloat(conversionRate)).toFixed(1) : '0.0'}% of total`}
        />
      </div>

      {/* â”€â”€ User growth chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-[#E5E0D4] rounded-2xl p-6">
        <h2 className="font-display font-semibold text-[16px] text-[#0F1F18] mb-1">User growth</h2>
        <p className="text-[12px] text-[#6B7A72] mb-5">New signups per day â€” last 30 days</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={userGrowth} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1F4D3A" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1F4D3A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D4" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateShort}
              tick={{ fontSize: 10, fontFamily: 'Inter, system-ui, sans-serif', fill: '#6B7A72' }}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis
              tick={{ fontSize: 10, fontFamily: 'Inter, system-ui, sans-serif', fill: '#6B7A72' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={TooltipStyle.contentStyle}
              labelStyle={TooltipStyle.labelStyle}
              labelFormatter={(l) => typeof l === 'string' ? formatDateShort(l) : String(l)}
              formatter={(v) => [v, 'new users']}
              cursor={TooltipStyle.cursor}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#1F4D3A"
              strokeWidth={2}
              fill="url(#userGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#1F4D3A' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* â”€â”€ Cards generated chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-[#E5E0D4] rounded-2xl p-6">
        <h2 className="font-display font-semibold text-[16px] text-[#0F1F18] mb-1">Cards generated</h2>
        <p className="text-[12px] text-[#6B7A72] mb-5">Attendee card downloads per day â€” last 30 days</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={cardGrowth} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D4" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateShort}
              tick={{ fontSize: 10, fontFamily: 'Inter, system-ui, sans-serif', fill: '#6B7A72' }}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis
              tick={{ fontSize: 10, fontFamily: 'Inter, system-ui, sans-serif', fill: '#6B7A72' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={TooltipStyle.contentStyle}
              labelStyle={TooltipStyle.labelStyle}
              labelFormatter={(l) => typeof l === 'string' ? formatDateShort(l) : String(l)}
              formatter={(v) => [v, 'cards']}
              cursor={{ fill: 'rgba(31,77,58,0.04)' }}
            />
            <Bar dataKey="count" fill="#E8C57E" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* â”€â”€ Plan distribution â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E5E0D4] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-[16px] text-[#0F1F18] mb-1">Plan distribution</h2>
          <p className="text-[12px] text-[#6B7A72] mb-5">Current users by plan tier</p>
          {planDist.every(p => p.count === 0) ? (
            <div className="h-[180px] grid place-items-center text-[13px] text-[#6B7A72]">No users yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={planDist}
                  dataKey="count"
                  nameKey="plan"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {planDist.map((entry) => (
                    <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan] ?? '#6B7A72'} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => (
                    <span style={{ fontSize: 11, fontFamily: 'Inter, system-ui, sans-serif', color: '#3A4A42', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {value}
                    </span>
                  )}
                />
                <Tooltip
                  contentStyle={TooltipStyle.contentStyle}
                  formatter={(v, name) => [v, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick numbers table */}
        <div className="bg-white border border-[#E5E0D4] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-[16px] text-[#0F1F18] mb-1">Platform summary</h2>
          <p className="text-[12px] text-[#6B7A72] mb-5">Key numbers at a glance</p>
          <div className="space-y-3">
            {[
              { label: 'Total users',         value: stats.totalUsers },
              { label: 'Paid users',          value: stats.paidUsers },
              { label: 'Free users',          value: stats.totalUsers - stats.paidUsers },
              { label: 'Conversion rate',     value: `${conversionRate}%` },
              { label: 'Total events',        value: stats.totalEvents },
              { label: 'Published events',    value: stats.publishedEvents },
              { label: 'Total registrations',  value: stats.totalRegistrations },
      { label: 'Cards shared',        value: stats.totalCards },
              { label: 'New users (30d)',     value: stats.newUsersThisMonth },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-[#E5E0D4] last:border-0">
                <span className="text-[12px] text-[#6B7A72]">{row.label}</span>
                <span className="text-[13px] font-mono font-semibold text-[#0F1F18]">
                  {typeof row.value === 'number' ? row.value.toLocaleString() : row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
