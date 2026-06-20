import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { getFees, deleteFee } from '../../api/feesApi';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import FeesForm from './FeesForm';
import { FeeReceiptContent } from './FeeReceipt';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

import { ACADEMIC_YEARS, DEFAULT_YEAR } from '../../constants/academicYears';

const statusVariant = { paid: 'success', pending: 'warning', overdue: 'danger', partial: 'info' };

export default function Fees() {
  const { user } = useAuth();
  const location = useLocation();
  const [fees, setFees] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', feeType: '', academicYear: DEFAULT_YEAR });
  const [showModal, setShowModal] = useState(false);
  const [editFee, setEditFee] = useState(null);
  const [prefillStudentId, setPrefillStudentId] = useState(null);
  const [viewFeeId, setViewFeeId] = useState(null);
  const limit = 15;

  // Auto-open fee form when navigated from "Add Student" flow
  useEffect(() => {
    if (location.state?.prefillStudentId) {
      setPrefillStudentId(location.state.prefillStudentId);
      setEditFee(null);
      setShowModal(true);
      window.history.replaceState({}, '');
    }
  }, []);

  const fetchFees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFees({ page, limit, ...filters });
      setFees(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load fees');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchFees(); }, [fetchFees]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this fee record?')) return;
    try {
      await deleteFee(id);
      toast.success('Deleted');
      fetchFees();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditFee(null);
    setPrefillStudentId(null);
    fetchFees();
  };

  const setFilter = (k) => (e) => { setFilters((p) => ({ ...p, [k]: e.target.value })); setPage(1); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Fees</h2>
          <p className="text-xs sm:text-sm text-gray-500">{total} records</p>
        </div>
        <button onClick={() => { setEditFee(null); setShowModal(true); }} className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shrink-0">
          + Add Fee
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 grid grid-cols-2 sm:flex gap-2 sm:gap-3 flex-wrap">
        <select value={filters.status} onChange={setFilter('status')} className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Status</option>
          {['paid', 'pending', 'overdue', 'partial'].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={filters.feeType} onChange={setFilter('feeType')} className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Types</option>
          {['tuition', 'transport', 'library', 'sports', 'laboratory', 'examination', 'other'].map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <select value={filters.academicYear} onChange={setFilter('academicYear')} className="col-span-2 sm:col-span-1 w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Years</option>
          {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : fees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No fee records found</div>
        ) : (
          <div className="overflow-x-auto sm:overflow-x-auto">
            {/* Mobile cards */}
            <div className="divide-y divide-gray-100 sm:hidden">
              {fees.map((f) => {
                const pct = f.finalAmount > 0 ? Math.round(((f.paidAmount||0)/f.finalAmount)*100) : 0;
                return (
                  <div key={f._id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{f.student?.firstName} {f.student?.lastName}</p>
                        <p className="text-xs text-gray-400">Class {f.student?.class}-{f.student?.section} · {f.student?.studentId}</p>
                      </div>
                      <Badge variant={statusVariant[f.status] || 'default'}>{f.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-bold text-gray-900">₹{(f.finalAmount||0).toLocaleString('en-IN')}</p>
                        {f.status === 'partial' && (
                          <p className="text-xs text-green-600">₹{(f.paidAmount||0).toLocaleString('en-IN')} paid · Balance ₹{((f.finalAmount||0)-(f.paidAmount||0)).toLocaleString('en-IN')}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setViewFeeId(f._id)} className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-medium">View</button>
                        {['pending','partial','overdue'].includes(f.status) && (
                          <button onClick={() => { setEditFee(f); setShowModal(true); }} className="text-xs px-2.5 py-1.5 rounded-lg bg-green-100 text-green-700 font-medium">Pay</button>
                        )}
                        <button onClick={() => { setEditFee(f); setShowModal(true); }} className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-medium">Edit</button>
                      </div>
                    </div>
                    {f.status === 'partial' && f.finalAmount > 0 && (
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{width:`${pct}%`}} />
                      </div>
                    )}
                    {(f.feeItems||[]).length > 0 && (
                      <p className="text-xs text-gray-400">{f.feeItems.map(i => i.feeType).join(' · ')}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <table className="hidden sm:table w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Student', 'Class', 'Fee Type', 'Amount', 'Paid Date', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fees.map((f) => (
                  <tr key={f._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{f.student?.firstName} {f.student?.lastName}</p>
                      <p className="text-xs text-gray-500">{f.student?.studentId}</p>
                    </td>
                    <td className="px-4 py-3">{f.student?.class}-{f.student?.section}</td>
                    <td className="px-4 py-3">
                      {(f.feeItems || []).length === 0 ? '—' : (
                        <div className="space-y-0.5">
                          {(f.feeItems || []).map((item, idx) => (
                            <div key={idx} className="flex items-baseline gap-1.5">
                              <span className="capitalize text-gray-800 font-medium text-xs">{item.feeType}</span>
                              {item.description && (
                                <span className="text-gray-400 text-xs">— {item.description}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium text-gray-900">₹{(f.finalAmount || 0).toLocaleString('en-IN')}</span>
                          {f.status === 'partial' && (
                            <span className="text-xs text-green-600">₹{(f.paidAmount || 0).toLocaleString('en-IN')} paid</span>
                          )}
                        </div>
                        {f.status === 'partial' && f.finalAmount > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden" style={{maxWidth:'80px'}}>
                              <div className="h-full bg-amber-400 rounded-full" style={{width:`${Math.min(100,Math.round(((f.paidAmount||0)/f.finalAmount)*100))}%`}} />
                            </div>
                            <span className="text-xs text-gray-400">{Math.round(((f.paidAmount||0)/f.finalAmount)*100)}%</span>
                          </div>
                        )}
                        {f.status === 'partial' && (
                          <p className="text-xs text-red-500">Balance ₹{((f.finalAmount||0)-(f.paidAmount||0)).toLocaleString('en-IN')}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {(f.payments?.length > 0)
                        ? new Date(f.payments[f.payments.length - 1].paidDate).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                    <td className="px-4 py-3"><Badge variant={statusVariant[f.status] || 'default'}>{f.status}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setViewFeeId(f._id)} className="text-gray-500 hover:text-gray-800 text-xs font-medium">View</button>
                        {['pending', 'partial', 'overdue'].includes(f.status) && (
                          <button
                            onClick={() => { setEditFee(f); setShowModal(true); }}
                            className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700 hover:bg-green-200"
                          >
                            Pay
                          </button>
                        )}
                        <button onClick={() => { setEditFee(f); setShowModal(true); }} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Edit</button>
                        <button onClick={() => handleDelete(f._id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
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

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setPrefillStudentId(null); }} title={editFee ? 'Edit Fee Record' : 'Add Fee Record'} size="md">
        <FeesForm fee={editFee} onSaved={handleSaved} onCancel={() => { setShowModal(false); setPrefillStudentId(null); }} prefillStudentId={prefillStudentId} />
      </Modal>

      {/* Fee Receipt overlay */}
      {viewFeeId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewFeeId(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
              <h3 className="text-base font-semibold text-gray-900">Fee Receipt</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    document.body.classList.add('print-fee-receipt');
                    window.print();
                    window.addEventListener('afterprint', () => {
                      document.body.classList.remove('print-fee-receipt');
                    }, { once: true });
                  }}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  🖨️ Print / Save PDF
                </button>
                <button onClick={() => setViewFeeId(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 bg-gray-100 p-6">
              <style>{`
                @media print {
                  body.print-fee-receipt > * { visibility: hidden; }
                  body.print-fee-receipt .fee-receipt-page,
                  body.print-fee-receipt .fee-receipt-page * { visibility: visible; }

                  body.print-fee-receipt .fee-receipt-page {
                    position: fixed !important;
                    top: 0 !important; left: 0 !important;
                    width: 100% !important;
                    max-width: none !important;
                    margin: 0 !important;
                    padding: 6mm 8mm !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    font-size: 10px !important;
                    font-family: Arial, sans-serif !important;
                  }

                  /* School header */
                  body.print-fee-receipt .fee-receipt-page h1 { font-size: 14px !important; margin: 2px 0 !important; }
                  body.print-fee-receipt .fee-receipt-page h2 { font-size: 11px !important; margin: 0 !important; }

                  /* Compact all tables */
                  body.print-fee-receipt .fee-receipt-page table {
                    margin-bottom: 5px !important;
                    font-size: 10px !important;
                  }
                  body.print-fee-receipt .fee-receipt-page table td,
                  body.print-fee-receipt .fee-receipt-page table th {
                    padding: 3px 7px !important;
                    font-size: 10px !important;
                  }

                  /* Shrink logo circle */
                  body.print-fee-receipt .fee-receipt-page div[style*="border-radius: 50%"] {
                    width: 34px !important;
                    height: 34px !important;
                    font-size: 15px !important;
                    margin-bottom: 3px !important;
                  }

                  /* Reduce gaps between sections */
                  body.print-fee-receipt .fee-receipt-page > div { margin-bottom: 5px !important; }

                  /* Status banner */
                  body.print-fee-receipt .fee-receipt-page div[style*="border-radius: 6px"] {
                    padding: 5px 12px !important;
                    margin-bottom: 8px !important;
                  }
                  body.print-fee-receipt .fee-receipt-page div[style*="border-radius: 6px"] span {
                    font-size: 14px !important;
                  }

                  /* Signatures — compress height */
                  body.print-fee-receipt .fee-receipt-page div[style*="border-bottom: 1px solid #333"] {
                    height: 20px !important;
                    margin-bottom: 3px !important;
                  }
                  body.print-fee-receipt .fee-receipt-page div[style*="border-bottom: 1px solid #333"] p {
                    font-size: 9px !important;
                    margin: 1px 0 !important;
                  }

                  /* Footer text */
                  body.print-fee-receipt .fee-receipt-page > p:last-child {
                    margin-top: 6px !important;
                    font-size: 9px !important;
                    padding-top: 4px !important;
                  }
                }

                @page { size: A4 portrait; margin: 0; }
              `}</style>
              <FeeReceiptContent
                feeId={viewFeeId}
                schoolName={user?.schoolName}
                schoolPhone={user?.phone}
                schoolAddress={user?.address}
                schoolCity={user?.city}
                schoolState={user?.state}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
