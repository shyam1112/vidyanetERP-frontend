import { useState, useEffect, useRef } from 'react';
import { createFee, updateFee, addPayment, deletePayment } from '../../api/feesApi';
import { getStudents } from '../../api/studentApi';
import { getFeeConfigByClass } from '../../api/feeConfigApi';
import toast from 'react-hot-toast';
import { ACADEMIC_YEARS } from '../../constants/academicYears';

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
const FEE_TYPES = ['tuition', 'transport', 'library', 'sports', 'laboratory', 'examination', 'other'];
const PAYMENT_METHODS = ['cash', 'online', 'cheque', 'dd'];
const EMPTY_ITEM = { feeType: '', description: '', amount: '' };

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtAmt  = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

// ── Student search combobox ────────────────────────────────────────────
function StudentSearch({ students, value, onChange, disabled }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (value && students.length > 0) {
      const s = students.find((st) => st._id === value);
      if (s) setQuery(`${s.firstName} ${s.lastName}`);
    }
  }, [value, students]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim().length === 0 ? [] : students.filter((s) => {
    const q = query.toLowerCase();
    return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      (s.studentId || '').toLowerCase().includes(q) ||
      String(s.class).includes(q) ||
      (s.rollNumber || '').toString().includes(q);
  }).slice(0, 8);

  const selectedStudent = students.find((s) => s._id === value);

  const handleSelect = (s) => { setQuery(`${s.firstName} ${s.lastName}`); setOpen(false); onChange(s._id); };
  const handleClear = () => { setQuery(''); setOpen(false); onChange(''); };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input type="text" value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(''); }}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          placeholder="Type name, ID or class..."
          disabled={disabled}
          className={`${inputCls} pr-8 ${value ? 'border-green-400 focus:ring-green-500' : ''}`} />
        {value
          ? <button type="button" onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">×</button>
          : <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">🔍</span>}
      </div>
      {selectedStudent && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5">
          <div className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs shrink-0">{selectedStudent.firstName[0]}</div>
          <span className="font-medium">{selectedStudent.firstName} {selectedStudent.lastName}</span>
          <span className="text-green-400">·</span>
          <span>Class {selectedStudent.class}-{selectedStudent.section}</span>
          <span className="text-green-400">·</span>
          <span className="font-mono">{selectedStudent.studentId}</span>
        </div>
      )}
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden">
          {filtered.map((s) => (
            <button key={s._id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handleSelect(s)}
              className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 flex items-center gap-3 border-b border-gray-50 last:border-b-0">
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">{s.firstName[0]}{s.lastName[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{s.firstName} {s.lastName}</p>
                <p className="text-xs text-gray-500">Class {s.class}-{s.section} · Roll {s.rollNumber} · <span className="font-mono">{s.studentId}</span></p>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && query.trim().length > 0 && filtered.length === 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 px-4 py-3 text-sm text-gray-500">
          No students found for "{query}"
        </div>
      )}
    </div>
  );
}

