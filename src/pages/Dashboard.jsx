import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import { getStudents } from '../api/studentApi';
import { getFeesSummary, getFeesChartData } from '../api/feesApi';
import { ACADEMIC_YEARS, DEFAULT_YEAR } from '../constants/academicYears';

const PIE_COLORS = { paid: '#22c55e', pending: '#f59e0b', overdue: '#ef4444', partial: '#6366f1' };

const fmt = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

const StatCard = ({ title, value, icon, color, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value ?? '—'}</p>
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState(null);
  const [feeSummary, setFeeSummary] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [year, setYear] = useState(DEFAULT_YEAR);

  useEffect(() => {
    getStudents({ limit: 1, isActive: true })
      .then((r) => setStudents(r.data.total))
      .catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      getFeesSummary({ academicYear: year }),
      getFeesChartData({ academicYear: year }),
    ])
      .then(([sumRes, chartRes]) => {
        setFeeSummary(sumRes.data.data);
        setChartData(chartRes.data.data);
      })
      .catch(() => {});
  }, [year]);

  const byStatus = (status) => feeSummary.find((f) => f._id === status)?.total ?? 0;
  const totalCollected = byStatus('paid');
  const totalPending = byStatus('pending') + byStatus('overdue') + byStatus('partial');

  const pieData = feeSummary
    .filter((f) => f.total > 0)
    .map((f) => ({ name: f._id.charAt(0).toUpperCase() + f._id.slice(1), value: f.total, color: PIE_COLORS[f._id] || '#94a3b8' }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 mt-1 text-sm">Welcome to Vidyanet ERP</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={students} icon="🎒" color="text-indigo-600" onClick={() => navigate('/students')} />
        <StatCard title="Fees Collected" value={fmt(totalCollected)} icon="✅" color="text-green-600" onClick={() => navigate('/fees')} />
        <StatCard title="Fees Pending" value={fmt(totalPending)} icon="⏳" color="text-yellow-600" onClick={() => navigate('/fees')} />
        <StatCard
          title="Collection Rate"
          value={totalCollected + totalPending > 0 ? `${Math.round((totalCollected / (totalCollected + totalPending)) * 100)}%` : '—'}
          icon="📈"
          color="text-blue-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bar chart — per student */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">
            Fees per Student
            <span className="ml-2 text-xs font-normal text-gray-400">({chartData.length} students)</span>
          </h3>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-gray-400 text-sm">No fee data for {year}</div>
          ) : (
            <div className="overflow-x-auto">
              <div style={{ width: '100%', minWidth: chartData.length * 70, height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 10, left: 10, bottom: 65 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} />
                    <Bar dataKey="paid" name="Paid" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Pie chart — status breakdown */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Fee Status Breakdown</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-gray-400 text-sm">No data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: d.color }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-medium text-gray-800">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
