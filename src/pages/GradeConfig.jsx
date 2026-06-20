import { useState, useEffect } from 'react';
import { getGradeConfig, saveGradeConfig } from '../api/gradeConfigApi';
import toast from 'react-hot-toast';

const DEFAULT_GRADES = [
  { grade: 'A+', minPercent: 90 },
  { grade: 'A',  minPercent: 80 },
  { grade: 'B+', minPercent: 70 },
  { grade: 'B',  minPercent: 60 },
  { grade: 'C',  minPercent: 50 },
  { grade: 'D',  minPercent: 35 },
  { grade: 'F',  minPercent: 0  },
];

const DEFAULT_OVERALL_GRADES = [
  { grade: 'A+', minPercent: 90 },
  { grade: 'A',  minPercent: 80 },
  { grade: 'B+', minPercent: 70 },
  { grade: 'B',  minPercent: 60 },
  { grade: 'C',  minPercent: 50 },
  { grade: 'D',  minPercent: 35 },
  { grade: 'F',  minPercent: 0  },
];

function desc(grades) {
  return [...grades].sort((a, b) => b.minPercent - a.minPercent);
}

function GradeTable({ grades, onChange }) {
  const updateRow = (i, field, value) => {
    onChange(grades.map((g, idx) =>
      idx === i ? { ...g, [field]: field === 'minPercent' ? Number(value) : value } : g
    ));
  };
  const addRow  = () => onChange([...grades, { grade: '', minPercent: 0 }]);
  const removeRow = (i) => onChange(grades.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="grid grid-cols-12 gap-3 mb-2 px-1">
        <span className="col-span-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade Label</span>
        <span className="col-span-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Min Percentage (%)</span>
        <span className="col-span-3" />
      </div>
      <div className="space-y-2">
        {grades.map((g, i) => (
          <div key={i} className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-4">
              <input
                type="text"
                value={g.grade}
                onChange={(e) => updateRow(i, 'grade', e.target.value)}
                placeholder="e.g. A+"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-5 flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={g.minPercent}
                onChange={(e) => updateRow(i, 'minPercent', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-400 shrink-0">% and above</span>
            </div>
            <div className="col-span-3 flex justify-end">
              <button
                onClick={() => removeRow(i)}
                className="text-red-400 hover:text-red-600 transition-colors text-lg leading-none px-2"
                title="Remove"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={addRow}
        className="mt-4 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
      >
        <span className="text-lg leading-none">+</span> Add Grade
      </button>
    </div>
  );
}

function GradePreview({ grades }) {
  if (!grades.length) return null;
  const sorted = desc(grades);
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Preview</p>
      <div className="flex flex-wrap gap-2">
        {[...sorted].reverse().map((g, i) => {
          const upper = sorted[i === 0 ? 0 : sorted.length - 1 - i + 1];
          const next  = sorted[sorted.length - 1 - i - 1];
          const rangeHigh = next ? next.minPercent - 1 : 100;
          return (
            <div key={i} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs">
              <span className="font-bold text-indigo-700">{g.grade}</span>
              <span className="text-gray-400">{g.minPercent}% – {rangeHigh}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GradeConfig() {
  const [grades,        setGrades]        = useState(DEFAULT_GRADES);
  const [overallGrades, setOverallGrades] = useState(DEFAULT_OVERALL_GRADES);
  const [passPercent,   setPassPercent]   = useState(35);
  const [loading,       setLoading]       = useState(false);
  const [fetching,      setFetching]      = useState(true);

  useEffect(() => {
    getGradeConfig()
      .then((res) => {
        setGrades(desc(res.data.data.grades || DEFAULT_GRADES));
        setOverallGrades(desc(res.data.data.overallGrades || DEFAULT_OVERALL_GRADES));
        setPassPercent(res.data.data.passPercent ?? 35);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const handleSave = async () => {
    for (const g of grades) {
      if (!g.grade.trim()) { toast.error('Subject grade label cannot be empty'); return; }
    }
    for (const g of overallGrades) {
      if (!g.grade.trim()) { toast.error('Overall grade label cannot be empty'); return; }
    }
    setLoading(true);
    try {
      await saveGradeConfig({ grades: desc(grades), overallGrades: desc(overallGrades), passPercent });
      setGrades(desc(grades));
      setOverallGrades(desc(overallGrades));
      toast.success('Grade configuration saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setGrades(DEFAULT_GRADES);
    setOverallGrades(DEFAULT_OVERALL_GRADES);
    setPassPercent(35);
  };

  if (fetching) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Grade Configuration</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Configure grade thresholds for subject marks and the overall result shown on the marksheet.
        </p>
      </div>

      {/* Pass Percentage */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-md">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-700">Pass Percentage</p>
            <p className="text-xs text-gray-400 mt-0.5">Students scoring below this overall are marked Fail</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={passPercent}
              onChange={(e) => setPassPercent(Number(e.target.value))}
              className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </div>
      </div>

      {/* Grade tables side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Overall Grade Config — left */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Overall Grade Configuration</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Grade shown on the marksheet overall result based on the student's total percentage across all subjects.
            </p>
          </div>
          <GradeTable grades={overallGrades} onChange={setOverallGrades} />
          <GradePreview grades={overallGrades} />
        </div>

        {/* Subject-wise Grade Config — right */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Subject Grade Configuration</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Grade assigned to each subject based on marks obtained. Grades are assigned top-down — highest minPercent wins.
            </p>
          </div>
          <GradeTable grades={grades} onChange={setGrades} />
          <GradePreview grades={grades} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Reset to Default
        </button>
      </div>
    </div>
  );
}
