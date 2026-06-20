import { useState, useEffect, useCallback } from 'react';
import {
  getRegistrations,
  getRegistrationSummary,
  approveRegistration,
  rejectRegistration,
} from '../../api/adminApi';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const statusVariant = { pending: 'warning', approved: 'success', rejected: 'danger' };

const StatCard = ({ label, value, color }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
    <p className="text-sm text-gray-500">{label}</p>
    <p className={`text-3xl font-bold mt-1 ${color}`}>{value ?? '...'}</p>
  </div>
);

export default function Registrations() {
  const [registrations, setRegistrations] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const limit = 15;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [regRes, sumRes] = await Promise.all([
        getRegistrations({ status: statusFilter, page, limit }),
        getRegistrationSummary(),
      ]);
      setRegistrations(regRes.data.data);
      setTotal(regRes.data.total);
      setSummary(sumRes.data.data);
    } catch {
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleApprove = async (id) => {
    if (!confirm('Approve this registration?')) return;
    setActionLoading(true);
    try {
      const res = await approveRegistration(id);
      toast.success(res.data.message);
      setShowDetail(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      const res = await rejectRegistration(selected._id, rejectReason);
      toast.success(res.data.message);
      setRejectModal(false);
      setShowDetail(false);
      setRejectReason('');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const openDetail = (reg) => {
    setSelected(reg);
    setShowDetail(true);
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">School Registrations</h2>
        <p className="text-sm text-gray-500">Review and manage school registration requests</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Pending" value={summary?.pending} color="text-yellow-600" />
        <StatCard label="Approved" value={summary?.approved} color="text-green-600" />
        <StatCard label="Rejected" value={summary?.rejected} color="text-red-600" />
      </div>

      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', ''].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : registrations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No {statusFilter} registrations found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['School Name', 'Admin Name', 'Email', 'Phone', 'City / State', 'Board', 'Submitted', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registrations.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.schoolName}</td>
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.email}</td>
                    <td className="px-4 py-3">{r.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{[r.city, r.state].filter(Boolean).join(', ') || '—'}</td>
                    <td className="px-4 py-3">{r.board || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 whitespace-nowrap">
                        <button onClick={() => openDetail(r)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">View</button>
                        {r.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(r._id)} className="text-green-600 hover:text-green-800 text-xs font-medium">Approve</button>
                            <button onClick={() => { setSelected(r); setRejectModal(true); }} className="text-red-600 hover:text-red-800 text-xs font-medium">Reject</button>
                          </>
                        )}
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
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Registration Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['School Name', selected.schoolName],
                ['Board', selected.board || '—'],
                ['Admin Name', selected.name],
                ['Email', selected.email],
                ['Phone', selected.phone],
                ['City', selected.city || '—'],
                ['State', selected.state || '—'],
                ['Website', selected.website || '—'],
                ['Submitted', fmt(selected.createdAt)],
                ['Status', selected.status],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-gray-500 text-xs">{label}</p>
                  <p className="font-medium text-gray-900">{value}</p>
                </div>
              ))}
            </div>
            {selected.message && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="text-gray-500 text-xs mb-1">Message from applicant</p>
                <p className="text-gray-700">{selected.message}</p>
              </div>
            )}
            {selected.status === 'rejected' && selected.rejectedReason && (
              <div className="bg-red-50 rounded-lg p-3 text-sm border border-red-100">
                <p className="text-red-500 text-xs mb-1">Rejection Reason</p>
                <p className="text-red-700">{selected.rejectedReason}</p>
              </div>
            )}
            {selected.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowDetail(false); setRejectModal(true); }}
                  className="flex-1 border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(selected._id)}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-60"
                >
                  {actionLoading ? 'Approving...' : 'Approve'}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={rejectModal} onClose={() => { setRejectModal(false); setRejectReason(''); }} title="Reject Registration" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You are rejecting the registration for <strong>{selected?.schoolName}</strong>. Provide a reason (optional).
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="e.g. Incomplete information, duplicate school..."
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setRejectModal(false); setRejectReason(''); }} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button onClick={handleReject} disabled={actionLoading} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-60">
              {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
