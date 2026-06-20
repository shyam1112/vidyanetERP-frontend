import { useState, useEffect, useRef } from 'react';
import { getStudents } from '../../api/studentApi';
import { getParentByStudent } from '../../api/parentApi';
import {
  getLeavingCertificateTemplate,
  saveLeavingCertificateTemplate,
} from '../../api/leavingCertificateApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ─── Variables ───────────────────────────────────────────────────────────────

const VARIABLE_GROUPS = [
  {
    label: 'Student',
    color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    vars: [
      { key: 'student_name', label: 'Student Name' },
      { key: 'father_name', label: 'Father Name' },
      { key: 'mother_name', label: 'Mother Name' },
      { key: 'dob', label: 'Date of Birth' },
      { key: 'gender', label: 'Gender' },
      { key: 'class', label: 'Class' },
      { key: 'section', label: 'Section' },
      { key: 'roll_number', label: 'Roll No' },
      { key: 'student_id', label: 'Student ID' },
      { key: 'admission_date', label: 'Admission Date' },
      { key: 'blood_group', label: 'Blood Group' },
      { key: 'address', label: 'Address' },
    ],
  },
  {
    label: 'School',
    color: 'bg-green-100 text-green-700 hover:bg-green-200',
    vars: [
      { key: 'school_name', label: 'School Name' },
      { key: 'school_address', label: 'School Address' },
      { key: 'school_phone', label: 'School Phone' },
    ],
  },
  {
    label: 'Manual (filled at generation)',
    color: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    vars: [
      { key: 'leaving_date', label: 'Leaving Date' },
      { key: 'certificate_no', label: 'Certificate No' },
      { key: 'conduct', label: 'Conduct / Character' },
      { key: 'last_exam', label: 'Last Exam' },
      { key: 'progress', label: 'Progress' },
      { key: 'reason', label: 'Reason for Leaving' },
    ],
  },
  {
    label: 'Auto',
    color: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    vars: [{ key: 'date', label: "Today's Date" }],
  },
];

const MANUAL_FIELDS = [
  { key: 'certificate_no', label: 'Certificate No', type: 'text', placeholder: 'e.g. LC-2024-001' },
  { key: 'leaving_date', label: 'Leaving Date', type: 'date' },
  { key: 'conduct', label: 'Conduct / Character', type: 'text', placeholder: 'e.g. Good' },
  { key: 'last_exam', label: 'Last Exam', type: 'text', placeholder: 'e.g. Class 10 — March 2024' },
  { key: 'progress', label: 'Progress', type: 'text', placeholder: 'e.g. Satisfactory' },
  { key: 'reason', label: 'Reason for Leaving', type: 'text', placeholder: 'e.g. Passed out' },
];

