import { useState, useEffect, useCallback } from 'react';
import { getStudents } from '../api/studentApi';
import { sendWhatsAppBulk } from '../api/whatsappApi';
import toast from 'react-hot-toast';

const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const SECTIONS = ['A','B','C','D','E'];

const VARIABLES = [
  { label: 'Student Name', value: '{{studentName}}' },
  { label: 'Class',        value: '{{class}}' },
  { label: 'Section',      value: '{{section}}' },
  { label: 'Roll No',      value: '{{rollNumber}}' },
  { label: 'Student ID',   value: '{{studentId}}' },
];

function resolveMessage(template, student) {
  return template
    .replace(/{{studentName}}/g, `${student.firstName} ${student.lastName}`)
    .replace(/{{class}}/g,       student.class)
    .replace(/{{section}}/g,     student.section)
    .replace(/{{rollNumber}}/g,  student.rollNumber  || '')
    .replace(/{{studentId}}/g,   student.studentId   || '');
}

function primaryPhone(student) {
  return student.parent?.father?.phone || student.parent?.mother?.phone || student.phone || null;
}

export default function WhatsApp() {
  const [students,       setStudents]     = useState([]);
  const [loading,        setLoading]      = useState(false);
  const [filters,        setFilters]      = useState({ class: '', section: '', search: '' });
  const [selected,       setSelected]     = useState(new Set());
  const [message,        setMessage]      = useState('');
  const [sending,        setSending]      = useState(false);
  const [sendResults,    setSendResults]  = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudents({ ...filters, limit: 200, isActive: true, withParent: true });
      setStudents(res.data.data);
      setSelected(new Set());
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  const toggleStudent = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const eligible = students.filter((s) => primaryPhone(s));
    if (selected.size === eligible.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligible.map((s) => s._id)));
    }
  };

  const insertVariable = (v) => {
    setMessage((prev) => prev + v);
  };

  const selectedStudents = students.filter((s) => selected.has(s._id));
  const eligibleCount    = students.filter((s) => primaryPhone(s)).length;
  const allSelected      = eligibleCount > 0 && selected.size === eligibleCount;

  const handleSend = async () => {
    if (!message.trim())    { toast.error('Please write a message'); return; }
    if (selected.size === 0) { toast.error('Select at least one student'); return; }

    const recipients = selectedStudents
      .map((s) => ({
        phone:   primaryPhone(s),
        name:    `${s.firstName} ${s.lastName}`,
        message: resolveMessage(message, s),
      }))
      .filter((r) => r.phone);

    if (recipients.length === 0) {
      toast.error('None of the selected students have a phone number');
      return;
    }

    setSending(true);
    setSendResults(null);
    try {
      const res = await sendWhatsAppBulk(recipients);
      const { sent, failed, results } = res.data;
      setSendResults(results);
      if (failed === 0) {
        toast.success(`Message sent to ${sent} student${sent !== 1 ? 's' : ''}`);
      } else {
        toast(`Sent: ${sent}, Failed: ${failed}`, { icon: '⚠️' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send messages');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">WhatsApp Messages</h2>
        <p className="text-sm text-gray-500">Select students and send a WhatsApp message to their parents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left — student selector */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">

          {/* Filters */}
          <div className="p-4 border-b border-gray-100 flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search name / ID..."
              value={filters.search}
              onChange={setFilter('search')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 min-w-32"
            />
            <select value={filters.class} onChange={setFilter('class')} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Classes</option>
              {CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}
            </select>
            <select value={filters.section} onChange={setFilter('section')} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Sections</option>
              {SECTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>

          {/* Select all bar */}
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 accent-indigo-600"
              />
              Select all with phone ({eligibleCount})
            </label>
            {selected.size > 0 && (
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full">
                {selected.size} selected
              </span>
            )}
          </div>

          {/* Student list */}
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 420 }}>
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No students found</div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {students.map((s) => {
                  const phone     = primaryPhone(s);
                  const isChecked = selected.has(s._id);
                  return (
                    <li
                      key={s._id}
                      onClick={() => phone && toggleStudent(s._id)}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                        phone ? 'cursor-pointer hover:bg-indigo-50' : 'opacity-50 cursor-not-allowed'
                      } ${isChecked ? 'bg-indigo-50' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        disabled={!phone}
                        className="w-4 h-4 accent-indigo-600 shrink-0"
                      />
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-gray-400">Class {s.class}-{s.section} · Roll {s.rollNumber}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {phone ? (
                          <p className="text-xs text-green-600 font-medium">📱 {phone}</p>
                        ) : (
                          <p className="text-xs text-red-400">No phone</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right — message composer */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Variable chips */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Insert Variable</p>
            <div className="flex flex-wrap gap-2">
              {VARIABLES.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => insertVariable(v.value)}
                  className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 font-medium transition-colors"
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message box */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi {{studentName}},\nThis is a reminder from the school...`}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={7}
            />
            <p className="text-xs text-gray-400 mt-1">{message.length} characters</p>
          </div>

          {/* Preview */}
          {message && selectedStudents.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">
                Preview — {selectedStudents[0].firstName} {selectedStudents[0].lastName}
              </p>
              <p className="text-sm text-green-900 whitespace-pre-wrap">
                {resolveMessage(message, selectedStudents[0])}
              </p>
            </div>
          )}

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || selected.size === 0 || !message.trim()}
            className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <span className="animate-spin inline-block">⏳</span>
                Sending to {selected.size} student{selected.size !== 1 ? 's' : ''}...
              </>
            ) : (
              <>
                <span>💬</span>
                Send WhatsApp to {selected.size > 0 ? `${selected.size} student${selected.size !== 1 ? 's' : ''}` : 'selected students'}
              </>
            )}
          </button>

          {/* Send results */}
          {sendResults && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Send Results</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {sendResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 truncate">{r.name}</span>
                    <span className={`ml-2 shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                      r.status === 'sent'   ? 'bg-green-100 text-green-700' :
                      r.status === 'failed' ? 'bg-red-100 text-red-700'    :
                                              'bg-gray-100 text-gray-500'
                    }`}>
                      {r.status === 'sent' ? '✓ Sent' : r.status === 'failed' ? `✗ ${r.reason || 'Failed'}` : 'Skipped'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