// ── Payment history section (edit mode only) ──────────────────────────
function PaymentSection({ fee, onUpdated }) {
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ amount: '', paidDate: new Date().toISOString().split('T')[0], paymentMethod: '', transactionId: '', remarks: '' });

  const balance = fee.balanceAmount ?? Math.max(0, (fee.finalAmount || 0) - (fee.paidAmount || 0));
  const paidPct  = fee.finalAmount > 0 ? Math.min(100, Math.round(((fee.paidAmount || 0) / fee.finalAmount) * 100)) : 0;
  const payments = fee.payments || [];

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleAdd = async () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (amt > balance + 0.01) { toast.error(`Amount exceeds balance ${fmtAmt(balance)}`); return; }
    setSaving(true);
    try {
      const res = await addPayment(fee._id, { ...form, amount: amt });
      toast.success('Payment recorded');
      setAdding(false);
      setForm({ amount: '', paidDate: new Date().toISOString().split('T')[0], paymentMethod: '', transactionId: '', remarks: '' });
      onUpdated(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (paymentId) => {
    if (!confirm('Remove this payment record?')) return;
    setDeleting(paymentId);
    try {
      const res = await deletePayment(fee._id, paymentId);
      toast.success('Payment removed');
      onUpdated(res.data.data);
    } catch {
      toast.error('Failed to remove payment');
    } finally {
      setDeleting(null);
    }
  };

  const cellCls = 'border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full';

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Summary bar */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-4 text-sm">
            <span className="text-gray-500">Total <strong className="text-gray-800 ml-1">{fmtAmt(fee.finalAmount)}</strong></span>
            <span className="text-green-600">Paid <strong className="ml-1">{fmtAmt(fee.paidAmount)}</strong></span>
            {balance > 0 && <span className="text-red-500">Balance <strong className="ml-1">{fmtAmt(balance)}</strong></span>}
          </div>
          <span className="text-xs font-semibold text-gray-500">{paidPct}%</span>
        </div>
        {/* progress bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${paidPct >= 100 ? 'bg-green-500' : paidPct > 0 ? 'bg-amber-400' : 'bg-gray-300'}`}
            style={{ width: `${paidPct}%` }}
          />
        </div>
      </div>

      {/* Payment list */}
      {payments.length > 0 && (
        <div className="divide-y divide-gray-100">
          {payments.map((p, i) => (
            <div key={p._id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs shrink-0">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-900">{fmtAmt(p.amount)}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600">{fmtDate(p.paidDate)}</span>
                  {p.paymentMethod && <><span className="text-gray-400">·</span><span className="uppercase text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{p.paymentMethod}</span></>}
                  {p.transactionId && <><span className="text-gray-400">·</span><span className="font-mono text-xs text-gray-500">{p.transactionId}</span></>}
                </div>
                {p.remarks && <p className="text-xs text-gray-400 mt-0.5">{p.remarks}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(p._id)}
                disabled={deleting === p._id}
                className="text-red-400 hover:text-red-600 text-xs shrink-0 disabled:opacity-40"
              >
                {deleting === p._id ? '...' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}

      {payments.length === 0 && (
        <div className="px-4 py-4 text-sm text-gray-400 text-center">No payments recorded yet</div>
      )}

      {/* Add payment */}
      {balance > 0 && (
        <div className="border-t border-gray-200 bg-gray-50">
          {!adding ? (
            <div className="px-4 py-3">
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                <span className="text-lg leading-none">+</span>
                Record Payment {balance > 0 && <span className="text-gray-400 font-normal">(balance {fmtAmt(balance)})</span>}
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">New Payment</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Amount * <span className="text-gray-400">(max {fmtAmt(balance)})</span></label>
                  <input type="number" min="1" max={balance} value={form.amount} onChange={set('amount')}
                    placeholder="0" className={cellCls} autoFocus />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Paid Date *</label>
                  <input type="date" value={form.paidDate} onChange={set('paidDate')} className={cellCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Payment Method</label>
                  <select value={form.paymentMethod} onChange={set('paymentMethod')} className={cellCls}>
                    <option value="">Select</option>
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Transaction ID</label>
                  <input value={form.transactionId} onChange={set('transactionId')} placeholder="Optional" className={cellCls} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Remarks</label>
                  <input value={form.remarks} onChange={set('remarks')} placeholder="Optional note" className={cellCls} />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setAdding(false)}
                  className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100">
                  Cancel
                </button>
                <button type="button" onClick={handleAdd} disabled={saving}
                  className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                  {saving ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {balance <= 0 && (
        <div className="border-t border-gray-100 px-4 py-2 text-xs text-green-600 bg-green-50 flex items-center gap-1.5">
          <span>✓</span> Fully paid
        </div>
      )}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────
export default function FeesForm({ fee: initialFee, onSaved, onCancel, prefillStudentId }) {
  const [fee, setFee] = useState(initialFee);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [justCreated, setJustCreated] = useState(false);
  const isEditMode = !!fee?._id;
  const autoFilled = useRef(false);

  const initItems = () => {
    if (fee?.feeItems?.length) return fee.feeItems.map((i) => ({ ...i, amount: String(i.amount) }));
    return [{ ...EMPTY_ITEM }];
  };

  const [student, setStudent]     = useState(fee?.student?._id || prefillStudentId || '');
  const [academicYear, setAY]     = useState(fee?.academicYear || '2025-2026');
  const [feeItems, setFeeItems]   = useState(initItems);
  const [discount, setDiscount]   = useState(String(fee?.discount ?? 0));
  const [status, setStatus]       = useState(fee?.status || 'pending');
  const [remarks, setRemarks]     = useState(fee?.remarks || '');

  useEffect(() => {
    getStudents({ limit: 500 }).then((res) => setStudents(res.data.data || [])).catch(() => {});
  }, []);

  // Auto-fill fee items from class config (new records only)
  useEffect(() => {
    if (isEditMode || !student || autoFilled.current) return;
    const selected = students.find((s) => s._id === student);
    if (!selected?.class) return;
    getFeeConfigByClass(selected.class, { academicYear })
      .then((res) => {
        const config = res.data.data;
        if (config?.feeItems?.length) {
          setFeeItems(config.feeItems.map((i) => ({ feeType: i.feeType || '', description: i.description || '', amount: String(i.amount || 0) })));
          autoFilled.current = true;
          toast.success(`Auto-filled from Class ${selected.class} config`, { icon: '📋' });
        }
      }).catch(() => {});
  }, [student, students, academicYear, isEditMode]);

  const handleStudentChange = (id) => { autoFilled.current = false; setStudent(id); };

  const updateItem = (i, field, val) => setFeeItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  const addItem    = () => setFeeItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (i) => setFeeItems((prev) => prev.filter((_, idx) => idx !== i));

  const subtotal    = feeItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const discountNum = parseFloat(discount) || 0;
  const finalAmount = Math.max(0, subtotal - discountNum);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!student) { toast.error('Please select a student'); return; }
    const validItems = feeItems.filter((i) => i.feeType && parseFloat(i.amount) > 0);
    if (validItems.length === 0) { toast.error('Add at least one fee item with a type and amount'); return; }

    const payload = {
      student, academicYear,
      feeItems: validItems.map((i) => ({ feeType: i.feeType, description: i.description, amount: parseFloat(i.amount) })),
      discount: discountNum,
      status,
      remarks: remarks || undefined,
    };

    setLoading(true);
    try {
      if (fee?._id) {
        const res = await updateFee(fee._id, payload);
        setFee(res.data.data);
        toast.success('Fee record updated');
        onSaved();
      } else {
        const res = await createFee(payload);
        setFee(res.data.data);
        setJustCreated(true);
        toast.success('Fee record created — record a payment below if needed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Student + Year */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
            <StudentSearch students={students} value={student} onChange={handleStudentChange} disabled={isEditMode} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
            <select required value={academicYear} onChange={(e) => { autoFilled.current = false; setAY(e.target.value); }} className={inputCls}>
              {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Fee Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Fee Items *</label>
            <button type="button" onClick={addItem} className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              <span className="text-lg leading-none">+</span> Add Item
            </button>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-2 bg-gray-50 px-3 py-2 border-b border-gray-200">
              <span className="col-span-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fee Type</span>
              <span className="col-span-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</span>
              <span className="col-span-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount (₹)</span>
              <span className="col-span-1" />
            </div>
            <div className="divide-y divide-gray-100">
              {feeItems.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center">
                  <div className="col-span-4">
                    <select value={item.feeType} onChange={(e) => updateItem(i, 'feeType', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select</option>
                      {FEE_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="col-span-4">
                    <input type="text" value={item.description ?? ''} onChange={(e) => updateItem(i, 'description', e.target.value)}
                      placeholder="Optional note"
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="col-span-3">
                    <input type="number" min="0" value={item.amount} onChange={(e) => updateItem(i, 'amount', e.target.value)}
                      placeholder="0"
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {feeItems.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-xl leading-none">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 bg-gray-50 px-3 py-2.5 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sub Total</span>
                <span className="font-medium">{fmtAmt(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Discount (₹)</span>
                <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)}
                  className="w-28 border border-gray-300 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex justify-between text-base font-bold text-indigo-700 border-t border-gray-200 pt-1.5">
                <span>Total</span>
                <span>{fmtAmt(finalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status + Remarks */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              {isEditMode && <option value="partial">Partial</option>}
              {isEditMode && <option value="paid">Paid</option>}
            </select>
            {isEditMode && <p className="text-xs text-gray-400 mt-1">Status auto-updates when you record payments below</p>}
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} className={inputCls} />
          </div>
        </div>

        <div className="flex gap-3">
          {justCreated ? (
            <button type="button" onClick={onSaved}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
              Done
            </button>
          ) : (
            <>
              <button type="button" onClick={onCancel}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
                {loading ? 'Saving...' : fee?._id ? 'Save Changes' : 'Add Fee Record'}
              </button>
            </>
          )}
        </div>
      </form>

      {/* Payment history — shown after save (new or edit) */}
      {isEditMode && (
        <div className="space-y-2">
          {justCreated && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700 flex items-center gap-2">
              <span>✓</span>
              <span>Fee record saved. You can record a partial or full payment below, then click <strong>Done</strong>.</span>
            </div>
          )}
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            Payment Installments
            {(fee.payments?.length > 0) && (
              <span className="text-xs font-normal text-gray-400">{fee.payments.length} payment{fee.payments.length !== 1 ? 's' : ''}</span>
            )}
          </h4>
          <PaymentSection fee={fee} onUpdated={setFee} />
        </div>
      )}
    </div>
  );
}