const SAMPLE_VALUES = {
  student_name: 'Rahul Sharma',
  father_name: 'Ramesh Sharma',
  mother_name: 'Sunita Sharma',
  dob: '15 March 2008',
  gender: 'Male',
  class: '10',
  section: 'A',
  roll_number: '15',
  student_id: 'STU2024001',
  admission_date: '12 June 2015',
  blood_group: 'O+',
  address: '123 MG Road, Ahmedabad, Gujarat – 380001',
  school_name: 'Sample School',
  school_address: '456 School Road',
  school_phone: '+91 98765 43210',
  leaving_date: '20 June 2026',
  certificate_no: 'LC-2026-001',
  conduct: 'Good',
  last_exam: 'Class 10 — March 2026',
  progress: 'Satisfactory',
  reason: 'Passed out',
  date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function fmtAddress(addr) {
  if (!addr) return '';
  return [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
}

// ─── Certificate Document ─────────────────────────────────────────────────────

function CertificateDocument({ resolvedBody, vars, school }) {
  return (
    <div className="leaving-certificate-page bg-white p-8 max-w-3xl mx-auto shadow-lg border-4 border-double border-gray-400 font-serif">
      {/* School header */}
      <div className="text-center pb-4 mb-5 border-b-2 border-gray-400">
        <h1 className="text-2xl font-bold text-gray-900 tracking-wide">
          {school.name || '{{school_name}}'}
        </h1>
        {school.address && (
          <p className="text-sm text-gray-600 mt-1">{school.address}</p>
        )}
        {(school.city || school.state || school.phone) && (
          <p className="text-sm text-gray-500">
            {[school.city, school.state].filter(Boolean).join(', ')}
            {school.phone ? ` · Ph: ${school.phone}` : ''}
          </p>
        )}
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold tracking-widest uppercase text-gray-800 underline underline-offset-4">
          Leaving Certificate
        </h2>
      </div>

      {/* Meta row */}
      <div className="flex justify-between text-sm mb-6 text-gray-700">
        <span>
          Certificate No:{' '}
          <span className="font-semibold">{vars.certificate_no || '__________'}</span>
        </span>
        <span>
          Date: <span className="font-semibold">{vars.date}</span>
        </span>
      </div>

      {/* Body */}
      <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800 min-h-48 font-mono">
        {resolvedBody}
      </div>

      {/* Signatures */}
      <div className="flex justify-between mt-14 pt-6">
        <div className="text-center">
          <div className="border-t border-gray-800 pt-1 w-36">
            <p className="text-xs text-gray-600">Class Teacher</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-800 pt-1 w-36">
            <p className="text-xs text-gray-600">Principal / Head Master</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeavingCertificate() {
  const { user } = useAuth();
  const [tab, setTab] = useState('template');

  // Template editor
  const [template, setTemplate] = useState('');
  const [templateLoading, setTemplateLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);

  // Generate
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [parentData, setParentData] = useState(null);
  const [manualFields, setManualFields] = useState({
    certificate_no: '',
    leaving_date: '',
    conduct: 'Good',
    last_exam: '',
    progress: 'Satisfactory',
    reason: '',
  });

  // Load template
  useEffect(() => {
    getLeavingCertificateTemplate()
      .then((res) => setTemplate(res.data.template))
      .catch(() => toast.error('Failed to load template'))
      .finally(() => setTemplateLoading(false));
  }, []);

  // Load students when generate tab is opened
  useEffect(() => {
    if (tab === 'generate' && students.length === 0) {
      setStudentsLoading(true);
      getStudents({ limit: 500 })
        .then((res) => setStudents(res.data.data || []))
        .catch(() => toast.error('Failed to load students'))
        .finally(() => setStudentsLoading(false));
    }
  }, [tab]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load parent when student selected
  useEffect(() => {
    if (!selectedStudent) { setParentData(null); return; }
    getParentByStudent(selectedStudent._id)
      .then((res) => setParentData(res.data.data))
      .catch(() => setParentData(null));
  }, [selectedStudent]);

  // Insert variable at cursor in template textarea
  const insertVariable = (key) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const tag = `{{${key}}}`;
    setTemplate((prev) => prev.slice(0, start) + tag + prev.slice(end));
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + tag.length;
      el.focus();
    }, 0);
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      await saveLeavingCertificateTemplate(template);
      toast.success('Template saved');
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  // Build resolved vars for generate preview
  const buildVars = () => {
    const s = selectedStudent;
    const p = parentData;
    return {
      student_name: s ? `${s.firstName} ${s.lastName}` : '',
      father_name: p?.father?.name || '',
      mother_name: p?.mother?.name || '',
      dob: fmtDate(s?.dateOfBirth),
      gender: s?.gender ? s.gender.charAt(0).toUpperCase() + s.gender.slice(1) : '',
      class: s?.class || '',
      section: s?.section || '',
      roll_number: s?.rollNumber || '',
      student_id: s?.studentId || '',
      admission_date: fmtDate(s?.admissionDate),
      blood_group: s?.bloodGroup || '',
      address: fmtAddress(s?.address),
      school_name: user?.schoolName || '',
      school_address: user?.address || '',
      school_phone: user?.phone || '',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
      ...manualFields,
      leaving_date: manualFields.leaving_date ? fmtDate(manualFields.leaving_date) : '',
    };
  };

  const handlePrint = () => {
    document.body.classList.add('print-leaving-cert');
    window.print();
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('print-leaving-cert');
    }, { once: true });
  };

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    return (
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.studentId?.toLowerCase().includes(q) ||
      s.rollNumber?.toLowerCase().includes(q) ||
      s.class?.toLowerCase().includes(q)
    );
  });

  const school = {
    name: user?.schoolName,
    address: user?.address,
    city: user?.city,
    state: user?.state,
    phone: user?.phone,
  };

  const vars = buildVars();
  const resolvedBody = resolveTemplate(template, vars);
  const sampleBody = resolveTemplate(template, SAMPLE_VALUES);

  return (
    <div className="space-y-4">
      {/* Print styles */}
      <style>{`
        @media print {
          body.print-leaving-cert > * { visibility: hidden; }
          body.print-leaving-cert .leaving-certificate-page,
          body.print-leaving-cert .leaving-certificate-page * { visibility: visible; }
          body.print-leaving-cert .leaving-certificate-page {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important; max-width: none !important;
            margin: 0 !important; padding: 8mm 12mm !important;
            box-shadow: none !important;
          }
          body.print-leaving-cert .leaving-certificate-page h1 { font-size: 20px !important; }
          body.print-leaving-cert .leaving-certificate-page h2 { font-size: 14px !important; }
          body.print-leaving-cert .leaving-certificate-page p,
          body.print-leaving-cert .leaving-certificate-page span,
          body.print-leaving-cert .leaving-certificate-page div { font-size: 12px !important; }
        }
        @page { size: A4 portrait; margin: 8mm; }
      `}</style>

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Leaving Certificate</h2>
        <p className="text-sm text-gray-500">Design your certificate template and generate for any student</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'template', label: '✏️ Template Editor' },
          { key: 'generate', label: '🎓 Generate Certificate' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Template Editor Tab ─────────────────────────────────────────────── */}
      {tab === 'template' && (
        <div className="space-y-4">
          {/* Variable chips */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Click a variable to insert it at cursor position
            </p>
            {VARIABLE_GROUPS.map((group) => (
              <div key={group.label} className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs font-medium text-gray-400 w-36 shrink-0">{group.label}:</span>
                {group.vars.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => insertVariable(v.key)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${group.color}`}
                    title={`Insert {{${v.key}}}`}
                  >
                    {`{{${v.key}}}`}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Textarea */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
              <span className="text-sm font-medium text-gray-700">Certificate Body Template</span>
              <button
                onClick={handleSaveTemplate}
                disabled={saving || templateLoading}
                className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving…' : 'Save Template'}
              </button>
            </div>
            {templateLoading ? (
              <div className="p-6 text-center text-gray-400">Loading…</div>
            ) : (
              <textarea
                ref={textareaRef}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={16}
                className="w-full p-4 text-sm text-gray-800 font-mono resize-y focus:outline-none"
                placeholder="Write your certificate template here. Click variable buttons above to insert them."
                spellCheck={false}
              />
            )}
          </div>

          {/* Sample preview */}
          {!templateLoading && template && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Sample Preview (with dummy data)
              </p>
              <CertificateDocument
                resolvedBody={sampleBody}
                vars={{ ...SAMPLE_VALUES, certificate_no: SAMPLE_VALUES.certificate_no }}
                school={{ name: SAMPLE_VALUES.school_name, address: SAMPLE_VALUES.school_address }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Generate Certificate Tab ────────────────────────────────────────── */}
      {tab === 'generate' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: student + manual fields */}
            <div className="lg:col-span-1 space-y-4">
              {/* Student selector */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Select Student</p>
                <div className="relative" ref={dropdownRef}>
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => { setStudentSearch(e.target.value); setDropdownOpen(true); }}
                    onFocus={() => setDropdownOpen(true)}
                    placeholder="Search by name, ID, roll no…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {dropdownOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                      {studentsLoading ? (
                        <div className="p-3 text-center text-sm text-gray-400">Loading…</div>
                      ) : filteredStudents.length === 0 ? (
                        <div className="p-3 text-center text-sm text-gray-400">No students found</div>
                      ) : (
                        filteredStudents.slice(0, 50).map((s) => (
                          <button
                            key={s._id}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors"
                            onClick={() => {
                              setSelectedStudent(s);
                              setStudentSearch(`${s.firstName} ${s.lastName}`);
                              setDropdownOpen(false);
                            }}
                          >
                            <p className="font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                            <p className="text-xs text-gray-500">
                              Class {s.class}-{s.section} · Roll {s.rollNumber} · {s.studentId}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {selectedStudent && (
                  <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <span>✓</span>
                    <span>{selectedStudent.firstName} {selectedStudent.lastName} selected</span>
                  </div>
                )}
              </div>

              {/* Manual fields */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Certificate Details</p>
                {MANUAL_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      value={manualFields[f.key]}
                      onChange={(e) =>
                        setManualFields((prev) => ({ ...prev, [f.key]: e.target.value }))
                      }
                      placeholder={f.placeholder}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: certificate preview */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Certificate Preview</p>
                {selectedStudent && (
                  <button
                    onClick={handlePrint}
                    className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    🖨️ Print / Save PDF
                  </button>
                )}
              </div>

              {!selectedStudent ? (
                <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center h-64 text-gray-400 text-sm">
                  Select a student to preview the certificate
                </div>
              ) : (
                <CertificateDocument
                  resolvedBody={resolvedBody}
                  vars={vars}
                  school={school}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
