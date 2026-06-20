import { useState, useEffect, useCallback } from 'react';
import { getAllFeeConfigs, saveFeeConfig, deleteFeeConfig } from '../api/feeConfigApi';
import toast from 'react-hot-toast';
import { ACADEMIC_YEARS } from '../constants/academicYears';

const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const FEE_TYPES = ['tuition', 'transport', 'library', 'sports', 'laboratory', 'examination', 'other'];
const EMPTY_ITEM = { feeType: '', description: '', amount: '' };

const cellCls = 'w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function FeeConfig() {
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [selectedClass, setSelectedClass] = useState('1');
  const [configuredClasses, setConfiguredClasses] = useState(new Set());
  const [feeItems, setFeeItems] = useState([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch all configs to know which classes have configs (for indicators)
  const fetchAllConfigs = useCallback(async () => {
    try {
      const res = await getAllFeeConfigs({ academicYear });
      const classes = new Set((res.data.data || []).map((c) => c.class));
      setConfiguredClasses(classes);
    } catch {
      // silently fail
    }
  }, [academicYear]);

  useEffect(() => { fetchAllConfigs(); }, [fetchAllConfigs]);

  // Fetch config for selected class + year
  useEffect(() => {
    const fetchClassConfig = async () => {
      try {
        const res = await getAllFeeConfigs({ academicYear });
        const all = res.data.data || [];
        const match = all.find((c) => c.class === selectedClass);
        if (match?.feeItems?.length) {
          setFeeItems(match.feeItems.map((i) => ({ ...i, amount: String(i.amount) })));
        } else {
          setFeeItems([{ ...EMPTY_ITEM }]);
        }
      } catch {
        setFeeItems([{ ...EMPTY_ITEM }]);
      }
    };
    fetchClassConfig();
  }, [selectedClass, academicYear]);

  const updateItem = (i, field, value) =>
    setFeeItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));

  const addItem = () => setFeeItems((prev) => [...prev, { ...EMPTY_ITEM }]);

  const removeItem = (i) => setFeeItems((prev) => prev.filter((_, idx) => idx !== i));

  const subtotal = feeItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  const handleSave = async () => {
    const valid = feeItems.filter((i) => i.feeType && parseFloat(i.amount) > 0);
    if (valid.length === 0) {
      toast.error('Add at least one fee item with a type and amount');
      return;
    }
    setSaving(true);
    try {
      await saveFeeConfig(selectedClass, {
        academicYear,
        feeItems: valid.map((i) => ({ feeType: i.feeType, description: i.description, amount: parseFloat(i.amount) })),
      });
      toast.success(`Class ${selectedClass} fee config saved`);
      fetchAllConfigs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!configuredClasses.has(selectedClass)) return;
    if (!confirm(`Remove fee configuration for Class ${selectedClass}?`)) return;
    setDeleting(true);
    try {
      await deleteFeeConfig(selectedClass, { academicYear });
      toast.success(`Class ${selectedClass} config removed`);
      setFeeItems([{ ...EMPTY_ITEM }]);
      fetchAllConfigs();
    } catch {
      toast.error('Failed to remove');
    } finally {
      setDeleting(false);
    }
  };

  const isSaved = configuredClasses.has(selectedClass);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fees Configuration</h2>
          <p className="text-sm text-gray-500">Set default fee structure per class — auto-filled when adding fees</p>
        </div>
        <select
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="flex gap-5 items-start">
        {/* Class picker */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 w-40 shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Class</p>
          <div className="flex flex-col gap-1">
            {CLASSES.map((cls) => {
              const active = cls === selectedClass;
              const saved = configuredClasses.has(cls);
              return (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>Class {cls}</span>
                  {saved && (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-indigo-200' : 'bg-green-500'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Class {selectedClass} — Fee Structure</h3>
              {isSaved && (
                <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 mt-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Configured for {academicYear}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <span className="text-lg leading-none">+</span> Add Item
            </button>
          </div>

          {/* Fee items table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 bg-gray-50 px-3 py-2 border-b border-gray-200">
              <span className="col-span-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fee Type</span>
              <span className="col-span-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</span>
              <span className="col-span-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount (₹)</span>
              <span className="col-span-1" />
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-100">
              {feeItems.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center">
                  <div className="col-span-4">
                    <select value={item.feeType} onChange={(e) => updateItem(i, 'feeType', e.target.value)} className={cellCls}>
                      <option value="">Select</option>
                      {FEE_TYPES.map((t) => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(i, 'description', e.target.value)}
                      placeholder="Optional note"
                      className={cellCls}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0"
                      value={item.amount}
                      onChange={(e) => updateItem(i, 'amount', e.target.value)}
                      placeholder="0"
                      className={cellCls}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {feeItems.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-xl leading-none">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 bg-gray-50 px-3 py-2.5 flex justify-between items-center text-sm">
              <span className="text-gray-500">Total per student</span>
              <span className="font-bold text-indigo-700 text-base">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700">
            <span className="text-base leading-none">💡</span>
            <span>
              When you add a fee record for a <strong>Class {selectedClass}</strong> student, these items will be
              auto-filled. You can still edit or add more items before saving.
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            {isSaved && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50 disabled:opacity-60"
              >
                {deleting ? 'Removing...' : 'Remove Config'}
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="ml-auto bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : `Save Class ${selectedClass} Config`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
