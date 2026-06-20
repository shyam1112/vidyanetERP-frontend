import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMark } from '../../api/marksApi';
import { getGradeConfig } from '../../api/gradeConfigApi';
import { useAuth } from '../../context/AuthContext';
import { assignGrade, gradeVariant } from '../../utils/gradeUtils';
import toast from 'react-hot-toast';

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const toLabel = (t) =>
  t ? t.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';

const GRADE_COLORS = {
  success: '#16a34a', info: '#2563eb', warning: '#d97706', danger: '#dc2626', default: '#6b7280',
};

function GradePill({ grade, gradeRanges }) {
  const color = GRADE_COLORS[gradeVariant(grade, gradeRanges)] || GRADE_COLORS.default;
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#fff', backgroundColor: color }}>
      {grade}
    </span>
  );
}

// ─── Shared printable content ────────────────────────────────────────────────
export function MarksheetContent({ markId, schoolName, schoolPhone, schoolAddress, schoolCity, schoolState }) {
  const [mark, setMark] = useState(null);
  const [gradeRanges, setGradeRanges] = useState([]);
  const [overallGradeRanges, setOverallGradeRanges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!markId) return;
    setLoading(true);
    setMark(null);
    Promise.all([getMark(markId), getGradeConfig()])
      .then(([mRes, gRes]) => {
        setMark(mRes.data.data);
        setGradeRanges(gRes.data.data.grades || []);
        setOverallGradeRanges(gRes.data.data.overallGrades || []);
      })
      .catch(() => toast.error('Failed to load marksheet'))
      .finally(() => setLoading(false));
  }, [markId]);

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: '#999', fontSize: 14 }}>Loading...</div>;
  if (!mark) return null;

  const sortedGrades = [...gradeRanges].sort((a, b) => a.minPercent - b.minPercent);
  const effectiveOverallRanges = overallGradeRanges.length > 0 ? overallGradeRanges : gradeRanges;
  const overallGrade = mark.overallGradeOverride
    ? mark.overallGrade
    : effectiveOverallRanges.length > 0
      ? assignGrade(mark.percentage, effectiveOverallRanges)
      : mark.overallGrade;

  return (
    <div
      className="marksheet-page"
      style={{
        maxWidth: 794, margin: '0 auto', background: '#fff',
        padding: '40px 48px', boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        borderRadius: 4, fontFamily: 'Georgia, "Times New Roman", serif', color: '#111',
      }}
    >
      {/* School Header */}
      <div style={{ textAlign: 'center', borderBottom: '3px double #1e3a5f', paddingBottom: 10, marginBottom: 14 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#1e3a5f', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          {(schoolName || 'S')[0].toUpperCase()}
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1e3a5f', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          {schoolName || 'School Name'}
        </h1>
        {schoolAddress && (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#555' }}>{schoolAddress}</p>
        )}
        {(schoolCity || schoolState || schoolPhone) && (
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#555' }}>
            {[schoolCity, schoolState].filter(Boolean).join(', ')}
            {schoolPhone ? ([schoolCity, schoolState].some(Boolean) ? '  |  ' : '') + '📞 ' + schoolPhone : ''}
          </p>
        )}
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', margin: '0 0 14px' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1e3a5f' }}>
          Mark Sheet
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 6 }}>
          <span style={{ fontSize: 13, color: '#444' }}><strong>Examination:</strong> {toLabel(mark.examType)}</span>
          <span style={{ fontSize: 13, color: '#444' }}><strong>Academic Year:</strong> {mark.academicYear}</span>
          {mark.examDate && <span style={{ fontSize: 13, color: '#444' }}><strong>Date:</strong> {fmt(mark.examDate)}</span>}
        </div>
      </div>

      {/* Student Info */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14, border: '1px solid #c0c0c0' }}>
        <tbody>
          <tr style={{ background: '#f0f4f8' }}>
            <td style={tdLabel}>Student Name</td>
            <td style={tdValue}>{mark.student?.firstName} {mark.student?.lastName}</td>
            <td style={tdLabel}>Roll Number</td>
            <td style={tdValue}>{mark.student?.rollNumber || '—'}</td>
          </tr>
          <tr>
            <td style={tdLabel}>Class & Section</td>
            <td style={tdValue}>Class {mark.class} – {mark.section}</td>
            <td style={tdLabel}>Student ID</td>
            <td style={{ ...tdValue, fontFamily: 'monospace', fontSize: 12 }}>{mark.student?.studentId || '—'}</td>
          </tr>
        </tbody>
      </table>

      {/* Marks Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0, border: '1px solid #c0c0c0' }}>
        <thead>
          <tr style={{ background: '#1e3a5f', color: '#fff' }}>
            {['S.No', 'Subject', 'Max Marks', 'Obtained Marks', 'Percentage', 'Grade', 'Remarks'].map((h) => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mark.subjects?.map((s, idx) => {
            const pctNum = s.maxMarks ? (s.obtainedMarks / s.maxMarks) * 100 : 0;
            const subjectGrade = s.gradeOverride
              ? s.grade
              : gradeRanges.length > 0 ? assignGrade(pctNum, gradeRanges) : s.grade;
            return (
              <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={{ ...tdBody, textAlign: 'center', color: '#666' }}>{idx + 1}</td>
                <td style={{ ...tdBody, fontWeight: 600 }}>{s.subject}</td>
                <td style={{ ...tdBody, textAlign: 'center' }}>{s.maxMarks}</td>
                <td style={{ ...tdBody, textAlign: 'center', fontWeight: 700 }}>{s.obtainedMarks}</td>
                <td style={{ ...tdBody, textAlign: 'center' }}>{s.maxMarks ? pctNum.toFixed(1) : '—'}%</td>
                <td style={{ ...tdBody, textAlign: 'center' }}><GradePill grade={subjectGrade} gradeRanges={gradeRanges} /></td>
                <td style={{ ...tdBody, color: '#666', fontSize: 12 }}>{s.remarks || '—'}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ background: '#1e3a5f', color: '#fff', fontWeight: 700 }}>
            <td colSpan={2} style={{ ...tdBody, color: '#fff', fontWeight: 700, textAlign: 'right' }}>Total</td>
            <td style={{ ...tdBody, color: '#fff', textAlign: 'center' }}>{mark.totalMaxMarks}</td>
            <td style={{ ...tdBody, color: '#fff', textAlign: 'center' }}>{mark.totalObtainedMarks}</td>
            <td style={{ ...tdBody, color: '#fff', textAlign: 'center' }}>{mark.percentage}%</td>
            <td style={{ ...tdBody, textAlign: 'center' }}><GradePill grade={overallGrade} gradeRanges={effectiveOverallRanges} /></td>
            <td style={{ ...tdBody, color: '#fff' }}></td>
          </tr>
        </tfoot>
      </table>

      {/* Result Banner */}
      <div style={{ margin: '12px 0', padding: '12px 24px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: mark.result === 'pass' ? '#f0fdf4' : '#fff1f2', border: `2px solid ${mark.result === 'pass' ? '#16a34a' : '#dc2626'}` }}>
        <div>
          <span style={{ fontSize: 13, color: '#555' }}>Overall Result: </span>
          <span style={{ fontSize: 22, fontWeight: 800, color: mark.result === 'pass' ? '#16a34a' : '#dc2626', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {mark.result === 'pass' ? '✓ PASS' : '✗ FAIL'}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: '#555' }}>Percentage</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1e3a5f' }}>{mark.percentage}%</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: '#555' }}>Overall Grade</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1e3a5f' }}>{overallGrade}</div>
        </div>
        {mark.rank && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: '#555' }}>Class Rank</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1e3a5f' }}>#{mark.rank}</div>
          </div>
        )}
      </div>

      {/* Grade Scale */}
      {sortedGrades.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Grade Scale</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[...sortedGrades].reverse().map((g, i, arr) => {
              const lower = arr[i + 1];
              const range = lower ? `${g.minPercent}–${lower.minPercent - 1}%` : `${g.minPercent}–100%`;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, border: '1px solid #ddd', borderRadius: 4, padding: '2px 8px', fontSize: 11, background: '#fafafa' }}>
                  <GradePill grade={g.grade} gradeRanges={gradeRanges} />
                  <span style={{ color: '#666' }}>{range}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Signature Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 12, borderTop: '1px solid #ddd' }}>
        {['Class Teacher', 'Examiner', 'Principal'].map((label) => (
          <div key={label} style={{ textAlign: 'center', width: '28%' }}>
            <div style={{ borderBottom: '1px solid #333', marginBottom: 6, height: 40 }}></div>
            <p style={{ margin: 0, fontSize: 12, color: '#444', fontWeight: 600 }}>{label}</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#888' }}>Signature & Date</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 10, color: '#aaa', borderTop: '1px solid #eee', paddingTop: 10 }}>
        This is a computer-generated marksheet. Issued by {schoolName || 'School'} via Vidyanet ERP.
      </p>
    </div>
  );
}

// ─── Standalone page (direct URL access) ─────────────────────────────────────
export default function Marksheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
          .marksheet-page { box-shadow: none !important; margin: 0 !important; padding: 16px 24px !important; max-width: 100% !important; zoom: 0.78; }
        }
        @page { size: A4 portrait; margin: 6mm; }
      `}</style>

      <div className="no-print bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/marks')} className="text-sm text-gray-600 hover:text-gray-900 font-medium">
          ← Back to Marks
        </button>
        <button onClick={() => window.print()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          🖨️ Print / Save PDF
        </button>
      </div>

      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <MarksheetContent markId={id} schoolName={user?.schoolName} schoolPhone={user?.phone} schoolAddress={user?.address} schoolCity={user?.city} schoolState={user?.state} />
      </div>
    </>
  );
}

const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', borderRight: '1px solid rgba(255,255,255,0.2)' };
const tdLabel = { padding: '8px 12px', fontSize: 12, fontWeight: 700, color: '#444', borderRight: '1px solid #d0d0d0', borderBottom: '1px solid #d0d0d0', width: '18%', background: 'inherit', textTransform: 'uppercase', letterSpacing: '0.04em' };
const tdValue = { padding: '8px 12px', fontSize: 13, fontWeight: 600, color: '#111', borderRight: '1px solid #d0d0d0', borderBottom: '1px solid #d0d0d0', width: '32%' };
const tdBody  = { padding: '8px 12px', fontSize: 13, borderRight: '1px solid #d0d0d0', borderBottom: '1px solid #e0e0e0' };
