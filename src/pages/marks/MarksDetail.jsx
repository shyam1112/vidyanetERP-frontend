import { useEffect, useState } from 'react';
import { getMark } from '../../api/marksApi';
import { getGradeConfig } from '../../api/gradeConfigApi';
import Badge from '../../components/common/Badge';
import { gradeVariant } from '../../utils/gradeUtils';
import toast from 'react-hot-toast';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const Stat = ({ label, value, highlight }) => (
  <div className={`rounded-lg p-3 text-center ${highlight ? 'bg-indigo-50' : 'bg-gray-50'}`}>
    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
    <p className={`text-lg font-bold mt-0.5 ${highlight ? 'text-indigo-700' : 'text-gray-800'}`}>{value}</p>
  </div>
);

export default function MarksDetail({ markId }) {
  const [mark, setMark] = useState(null);
  const [gradeRanges, setGradeRanges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!markId) return;
    setLoading(true);
    Promise.all([getMark(markId), getGradeConfig()])
      .then(([markRes, gradeRes]) => {
        setMark(markRes.data.data);
        setGradeRanges(gradeRes.data.data.grades || []);
      })
      .catch(() => toast.error('Failed to load marks details'))
      .finally(() => setLoading(false));
  }, [markId]);

  if (loading) return <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>;
  if (!mark) return null;

  const examLabel = mark.examType?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {mark.student?.firstName} {mark.student?.lastName}
          </h2>
          <p className="text-sm text-gray-500 font-mono">{mark.student?.studentId}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Class {mark.class} – {mark.section} &nbsp;|&nbsp; Roll {mark.student?.rollNumber}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-700">{examLabel}</p>
          <p className="text-xs text-gray-400">{mark.academicYear}</p>
          {mark.examDate && <p className="text-xs text-gray-400 mt-0.5">{formatDate(mark.examDate)}</p>}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        <Stat label="Total Marks" value={mark.totalMaxMarks} />
        <Stat label="Obtained" value={mark.totalObtainedMarks} highlight />
        <Stat label="Percentage" value={`${mark.percentage}%`} highlight />
        <Stat label="Grade" value={
          <Badge variant={gradeVariant(mark.overallGrade, gradeRanges)}>{mark.overallGrade}</Badge>
        } />
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={mark.result === 'pass' ? 'success' : 'danger'}>
          {mark.result?.toUpperCase()}
        </Badge>
        {mark.rank && (
          <span className="text-sm text-gray-500">Rank: <span className="font-semibold text-gray-700">#{mark.rank}</span></span>
        )}
      </div>

      {/* Subject-wise table */}
      {mark.subjects?.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3 pb-1 border-b border-indigo-50">
            Subject-wise Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Subject', 'Max Marks', 'Obtained', '%', 'Grade', 'Remarks'].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mark.subjects.map((s, idx) => {
                  const pct = s.maxMarks ? ((s.obtainedMarks / s.maxMarks) * 100).toFixed(1) : '—';
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-800">{s.subject}</td>
                      <td className="px-3 py-2 text-gray-600">{s.maxMarks}</td>
                      <td className="px-3 py-2 font-semibold text-gray-900">{s.obtainedMarks}</td>
                      <td className="px-3 py-2 text-gray-600">{pct}%</td>
                      <td className="px-3 py-2">
                        <Badge variant={gradeVariant(s.grade, gradeRanges)}>{s.grade}</Badge>
                      </td>
                      <td className="px-3 py-2 text-gray-500">{s.remarks || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grade legend */}
      {gradeRanges.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Grade Scale</p>
          <div className="flex flex-wrap gap-2">
            {[...gradeRanges]
              .sort((a, b) => b.minPercent - a.minPercent)
              .map((g, i, arr) => {
                const next = arr[i + 1];
                const label = next ? `${g.minPercent}–${next.minPercent - 1}%` : `${g.minPercent}–100%`;
                return (
                  <div key={i} className="flex items-center gap-1 text-xs bg-white border border-gray-200 rounded px-2 py-1">
                    <Badge variant={gradeVariant(g.grade, gradeRanges)}>{g.grade}</Badge>
                    <span className="text-gray-400">{label}</span>
                  </div>
                );
              }).reverse()}
          </div>
        </div>
      )}
    </div>
  );
}
