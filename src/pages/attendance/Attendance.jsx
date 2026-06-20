import { useState, useEffect, useCallback } from 'react';
import { getAttendanceByDate, saveAttendance, getClassReport, getOverview } from '../../api/attendanceApi';
import toast from 'react-hot-toast';

const CLASSES  = Array.from({ length: 12 }, (_, i) => String(i + 1));
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

const STATUS = {
  present:   { label: 'P', full: 'Present',  bg: 'bg-green-500',  ring: 'ring-green-400',  text: 'text-green-700',  light: 'bg-green-50'  },
  absent:    { label: 'A', full: 'Absent',   bg: 'bg-red-500',    ring: 'ring-red-400',    text: 'text-red-700',    light: 'bg-red-50'    },
  late:      { label: 'L', full: 'Late',     bg: 'bg-amber-500',  ring: 'ring-amber-400',  text: 'text-amber-700',  light: 'bg-amber-50'  },
  'half-day':{ label: 'H', full: 'Half Day', bg: 'bg-blue-500',   ring: 'ring-blue-400',   text: 'text-blue-700',   light: 'bg-blue-50'   },
};

const todayStr = () => new Date().toISOString().split('T')[0];

const pctColor = (pct) =>
  pct >= 80 ? 'text-green-600 bg-green-50' : pct >= 60 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';

