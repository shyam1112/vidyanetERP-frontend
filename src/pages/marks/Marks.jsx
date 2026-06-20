import { useState, useEffect, useCallback } from 'react';
import { getMarks, deleteMarks } from '../../api/marksApi';
import { getExamTypes } from '../../api/examTypeApi';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import MarksForm from './MarksForm';
import { MarksheetContent } from './Marksheet';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

import { ACADEMIC_YEARS } from '../../constants/academicYears';
import { getGradeConfig } from '../../api/gradeConfigApi';
import { gradeVariant } from '../../utils/gradeUtils';

export default function Marks() {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ examType: '', class: '', academicYear: '', result: 'pass' });
  const [showModal, setShowModal] = useState(false);
  const [editMark, setEditMark] = useState(null);
  const [viewMarkId, setViewMarkId] = useState(null);
  const [examTypes, setExamTypes] = useState([]);
  const [gradeRanges, setGradeRanges] = useState([]);
  const limit = 15;

  const fetchMarks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMarks({ page, limit, ...filters });
      setMarks(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load marks');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchMarks(); }, [fetchMarks]);
  useEffect(() => { getExamTypes().then((r) => setExamTypes(r.data.data)).catch(() => {}); }, []);
  useEffect(() => { getGradeConfig().then((r) => setGradeRanges(r.data.data.grades || [])).catch(() => {}); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this marks record?')) return;
    try {
      await deleteMarks(id);
      toast.success('Deleted');
      fetchMarks();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditMark(null);
    fetchMarks();
  };

  const setFilter = (k) => (e) => { setFilters((prev) => ({ ...prev, [k]: e.target.value })); setPage(1); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Marks</h2>
          <p className="text-sm text-gray-500">{total} records</p>
        </div>
        <button onClick={() => { setEditMark(null); setShowModal(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          + Add Marks
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-3">
        <select value={filters.examType} onChange={setFilter('examType')} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Exams</option>
          {examTypes.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={filters.class} onChange={setFilter('class')} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Classes</option>
          {['1','2','3','4','5','6','7','8','9','10','11','12'].map((c) => (
            <option key={c} value={c}>Class {c}</option>
          ))}
        </select>
        <select value={filters.academicYear} onChange={setFilter('academicYear')} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Years</option>
          {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filters.result} onChange={setFilter('result')} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Results</option>
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : marks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No marks found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Student', 'Class', 'Exam', 'Total', 'Obtained', 'Percentage', 'Grade', 'Result', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {marks.map((m) => (
                  <tr key={m._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{m.student?.firstName} {m.student?.lastName}</p>
                      <p className="text-xs text-gray-500">Roll: {m.student?.rollNumber}</p>
                    </td>
                    <td className="px-4 py-3">{m.class}-{m.section}</td>
                    <td className="px-4 py-3 capitalize">{m.examType?.replace(/-/g, ' ')}</td>
                    <td className="px-4 py-3">{m.totalMaxMarks}</td>
                    <td className="px-4 py-3 font-medium">{m.totalObtainedMarks}</td>
                    <td className="px-4 py-3">{m.percentage}%</td>
                    <td className="px-4 py-3"><Badge variant={gradeVariant(m.overallGrade, gradeRanges)}>{m.overallGrade}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={m.result === 'pass' ? 'success' : 'danger'}>{m.result}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setViewMarkId(m._id)} className="text-gray-500 hover:text-gray-800 text-xs font-medium">View</button>
                        <button onClick={() => { setEditMark(m); setShowModal(true); }} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Edit</button>
                        <button onClick={() => handleDelete(m._id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > limit && (
          <div className="p-4 border-t flex items-center justify-between text-sm text-gray-600">
            <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border disabled:opacity-40">Prev</button>
              <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editMark ? 'Edit Marks' : 'Add Marks'} size="lg">
        <MarksForm mark={editMark} onSaved={handleSaved} onCancel={() => setShowModal(false)} />
      </Modal>

      {/* Marksheet modal */}
      {viewMarkId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewMarkId(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
              <h3 className="text-base font-semibold text-gray-900">Mark Sheet</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    document.body.classList.add('print-marksheet');
                    window.print();
                    window.addEventListener('afterprint', () => {
                      document.body.classList.remove('print-marksheet');
                    }, { once: true });
                  }}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  🖨️ Print / Save PDF
                </button>
                <button onClick={() => setViewMarkId(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 bg-gray-100 p-6">
              <style>{`
                @media print {
                  body.print-marksheet > * { visibility: hidden; }
                  body.print-marksheet .marksheet-page,
                  body.print-marksheet .marksheet-page * { visibility: visible; }
                  body.print-marksheet .marksheet-page {
                    position: fixed !important;
                    top: 0 !important; left: 0 !important;
                    width: 100% !important;
                    max-width: none !important;
                    margin: 0 !important;
                    padding: 10px 18px !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                  }
                  body.print-marksheet .marksheet-page h1 { font-size: 18px !important; }
                  body.print-marksheet .marksheet-page h2 { font-size: 13px !important; }
                  body.print-marksheet .marksheet-page table td,
                  body.print-marksheet .marksheet-page table th { padding: 4px 8px !important; font-size: 11px !important; }
                  body.print-marksheet .marksheet-page p,
                  body.print-marksheet .marksheet-page span,
                  body.print-marksheet .marksheet-page div { font-size: 11px !important; }
                }
                @page { size: A4 portrait; margin: 8mm; }
              `}</style>
              <MarksheetContent markId={viewMarkId} schoolName={user?.schoolName} schoolPhone={user?.phone} schoolAddress={user?.address} schoolCity={user?.city} schoolState={user?.state} />
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
