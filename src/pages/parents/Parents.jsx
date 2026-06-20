import { useState, useEffect, useCallback } from 'react';
import { getParents, deleteParent } from '../../api/parentApi';
import Modal from '../../components/common/Modal';
import ParentForm from './ParentForm';
import toast from 'react-hot-toast';

export default function Parents() {
  const [parents, setParents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editParent, setEditParent] = useState(null);
  const limit = 10;

  const fetchParents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getParents({ page, limit });
      setParents(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load parent records');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchParents(); }, [fetchParents]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this parent record?')) return;
    try {
      await deleteParent(id);
      toast.success('Parent record deleted');
      fetchParents();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditParent(null);
    fetchParents();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Parents</h2>
          <p className="text-sm text-gray-500">{total} records</p>
        </div>
        <button onClick={() => { setEditParent(null); setShowModal(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          + Add Parent
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : parents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No parent records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Student', 'Class', "Father's Name", "Father's Phone", "Mother's Name", "Mother's Phone", 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parents.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{p.student?.firstName} {p.student?.lastName}</p>
                        <p className="text-xs text-gray-500">{p.student?.studentId}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{p.student?.class}-{p.student?.section}</td>
                    <td className="px-4 py-3">{p.father?.name || '—'}</td>
                    <td className="px-4 py-3">{p.father?.phone || '—'}</td>
                    <td className="px-4 py-3">{p.mother?.name || '—'}</td>
                    <td className="px-4 py-3">{p.mother?.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditParent(p); setShowModal(true); }} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Edit</button>
                        <button onClick={() => handleDelete(p._id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editParent ? 'Edit Parent' : 'Add Parent'} size="lg">
        <ParentForm parent={editParent} onSaved={handleSaved} onCancel={() => setShowModal(false)} />
      </Modal>
    </div>
  );
}