// ── Mark Attendance Tab ────────────────────────────────────────────────────────
function MarkTab() {
  const [date, setDate]       = useState(todayStr());
  const [cls, setCls]         = useState('');
  const [section, setSection] = useState('');
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({});  // studentId → status
  const [remarksMap, setRemarksMap] = useState({});
  const [existing, setExisting] = useState(null);  // existing attendance doc
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [overview, setOverview] = useState([]);

  // Load today's overview (which classes already marked)
  useEffect(() => {
    getOverview({ date }).then((r) => setOverview(r.data.data)).catch(() => {});
  }, [date, saving]);

  // Auto-load when date+class+section all selected
  useEffect(() => {
    if (!date || !cls || !section) { setStudents([]); setStatusMap({}); setExisting(null); return; }

    setLoadingStudents(true);
    getAttendanceByDate({ date, class: cls, section })
      .then((res) => {
        const { record, students: list } = res.data.data;
        setStudents(list);
        setExisting(record);

        if (record) {
          // Pre-fill from existing record
          const sm = {}, rm = {};
          record.records.forEach((r) => {
            sm[r.student._id || r.student] = r.status;
            rm[r.student._id || r.student] = r.remarks || '';
          });
          setStatusMap(sm);
          setRemarksMap(rm);
        } else {
          // Default all to present
          const sm = {};
          list.forEach((s) => { sm[s._id] = 'present'; });
          setStatusMap(sm);
          setRemarksMap({});
        }
      })
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoadingStudents(false));
  }, [date, cls, section]);

  const setStatus = (studentId, status) =>
    setStatusMap((prev) => ({ ...prev, [studentId]: status }));

  const markAll = (status) => {
    const sm = {};
    students.forEach((s) => { sm[s._id] = status; });
    setStatusMap(sm);
  };

  const summary = Object.values(statusMap).reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const handleSave = async () => {
    if (!date || !cls || !section) { toast.error('Select date, class and section'); return; }
    if (students.length === 0) { toast.error('No students found for this class'); return; }

    const records = students.map((s) => ({
      student:  s._id,
      status:   statusMap[s._id] || 'absent',
      remarks:  remarksMap[s._id] || '',
    }));

    setSaving(true);
    try {
      await saveAttendance({ date, class: cls, section, records });
      toast.success(existing ? 'Attendance updated' : 'Attendance saved');
      // Refresh to get updated existing record
      const res = await getAttendanceByDate({ date, class: cls, section });
      setExisting(res.data.data.record);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const isMarked = overview.find((o) => o.class === cls && o.section === section);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-3 items-end">
          <div className="col-span-3 sm:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select value={cls} onChange={(e) => setCls(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Class</option>
              {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
            <select value={section} onChange={(e) => setSection(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Sec</option>
              {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {students.length > 0 && (
            <div className="col-span-3 sm:col-span-1 flex gap-2 sm:ml-auto">
              <button onClick={() => markAll('present')}
                className="flex-1 text-xs font-medium px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200">
                ✓ All Present
              </button>
              <button onClick={() => markAll('absent')}
                className="flex-1 text-xs font-medium px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200">
                ✗ All Absent
              </button>
            </div>
          )}
        </div>

        {/* Overview chips for the selected date */}
        {overview.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Already marked today:</p>
            <div className="flex flex-wrap gap-2">
              {overview.map((o) => (
                <button
                  key={`${o.class}-${o.section}`}
                  onClick={() => { setCls(o.class); setSection(o.section); }}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                    o.class === cls && o.section === section
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-green-50 text-green-700 border-green-200 hover:border-green-400'
                  }`}
                >
                  {o.class}-{o.section}
                  <span className="ml-1.5 opacity-70">{o.present}P/{o.absent}A</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Student list */}
      {!cls || !section ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium text-gray-500">Select class and section to mark attendance</p>
        </div>
      ) : loadingStudents ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
          No students found in Class {cls}-{section}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Already-marked banner */}
          {existing && (
            <div className="bg-green-50 border-b border-green-100 px-4 py-2.5 flex items-center gap-2 text-sm text-green-700">
              <span>✓</span>
              <span>Attendance already marked — you can still edit and save again.</span>
              <span className="ml-auto text-xs text-green-500">
                Last updated: {new Date(existing.updatedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                {existing.markedBy?.name && ` by ${existing.markedBy.name}`}
              </span>
            </div>
          )}

          {/* Table header — hidden on mobile */}
          <div className="hidden sm:grid grid-cols-12 gap-2 bg-gray-50 px-4 py-2.5 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Student</div>
            <div className="col-span-4">Status</div>
            <div className="col-span-2">Remarks</div>
          </div>

          {/* Student rows */}
          <div className="divide-y divide-gray-50">
            {students.map((s, idx) => {
              const currentStatus = statusMap[s._id] || 'absent';
              const cfg = STATUS[currentStatus];
              return (
                <div key={s._id} className={`transition-colors ${cfg.light}`}>
                  {/* Mobile layout */}
                  <div className="sm:hidden flex items-center gap-3 px-4 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${cfg.bg}`}>
                      {s.firstName[0]}{s.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-gray-400">Roll {s.rollNumber}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {Object.entries(STATUS).map(([key, c]) => (
                        <button key={key} type="button" onClick={() => setStatus(s._id, key)}
                          className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === key ? `${c.bg} text-white ring-2 ${c.ring} ring-offset-1` : 'bg-white border border-gray-200 text-gray-500'
                          }`} title={c.full}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-3 items-center">
                    <div className="col-span-1 text-xs text-gray-400 font-mono">{String(idx + 1).padStart(2, '0')}</div>
                    <div className="col-span-5 flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${cfg.bg}`}>
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-gray-400">Roll {s.rollNumber}</p>
                      </div>
                    </div>
                    <div className="col-span-4 flex gap-1">
                      {Object.entries(STATUS).map(([key, c]) => (
                        <button key={key} type="button" onClick={() => setStatus(s._id, key)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === key ? `${c.bg} text-white ring-2 ${c.ring} ring-offset-1` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`} title={c.full}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                    <div className="col-span-2">
                      <input type="text" value={remarksMap[s._id] || ''} onChange={(e) => setRemarksMap((p) => ({ ...p, [s._id]: e.target.value }))}
                        placeholder="Note" className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer: summary + save */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex gap-4 text-sm">
              {Object.entries(STATUS).map(([key, cfg]) => (
                <span key={key} className={`flex items-center gap-1.5 ${cfg.text} font-medium`}>
                  <span className={`w-2 h-2 rounded-full ${cfg.bg}`} />
                  {summary[key] || 0} {cfg.full}
                </span>
              ))}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 shrink-0"
            >
              {saving ? 'Saving...' : existing ? 'Update Attendance' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reports Tab ────────────────────────────────────────────────────────────────
function ReportsTab() {
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const [cls, setCls]         = useState('');
  const [section, setSection] = useState('');
  const [from, setFrom]       = useState(firstOfMonth);
  const [to, setTo]           = useState(todayStr());
  const [data, setData]       = useState([]);
  const [totalDays, setTotalDays] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!cls || !section) { toast.error('Select class and section'); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res = await getClassReport({ class: cls, section, from, to });
      setData(res.data.data);
      setTotalDays(res.data.totalDays);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [cls, section, from, to]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select value={cls} onChange={(e) => setCls(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select</option>
              {CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
            <select value={section} onChange={(e) => setSection(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select</option>
              {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" value={to} min={from} max={todayStr()} onChange={(e) => setTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={handleGenerate} disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Report table */}
      {!searched ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-medium text-gray-500">Select class, section and date range, then click Generate</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">Generating report...</div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
          No attendance data for Class {cls}-{section} in this date range
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Class {cls}-{section} — Attendance Report</p>
              <p className="text-xs text-gray-400 mt-0.5">{from} to {to} · {totalDays} school day{totalDays !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> ≥80% Good</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> 60–79% Average</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &lt;60% Low</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['#', 'Student', 'Present', 'Absent', 'Late', 'Half-Day', 'Attendance %'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((row, i) => (
                  <tr key={row.student._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{String(i + 1).padStart(2, '0')}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{row.student.firstName} {row.student.lastName}</p>
                      <p className="text-xs text-gray-400">Roll {row.student.rollNumber} · {row.student.studentId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-green-700 font-semibold">{row.present}</span>
                      <span className="text-gray-300 ml-1 text-xs">/{totalDays}</span>
                    </td>
                    <td className="px-4 py-3 text-red-600 font-medium">{row.absent}</td>
                    <td className="px-4 py-3 text-amber-600 font-medium">{row.late}</td>
                    <td className="px-4 py-3 text-blue-600 font-medium">{row.halfDay}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${pctColor(row.percentage)}`}>
                        {row.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-xs font-semibold text-gray-600">Class Average</td>
                  <td className="px-4 py-3 text-green-700 font-bold">{Math.round(data.reduce((s, r) => s + r.present, 0) / data.length)}</td>
                  <td className="px-4 py-3 text-red-600 font-bold">{Math.round(data.reduce((s, r) => s + r.absent, 0) / data.length)}</td>
                  <td className="px-4 py-3 text-amber-600 font-bold">{Math.round(data.reduce((s, r) => s + r.late, 0) / data.length)}</td>
                  <td className="px-4 py-3 text-blue-600 font-bold">{Math.round(data.reduce((s, r) => s + r.halfDay, 0) / data.length)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${pctColor(Math.round(data.reduce((s, r) => s + r.percentage, 0) / data.length))}`}>
                      {Math.round(data.reduce((s, r) => s + r.percentage, 0) / data.length)}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Attendance() {
  const [tab, setTab] = useState('mark');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Attendance</h2>
          <p className="text-sm text-gray-500">Mark daily attendance and view class reports</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'mark',   label: '✏️  Mark Attendance' },
          { key: 'report', label: '📊  Reports'         },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'mark'   && <MarkTab />}
      {tab === 'report' && <ReportsTab />}
    </div>
  );
}
