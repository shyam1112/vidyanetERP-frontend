import { useState, useEffect, useRef } from 'react';
import { createMarks, updateMarks } from '../../api/marksApi';
import { getStudents } from '../../api/studentApi';
import { getExamTypes, createExamType } from '../../api/examTypeApi';
import { getGradeConfig } from '../../api/gradeConfigApi';
import { assignGrade } from '../../utils/gradeUtils';
import toast from 'react-hot-toast';

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer', 'Physical Education'];
import { ACADEMIC_YEARS } from '../../constants/academicYears';
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

function StudentSearch({ students, selectedId, onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = students.find((s) => s._id === selectedId);

  const filtered = query.trim()
    ? students.filter((s) =>
        `${s.firstName} ${s.lastName} ${s.studentId} ${s.class}-${s.section}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : students;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (student) => {
    onSelect(student);
    setQuery('');
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onSelect(null);
    setQuery('');
  };

  return (
    <div ref={ref} className="relative">
      {selected && !open ? (
        <div className="flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <div>
            <span className="font-medium text-gray-900">{selected.firstName} {selected.lastName}</span>
            <span className="ml-2 text-gray-500 text-xs">Class {selected.class}-{selected.section} · {selected.studentId}</span>
          </div>
          <button type="button" onClick={handleClear} className="text-gray-400 hover:text-red-500 text-base leading-none ml-2">✕</button>
        </div>
      ) : (
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className={inputCls}
          placeholder="Search student by name or ID..."
          autoComplete="off"
        />
      )}

      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-400">No students found</li>
          ) : (
            filtered.map((s) => (
              <li
                key={s._id}
                onMouseDown={() => handleSelect(s)}
                className="flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer hover:bg-indigo-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{s.firstName} {s.lastName}</span>
                <span className="text-xs text-gray-500">Class {s.class}-{s.section} · {s.studentId}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default function MarksForm({ mark, onSaved, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [gradeRanges, setGradeRanges] = useState([]);
  const [overallGradeRanges, setOverallGradeRanges] = useState([]);
  const [overallGrade, setOverallGrade] = useState(mark?.overallGrade || '');
  const [overallGradeOverride, setOverallGradeOverride] = useState(mark?.overallGradeOverride || false);
  const [showNewExam, setShowNewExam] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [examCreating, setExamCreating] = useState(false);
  const [subjects, setSubjects] = useState(
    mark?.subjects?.map((s) => ({ ...s, gradeOverride: s.gradeOverride || false })) ||
    SUBJECTS.map((s) => ({ subject: s, maxMarks: 100, obtainedMarks: 0, grade: '', gradeOverride: false }))
  );
  const [form, setForm] = useState({
    student: mark?.student?._id || '',
    examType: mark?.examType || '',
    class: mark?.class || '',
    section: mark?.section || '',
    academicYear: mark?.academicYear || '2025-2026',
    examDate: mark?.examDate?.split('T')[0] || '',
    result: mark?.result || 'pass',
  });

  const loadExamTypes = () =>
    getExamTypes().then((res) => setExamTypes(res.data.data)).catch(() => {});

  useEffect(() => {
    getStudents({ limit: 500 }).then((res) => setStudents(res.data.data)).catch(() => {});
    loadExamTypes();
    getGradeConfig().then((res) => {
      setGradeRanges(res.data.data.grades || []);
      setOverallGradeRanges(res.data.data.overallGrades || res.data.data.grades || []);
    }).catch(() => {});
  }, []);

  // Auto-calculate subject grades once grade config loads
  useEffect(() => {
    if (gradeRanges.length === 0) return;
    setSubjects((prev) => prev.map((s) => {
      if (s.gradeOverride) return s;
      if (!s.maxMarks || s.obtainedMarks === undefined) return s;
      return { ...s, grade: assignGrade((s.obtainedMarks / s.maxMarks) * 100, gradeRanges) };
    }));
  }, [gradeRanges]);

  // Auto-calculate overall grade whenever subjects or overallGradeRanges change (unless overridden)
  useEffect(() => {
    if (overallGradeOverride || overallGradeRanges.length === 0) return;
    const tot     = subjects.reduce((s, r) => s + Number(r.obtainedMarks || 0), 0);
    const maxTot  = subjects.reduce((s, r) => s + Number(r.maxMarks || 0), 0);
    if (maxTot === 0) return;
    setOverallGrade(assignGrade((tot / maxTot) * 100, overallGradeRanges));
  }, [subjects, overallGradeRanges, overallGradeOverride]);

  const handleExamTypeChange = (e) => {
    if (e.target.value === '__create__') {
      setShowNewExam(true);
    } else {
      setField('examType')(e);
    }
  };

  const handleCreateExam = async () => {
    if (!newExamName.trim()) return toast.error('Exam name is required');
    setExamCreating(true);
    try {
      await createExamType(newExamName.trim());
      await loadExamTypes();
      setForm((p) => ({ ...p, examType: newExamName.trim() }));
      setShowNewExam(false);
      setNewExamName('');
      toast.success('Exam type created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create exam type');
    } finally {
      setExamCreating(false);
    }
  };

  const setField = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleStudentSelect = (student) => {
    if (student) {
      setForm((p) => ({ ...p, student: student._id, class: student.class, section: student.section }));
    } else {
      setForm((p) => ({ ...p, student: '', class: '', section: '' }));
    }
  };

  const updateSubject = (idx, field, val) => {
    setSubjects((prev) => {
      const next = [...prev];
      const updated = { ...next[idx], [field]: field === 'subject' ? val : Number(val) };
      // When marks change, clear manual override and auto-recalculate grade
      if ((field === 'obtainedMarks' || field === 'maxMarks') && updated.maxMarks > 0) {
        updated.gradeOverride = false;
        updated.grade = assignGrade((updated.obtainedMarks / updated.maxMarks) * 100, gradeRanges);
      }
      next[idx] = updated;
      return next;
    });
  };

  const updateSubjectGrade = (idx, grade) => {
    setSubjects((prev) => {
      const next = [...prev];
      if (!grade) {
        // User picked "Auto" — recalculate
        const s = next[idx];
        const calculated = s.maxMarks > 0 ? assignGrade((s.obtainedMarks / s.maxMarks) * 100, gradeRanges) : '';
        next[idx] = { ...s, grade: calculated, gradeOverride: false };
      } else {
        next[idx] = { ...next[idx], grade, gradeOverride: true };
      }
      return next;
    });
  };

  const addSubject = () => setSubjects((prev) => [...prev, { subject: '', maxMarks: 100, obtainedMarks: 0, grade: '', gradeOverride: false }]);
  const removeSubject = (idx) => setSubjects((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student) return toast.error('Please select a student');
    if (subjects.some((s) => !s.subject)) return toast.error('All subjects must have a name');
    setLoading(true);
    try {
      const payload = { ...form, subjects, overallGrade, overallGradeOverride };
      if (mark) {
        await updateMarks(mark._id, payload);
        toast.success('Marks updated');
      } else {
        await createMarks(payload);
        toast.success('Marks saved');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save marks');
    } finally {
      setLoading(false);
    }
  };

  const total = subjects.reduce((s, r) => s + Number(r.obtainedMarks || 0), 0);
  const maxTotal = subjects.reduce((s, r) => s + Number(r.maxMarks || 0), 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Student <span className="text-red-500">*</span></label>
          <StudentSearch
            students={students}
            selectedId={form.student}
            onSelect={handleStudentSelect}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type *</label>
          <select required value={form.examType} onChange={handleExamTypeChange} className={inputCls}>
            <option value="">Select exam</option>
            <option value="__create__">+ Create New Exam</option>
            {examTypes.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date</label>
          <input type="date" value={form.examDate} onChange={setField('examDate')} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
          <input value={form.class} readOnly className={`${inputCls} bg-gray-50 text-gray-500 cursor-not-allowed`} placeholder="Auto-filled" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
          <select value={form.section} onChange={setField('section')} className={inputCls}>
            <option value="">Select section</option>
            {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
          <select value={form.academicYear} onChange={setField('academicYear')} className={inputCls}>
            {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
          <select value={form.result} onChange={setField('result')} className={inputCls}>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
            <option value="absent">Absent</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Subjects & Marks</h4>
          <button type="button" onClick={addSubject} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">+ Add Subject</button>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium px-1">
            <span className="col-span-4">Subject</span>
            <span className="col-span-2">Max</span>
            <span className="col-span-2">Obtained</span>
            <span className="col-span-3">Grade <span className="text-gray-400 font-normal">(auto / override)</span></span>
            <span className="col-span-1"></span>
          </div>
          {subjects.map((sub, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <input value={sub.subject} onChange={(e) => updateSubject(idx, 'subject', e.target.value)} className={`col-span-4 ${inputCls}`} placeholder="Subject name" />
              <input type="number" value={sub.maxMarks} onChange={(e) => updateSubject(idx, 'maxMarks', e.target.value)} className={`col-span-2 ${inputCls}`} min="0" />
              <input type="number" value={sub.obtainedMarks} onChange={(e) => updateSubject(idx, 'obtainedMarks', e.target.value)} className={`col-span-2 ${inputCls}`} min="0" max={sub.maxMarks} />
              <div className="col-span-3">
                <select
                  value={sub.grade || ''}
                  onChange={(e) => updateSubjectGrade(idx, e.target.value)}
                  className={`${inputCls} ${sub.gradeOverride ? 'border-amber-400 bg-amber-50 text-amber-700 font-medium' : ''}`}
                  title={sub.gradeOverride ? 'Manually set — select Auto to revert' : 'Auto-calculated from marks'}
                >
                  <option value="">— Auto —</option>
                  {[...gradeRanges]
                    .sort((a, b) => b.minPercent - a.minPercent)
                    .map((g) => (
                      <option key={g.grade} value={g.grade}>
                        {g.grade}  (≥{g.minPercent}%)
                      </option>
                    ))}
                </select>
              </div>
              <button type="button" onClick={() => removeSubject(idx)} className="col-span-1 text-red-400 hover:text-red-600 text-lg leading-none text-center">&times;</button>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center justify-between gap-4 text-sm">
          <div>
            <span className="font-medium">Total: {total} / {maxTotal}</span>
            {maxTotal > 0 && <span className="ml-3 text-gray-500">({((total / maxTotal) * 100).toFixed(1)}%)</span>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-gray-500">Overall Grade</span>
            <select
              value={overallGrade}
              onChange={(e) => {
                if (!e.target.value) {
                  // Revert to auto
                  setOverallGradeOverride(false);
                  const tot    = subjects.reduce((s, r) => s + Number(r.obtainedMarks || 0), 0);
                  const maxTot = subjects.reduce((s, r) => s + Number(r.maxMarks || 0), 0);
                  setOverallGrade(maxTot > 0 ? assignGrade((tot / maxTot) * 100, overallGradeRanges) : '');
                } else {
                  setOverallGrade(e.target.value);
                  setOverallGradeOverride(true);
                }
              }}
              className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                overallGradeOverride
                  ? 'border-amber-400 bg-amber-50 text-amber-700 font-medium'
                  : 'border-gray-300'
              }`}
              title={overallGradeOverride ? 'Manually set — select Auto to revert' : 'Auto-calculated from total marks'}
            >
              <option value="">— Auto —</option>
              {[...overallGradeRanges]
                .sort((a, b) => b.minPercent - a.minPercent)
                .map((g) => (
                  <option key={g.grade} value={g.grade}>
                    {g.grade} (≥{g.minPercent}%)
                  </option>
                ))}
            </select>
            {overallGradeOverride && (
              <span className="text-xs text-amber-600 font-medium">Manual</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60">
          {loading ? 'Saving...' : mark ? 'Update Marks' : 'Save Marks'}
        </button>
      </div>

      {/* Create New Exam Modal */}
      {showNewExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Create New Exam Type</h3>
            <p className="text-xs text-gray-400 mb-4">This exam will be available for your school only.</p>
            <input
              type="text"
              value={newExamName}
              onChange={(e) => setNewExamName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateExam()}
              className={inputCls}
              placeholder="e.g. Quarterly Exam, Term 1..."
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => { setShowNewExam(false); setNewExamName(''); }}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateExam}
                disabled={examCreating}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60"
              >
                {examCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
